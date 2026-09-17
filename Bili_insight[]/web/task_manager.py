"""后台任务管理：内存任务 + 进度回传。

设计（见 system-design-desktop）：
- TaskManager 在内存中维护任务字典，每个任务由独立后台线程驱动 BilibiliUpCrawler。
- 引擎通过 progress_callback 上报“已处理/总数/当前标题”，写入对应 Task。
- 前端以 /api/task/<id>/status 轮询真实进度，任务 done 后取 /api/task/<id>/result。
- 本期仅单 UP 主顺序任务；预留队列接口（enqueue）供未来批量（P2-2）扩展。
"""
from __future__ import annotations

import threading
import traceback
import uuid
from typing import Any, Dict, List, Optional

from main import BilibiliUpCrawler


class Task:
    """单个提取任务的状态容器。"""

    def __init__(self, task_id: str) -> None:
        self.id = task_id
        self.status = "pending"            # pending | running | done | error
        self.stage = ""                    # fetching | processing
        self.processed = 0
        self.total = 0
        self.current_title = ""
        self.results: List[Dict[str, Any]] = []
        self.overall_summary = ""
        self.error: Optional[str] = None

    def to_status(self) -> Dict[str, Any]:
        """返回 /api/task/<id>/status 需要的字段。"""
        return {
            "id": self.id,
            "status": self.status,
            "stage": self.stage,
            "processed": self.processed,
            "total": self.total,
            "current_title": self.current_title,
            "error": self.error,
        }

    def to_result(self) -> Dict[str, Any]:
        """返回 /api/task/<id>/result 需要的字段。"""
        return {
            "id": self.id,
            "status": self.status,
            "results": self.results,
            "overall_summary": self.overall_summary,
            "error": self.error,
        }


class TaskManager:
    """内存任务管理器（由 app.py 持有，单例语义）。"""

    def __init__(self) -> None:
        self._tasks: Dict[str, Task] = {}
        self._lock = threading.Lock()

    # ---------- 对外接口 ----------
    def create(self, params: Dict[str, Any]) -> str:
        """创建任务并启动后台线程，立即返回 task_id（异步）。"""
        task_id = uuid.uuid4().hex
        task = Task(task_id)
        with self._lock:
            self._tasks[task_id] = task
        # 后台线程驱动爬虫；daemon=True 保证主进程退出时不会滞留
        thread = threading.Thread(
            target=self._run, args=(task_id, params), daemon=True
        )
        thread.start()
        return task_id

    def get(self, task_id: str) -> Optional[Task]:
        with self._lock:
            return self._tasks.get(task_id)

    def update_progress(self, task_id: str, stage: str, processed: int,
                        total: int, current_title: str) -> None:
        with self._lock:
            task = self._tasks.get(task_id)
            if not task:
                return
            task.stage = stage
            task.processed = processed
            task.total = total
            task.current_title = current_title
            task.status = "running"

    def finish(self, task_id: str, results: List[Dict[str, Any]],
               overall_summary: str) -> None:
        with self._lock:
            task = self._tasks.get(task_id)
            if not task:
                return
            task.results = results
            task.overall_summary = overall_summary
            task.status = "done"

    def finish_with_error(self, task_id: str, error: str) -> None:
        with self._lock:
            task = self._tasks.get(task_id)
            if not task:
                return
            task.error = error
            task.status = "error"

    # ---------- 后台执行 ----------
    def _run(self, task_id: str, params: Dict[str, Any]) -> None:
        try:
            crawler = BilibiliUpCrawler(
                up_mid=str(params.get("uid", "")),
                max_videos=int(params.get("max_videos", 5)),
                model_type=params.get("model_type"),
                api_keys=params.get("api_keys", {}),
                temperature=params.get("temperature"),
                max_tokens=params.get("max_tokens"),
            )

            # 进度回调：把引擎的进度写入当前任务
            def _callback(stage: str, processed: int, total: int,
                          current_title: str) -> None:
                self.update_progress(task_id, stage, processed, total,
                                     current_title)

            crawler.progress_callback = _callback  # type: ignore[assignment]

            # 1) 获取视频列表
            crawler.get_up_videos()
            if not crawler.videos:
                self.finish_with_error(task_id, "没有获取到视频，请检查 UID 是否正确")
                return

            # 2) 处理所有视频（期间回调持续上报真实进度）
            crawler.process_all_videos()

            # 3) 整体总结
            overall_summary = crawler.generate_overall_summary()

            self.finish(task_id, crawler.results, overall_summary)
        except Exception as exc:  # 捕获所有异常，避免后台线程静默崩溃
            traceback.print_exc()
            self.finish_with_error(task_id, str(exc))

    # ---------- 预留：批量队列（P2-2） ----------
    def enqueue(self, params_list: List[Dict[str, Any]]) -> List[str]:
        """未来批量处理：依次创建多个任务并返回 task_id 列表。"""
        return [self.create(p) for p in params_list]
