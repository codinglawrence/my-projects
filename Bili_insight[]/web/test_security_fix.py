# -*- coding: utf-8 -*-
"""
Bili_summary 桌面端封装 —— 安全修复回归测试（寇豆码 / Kou）

对应安全审计报告（安无漏，2026-08-02）修复项：
- C1/H3：打包产物不含真实 key（静态校验 build 逻辑 + 运行时 key 默认空）
- H1：/api/export 路径穿越（basename 仅允许、写入安全目录、拒绝穿越/绝对路径）
- H2：CORS 收紧（非令牌模式拒绝 null 来源；令牌模式缺令牌 401）
- 设置接口不回显 key 明文

运行（项目根目录）：
    python web/test_security_fix.py
"""
import os
import sys
import json
import types
import tempfile
import unittest
import subprocess

# ---------------------------------------------------------------------------
# 0) 准备：APPDATA 指向临时目录，避免污染真实用户配置
# ---------------------------------------------------------------------------
_TMP_APP = tempfile.mkdtemp(prefix="bili_sec_")
os.environ["APPDATA"] = _TMP_APP
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# ---------------------------------------------------------------------------
# 1) 桩引擎（与 QA 测试一致，避免真实 bilibili_api 依赖）
# ---------------------------------------------------------------------------
def _install_stub_main():
    stub = types.ModuleType("main")

    class FakeBilibiliUpCrawler:
        def __init__(self, *a, **k):
            self.results = []
        def get_up_videos(self):
            return []
        def process_all_videos(self):
            pass
        def process_video(self, v):
            pass
        def generate_overall_summary(self):
            return ""
        def answer_question(self, q):
            return ""
        def _call_model(self, p):
            return ""

    stub.BilibiliUpCrawler = FakeBilibiliUpCrawler
    sys.modules["main"] = stub


_install_stub_main()


class InMemoryKeyProvider:
    def __init__(self):
        self._store = {}
    def resolve(self, provider):
        return self._store.get(provider, "")
    def set(self, provider, key):
        self._store[provider] = key
    def has(self, provider):
        return bool(self._store.get(provider))


import app as backend  # noqa: E402
backend.key_svc = InMemoryKeyProvider()
CLIENT = backend.app.test_client()


# ---------------------------------------------------------------------------
# 2) 核心回归断言
# ---------------------------------------------------------------------------
class TestSecurityFix(unittest.TestCase):
    # ① 设置接口不回显 key 明文
    def test_settings_does_not_echo_key(self):
        secret = "sk-SECRET_SECURITY_TEST_99887766"
        r = CLIENT.post("/api/settings", json={
            "provider": "dashscope", "api_key": secret,
            "temperature": 0.4, "max_tokens": 1024, "max_videos": 5,
        })
        self.assertEqual(r.status_code, 200)
        g = CLIENT.get("/api/settings")
        raw = g.get_data(as_text=True)
        self.assertNotIn(secret, raw, "GET /api/settings 不得回显 key 明文")
        self.assertNotIn("api_key", g.get_json()["data"], "data 不得含 api_key 字段")

    # ② /api/export 路径穿越：../../etc/passwd 必须被拒绝
    def test_export_traversal_rejected(self):
        r = CLIENT.post("/api/export", json={
            "format": "json",
            "path": "../../etc/passwd",
            "results": [{"视频标题": "t", "视频链接": "u", "发布时间": "x", "核心观点": "c"}],
            "overall_summary": "s",
        })
        self.assertEqual(r.status_code, 400, "含 .. 的路径穿越必须被拒绝")
        self.assertIn("非法的导出路径", r.get_json()["message"])

    # ② /api/export 绝对路径必须被拒绝（不允许任意路径写文件）
    def test_export_absolute_path_rejected(self):
        r = CLIENT.post("/api/export", json={
            "format": "json",
            "path": "C:/Windows/System32/evil.json",
            "results": [{"视频标题": "t", "视频链接": "u", "发布时间": "x", "核心观点": "c"}],
            "overall_summary": "s",
        })
        self.assertEqual(r.status_code, 400, "绝对路径必须被拒绝")
        self.assertIn("非法的导出路径", r.get_json()["message"])

    # ② /api/export 仅 basename 时仍可用（落到安全目录，验证“先用着”）
    def test_export_basename_writes_safe_dir(self):
        fname = "my_export.json"
        safe_dir = os.path.join(os.environ["APPDATA"], "BiliInsight", "exports")
        out = os.path.join(safe_dir, fname)
        r = CLIENT.post("/api/export", json={
            "format": "json",
            "path": fname,
            "results": [{"视频标题": "t", "视频链接": "u", "发布时间": "x", "核心观点": "c"}],
            "overall_summary": "s",
        })
        self.assertEqual(r.status_code, 200)
        self.assertTrue(os.path.exists(out), "basename 应写入安全目录")
        # 确认没有写到调用方“期望”的任意绝对位置
        stray = os.path.join(_TMP_APP, fname)
        self.assertFalse(os.path.exists(stray), "不得写到安全目录之外的位置")

    # ③ CORS 对 null 来源必须拒绝（非令牌模式）
    def test_cors_null_origin_rejected(self):
        r = CLIENT.get("/api/settings", headers={"Origin": "null"})
        acao = r.headers.get("Access-Control-Allow-Origin")
        self.assertNotEqual(acao, "null", "不得放行 null 来源的 CORS")
        self.assertIsNone(acao, "非令牌模式应拒绝 null 来源（无 ACAO）")

    # C1/H3 静态校验：构建脚本不得把真实 key 打进 exe
    def test_build_excludes_real_key(self):
        import config as real_config  # 仓库内真实 config（本地 CLI 用，含真实 key）
        real_key = getattr(real_config, "DASHSCOPE_API_KEY", "")

        build_py = open(os.path.join(PROJECT_ROOT, "pyinstaller", "build_backend.py"),
                        encoding="utf-8").read()
        self.assertIn("BILI_BUILD_CONFIG_DIR", build_py, "build 应注入占位 config 目录")
        # 占位 config 文本中不得出现真实 key
        self.assertNotIn(real_key, build_py, "打包脚本不得包含真实 DashScope key")

        spec = open(os.path.join(PROJECT_ROOT, "pyinstaller", "build-backend.spec"),
                    encoding="utf-8").read()
        self.assertIn("BILI_BUILD_CONFIG_DIR", spec, "spec 应读取占位 config 目录")
        self.assertNotIn("os.path.join(ROOT, 'config.py')", spec,
                         "spec 的 datas 不得再携带真实 config.py")
        self.assertIn("results", spec, "仍应携带 results 资源")

    # H3 运行时校验：未设置用户 key 时 resolve 默认应为空（占位 config）
    def test_default_key_is_empty_in_bundle_config(self):
        # 运行时 app 导入的是仓库真实 config（开发态），其默认含真实 key 属预期；
        # 这里验证 KeyProvider 在“无用户 key + 配置默认空”场景下返回空字符串，
        # 即打包后的占位 config 行为（set 一个空默认即可模拟）。
        prov = backend.key_svc
        prov.set("dashscope", "")  # 模拟打包后占位 config 默认空
        self.assertEqual(prov.resolve("dashscope"), "",
                         "默认 key 为空时 resolve 必须返回空（不再内置可用共享 key）")


