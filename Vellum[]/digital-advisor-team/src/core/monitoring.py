"""
监控和可观测性模块
提供成本、延迟、质量指标的追踪和告警
"""

import time
import asyncio
from typing import Dict, Any, Optional, List, Callable, Deque
from dataclasses import dataclass, field
from collections import deque
from enum import Enum
from datetime import datetime, timedelta
from abc import ABC, abstractmethod

from src.core.logging import ContextLogger
from src.core.exceptions import DigitalAdvisorException as BaseAppException


class MetricType(Enum):
    """指标类型"""
    COUNTER = "counter"       # 计数器
    GAUGE = "gauge"          # 仪表盘
    HISTOGRAM = "histogram"  # 直方图
    SUMMARY = "summary"      # 摘要


@dataclass
class MetricValue:
    """指标值"""
    name: str
    value: float
    metric_type: MetricType
    labels: Dict[str, str] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "value": self.value,
            "type": self.metric_type.value,
            "labels": self.labels,
            "timestamp": self.timestamp.isoformat()
        }


class MetricsCollector:
    """
    指标收集器
    
    收集系统各项指标
    """
    
    def __init__(self, max_history: int = 10000):
        self.max_history = max_history
        self._metrics: Dict[str, Deque[MetricValue]] = {}
        self._gauges: Dict[str, float] = {}
        self._counters: Dict[str, float] = {}
        self._lock = asyncio.Lock()
    
    async def record(
        self,
        name: str,
        value: float,
        metric_type: MetricType = MetricType.GAUGE,
        labels: Optional[Dict[str, str]] = None
    ) -> None:
        """记录指标"""
        async with self._lock:
            metric = MetricValue(
                name=name,
                value=value,
                metric_type=metric_type,
                labels=labels or {}
            )
            
            if name not in self._metrics:
                self._metrics[name] = deque(maxlen=self.max_history)
            
            self._metrics[name].append(metric)
            
            # 更新计数器和仪表盘
            if metric_type == MetricType.COUNTER:
                self._counters[name] = self._counters.get(name, 0) + value
            elif metric_type == MetricType.GAUGE:
                self._gauges[name] = value
    
    async def increment_counter(
        self,
        name: str,
        value: float = 1.0,
        labels: Optional[Dict[str, str]] = None
    ) -> None:
        """增加计数器"""
        await self.record(name, value, MetricType.COUNTER, labels)
    
    async def set_gauge(
        self,
        name: str,
        value: float,
        labels: Optional[Dict[str, str]] = None
    ) -> None:
        """设置仪表盘"""
        await self.record(name, value, MetricType.GAUGE, labels)
    
    async def record_histogram(
        self,
        name: str,
        value: float,
        labels: Optional[Dict[str, str]] = None
    ) -> None:
        """记录直方图"""
        await self.record(name, value, MetricType.HISTOGRAM, labels)
    
    def get_current_value(self, name: str) -> Optional[float]:
        """获取当前值"""
        if name in self._gauges:
            return self._gauges[name]
        if name in self._counters:
            return self._counters[name]
        return None
    
    def get_history(
        self,
        name: str,
        since: Optional[datetime] = None
    ) -> List[MetricValue]:
        """获取历史数据"""
        if name not in self._metrics:
            return []
        
        metrics = list(self._metrics[name])
        
        if since:
            metrics = [m for m in metrics if m.timestamp >= since]
        
        return metrics
    
    def get_stats(self, name: str) -> Dict[str, Any]:
        """获取统计信息"""
        history = self.get_history(name)
        
        if not history:
            return {"name": name, "count": 0}
        
        values = [m.value for m in history]
        values.sort()
        
        n = len(values)
        return {
            "name": name,
            "count": n,
            "sum": sum(values),
            "min": values[0],
            "max": values[-1],
            "mean": sum(values) / n,
            "p50": values[int(n * 0.5)],
            "p95": values[int(n * 0.95)] if n > 20 else values[-1],
            "p99": values[int(n * 0.99)] if n > 100 else values[-1],
        }
    
    def get_all_stats(self) -> Dict[str, Dict[str, Any]]:
        """获取所有指标统计"""
        return {
            name: self.get_stats(name)
            for name in self._metrics.keys()
        }


