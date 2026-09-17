# -*- coding: utf-8 -*-
"""
Bili_summary 桌面端封装 —— QA 集成/单元测试（严过关 / Yan）

运行方式（在 Bili_summary 项目根目录）：
    python web/test_qa_desktop.py

测试策略说明（诚实原则）：
- 环境可用：flask / keyring / cryptography。
- 环境缺失：bilibili_api（引擎依赖）、pandas（Excel 导出依赖）。
- 由于 main.py 顶部 `from bilibili_api import ...` 无法真实导入，本测试在导入 app 之前
  把 `main` 模块替换为「忠实模拟进度回调契约」的桩引擎；并（为不污染 Windows 凭据管理器）
  把 app.key_svc 替换为内存密钥提供方。这样可在不依赖网络/重型依赖的情况下，验证工程师
  改动的所有路由与 TaskManager 真实进度链路逻辑。
- key_provider.resolve 优先级（用户 key > config 默认）单独用「真实 LocalKeyProvider +
  关闭 keyring、走 cryptography 文件兜底」做单测，验证优先级正确性。
- 前端引用一致性、main.py 进度回调契约、127.0.0.1 绑定做静态检查（npm 构建在本环境受限）。
"""

import os
import sys
import json
import time
import types
import tempfile
import unittest

# ----------------------------------------------------------------------------
# 0) 准备：把 APPDATA 指向临时目录，避免污染真实用户配置/历史/密钥文件
#    （必须在 import app 之前设置，因为 HistoryStore/SettingsStore/KeyProvider 在
#      __init__ 时读取 os.environ['APPDATA']）
# ----------------------------------------------------------------------------
_TMP_APP = tempfile.mkdtemp(prefix="bili_qa_")
os.environ["APPDATA"] = _TMP_APP

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# ----------------------------------------------------------------------------
# 1) 桩引擎：忠实模拟 main.BilibiliUpCrawler 的进度回调契约（不含网络/大模型）
#    关键：process_all_videos 会按真实顺序调用
#      progress_callback("fetching", 0, total, "")
#      progress_callback("processing", i+1, total, title)   # 每处理完一个视频 +1
# ----------------------------------------------------------------------------
def _install_stub_main():
    stub = types.ModuleType("main")

    class FakeBilibiliUpCrawler:
        def __init__(self, up_mid, max_videos=100, model_type=None, api_keys=None,
                     progress_callback=None, temperature=None, max_tokens=None):
            self.up_mid = up_mid
            self.max_videos = int(max_videos)
            self.model_type = model_type
            self.api_keys = api_keys or {}
            self.progress_callback = progress_callback
            self.temperature = temperature
            self.max_tokens = max_tokens
            self.videos = []
            self.results = []

        def get_up_videos(self):
            n = max(1, min(self.max_videos, 5))
            self.videos = [
                {
                    "bvid": f"BV{idx}",
                    "title": f"测试视频{idx}",
                    "url": f"https://b23.tv/BV{idx}",
                    "desc": "desc",
                    "pubdate": 1700000000,
                }
                for idx in range(1, n + 1)
            ]
            return self.videos

        def process_all_videos(self):
            if not self.videos:
                return
            total = len(self.videos)
            if self.progress_callback:
                self.progress_callback("fetching", 0, total, "")
            for i, v in enumerate(self.videos):
                self.process_video(v)
                # 故意放慢，便于轮询观测到「真实递增」的中间状态（非假进度）
                time.sleep(0.05)
                if self.progress_callback:
                    self.progress_callback("processing", i + 1, total, v.get("title", ""))

        def process_video(self, v):
            self.results.append({
                "视频标题": v["title"],
                "视频链接": v["url"],
                "发布时间": "2023-11-14 00:00:00",
                "核心观点": f"这是关于《{v['title']}》的核心观点。",
            })

        def generate_overall_summary(self):
            return "本期所有视频的整体总结内容。"

        def answer_question(self, q):
            return f"回答：{q}"

        def _call_model(self, prompt):
            return "模型返回结果"

    stub.BilibiliUpCrawler = FakeBilibiliUpCrawler
    sys.modules["main"] = stub


