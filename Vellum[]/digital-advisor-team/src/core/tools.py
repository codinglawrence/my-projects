"""
工具系统模块
提供工具注册装饰器、参数Schema校验、执行结果统一封装、工具调用日志
"""

import inspect
import json
from typing import (
    Dict, Any, Optional, List, Callable, Type, get_type_hints, get_origin, get_args
)
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from enum import Enum, auto
from functools import wraps
import asyncio

from pydantic import BaseModel, Field, create_model, ValidationError

from src.core.exceptions import ToolException, ValidationException
from src.core.logging import ContextLogger


class ToolResultStatus(Enum):
    """工具执行结果状态"""
    SUCCESS = auto()
    FAILURE = auto()
    PARTIAL = auto()
    TIMEOUT = auto()


@dataclass
class ToolResult:
    """
    工具执行结果统一封装
    
    所有工具必须返回此格式的结果
    """
    status: ToolResultStatus
    data: Any = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    execution_time_ms: float = 0.0
    
    @classmethod
    def success(
        cls,
        data: Any,
        execution_time_ms: float = 0.0,
        **metadata
    ) -> "ToolResult":
        """创建成功结果"""
        return cls(
            status=ToolResultStatus.SUCCESS,
            data=data,
            execution_time_ms=execution_time_ms,
            metadata=metadata
        )
    
    @classmethod
    def failure(
        cls,
        error: str,
        execution_time_ms: float = 0.0,
        **metadata
    ) -> "ToolResult":
        """创建失败结果"""
        return cls(
            status=ToolResultStatus.FAILURE,
            error=error,
            execution_time_ms=execution_time_ms,
            metadata=metadata
        )
    
    @classmethod
    def partial(
        cls,
        data: Any,
        error: str,
        execution_time_ms: float = 0.0,
        **metadata
    ) -> "ToolResult":
        """创建部分成功结果"""
        return cls(
            status=ToolResultStatus.PARTIAL,
            data=data,
            error=error,
            execution_time_ms=execution_time_ms,
            metadata=metadata
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "status": self.status.name,
            "data": self.data,
            "error": self.error,
            "metadata": self.metadata,
            "execution_time_ms": self.execution_time_ms
        }
    
    @property
    def is_success(self) -> bool:
        """是否成功"""
        return self.status == ToolResultStatus.SUCCESS


class ToolParameter(BaseModel):
    """工具参数定义"""
    
    name: str = Field(description="参数名")
    type: str = Field(description="参数类型")
    description: str = Field(description="参数描述")
    required: bool = Field(default=True, description="是否必需")
    default: Any = Field(default=None, description="默认值")
    enum: Optional[List[Any]] = Field(default=None, description="枚举值")


class ToolSchema(BaseModel):
    """工具Schema定义"""
    
    name: str = Field(description="工具名称")
    description: str = Field(description="工具描述")
    parameters: List[ToolParameter] = Field(default_factory=list, description="参数列表")
    returns: Dict[str, Any] = Field(default_factory=dict, description="返回值描述")
    
    def to_openai_function(self) -> Dict[str, Any]:
        """转换为OpenAI Function格式"""
        properties = {}
        required = []
        
        for param in self.parameters:
            prop = {
                "type": param.type,
                "description": param.description
            }
            if param.enum:
                prop["enum"] = param.enum
            properties[param.name] = prop
            
            if param.required:
                required.append(param.name)
        
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": properties,
                    "required": required
                }
            }
        }


