"""
节点系统模块
提供单一职责的节点设计、输入/输出类型明确、错误恢复和降级机制
"""

import time
import asyncio
from typing import (
    Dict, Any, Optional, List, Callable, TypeVar, Generic,
    Awaitable, Union, get_type_hints
)
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum, auto
from functools import wraps

from pydantic import BaseModel, Field, ValidationError

from src.core.exceptions import (
    AgentNodeException, BaseAppException, ErrorContext
)
from src.core.logging import log_agent_execution, ContextLogger, timed
from src.core.state import AgentState


class NodeStatus(Enum):
    """节点执行状态"""
    PENDING = auto()
    RUNNING = auto()
    SUCCESS = auto()
    FAILED = auto()
    SKIPPED = auto()
    RETRYING = auto()


class NodeType(Enum):
    """节点类型"""
    PROCESS = auto()      # 处理节点
    DECISION = auto()     # 决策节点
    PARALLEL = auto()     # 并行节点
    LOOP = auto()         # 循环节点
    FALLBACK = auto()     # 降级节点


@dataclass
class NodeResult:
    """节点执行结果"""
    status: NodeStatus
    output: Any = None
    error: Optional[str] = None
    duration_ms: float = 0.0
    retry_count: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    @classmethod
    def success(cls, output: Any, duration_ms: float = 0.0, **metadata) -> "NodeResult":
        """创建成功结果"""
        return cls(
            status=NodeStatus.SUCCESS,
            output=output,
            duration_ms=duration_ms,
            metadata=metadata
        )
    
    @classmethod
    def failure(cls, error: str, duration_ms: float = 0.0, **metadata) -> "NodeResult":
        """创建失败结果"""
        return cls(
            status=NodeStatus.FAILED,
            error=error,
            duration_ms=duration_ms,
            metadata=metadata
        )
    
    @classmethod
    def skipped(cls, reason: str = "") -> "NodeResult":
        """创建跳过结果"""
        return cls(
            status=NodeStatus.SKIPPED,
            metadata={"skip_reason": reason}
        )
    
    @property
    def is_success(self) -> bool:
        """是否成功"""
        return self.status == NodeStatus.SUCCESS


class NodeConfig(BaseModel):
    """节点配置"""
    
    name: str = Field(description="节点名称")
    description: Optional[str] = Field(default=None, description="节点描述")
    node_type: NodeType = Field(default=NodeType.PROCESS, description="节点类型")
    
    # 重试配置
    max_retries: int = Field(default=2, ge=0, description="最大重试次数")
    retry_delay: float = Field(default=1.0, ge=0, description="重试延迟(秒)")
    
    # 超时配置
    timeout: Optional[float] = Field(default=30.0, description="超时时间(秒)")
    
    # 降级配置
    fallback_node: Optional[str] = Field(default=None, description="降级节点名称")
    fallback_value: Any = Field(default=None, description="降级默认值")
    
    # 条件执行
    condition: Optional[str] = Field(default=None, description="执行条件表达式")
    skip_on_error: bool = Field(default=False, description="错误时是否跳过")
    
    # 输入输出校验
    input_schema: Optional[Dict[str, Any]] = Field(default=None, description="输入Schema")
    output_schema: Optional[Dict[str, Any]] = Field(default=None, description="输出Schema")