_install_stub_main()


# ----------------------------------------------------------------------------
# 2) 内存密钥提供方（避免测试时往 Windows 凭据管理器写真实凭据）
# ----------------------------------------------------------------------------
class InMemoryKeyProvider:
    def __init__(self):
        self._store = {}

    def resolve(self, provider):
        return self._store.get(provider, "")

    def set(self, provider, key):
        self._store[provider] = key

    def has(self, provider):
        return bool(self._store.get(provider))


# ----------------------------------------------------------------------------
# 3) 导入被测后端（此时 config.py 真实存在，key_provider/settings_store/
#    history_store 均使用真实模块；app.key_svc 随后被替换为内存版）
# ----------------------------------------------------------------------------
import app as backend  # noqa: E402

backend.key_svc = InMemoryKeyProvider()

FLASK_APP = backend.app
FLASK_APP.config.update(TESTING=True)
CLIENT = FLASK_APP.test_client()


# ----------------------------------------------------------------------------
# 工具
# ----------------------------------------------------------------------------
def _poll_until_done(task_id, timeout=15.0, interval=0.03):
    """轮询 /api/task/<id>/status，返回 (final_status_json, 观测到的 processed 序列)。"""
    seen_processed = []
    seen_titles = []
    deadline = time.time() + timeout
    while time.time() < deadline:
        r = CLIENT.get(f"/api/task/{task_id}/status")
        data = r.get_json()["data"]
        seen_processed.append(data["processed"])
        if data.get("current_title"):
            seen_titles.append(data["current_title"])
        if data["status"] in ("done", "error"):
            return data, seen_processed, seen_titles
        time.sleep(interval)
    return data, seen_processed, seen_titles


# ============================================================================
# 测试 1：异步 extract + 真实进度轮询 + result（核心需求 P0-3）
# ============================================================================
class TestAsyncExtractRealProgress(unittest.TestCase):
    def test_extract_async_then_poll_real_progress(self):
        # 1) 异步提交
        r = CLIENT.post("/api/extract", json={
            "uid": "123456", "max_videos": 3, "model_type": "dashscope",
        })
        self.assertEqual(r.status_code, 200)
        body = r.get_json()
        self.assertTrue(body["success"])
        self.assertIn("task_id", body["data"])
        self.assertEqual(body["data"]["status"], "pending")
        task_id = body["data"]["task_id"]

        # 2) 轮询真实进度
        final, seen, titles = _poll_until_done(task_id)
        self.assertEqual(final["status"], "done", msg=f"任务未正常完成：{final}")

        # 3) 真实进度断言：processed 必须从 0 真实递增到最后 total；不是假进度
        total = final["total"]
        self.assertEqual(total, 3, "total 应为请求的最大视频数 3")
        self.assertIn(0, seen, "应观测到初始 fetching 阶段 processed=0")
        self.assertIn(total, seen, "最终 processed 应达到 total")
        # 递增过程中应出现 1..total-1 的中间值（证明非一次性跳到 100%）
        for mid in range(1, total):
            self.assertIn(mid, seen, f"应观测到真实中间进度 processed={mid}")
        self.assertTrue(any(titles), "处理中应出现 current_title")

        # 4) 取结果
        r2 = CLIENT.get(f"/api/task/{task_id}/result")
        self.assertEqual(r2.status_code, 200)
        res = r2.get_json()["data"]
        self.assertEqual(len(res["results"]), 3, "结果数应等于 3")
        self.assertTrue(res["overall_summary"], "整体总结不应为空")


