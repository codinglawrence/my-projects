"""
性能优化工具

提供性能监控、缓存管理和资源优化功能
"""

import time
import functools
from typing import Any, Callable, Dict, Optional, TypeVar
from contextlib import contextmanager
from dataclasses import dataclass
from loguru import logger


T = TypeVar('T')


@dataclass
class PerformanceMetrics:
    """性能指标"""
    function_name: str
    execution_time: float
    memory_usage: Optional[int] = None
    success: bool = True
    error: Optional[str] = None


def time_it(func: Callable[..., T]) -> Callable[..., T]:
    """
    性能计时装饰器
    
    Args:
        func: 要计时的函数
        
    Returns:
        包装后的函数
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs) -> T:
        start_time = time.perf_counter()
        try:
            result = func(*args, **kwargs)
            execution_time = time.perf_counter() - start_time
            
            # 记录性能指标
            if execution_time > 1.0:  # 超过1秒的调用需要关注
                logger.warning(
                    f"性能警告: {func.__name__} 耗时 {execution_time:.2f}秒"
                )
            
            return result
        except Exception as e:
            execution_time = time.perf_counter() - start_time
            logger.error(
                f"函数 {func.__name__} 执行失败，耗时 {execution_time:.2f}秒: {e}"
            )
            raise
    
    return wrapper


class CacheManager:
    """缓存管理器"""
    
    def __init__(self, max_size: int = 1000, ttl: int = 300):
        """
        初始化缓存管理器
        
        Args:
            max_size: 最大缓存项数
            ttl: 缓存生存时间（秒）
        """
        self.max_size = max_size
        self.ttl = ttl
        self._cache: Dict[str, Dict[str, Any]] = {}
    
    def get(self, key: str) -> Optional[Any]:
        """获取缓存值"""
        if key not in self._cache:
            return None
        
        item = self._cache[key]
        
        # 检查是否过期
        if time.time() - item['timestamp'] > self.ttl:
            del self._cache[key]
            return None
        
        return item['value']
    
    def set(self, key: str, value: Any) -> None:
        """设置缓存值"""
        # 检查缓存大小
        if len(self._cache) >= self.max_size:
            # 移除最旧的项
            oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k]['timestamp'])
            del self._cache[oldest_key]
        
        self._cache[key] = {
            'value': value,
            'timestamp': time.time()
        }
    
    def clear(self) -> None:
        """清空缓存"""
        self._cache.clear()
    
    def size(self) -> int:
        """获取缓存大小"""
        return len(self._cache)


class ResourceMonitor:
    """资源监控器"""
    
    def __init__(self):
        self.active_connections = 0
        self.memory_usage = 0
        self.peak_memory = 0
    
    @contextmanager
    def track_connection(self):
        """跟踪数据库连接"""
        self.active_connections += 1
        try:
            yield
        finally:
            self.active_connections -= 1
    
    def get_metrics(self) -> Dict[str, Any]:
        """获取资源指标"""
        return {
            'active_connections': self.active_connections,
            'memory_usage': self.memory_usage,
            'peak_memory': self.peak_memory
        }


# 全局实例
cache_manager = CacheManager()
resource_monitor = ResourceMonitor()


def cache_result(ttl: int = 300) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """
    缓存结果装饰器
    
    Args:
        ttl: 缓存生存时间（秒）
        
    Returns:
        包装后的函数
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> T:
            # 生成缓存键
            cache_key = f"{func.__module__}.{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # 尝试从缓存获取
            cached_result = cache_manager.get(cache_key)
            if cached_result is not None:
                logger.debug(f"缓存命中: {func.__name__}")
                return cached_result
            
            # 执行函数
            result = func(*args, **kwargs)
            
            # 缓存结果
            cache_manager.set(cache_key, result)
            
            return result
        
        return wrapper
    
    return decorator


def retry_on_failure(
    max_retries: int = 3, 
    delay: float = 1.0,
    backoff_factor: float = 2.0
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """
    失败重试装饰器
    
    Args:
        max_retries: 最大重试次数
        delay: 初始延迟时间（秒）
        backoff_factor: 退避因子
        
    Returns:
        包装后的函数
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> T:
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    
                    if attempt == max_retries:
                        break
                    
                    # 计算延迟时间
                    current_delay = delay * (backoff_factor ** attempt)
                    logger.warning(
                        f"{func.__name__} 第 {attempt + 1} 次失败，{current_delay:.1f}秒后重试: {e}"
                    )
                    
                    time.sleep(current_delay)
            
            # 所有重试都失败
            raise last_exception
        
        return wrapper
    
    return decorator