class BaseNode(ABC):
    """
    基础节点类
    
    所有节点的基类，提供：
    - 统一的执行接口
    - 错误处理和重试机制
    - 降级策略
    - 输入输出校验
    - 性能监控
    """
    
    def __init__(self, config: NodeConfig):
        self.config = config
        self.execution_count = 0
        self.success_count = 0
        self.failure_count = 0
        self.total_duration_ms = 0.0
    
    @abstractmethod
    async def _execute(self, state: AgentState, **inputs) -> Any:
        """
        实际执行逻辑（子类实现）
        
        Args:
            state: Agent状态
            **inputs: 输入参数
            
        Returns:
            执行结果
        """
        pass
    
    async def _validate_input(self, inputs: Dict[str, Any]) -> None:
        """校验输入"""
        if self.config.input_schema:
            # 简化校验，实际可用jsonschema
            required = self.config.input_schema.get("required", [])
            for field in required:
                if field not in inputs:
                    raise ValueError(f"缺少必需字段: {field}")
    
    async def _validate_output(self, output: Any) -> Any:
        """校验输出"""
        return output
    
    async def _should_execute(self, state: AgentState) -> bool:
        """判断是否应执行"""
        if self.config.condition:
            # 简化条件判断，实际可用表达式引擎
            return eval(self.config.condition, {"state": state})
        return True
    
    async def _execute_with_retry(
        self,
        state: AgentState,
        **inputs
    ) -> NodeResult:
        """带重试的执行"""
        last_error = None
        
        for attempt in range(self.config.max_retries + 1):
            start_time = time.perf_counter()
            
            try:
                # 设置超时
                if self.config.timeout:
                    output = await asyncio.wait_for(
                        self._execute(state, **inputs),
                        timeout=self.config.timeout
                    )
                else:
                    output = await self._execute(state, **inputs)
                
                duration_ms = (time.perf_counter() - start_time) * 1000
                
                # 校验输出
                output = await self._validate_output(output)
                
                return NodeResult.success(
                    output=output,
                    duration_ms=duration_ms,
                    attempt=attempt + 1
                )
                
            except asyncio.TimeoutError as e:
                last_error = f"执行超时: {self.config.timeout}秒"
                ContextLogger.warning(f"节点 {self.config.name} 超时 (尝试 {attempt + 1})")
                
            except Exception as e:
                last_error = str(e)
                ContextLogger.warning(
                    f"节点 {self.config.name} 失败 (尝试 {attempt + 1}): {e}"
                )
            
            # 重试延迟
            if attempt < self.config.max_retries:
                await asyncio.sleep(self.config.retry_delay * (attempt + 1))
        
        # 所有重试失败
        return NodeResult.failure(
            error=last_error or "未知错误",
            duration_ms=(time.perf_counter() - start_time) * 1000,
            retry_count=self.config.max_retries
        )
    
    async def execute(self, state: AgentState, **inputs) -> NodeResult:
        """
        执行节点
        
        Args:
            state: Agent状态
            **inputs: 输入参数
            
        Returns:
            NodeResult: 执行结果
        """
        self.execution_count += 1
        state.set_current_node(self.config.name)
        
        ContextLogger.info(f"执行节点: {self.config.name}")
        
        # 检查执行条件
        if not await self._should_execute(state):
            ContextLogger.info(f"跳过节点: {self.config.name} (条件不满足)")
            return NodeResult.skipped("条件不满足")
        
        # 校验输入
        try:
            await self._validate_input(inputs)
        except ValueError as e:
            return NodeResult.failure(f"输入校验失败: {e}")
        
        # 执行
        result = await self._execute_with_retry(state, **inputs)
        
        # 更新统计
        self.total_duration_ms += result.duration_ms
        if result.is_success:
            self.success_count += 1
            state.set_node_output(self.config.name, result.output)
        else:
            self.failure_count += 1
            state.increment_error()
            
            # 尝试降级
            if self.config.fallback_value is not None:
                ContextLogger.info(f"使用降级值: {self.config.name}")
                result = NodeResult.success(
                    output=self.config.fallback_value,
                    duration_ms=result.duration_ms,
                    fallback=True
                )
                state.set_node_output(self.config.name, result.output)
            elif self.config.skip_on_error:
                ContextLogger.info(f"错误时跳过: {self.config.name}")
                return NodeResult.skipped(f"执行失败但已跳过: {result.error}")
        
        # 记录日志
        log_agent_execution(
            agent_name=state.agent_name,
            node_name=self.config.name,
            duration_ms=result.duration_ms,
            success=result.is_success,
            error=result.error
        )
        
        return result
    
    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        avg_duration = (
            self.total_duration_ms / self.execution_count
            if self.execution_count > 0 else 0
        )
        return {
            "name": self.config.name,
            "executions": self.execution_count,
            "successes": self.success_count,
            "failures": self.failure_count,
            "success_rate": (
                self.success_count / self.execution_count
                if self.execution_count > 0 else 0
            ),
            "avg_duration_ms": round(avg_duration, 2),
            "total_duration_ms": round(self.total_duration_ms, 2)
        }