class AlertRule:
    """告警规则"""
    
    def __init__(
        self,
        name: str,
        metric_name: str,
        condition: Callable[[float], bool],
        severity: str = "warning",
        cooldown_minutes: int = 5
    ):
        self.name = name
        self.metric_name = metric_name
        self.condition = condition
        self.severity = severity
        self.cooldown_minutes = cooldown_minutes
        self.last_alert: Optional[datetime] = None
        self.alert_count = 0
    
    def check(self, value: float) -> bool:
        """检查是否触发告警"""
        if not self.condition(value):
            return False
        
        # 检查冷却时间
        if self.last_alert:
            cooldown = timedelta(minutes=self.cooldown_minutes)
            if datetime.utcnow() - self.last_alert < cooldown:
                return False
        
        return True
    
    def trigger(self) -> Dict[str, Any]:
        """触发告警"""
        self.last_alert = datetime.utcnow()
        self.alert_count += 1
        
        return {
            "rule_name": self.name,
            "metric_name": self.metric_name,
            "severity": self.severity,
            "timestamp": self.last_alert.isoformat(),
            "alert_count": self.alert_count
        }


class AlertManager:
    """告警管理器"""
    
    def __init__(self):
        self.rules: List[AlertRule] = []
        self.handlers: List[Callable[[Dict[str, Any]], None]] = []
        self._running = False
    
    def add_rule(self, rule: AlertRule) -> None:
        """添加告警规则"""
        self.rules.append(rule)
    
    def add_handler(self, handler: Callable[[Dict[str, Any]], None]) -> None:
        """添加告警处理器"""
        self.handlers.append(handler)
    
    async def evaluate(self, metrics_collector: MetricsCollector) -> List[Dict[str, Any]]:
        """评估告警规则"""
        triggered = []
        
        for rule in self.rules:
            value = metrics_collector.get_current_value(rule.metric_name)
            
            if value is not None and rule.check(value):
                alert = rule.trigger()
                triggered.append(alert)
                
                # 通知处理器
                for handler in self.handlers:
                    try:
                        handler(alert)
                    except Exception as e:
                        ContextLogger.error(f"告警处理器失败: {e}")
        
        return triggered
    
    async def start_monitoring(
        self,
        metrics_collector: MetricsCollector,
        interval_seconds: float = 60.0
    ) -> None:
        """开始监控"""
        self._running = True
        
        while self._running:
            try:
                alerts = await self.evaluate(metrics_collector)
                
                for alert in alerts:
                    ContextLogger.warning(
                        f"告警触发: {alert['rule_name']}",
                        extra={"alert": alert}
                    )
                
                await asyncio.sleep(interval_seconds)
                
            except Exception as e:
                ContextLogger.error(f"监控循环错误: {e}")
                await asyncio.sleep(interval_seconds)
    
    def stop(self) -> None:
        """停止监控"""
        self._running = False