class BaseTool(ABC):
    """
    基础工具类
    
    所有工具的基类，提供：
    - 统一的执行接口
    - 参数校验
    - 结果封装
    - 执行日志
    """
    
    def __init__(
        self,
        name: str,
        description: str,
        timeout: float = 30.0
    ):
        self.name = name
        self.description = description
        self.timeout = timeout
        self.schema = self._build_schema()
        
        # 统计信息
        self.call_count = 0
        self.success_count = 0
        self.failure_count = 0
        self.total_execution_time_ms = 0.0
    
    @abstractmethod
    async def _execute(self, **params) -> Any:
        """
        实际执行逻辑（子类实现）
        
        Args:
            **params: 参数
            
        Returns:
            执行结果
        """
        pass
    
    def _build_schema(self) -> ToolSchema:
        """构建工具Schema"""
        # 从_execute方法的签名提取参数
        sig = inspect.signature(self._execute)
        type_hints = get_type_hints(self._execute)
        
        parameters = []
        for param_name, param in sig.parameters.items():
            if param_name == "self":
                continue
            
            param_type = type_hints.get(param_name, str)
            type_str = self._python_type_to_json_type(param_type)
            
            tool_param = ToolParameter(
                name=param_name,
                type=type_str,
                description=param_name.replace("_", " "),
                required=param.default == inspect.Parameter.empty,
                default=None if param.default == inspect.Parameter.empty else param.default
            )
            parameters.append(tool_param)
        
        return ToolSchema(
            name=self.name,
            description=self.description,
            parameters=parameters
        )
    
    def _python_type_to_json_type(self, py_type: Type) -> str:
        """Python类型转JSON Schema类型"""
        origin = get_origin(py_type)
        
        if origin is not None:
            # 处理泛型类型
            if origin is list or origin is List:
                return "array"
            elif origin is dict or origin is Dict:
                return "object"
            elif origin is Optional:
                args = get_args(py_type)
                if args:
                    return self._python_type_to_json_type(args[0])
        
        # 基本类型映射
        type_map = {
            str: "string",
            int: "integer",
            float: "number",
            bool: "boolean",
            list: "array",
            dict: "object",
            Any: "object"
        }
        
        return type_map.get(py_type, "string")
    
    def _validate_params(self, params: Dict[str, Any]) -> None:
        """校验参数"""
        errors = []
        
        for param in self.schema.parameters:
            if param.required and param.name not in params:
                errors.append(f"缺少必需参数: {param.name}")
            
            if param.name in params and param.enum:
                if params[param.name] not in param.enum:
                    errors.append(f"参数 {param.name} 值无效，必须是 {param.enum}")
        
        if errors:
            raise ValidationException(
                message=f"工具 {self.name} 参数校验失败",
                errors=[{"field": e} for e in errors]
            )
    
    async def execute(self, **params) -> ToolResult:
        """
        执行工具
        
        Args:
            **params: 参数
            
        Returns:
            ToolResult: 执行结果
        """
        import time
        
        self.call_count += 1
        start_time = time.perf_counter()
        
        ContextLogger.info(f"工具调用: {self.name}", extra={"params": params})
        
        try:
            # 校验参数
            self._validate_params(params)
            
            # 设置超时执行
            result = await asyncio.wait_for(
                self._execute(**params),
                timeout=self.timeout
            )
            
            execution_time_ms = (time.perf_counter() - start_time) * 1000
            self.success_count += 1
            self.total_execution_time_ms += execution_time_ms
            
            ContextLogger.info(
                f"工具执行成功: {self.name}",
                extra={"execution_time_ms": execution_time_ms}
            )
            
            return ToolResult.success(
                data=result,
                execution_time_ms=execution_time_ms
            )
            
        except asyncio.TimeoutError:
            execution_time_ms = (time.perf_counter() - start_time) * 1000
            self.failure_count += 1
            
            ContextLogger.error(
                f"工具执行超时: {self.name}",
                extra={"timeout": self.timeout}
            )
            
            return ToolResult.failure(
                error=f"执行超时: {self.timeout}秒",
                execution_time_ms=execution_time_ms
            )
            
        except Exception as e:
            execution_time_ms = (time.perf_counter() - start_time) * 1000
            self.failure_count += 1
            
            ContextLogger.exception(f"工具执行失败: {self.name}")
            
            return ToolResult.failure(
                error=str(e),
                execution_time_ms=execution_time_ms
            )
    
    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        avg_time = (
            self.total_execution_time_ms / self.call_count
            if self.call_count > 0 else 0
        )
        return {
            "name": self.name,
            "calls": self.call_count,
            "successes": self.success_count,
            "failures": self.failure_count,
            "success_rate": (
                self.success_count / self.call_count
                if self.call_count > 0 else 0
            ),
            "avg_execution_time_ms": round(avg_time, 2),
            "total_execution_time_ms": round(self.total_execution_time_ms, 2)
        }