class LLMNode(BaseNode):
    """
    LLM调用节点
    
    封装LLM调用，提供统一的接口
    """
    
    def __init__(
        self,
        config: NodeConfig,
        llm_client: Any,
        system_prompt: Optional[str] = None
    ):
        super().__init__(config)
        self.llm_client = llm_client
        self.system_prompt = system_prompt
    
    async def _execute(self, state: AgentState, **inputs) -> Any:
        """执行LLM调用"""
        # 构建消息
        messages = []
        if self.system_prompt:
            messages.append({"role": "system", "content": self.system_prompt})
        
        # 添加上下文
        messages.extend(state.get_context_for_llm())
        
        # 添加当前输入
        user_message = inputs.get("message", "")
        messages.append({"role": "user", "content": user_message})
        
        # 调用LLM
        response = await self.llm_client.complete(
            messages=messages,
            temperature=inputs.get("temperature", 0.7),
            max_tokens=inputs.get("max_tokens", 2000),
            json_mode=inputs.get("json_mode", False)
        )
        
        # 更新状态
        state.add_context("user", user_message)
        state.add_context("assistant", response.content)
        
        return {
            "content": response.content,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            },
            "cost_usd": response.cost_usd
        }


class FunctionNode(BaseNode):
    """
    函数节点
    
    包装普通函数为节点
    """
    
    def __init__(
        self,
        config: NodeConfig,
        func: Callable,
        is_async: bool = True
    ):
        super().__init__(config)
        self.func = func
        self.is_async = is_async
    
    async def _execute(self, state: AgentState, **inputs) -> Any:
        """执行函数"""
        if self.is_async:
            return await self.func(state=state, **inputs)
        else:
            return self.func(state=state, **inputs)


class DecisionNode(BaseNode):
    """
    决策节点
    
    根据条件选择分支
    """
    
    def __init__(
        self,
        config: NodeConfig,
        branches: Dict[str, Callable[[AgentState], bool]]
    ):
        super().__init__(config)
        self.branches = branches
    
    async def _execute(self, state: AgentState, **inputs) -> Any:
        """执行决策"""
        for branch_name, condition in self.branches.items():
            if condition(state):
                return {"branch": branch_name}
        
        return {"branch": "default"}


class ParallelNode(BaseNode):
    """
    并行节点
    
    并行执行多个子节点
    """
    
    def __init__(
        self,
        config: NodeConfig,
        nodes: List[BaseNode],
        max_concurrency: int = 5
    ):
        super().__init__(config)
        self.nodes = nodes
        self.max_concurrency = max_concurrency
    
    async def _execute(self, state: AgentState, **inputs) -> Any:
        """并行执行"""
        semaphore = asyncio.Semaphore(self.max_concurrency)
        
        async def run_node(node: BaseNode) -> NodeResult:
            async with semaphore:
                return await node.execute(state, **inputs)
        
        results = await asyncio.gather(
            *[run_node(node) for node in self.nodes],
            return_exceptions=True
        )
        
        return {
            node.config.name: result
            for node, result in zip(self.nodes, results)
        }


class NodeRegistry:
    """
    节点注册表
    
    管理所有可用节点
    """
    
    def __init__(self):
        self._nodes: Dict[str, BaseNode] = {}
    
    def register(self, node: BaseNode) -> None:
        """注册节点"""
        self._nodes[node.config.name] = node
        ContextLogger.info(f"节点已注册: {node.config.name}")
    
    def get(self, name: str) -> Optional[BaseNode]:
        """获取节点"""
        return self._nodes.get(name)
    
    def list_nodes(self) -> List[str]:
        """列出所有节点"""
        return list(self._nodes.keys())
    
    def get_stats(self) -> Dict[str, Dict[str, Any]]:
        """获取所有节点统计"""
        return {
            name: node.get_stats()
            for name, node in self._nodes.items()
        }


# 全局节点注册表
node_registry = NodeRegistry()


def node(
    name: str,
    description: Optional[str] = None,
    max_retries: int = 2,
    timeout: float = 30.0,
    fallback_value: Any = None
):
    """
    节点装饰器
    
    将函数转换为节点
    
    Example:
        @node(name="process_data", description="处理数据")
        async def process_data(state: AgentState, data: dict) -> dict:
            return {"processed": True}
    """
    def decorator(func: Callable) -> BaseNode:
        config = NodeConfig(
            name=name,
            description=description,
            max_retries=max_retries,
            timeout=timeout,
            fallback_value=fallback_value
        )
        
        is_async = asyncio.iscoroutinefunction(func)
        node_instance = FunctionNode(config, func, is_async)
        
        # 自动注册
        node_registry.register(node_instance)
        
        return node_instance
    return decorator