class PerformanceMonitor:
    """
    性能监控器
    
    监控系统性能指标
    """
    
    def __init__(self, metrics_collector: Optional[MetricsCollector] = None):
        self.metrics = metrics_collector or MetricsCollector()
        self.alert_manager = AlertManager()
        
        # 默认告警规则
        self._setup_default_alerts()
    
    def _setup_default_alerts(self) -> None:
        """设置默认告警规则"""
        # LLM延迟告警
        self.alert_manager.add_rule(AlertRule(
            name="llm_high_latency",
            metric_name="llm_latency_ms",
            condition=lambda v: v > 5000,
            severity="warning"
        ))
        
        # LLM成本告警
        self.alert_manager.add_rule(AlertRule(
            name="llm_high_cost",
            metric_name="llm_cost_usd",
            condition=lambda v: v > 10.0,
            severity="critical"
        ))
        
        # 错误率告警
        self.alert_manager.add_rule(AlertRule(
            name="high_error_rate",
            metric_name="error_rate",
            condition=lambda v: v > 0.1,
            severity="critical"
        ))
    
    async def record_llm_call(
        self,
        model: str,
        latency_ms: float,
        cost_usd: float,
        tokens: int,
        success: bool
    ) -> None:
        """记录LLM调用"""
        await self.metrics.record_histogram("llm_latency_ms", latency_ms, {"model": model})
        await self.metrics.increment_counter("llm_cost_usd_total", cost_usd)
        await self.metrics.set_gauge("llm_cost_usd", cost_usd)
        await self.metrics.increment_counter("llm_tokens_total", tokens)
        
        if success:
            await self.metrics.increment_counter("llm_success_total")
        else:
            await self.metrics.increment_counter("llm_failure_total")
    
    async def record_db_query(
        self,
        operation: str,
        table: str,
        latency_ms: float,
        success: bool
    ) -> None:
        """记录数据库查询"""
        labels = {"operation": operation, "table": table}
        await self.metrics.record_histogram("db_query_latency_ms", latency_ms, labels)
        
        if success:
            await self.metrics.increment_counter("db_success_total", labels=labels)
        else:
            await self.metrics.increment_counter("db_failure_total", labels=labels)
    
    async def record_agent_execution(
        self,
        agent_name: str,
        node_name: str,
        latency_ms: float,
        success: bool
    ) -> None:
        """记录Agent执行"""
        labels = {"agent": agent_name, "node": node_name}
        await self.metrics.record_histogram("agent_node_latency_ms", latency_ms, labels)
        
        if success:
            await self.metrics.increment_counter("agent_success_total", labels=labels)
        else:
            await self.metrics.increment_counter("agent_failure_total", labels=labels)
    
    async def record_request(
        self,
        endpoint: str,
        method: str,
        latency_ms: float,
        status_code: int
    ) -> None:
        """记录HTTP请求"""
        labels = {"endpoint": endpoint, "method": method}
        await self.metrics.record_histogram("http_request_latency_ms", latency_ms, labels)
        await self.metrics.increment_counter("http_requests_total", labels=labels)
        
        if 200 <= status_code < 400:
            await self.metrics.increment_counter("http_success_total", labels=labels)
        else:
            await self.metrics.increment_counter("http_error_total", labels=labels)
    
    async def update_error_rate(self) -> None:
        """更新错误率"""
        total_errors = (
            self.metrics.get_current_value("llm_failure_total") or 0 +
            self.metrics.get_current_value("db_failure_total") or 0 +
            self.metrics.get_current_value("agent_failure_total") or 0
        )
        
        total_requests = (
            self.metrics.get_current_value("llm_success_total") or 0 +
            self.metrics.get_current_value("db_success_total") or 0 +
            self.metrics.get_current_value("agent_success_total") or 0 +
            total_errors
        )
        
        if total_requests > 0:
            error_rate = total_errors / total_requests
            await self.metrics.set_gauge("error_rate", error_rate)
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """获取仪表盘数据"""
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": self.metrics.get_all_stats(),
            "current_values": {
                "llm_cost_usd": self.metrics.get_current_value("llm_cost_usd"),
                "llm_latency_ms": self.metrics.get_current_value("llm_latency_ms"),
                "error_rate": self.metrics.get_current_value("error_rate"),
            }
        }
    
    async def start(self, interval_seconds: float = 60.0) -> None:
        """启动监控"""
        asyncio.create_task(
            self.alert_manager.start_monitoring(self.metrics, interval_seconds)
        )


class CostAnalyzer:
    """
    成本分析器
    
    分析系统成本并提供优化建议
    """
    
    def __init__(self, metrics_collector: MetricsCollector):
        self.metrics = metrics_collector
    
    def analyze(self) -> Dict[str, Any]:
        """分析成本"""
        llm_cost = self.metrics.get_current_value("llm_cost_usd_total") or 0
        
        # 获取LLM调用历史
        llm_history = self.metrics.get_history("llm_latency_ms", 
            since=datetime.utcnow() - timedelta(days=1))
        
        analysis = {
            "total_cost_usd": round(llm_cost, 6),
            "daily_cost_usd": 0.0,
            "cost_by_model": {},
            "optimization_suggestions": []
        }
        
        # 计算日均成本
        if llm_history:
            days = 1  # 简化计算
            analysis["daily_cost_usd"] = round(llm_cost / days, 6)
        
        # 生成优化建议
        suggestions = []
        
        avg_latency = self.metrics.get_stats("llm_latency_ms").get("mean", 0)
        if avg_latency > 3000:
            suggestions.append({
                "type": "performance",
                "message": "LLM延迟较高，考虑使用更快的模型或启用缓存",
                "impact": "high"
            })
        
        error_rate = self.metrics.get_current_value("error_rate") or 0
        if error_rate > 0.05:
            suggestions.append({
                "type": "reliability",
                "message": "错误率超过5%，需要检查系统稳定性",
                "impact": "critical"
            })
        
        analysis["optimization_suggestions"] = suggestions
        
        return analysis


# 全局监控实例
metrics_collector = MetricsCollector()
performance_monitor = PerformanceMonitor(metrics_collector)
cost_analyzer = CostAnalyzer(metrics_collector)