# ============================================================================
# 测试 2：/api/settings 密钥不回显 + has_key 标记（安全红线 P0-4 / P1-2）
# ============================================================================
class TestSettingsNoKeyEcho(unittest.TestCase):
    def test_post_then_get_does_not_echo_key(self):
        secret = "sk-SUPER_SECRET_QA_123456"
        r = CLIENT.post("/api/settings", json={
            "provider": "dashscope",
            "api_key": secret,
            "temperature": 0.5,
            "max_tokens": 2048,
            "max_videos": 10,
            "save_path": "C:/tmp/bili",
        })
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.get_json()["success"])
        self.assertTrue(r.get_json()["data"]["has_key"], "设置 key 后 has_key 应为 True")

        # 断言后端确实存下了 key（内存提供方）
        self.assertEqual(backend.key_svc.resolve("dashscope"), secret)

        # GET 响应体绝不含 key 明文，也不含 api_key 字段
        g = CLIENT.get("/api/settings")
        self.assertEqual(g.status_code, 200)
        payload = g.get_json()
        raw = g.get_data(as_text=True)
        self.assertNotIn("api_key", payload["data"], "响应 data 不应含 api_key 字段")
        self.assertNotIn(secret, raw, "响应体任何位置都不应回显 key 明文")
        self.assertEqual(payload["data"]["provider"], "dashscope")
        self.assertEqual(payload["data"]["temperature"], 0.5)
        self.assertEqual(payload["data"]["max_tokens"], 2048)
        self.assertEqual(payload["data"]["max_videos"], 10)

    def test_post_without_key_keeps_prefs_only(self):
        # 不传 api_key，仅更新偏好；不应出现 key 字段
        r = CLIENT.post("/api/settings", json={
            "provider": "openai", "temperature": 0.7,
            "max_tokens": 512, "max_videos": 7, "save_path": "C:/tmp/x",
        })
        self.assertEqual(r.status_code, 200)
        self.assertNotIn("api_key", r.get_json()["data"])


# ============================================================================
# 测试 3：/api/history 增查与清空（P1-3）
# ============================================================================
class TestHistory(unittest.TestCase):
    def test_add_list_clear(self):
        sess = {"id": "qa-s1", "uid": "999", "timestamp": "2026-08-02T00:00:00Z",
                "totalVideos": 2, "results": [], "overall_summary": "s"}
        r = CLIENT.post("/api/history", json={"session": sess})
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.get_json()["success"])

        g = CLIENT.get("/api/history")
        self.assertEqual(g.status_code, 200)
        sessions = g.get_json()["data"]["sessions"]
        self.assertTrue(any(s["id"] == "qa-s1" for s in sessions), "应查到刚写入的会话")

        d = CLIENT.delete("/api/history")
        self.assertEqual(d.status_code, 200)
        g2 = CLIENT.get("/api/history")
        self.assertEqual(len(g2.get_json()["data"]["sessions"]), 0, "清空后应为空")


# ============================================================================
# 测试 4：/api/export 写文件（json / markdown）；excel 依赖 pandas（环境受限）
# ============================================================================
class TestExport(unittest.TestCase):
    def test_export_json_writes_file(self):
        # 导出仅接受 basename，并写入安全目录 %APPDATA%/BiliInsight/exports
        fname = "out_qa.json"
        safe_dir = os.path.join(os.environ["APPDATA"], "BiliInsight", "exports")
        out = os.path.join(safe_dir, fname)
        r = CLIENT.post("/api/export", json={
            "format": "json",
            "path": fname,
            "results": [{"视频标题": "t", "视频链接": "u", "发布时间": "x", "核心观点": "c"}],
            "overall_summary": "总结",
        })
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.get_json()["success"])
        self.assertTrue(os.path.exists(out), "json 文件应已写出到安全导出目录")
        with open(out, encoding="utf-8") as f:
            self.assertEqual(json.load(f)[0]["视频标题"], "t")

    def test_export_markdown_writes_file(self):
        fname = "out_qa.md"
        safe_dir = os.path.join(os.environ["APPDATA"], "BiliInsight", "exports")
        out = os.path.join(safe_dir, fname)
        r = CLIENT.post("/api/export", json={
            "format": "markdown", "path": fname,
            "results": [{"视频标题": "t", "视频链接": "u", "发布时间": "x", "核心观点": "c"}],
            "overall_summary": "总结",
        })
        self.assertEqual(r.status_code, 200)
        self.assertTrue(os.path.exists(out), "markdown 文件应已写出到安全导出目录")

    def test_export_excel_env_limited(self):
        # pandas 在本环境缺失，真实 Excel 导出分支无法运行；做静态确认：
        # 1) /api/export 路由存在；2) excel 分支使用 pandas 写出。
        self.assertIn("export_result", backend.app.view_functions, "/api/export 路由应存在")
        with open(os.path.join(PROJECT_ROOT, "web", "app.py"), encoding="utf-8") as fh:
            src = fh.read()
        self.assertIn("pd.DataFrame(results)", src, "excel 分支应使用 pandas 写出")