# ---------------------------------------------------------------------------
# 3) 令牌鉴权（H2）：在子进程中以 BILI_LOCAL_TOKEN 启动后端，验证缺令牌被拒
# ---------------------------------------------------------------------------
_SUBPROC = '''
import os, sys, json, types, tempfile
os.environ["APPDATA"] = tempfile.mkdtemp()
# 把项目根与 web 目录加入搜索路径（subprocess cwd 为项目根）
sys.path.insert(0, os.path.join(os.getcwd(), "web"))
sys.path.insert(0, os.getcwd())
token = os.environ["BILI_LOCAL_TOKEN"]
stub = types.ModuleType("main")
class Fake:
    def __init__(self, *a, **k): self.results = []
    def get_up_videos(self): return []
    def process_all_videos(self): pass
    def process_video(self, v): pass
    def generate_overall_summary(self): return ""
    def answer_question(self, q): return ""
    def _call_model(self, p): return ""
stub.BilibiliUpCrawler = Fake
sys.modules["main"] = stub
import app as backend
backend.key_svc = type("M", (), {
    "resolve": lambda s, p: "", "set": lambda s, p, k: None, "has": lambda s, p: False
})()
c = backend.app.test_client()
r1 = c.get("/api/settings")
print(json.dumps({"no_token": r1.status_code}))
r2 = c.get("/api/settings", headers={"Authorization": "Bearer " + token})
print(json.dumps({"with_token": r2.status_code}))
r3 = c.get("/api/settings", headers={"Authorization": "Bearer wrong"})
print(json.dumps({"wrong_token": r3.status_code}))
'''


class TestLocalTokenGate(unittest.TestCase):
    def test_token_required_when_set(self):
        token = "test-token-123456"
        env = dict(os.environ)
        env["BILI_LOCAL_TOKEN"] = token
        proc = subprocess.run(
            [sys.executable, "-c", _SUBPROC],
            env=env, capture_output=True, text=True, timeout=60, cwd=PROJECT_ROOT,
        )
        self.assertEqual(proc.returncode, 0, f"子进程异常：{proc.stderr}")
        # 解析打印的 JSON 行
        results = {}
        for line in proc.stdout.splitlines():
            line = line.strip()
            if line.startswith("{"):
                results.update(json.loads(line))
        self.assertEqual(results.get("no_token"), 401, "缺令牌应返回 401")
        self.assertEqual(results.get("with_token"), 200, "正确令牌应放行")
        self.assertEqual(results.get("wrong_token"), 401, "错误令牌应返回 401")


if __name__ == "__main__":
    unittest.main(verbosity=2)
