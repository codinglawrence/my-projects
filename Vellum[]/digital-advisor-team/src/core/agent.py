"""
Agent核心模块
提供Agent工作流编排、执行引擎和生命周期管理
"""

import time
import uuid
from typing import Dict, Any, Optional, List, Callable, AsyncGenerator
from dataclasses import dataclass, field
from enum import Enum, auto
from abc import ABC, abstractmethod

from src.core.state import AgentState, state_manager, Checkpoint
from src.core.nodes import BaseNode, NodeResult, NodeStatus, node_registry
from src.core.tools import tool_registry, ToolResult
from src.core.logging import ContextLogger, log_agent_execution
from src.core.exceptions import AgentException, AgentNodeException


class AgentStatus(Enum):
    """Agent状态"""
    IDLE = auto()
    RUNNING = auto()
    PAUSED = auto()
    COMPLETED = auto()
    FAILED = auto()


@dataclass
class AgentConfig:
    """Agent配置"""
    name: str
    description: str = ""
    max_iterations: int = 50
    enable_checkpoints: bool = True
    checkpoint_interval: int = 5  # 每5个节点保存一次
    auto_retry: bool = True
    max_errors: int = 3


class Workflow:
    """
    工作流
    
    定义节点执行顺序和依赖关系
    """
    
    def __init__(self, name: str):
        self.name = name
        self.nodes: List[str] = []
        self.edges: Dict[str, List[str]] = {}
        self.conditional_edges: Dict[str, Callable] = {}
    
    def add_node(self, node_name: str, next_nodes: Optional[List[str]] = None) -> "Workflow":
        """添加节点"""
        self.nodes.append(node_name)
        if next_nodes:
            self.edges[node_name] = next_nodes
        return self
    
    def add_edge(self, from_node: str, to_node: str) -> "Workflow":
        """添加边"""
        if from_node not in self.edges:
            self.edges[from_node] = []
        self.edges[from_node].append(to_node)
        return self
    
    def add_conditional_edge(
        self,
        from_node: str,
        condition: Callable[[NodeResult], str]
    ) -> "Workflow":
        """添加条件边"""
        self.conditional_edges[from_node] = condition
        return self
    
    def get_next_nodes(self, node_name: str, result: NodeResult) -> List[str]:
        """获取下一个节点"""
        # 优先检查条件边
        if node_name in self.conditional_edges:
            condition = self.conditional_edges[node_name]
            next_node = condition(result)
            return [next_node] if next_node else []
        
        # 普通边
        return self.edges.get(node_name, [])
    
    def validate(self) -> bool:
        """验证工作流"""
        # 检查所有节点是否已注册
        for node_name in self.nodes:
            if not node_registry.get(node_name):
                ContextLogger.error(f"工作流 {self.name} 包含未注册节点: {node_name}")
                return False
        return True