# ============================================================================
# 测试 5：边界 —— extract 参数校验（空/非法 UID/范围/未知 model_type）
# ============================================================================
class TestExtractBoundary(unittest.TestCase):
    def test_missing_uid(self):
        r = CLIENT.post("/api/extract", json={"max_videos": 3})
        self.assertEqual(r.status_code, 400)
        self.assertFalse(r.get_json()["success"])

    def test_non_digit_uid(self):
        r = CLIENT.post("/api/extract", json={"uid": "abc", "max_videos": 3})
        self.assertEqual(r.status_code, 400)

    def test_uid_zero_handled_gracefully(self):
        # 注：当前校验仅 isdigit()，"0" 会通过并在下游因无视频优雅报错（finish_with_error）。
        # 严格拒绝非正 UID 非硬性验收（见报告 Known Issues 观察项）。
        r = CLIENT.post("/api/extract", json={"uid": "0", "max_videos": 3})
        self.assertNotEqual(r.status_code, 500, "UID='0' 不应导致 500 崩溃")

    def test_max_videos_out_of_range(self):
        r1 = CLIENT.post("/api/extract", json={"uid": "123", "max_videos": 0})
        self.assertEqual(r1.status_code, 400)
        r2 = CLIENT.post("/api/extract", json={"uid": "123", "max_videos": 201})
        self.assertEqual(r2.status_code, 400)

    def test_unknown_model_type(self):
        r = CLIENT.post("/api/extract", json={"uid": "123", "max_videos": 3, "model_type": "foo"})
        self.assertEqual(r.status_code, 400)

    def test_unknown_task_status_404(self):
        r = CLIENT.get("/api/task/does-not-exist/status")
        self.assertEqual(r.status_code, 404)


# ============================================================================
# 测试 6：TaskManager 并发两个任务互不干扰（设计点：单类任务隔离）
# ============================================================================
class TestConcurrency(unittest.TestCase):
    def test_two_concurrent_tasks_isolated(self):
        ra = CLIENT.post("/api/extract", json={"uid": "111", "max_videos": 2, "model_type": "dashscope"})
        rb = CLIENT.post("/api/extract", json={"uid": "222", "max_videos": 3, "model_type": "dashscope"})
        id_a = ra.get_json()["data"]["task_id"]
        id_b = rb.get_json()["data"]["task_id"]
        self.assertNotEqual(id_a, id_b, "两个任务 id 必须不同")

        fa, _, _ = _poll_until_done(id_a)
        fb, _, _ = _poll_until_done(id_b)
        self.assertEqual(fa["status"], "done")
        self.assertEqual(fb["status"], "done")

        res_a = CLIENT.get(f"/api/task/{id_a}/result").get_json()["data"]
        res_b = CLIENT.get(f"/api/task/{id_b}/result").get_json()["data"]
        self.assertEqual(len(res_a["results"]), 2, "任务A 应只有 2 条结果")
        self.assertEqual(len(res_b["results"]), 3, "任务B 应有 3 条结果")
        # 互不影响：A 的结果不应被 B 覆盖
        self.assertNotEqual(res_a["results"], res_b["results"])