class FunctionTool(BaseTool):
    """
    函数工具
    
    将普通函数包装为工具
    """
    
    def __init__(
        self,
        func: Callable,
        name: Optional[str] = None,
        description: Optional[str] = None,
        timeout: float = 30.0
    ):
        self.func = func
        self.is_async = asyncio.iscoroutinefunction(func)
        
        # 从函数文档提取描述
        func_name = name or func.__name__
        func_desc = description or func.__doc__ or f"执行 {func_name}"
        
        super().__init__(func_name, func_desc, timeout)
    
    async def _execute(self, **params) -> Any:
        """执行函数"""
        if self.is_async:
            return await self.func(**params)
        else:
            return self.func(**params)


class ToolRegistry:
    """
    工具注册表
    
    管理所有可用工具
    """
    
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
    
    def register(self, tool: BaseTool) -> None:
        """注册工具"""
        self._tools[tool.name] = tool
        ContextLogger.info(f"工具已注册: {tool.name}")
    
    def get(self, name: str) -> Optional[BaseTool]:
        """获取工具"""
        return self._tools.get(name)
    
    def list_tools(self) -> List[str]:
        """列出所有工具"""
        return list(self._tools.keys())
    
    def get_schemas(self) -> List[ToolSchema]:
        """获取所有工具Schema"""
        return [tool.schema for tool in self._tools.values()]
    
    def get_openai_functions(self) -> List[Dict[str, Any]]:
        """获取OpenAI Function格式"""
        return [tool.schema.to_openai_function() for tool in self._tools.values()]
    
    async def execute(self, name: str, **params) -> ToolResult:
        """执行工具"""
        tool = self.get(name)
        if not tool:
            return ToolResult.failure(error=f"工具不存在: {name}")
        
        return await tool.execute(**params)
    
    def get_stats(self) -> Dict[str, Dict[str, Any]]:
        """获取所有工具统计"""
        return {
            name: tool.get_stats()
            for name, tool in self._tools.items()
        }


# 全局工具注册表
tool_registry = ToolRegistry()


def tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    timeout: float = 30.0
):
    """
    工具装饰器
    
    将函数注册为工具
    
    Example:
        @tool(name="search", description="搜索信息")
        async def search(query: str, limit: int = 10) -> list:
            return results
    """
    def decorator(func: Callable) -> BaseTool:
        tool_instance = FunctionTool(
            func=func,
            name=name,
            description=description,
            timeout=timeout
        )
        
        # 自动注册
        tool_registry.register(tool_instance)
        
        return tool_instance
    return decorator


# ==================== 预定义工具 ====================

class CalculatorTool(BaseTool):
    """计算器工具"""
    
    def __init__(self):
        super().__init__(
            name="calculator",
            description="执行数学计算",
            timeout=5.0
        )
    
    async def _execute(self, expression: str) -> Dict[str, Any]:
        """执行计算"""
        try:
            # 安全计算，只允许基本运算
            allowed_names = {
                "abs": abs,
                "max": max,
                "min": min,
                "sum": sum,
                "round": round,
                "pow": pow
            }
            
            result = eval(expression, {"__builtins__": {}}, allowed_names)
            return {"result": result, "expression": expression}
        except Exception as e:
            raise ValueError(f"计算错误: {e}")


class WebSearchTool(BaseTool):
    """网页搜索工具（示例）"""
    
    def __init__(self):
        super().__init__(
            name="web_search",
            description="搜索网页信息",
            timeout=10.0
        )
    
    async def _execute(self, query: str, num_results: int = 5) -> List[Dict[str, str]]:
        """执行搜索"""
        # 这里应该集成实际的搜索API
        # 目前返回模拟数据
        return [
            {
                "title": f"搜索结果 {i+1} for: {query}",
                "url": f"https://example.com/result{i+1}",
                "snippet": f"这是关于 {query} 的搜索结果摘要..."
            }
            for i in range(min(num_results, 10))
        ]


class DatabaseQueryTool(BaseTool):
    """数据库查询工具（示例）"""
    
    def __init__(self):
        super().__init__(
            name="db_query",
            description="查询数据库",
            timeout=10.0
        )
    
    async def _execute(
        self,
        table: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """执行查询"""
        # 这里应该集成实际的数据库查询
        ContextLogger.info(f"数据库查询: {table}, filters={filters}, limit={limit}")
        return [{"id": i, "table": table} for i in range(limit)]


# 注册预定义工具
tool_registry.register(CalculatorTool())
tool_registry.register(WebSearchTool())
tool_registry.register(DatabaseQueryTool())