class BaseAgent(ABC):
    """
    基础Agent类
    
    所有Agent的基类，提供：
    - 工作流执行引擎
    - 状态管理
    - 检查点机制
    - 错误恢复
    - 性能监控
    """
    
    def __init__(self, config: AgentConfig):
        self.config = config
        self.agent_id = str(uuid.uuid4())
        self.status = AgentStatus.IDLE
        self.workflow: Optional[Workflow] = None
        
        # 执行统计
        self.execution_count = 0
        self.total_duration_ms = 0.0
        self.error_count = 0
    
    @abstractmethod
    def define_workflow(self) -> Workflow:
        """
        定义工作流（子类实现）
        
        Returns:
            Workflow: 工作流定义
        """
        pass
    
    def initialize(self) -> None:
        """初始化Agent"""
        self.workflow = self.define_workflow()
        
        if not self.workflow.validate():
            raise AgentException(f"Agent {self.config.name} 工作流验证失败")
        
        ContextLogger.info(f"Agent初始化完成: {self.config.name} (ID: {self.agent_id})")
    
    async def run(
        self,
        input_data: Dict[str, Any],
        state_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        运行Agent
        
        Args:
            input_data: 输入数据
            state_id: 状态ID（用于恢复）
            
        Returns:
            Dict[str, Any]: 执行结果
        """
        if not self.workflow:
            self.initialize()
        
        start_time = time.perf_counter()
        self.status = AgentStatus.RUNNING
        self.execution_count += 1
        
        # 创建或恢复状态
        if state_id:
            state = state_manager.get_state(state_id)
            if not state:
                raise AgentException(f"状态不存在: {state_id}")
        else:
            state_id = f"{self.config.name}_{uuid.uuid4().hex[:8]}"
            state = AgentState(
                agent_id=self.agent_id,
                agent_name=self.config.name,
                input_data=input_data
            )
            state_manager.update_state(state_id, state)
        
        ContextLogger.info(
            f"Agent开始执行: {self.config.name}",
            extra={"state_id": state_id, "input": input_data}
        )
        
        try:
            # 执行工作流
            result = await self._execute_workflow(state, state_id)
            
            self.status = AgentStatus.COMPLETED
            duration_ms = (time.perf_counter() - start_time) * 1000
            self.total_duration_ms += duration_ms
            
            ContextLogger.info(
                f"Agent执行完成: {self.config.name}",
                extra={"duration_ms": duration_ms, "result": result}
            )
            
            return result
            
        except Exception as e:
            self.status = AgentStatus.FAILED
            self.error_count += 1
            
            ContextLogger.exception(f"Agent执行失败: {self.config.name}")
            
            raise AgentException(
                message=f"Agent执行失败: {e}",
                original_error=e
            )
    
    async def _execute_workflow(self, state: AgentState, state_id: str) -> Dict[str, Any]:
        """执行工作流"""
        if not self.workflow:
            raise AgentException("工作流未定义")
        
        node_index = 0
        checkpoint_counter = 0
        
        # 找到起始节点
        if state.current_node:
            # 从上次位置恢复
            try:
                node_index = self.workflow.nodes.index(state.current_node)
            except ValueError:
                pass
        
        while node_index < len(self.workflow.nodes):
            # 检查是否应该停止
            if state.should_stop():
                ContextLogger.warning(f"Agent停止执行: 错误数达到上限")
                break
            
            if node_index >= self.config.max_iterations:
                ContextLogger.warning(f"Agent停止执行: 达到最大迭代次数")
                break
            
            node_name = self.workflow.nodes[node_index]
            node = node_registry.get(node_name)
            
            if not node:
                raise AgentNodeException(
                    node_name=node_name,
                    message="节点未注册"
                )
            
            # 准备输入
            node_inputs = self._prepare_node_inputs(node_name, state)
            
            # 执行节点
            result = await node.execute(state, **node_inputs)
            
            # 更新状态
            if result.is_success:
                state.set_node_output(node_name, result.output)
            else:
                state.increment_error()
                if not self.config.auto_retry:
                    raise AgentNodeException(
                        node_name=node_name,
                        message=result.error or "节点执行失败",
                        node_output=result.output
                    )
            
            # 保存检查点
            checkpoint_counter += 1
            if (
                self.config.enable_checkpoints and
                checkpoint_counter >= self.config.checkpoint_interval
            ):
                await state_manager.create_checkpoint(state_id)
                checkpoint_counter = 0
            
            # 确定下一个节点
            next_nodes = self.workflow.get_next_nodes(node_name, result)
            
            if not next_nodes:
                # 没有下一个节点，结束
                break
            elif len(next_nodes) == 1:
                # 单一路径
                try:
                    node_index = self.workflow.nodes.index(next_nodes[0])
                except ValueError:
                    break
            else:
                # 并行路径（简化处理，选择第一个）
                try:
                    node_index = self.workflow.nodes.index(next_nodes[0])
                except ValueError:
                    break
        
        # 标记完成，将所有节点输出作为最终结果
        state.complete(output=state.node_outputs)
        
        return state.output_data
    
    def _prepare_node_inputs(self, node_name: str, state: AgentState) -> Dict[str, Any]:
        """准备节点输入"""
        # 基础输入
        inputs = {
            "agent_id": state.agent_id,
            "agent_name": state.agent_name,
        }
        
        # 添加上游节点输出作为输入
        for prev_node, output in state.node_outputs.items():
            inputs[f"{prev_node}_output"] = output
        
        # 添加原始输入
        inputs.update(state.input_data)
        
        return inputs
    
    async def stream_run(
        self,
        input_data: Dict[str, Any]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        流式运行Agent
        
        Yields:
            执行进度和结果
        """
        if not self.workflow:
            self.initialize()
        
        state_id = f"{self.config.name}_{uuid.uuid4().hex[:8]}"
        state = AgentState(
            agent_id=self.agent_id,
            agent_name=self.config.name,
            input_data=input_data
        )
        state_manager.update_state(state_id, state)
        
        yield {"type": "start", "agent_id": self.agent_id, "state_id": state_id}
        
        try:
            for i, node_name in enumerate(self.workflow.nodes):
                node = node_registry.get(node_name)
                if not node:
                    yield {"type": "error", "node": node_name, "error": "节点未注册"}
                    continue
                
                yield {"type": "node_start", "node": node_name, "index": i}
                
                node_inputs = self._prepare_node_inputs(node_name, state)
                result = await node.execute(state, **node_inputs)
                
                yield {
                    "type": "node_complete",
                    "node": node_name,
                    "success": result.is_success,
                    "duration_ms": result.duration_ms
                }
                
                if not result.is_success:
                    yield {"type": "error", "node": node_name, "error": result.error}
            
            yield {"type": "complete", "output": state.output_data}
            
        except Exception as e:
            yield {"type": "error", "error": str(e)}
    
    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        avg_duration = (
            self.total_duration_ms / self.execution_count
            if self.execution_count > 0 else 0
        )
        return {
            "agent_id": self.agent_id,
            "name": self.config.name,
            "status": self.status.name,
            "executions": self.execution_count,
            "errors": self.error_count,
            "avg_duration_ms": round(avg_duration, 2),
            "total_duration_ms": round(self.total_duration_ms, 2)
        }


class AgentBuilder:
    """
    Agent构建器
    
    用于简化Agent创建
    """
    
    def __init__(self, name: str):
        self.config = AgentConfig(name=name)
        self.workflow = Workflow(name=name)
        self.nodes: List[BaseNode] = []
    
    def with_description(self, description: str) -> "AgentBuilder":
        """设置描述"""
        self.config.description = description
        return self
    
    def with_max_iterations(self, max_iterations: int) -> "AgentBuilder":
        """设置最大迭代次数"""
        self.config.max_iterations = max_iterations
        return self
    
    def add_node(self, node: BaseNode, next_nodes: Optional[List[str]] = None) -> "AgentBuilder":
        """添加节点"""
        self.nodes.append(node)
        self.workflow.add_node(node.config.name, next_nodes)
        return self
    
    def add_edge(self, from_node: str, to_node: str) -> "AgentBuilder":
        """添加边"""
        self.workflow.add_edge(from_node, to_node)
        return self
    
    def build(self) -> BaseAgent:
        """构建Agent"""
        # 注册所有节点
        for node in self.nodes:
            node_registry.register(node)
        
        # 创建Agent类
        workflow = self.workflow
        config = self.config
        
        class BuiltAgent(BaseAgent):
            def define_workflow(self) -> Workflow:
                return workflow
        
        agent = BuiltAgent(config)
        agent.workflow = workflow
        
        return agent


def create_agent(name: str) -> AgentBuilder:
    """
    创建Agent构建器
    
    Example:
        agent = create_agent("my_agent")
            .with_description("我的Agent")
            .add_node(node1)
            .add_node(node2)
            .build()
    """
    return AgentBuilder(name)