# ============================================================================
# 测试 7：key_provider.resolve 优先级（用户设置 key > config 内置默认）
#    真实 LocalKeyProvider + 关闭 keyring，走 cryptography 文件兜底
# ============================================================================
class TestKeyProviderPriority(unittest.TestCase):
    def test_resolve_priority_user_over_config(self):
        # 关闭 keyring，强制走加密文件兜底，避免写 Windows 凭据管理器
        import key_provider as kp
        saved_has = kp._HAS_KEYRING
        saved_mod = kp.keyring
        kp._HAS_KEYRING = False
        kp.keyring = None
        try:
            # 用临时 APPDATA 下新建一个实例
            prov = kp.LocalKeyProvider()
            # 未设置用户 key 时，应回退到 config.py 内置默认
            self.assertEqual(
                prov.resolve("dashscope"),
                "sk-ws-H.EDRMPXH.l4fW.MEYCIQCwMOl0-AQ76bemEuEfER2aqAPBli2k-avE3k0h18KZbAIhAPlCENrNBQpQmMjvUFhYVcKiuD4x9cackTnWjyt1faFw",
                "无用户 key 时应回退到 config 内置默认",
            )
            self.assertEqual(prov.resolve("openai"), "your-openai-api-key")
            self.assertFalse(prov.has("dashscope"), "未设置时 has 应为 False")

            # 用户设置 key 后，应优先返回用户 key（优先级 > config 默认）
            user_key = "user-dashscope-key-XYZ"
            prov.set("dashscope", user_key)
            self.assertTrue(prov.has("dashscope"))
            self.assertEqual(prov.resolve("dashscope"), user_key,
                             "已设置用户 key 后 resolve 必须返回用户 key（优先级最高）")
            # 其它未设置的供应商仍回退 config 默认
            self.assertEqual(prov.resolve("openai"), "your-openai-api-key")
        finally:
            kp._HAS_KEYRING = saved_has
            kp.keyring = saved_mod


# ============================================================================
# 测试 8：静态一致性（前端引用 / main.py 进度回调契约 / 绑定 127.0.0.1）
# ============================================================================
class TestStaticConsistency(unittest.TestCase):
    def _read(self, rel):
        with open(os.path.join(PROJECT_ROOT, rel), encoding="utf-8") as f:
            return f.read()

    def test_frontend_hook_api_paths_consistent(self):
        client = self._read("biliinsight-pro/src/api/client.ts")
        # useSettings 调用的接口
        us = self._read("biliinsight-pro/src/hooks/useSettings.ts")
        for fn in ("getSettings", "saveSettings"):
            self.assertIn(f"export async function {fn}", client, f"client.ts 应导出 {fn}")
            self.assertIn(fn, us, f"useSettings 应调用 {fn}")
        # useHistory 调用的接口
        uh = self._read("biliinsight-pro/src/hooks/useHistory.ts")
        for fn in ("getHistory", "addHistory", "clearHistory"):
            self.assertIn(f"export async function {fn}", client, f"client.ts 应导出 {fn}")
            self.assertIn(fn, uh, f"useHistory 应调用 {fn}")

    def test_resultsview_no_innerhtml_xss_safe(self):
        rv = self._read("biliinsight-pro/src/components/ResultsView.tsx")
        self.assertIn("ReactMarkdown", rv, "应使用 ReactMarkdown 安全渲染")
        self.assertNotIn("dangerouslySetInnerHTML", rv, "禁止 dangerouslySetInnerHTML")
        self.assertNotIn("innerHTML", rv, "禁止 innerHTML（防 XSS）")

    def test_main_progress_callback_wired(self):
        main_src = self._read("main.py")
        self.assertIn('self.progress_callback("fetching", 0, total, "")',
                      main_src, "main.py 应在处理前上报 fetching 进度")
        self.assertIn('self.progress_callback("processing", i + 1, total,',
                      main_src, "main.py 应在每处理一个视频后上报 processing 真实进度")

    def test_app_binds_localhost_only(self):
        app_src = self._read("web/app.py")
        self.assertIn("127.0.0.1", app_src, "后端应绑定 127.0.0.1，而非 0.0.0.0")
        # 实际启动调用必须绑定 127.0.0.1，且不得出现绑定 0.0.0.0 的代码
        # （源码注释中出现 '0.0.0.0' 字样属正常说明，不作为判定）
        self.assertIn("run_server('127.0.0.1', 5000)", app_src, "run_server 应绑定 127.0.0.1")
        self.assertNotIn("app.run(host='0.0.0.0'", app_src, "不得绑定 0.0.0.0 局域网")
        self.assertNotIn("run_server('0.0.0.0'", app_src, "不得绑定 0.0.0.0 局域网")


if __name__ == "__main__":
    unittest.main(verbosity=2)
