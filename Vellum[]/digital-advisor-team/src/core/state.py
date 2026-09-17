"""
状态管理模块
提供Pydantic模型定义、序列化/反序列化、检查点保存机制
"""

import json
import hashlib
from typing import Dict, Any, Optional, List, TypeVar, Generic, Callable
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field, asdict
from abc import ABC, abstractmethod
from pathlib import Path
import asyncio

from pydantic import BaseModel, Field, field_serializer, field_validator

from src.core.logging import ContextLogger


class CheckpointStatus(Enum):
    """检查点状态"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


class StateVersion(BaseModel):
    """状态版本信息"""
    version: int = Field(default=1, description="版本号")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    checksum: Optional[str] = Field(default=None, description="状态校验和")
    
    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, v: datetime) -> str:
        return v.isoformat()


class BaseState(BaseModel):
    """
    基础状态模型
    
    所有Agent状态的基类，提供：
    - 版本控制
    - 校验和验证
    - 序列化/反序列化
    - 变更追踪
    """
    
    # 元数据
    version_info: StateVersion = Field(default_factory=StateVersion)
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")
    
    # 上下文窗口管理
    context_window: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="上下文窗口",
        max_length=50
    )
    
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
    
    def compute_checksum(self) -> str:
        """计算状态校验和"""
        state_dict = self.model_dump(exclude={"version_info"})
        state_json = json.dumps(state_dict, sort_keys=True, default=str)
        return hashlib.sha256(state_json.encode()).hexdigest()[:16]
    
    def validate_checksum(self) -> bool:
        """验证校验和"""
        if not self.version_info.checksum:
            return True
        return self.compute_checksum() == self.version_info.checksum
    
    def bump_version(self) -> None:
        """增加版本号"""
        self.version_info.version += 1
        self.version_info.updated_at = datetime.utcnow()
        self.version_info.checksum = self.compute_checksum()
    
    def to_json(self, indent: Optional[int] = None) -> str:
        """序列化为JSON"""
        return self.model_dump_json(indent=indent)
    
    @classmethod
    def from_json(cls, json_str: str) -> "BaseState":
        """从JSON反序列化"""
        return cls.model_validate_json(json_str)
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return self.model_dump()
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "BaseState":
        """从字典创建"""
        return cls.model_validate(data)
    
    def add_context(self, role: str, content: str, metadata: Optional[Dict] = None) -> None:
        """添加上下文"""
        entry = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        }
        self.context_window.append(entry)
        
        # 限制上下文窗口大小
        max_size = self.model_fields["context_window"].json_schema_extra or {}
        max_length = max_size.get("max_length", 50)
        if len(self.context_window) > max_length:
            self.context_window = self.context_window[-max_length:]
    
    def get_context_for_llm(self, max_messages: int = 10) -> List[Dict[str, str]]:
        """获取用于LLM的上下文"""
        recent = self.context_window[-max_messages:]
        return [{"role": entry["role"], "content": entry["content"]} for entry in recent]
    
    def copy(self) -> "BaseState":
        """创建深拷贝"""
        return self.__class__.from_json(self.to_json())


class ConversationState(BaseState):
    """
    对话状态
    
    用于管理对话会话的状态
    """
    
    # 对话信息
    conversation_id: str = Field(description="对话ID")
    blogger_id: Optional[str] = Field(default=None, description="博主ID")
    user_id: Optional[str] = Field(default=None, description="用户ID")
    
    # 对话内容
    title: Optional[str] = Field(default=None, description="对话标题")
    messages: List[Dict[str, Any]] = Field(default_factory=list, description="消息列表")
    
    # 风格信息
    style_description: Optional[str] = Field(default=None, description="风格描述")
    
    # 统计信息
    message_count: int = Field(default=0, description="消息数量")
    total_tokens: int = Field(default=0, description="总token数")
    
    def add_message(self, role: str, content: str, metadata: Optional[Dict] = None) -> None:
        """添加消息"""
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        }
        self.messages.append(message)
        self.message_count += 1
        self.add_context(role, content, metadata)
        self.bump_version()


class AgentState(BaseState):
    """
    Agent执行状态
    
    用于管理Agent工作流执行的状态
    """
    
    # Agent信息
    agent_id: str = Field(description="Agent ID")
    agent_name: str = Field(description="Agent名称")
    
    # 执行状态
    current_node: Optional[str] = Field(default=None, description="当前节点")
    node_history: List[str] = Field(default_factory=list, description="节点执行历史")
    node_outputs: Dict[str, Any] = Field(default_factory=dict, description="节点输出")
    
    # 输入输出
    input_data: Dict[str, Any] = Field(default_factory=dict, description="输入数据")
    output_data: Dict[str, Any] = Field(default_factory=dict, description="输出数据")
    
    # 执行控制
    is_complete: bool = Field(default=False, description="是否完成")
    error_count: int = Field(default=0, description="错误计数")
    max_errors: int = Field(default=3, description="最大错误数")
    
    def set_current_node(self, node_name: str) -> None:
        """设置当前节点"""
        self.current_node = node_name
        self.node_history.append(node_name)
        self.bump_version()
    
    def set_node_output(self, node_name: str, output: Any) -> None:
        """设置节点输出"""
        self.node_outputs[node_name] = output
        self.bump_version()
    
    def get_node_output(self, node_name: str) -> Optional[Any]:
        """获取节点输出"""
        return self.node_outputs.get(node_name)
    
    def increment_error(self) -> None:
        """增加错误计数"""
        self.error_count += 1
        self.bump_version()
    
    def should_stop(self) -> bool:
        """是否应该停止执行"""
        return self.error_count >= self.max_errors or self.is_complete
    
    def complete(self, output: Optional[Dict[str, Any]] = None) -> None:
        """标记为完成"""
        self.is_complete = True
        if output:
            self.output_data.update(output)
        self.bump_version()


@dataclass
class Checkpoint:
    """
    检查点
    
    用于保存和恢复状态
    """
    
    checkpoint_id: str
    state: BaseState
    status: CheckpointStatus = CheckpointStatus.PENDING
    created_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def mark_completed(self) -> None:
        """标记为完成"""
        self.status = CheckpointStatus.COMPLETED
        self.completed_at = datetime.utcnow()
    
    def mark_failed(self, error: str) -> None:
        """标记为失败"""
        self.status = CheckpointStatus.FAILED
        self.error_message = error
    
    def mark_rolled_back(self) -> None:
        """标记为已回滚"""
        self.status = CheckpointStatus.ROLLED_BACK
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "checkpoint_id": self.checkpoint_id,
            "state": self.state.to_dict(),
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "error_message": self.error_message,
            "metadata": self.metadata
        }


class CheckpointStore(ABC):
    """检查点存储抽象基类"""
    
    @abstractmethod
    async def save(self, checkpoint: Checkpoint) -> None:
        """保存检查点"""
        pass
    
    @abstractmethod
    async def load(self, checkpoint_id: str) -> Optional[Checkpoint]:
        """加载检查点"""
        pass
    
    @abstractmethod
    async def list_checkpoints(self, agent_id: Optional[str] = None) -> List[Checkpoint]:
        """列出检查点"""
        pass
    
    @abstractmethod
    async def delete(self, checkpoint_id: str) -> bool:
        """删除检查点"""
        pass


class FileCheckpointStore(CheckpointStore):
    """文件系统检查点存储"""
    
    def __init__(self, base_path: str = "./checkpoints"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        self._lock = asyncio.Lock()
    
    def _get_checkpoint_path(self, checkpoint_id: str) -> Path:
        """获取检查点文件路径"""
        return self.base_path / f"{checkpoint_id}.json"
    
    async def save(self, checkpoint: Checkpoint) -> None:
        """保存检查点"""
        async with self._lock:
            path = self._get_checkpoint_path(checkpoint.checkpoint_id)
            checkpoint_data = checkpoint.to_dict()
            
            # 序列化状态
            state_json = json.dumps(checkpoint_data, indent=2, default=str)
            
            # 原子写入
            temp_path = path.with_suffix(".tmp")
            temp_path.write_text(state_json, encoding="utf-8")
            temp_path.replace(path)
            
            ContextLogger.info(f"检查点已保存: {checkpoint.checkpoint_id}")
    
    async def load(self, checkpoint_id: str) -> Optional[Checkpoint]:
        """加载检查点"""
        path = self._get_checkpoint_path(checkpoint_id)
        
        if not path.exists():
            return None
        
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            
            # 反序列化状态
            state_data = data.pop("state")
            state = BaseState.from_dict(state_data)
            
            return Checkpoint(
                checkpoint_id=data["checkpoint_id"],
                state=state,
                status=CheckpointStatus(data["status"]),
                created_at=datetime.fromisoformat(data["created_at"]),
                completed_at=datetime.fromisoformat(data["completed_at"]) if data["completed_at"] else None,
                error_message=data.get("error_message"),
                metadata=data.get("metadata", {})
            )
        except Exception as e:
            ContextLogger.error(f"加载检查点失败 {checkpoint_id}: {e}")
            return None
    
    async def list_checkpoints(self, agent_id: Optional[str] = None) -> List[Checkpoint]:
        """列出检查点"""
        checkpoints = []
        
        for path in self.base_path.glob("*.json"):
            checkpoint_id = path.stem
            checkpoint = await self.load(checkpoint_id)
            if checkpoint:
                if agent_id is None or checkpoint.state.metadata.get("agent_id") == agent_id:
                    checkpoints.append(checkpoint)
        
        return sorted(checkpoints, key=lambda x: x.created_at, reverse=True)
    
    async def delete(self, checkpoint_id: str) -> bool:
        """删除检查点"""
        path = self._get_checkpoint_path(checkpoint_id)
        
        if path.exists():
            path.unlink()
            ContextLogger.info(f"检查点已删除: {checkpoint_id}")
            return True
        return False


class StateManager:
    """
    状态管理器
    
    管理状态的创建、保存、恢复和检查点
    """
    
    def __init__(self, checkpoint_store: Optional[CheckpointStore] = None):
        self.checkpoint_store = checkpoint_store or FileCheckpointStore()
        self._active_states: Dict[str, BaseState] = {}
    
    def create_state(
        self,
        state_class: type,
        state_id: str,
        **kwargs
    ) -> BaseState:
        """创建新状态"""
        state = state_class(**kwargs)
        state.metadata["state_id"] = state_id
        state.bump_version()
        self._active_states[state_id] = state
        return state
    
    def get_state(self, state_id: str) -> Optional[BaseState]:
        """获取活动状态"""
        return self._active_states.get(state_id)
    
    def update_state(self, state_id: str, state: BaseState) -> None:
        """更新活动状态"""
        self._active_states[state_id] = state
    
    async def create_checkpoint(
        self,
        state_id: str,
        checkpoint_id: Optional[str] = None
    ) -> Optional[Checkpoint]:
        """创建检查点"""
        state = self.get_state(state_id)
        if not state:
            ContextLogger.error(f"创建检查点失败: 状态不存在 {state_id}")
            return None
        
        checkpoint_id = checkpoint_id or f"{state_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        checkpoint = Checkpoint(
            checkpoint_id=checkpoint_id,
            state=state.copy()
        )
        
        await self.checkpoint_store.save(checkpoint)
        return checkpoint
    
    async def restore_from_checkpoint(
        self,
        checkpoint_id: str
    ) -> Optional[BaseState]:
        """从检查点恢复"""
        checkpoint = await self.checkpoint_store.load(checkpoint_id)
        
        if not checkpoint:
            ContextLogger.error(f"恢复失败: 检查点不存在 {checkpoint_id}")
            return None
        
        state = checkpoint.state
        state_id = state.metadata.get("state_id")
        
        if state_id:
            self._active_states[state_id] = state
        
        ContextLogger.info(f"状态已从检查点恢复: {checkpoint_id}")
        return state
    
    async def cleanup_old_checkpoints(self, max_age_days: int = 7) -> int:
        """清理旧检查点"""
        checkpoints = await self.checkpoint_store.list_checkpoints()
        deleted_count = 0
        
        for checkpoint in checkpoints:
            age = (datetime.utcnow() - checkpoint.created_at).days
            if age > max_age_days:
                await self.checkpoint_store.delete(checkpoint.checkpoint_id)
                deleted_count += 1
        
        ContextLogger.info(f"清理了 {deleted_count} 个旧检查点")
        return deleted_count


# 全局状态管理器
state_manager = StateManager()
