#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
B站UP主视频核心观点提取工具 - 后端服务（桌面端改造版）

相对原版改动（见 docs/system-design-desktop-2026-08-02.md）：
1. 绑定 127.0.0.1，仅本地访问，关闭局域网无鉴权暴露。
2. CORS 收紧（修复 H2）：非令牌模式仅放行明确 localhost 来源（拒绝 null/通配）；
   生产模式下由 Electron 注入一次性本地令牌，CORS 仅在令牌合法时反射来源。
3. /api/extract 改为异步任务，返回 task_id；真实进度由 /api/task/<id>/status 轮询。
4. 统一密钥解析：KeyProvider（用户设置 key > config 默认）；config 默认在生产包中为
   空（无密钥版本），未配置 key 时提示用户在设置面板填写（修复 H3）。
5. 新增 /api/settings、/api/history、/api/export，不在任何响应中回显 key 明文。
6. /api/chat 走统一 key 解析（原 /api/ask 死代码已移除）。
7. /api/export 强制写入安全输出目录、仅允许 basename 文件名（修复 H1 路径穿越）。
"""

import logging
import os
import sys
import threading

from flask import Flask, request, jsonify, g

# 添加项目根目录到 Python 路径，确保能 import main / config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import BilibiliUpCrawler
from config import *
import key_provider
import task_manager
import settings_store
import history_store

# ------------------------- 基础配置 -------------------------
app = Flask(__name__, static_folder=None)  # 桌面端前端由 Electron 加载，不再托管静态文件

# ------------------------- 本地令牌与 CORS 收紧（修复 H2） -------------------------
# 仅当 Electron 启动后端时通过环境变量 BILI_LOCAL_TOKEN 注入一次性随机令牌，才会启用
# “本地鉴权 + 动态 CORS”：此时所有 /api/*（除 /api/test 健康检查）必须携带
# Authorization: Bearer <token>，且 CORS 仅在令牌合法时反射请求来源（含 file:// 的 null）。
# 开发者直接 `python web/app.py`（无该环境变量）则不启用令牌，CORS 收紧为明确的 localhost
# 来源并拒绝 null/通配，既方便本地调试，也确保分发产物不会放行任意 file:// 页面。
LOCAL_TOKEN = os.environ.get("BILI_LOCAL_TOKEN") or ""
REQUIRE_TOKEN = bool(LOCAL_TOKEN)

# 非令牌模式下允许的来源（明确 localhost，拒绝 null 与通配）
_LOCALHOST_ORIGINS = {
    "http://localhost:3000", "http://127.0.0.1:3000",
    "http://localhost:5000", "http://127.0.0.1:5000",
}


@app.before_request
def _enforce_local_token():
    """本地 API 鉴权（仅生产/Electron 模式启用）。"""
    # 健康检查接口不要求令牌（供 backend-launcher 探活）
    if request.path == "/api/test":
        g.auth_ok = True
        return
    # 预检请求放行（不带凭据），实际请求仍需令牌
    if request.method == "OPTIONS":
        g.auth_ok = True
        return
    if not REQUIRE_TOKEN:
        g.auth_ok = True
        return
    auth = request.headers.get("Authorization", "")
    if auth == f"Bearer {LOCAL_TOKEN}":
        g.auth_ok = True
    else:
        g.auth_ok = False
        return jsonify({"success": False, "message": "未授权：缺少有效的本地令牌"}), 401


@app.after_request
def _cors_headers(resp):
    """动态 CORS：令牌合法才反射来源；非令牌模式仅放行明确 localhost 来源（拒绝 null/通配）。"""
    origin = request.headers.get("Origin")
    if REQUIRE_TOKEN:
        # 仅对携带合法令牌的请求放行其来源（含 file:// 的 null），否则不放行
        if getattr(g, "auth_ok", False) and origin:
            resp.headers["Access-Control-Allow-Origin"] = origin
    else:
        if origin in _LOCALHOST_ORIGINS:
            resp.headers["Access-Control-Allow-Origin"] = origin
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return resp

# 诊断日志：写到 %APPDATA%/BiliInsight/backend.log（即使 --windowed 打包仍可排错）
_log_path = os.path.join(
    os.environ.get("APPDATA", os.path.expanduser("~")), "BiliInsight", "backend.log"
)
try:
    os.makedirs(os.path.dirname(_log_path), exist_ok=True)
    logging.basicConfig(
        filename=_log_path, level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
except Exception:
    logging.basicConfig(level=logging.INFO)
log = logging.getLogger("biliinsight")

# 单例：任务管理器 / 设置存储 / 历史存储
task_mgr = task_manager.TaskManager()
settings = settings_store.SettingsStore()
history = history_store.HistoryStore()
key_svc = key_provider.default_provider


def _resolve_api_keys() -> dict:
    """统一解析全部供应商的有效 key（用户设置 > 内置默认）。"""
    return {p: key_svc.resolve(p) for p in key_provider.PROVIDERS}


def _make_crawler(uid: str, max_videos: int, model_type: str = None,
                  temperature=None, max_tokens=None) -> BilibiliUpCrawler:
    """构造爬虫并注入统一解析的 key（消除 /extract 与 /chat、/ask 不一致）。"""
    provider = model_type or settings.load().get("provider", MODEL_TYPE)
    return BilibiliUpCrawler(
        up_mid=str(uid),
        max_videos=int(max_videos),
        model_type=provider,
        api_keys=_resolve_api_keys(),
        temperature=temperature,
        max_tokens=max_tokens,
    )


def _require_key(provider: str):
    """生产（令牌）模式下，若用户尚未配置自有 key，则提示先在设置面板填写（修复 H3）。

    开发/测试模式（未注入 BILI_LOCAL_TOKEN）不强制，保持“先用着”向后兼容。
    """
    if REQUIRE_TOKEN and not key_svc.resolve(provider):
        return jsonify({
            "success": False,
            "message": f"尚未配置 {provider} 的 API Key，请先在「设置」面板填写你自己的密钥后重试。",
        }), 400
    return None


# ------------------------- 路由 -------------------------
@app.route('/api/test', methods=['GET'])
def test():
    """端口健康自检（Electron 启动探活用）。"""
    return jsonify({'success': True, 'message': '后端服务运行正常'})


@app.route('/api/extract', methods=['POST'])
def extract_core_views():
    """异步提取：建任务 + 起后台线程，立即返回 task_id。"""
    try:
        data = request.json or {}
        uid = data.get('uid')
        if not uid:
            return jsonify({'success': False, 'message': '缺少必填参数：uid'}), 400
        if not isinstance(uid, str) or not uid.strip().isdigit():
            return jsonify({'success': False, 'message': 'UID 必须是纯数字'}), 400

        max_videos = int(data.get('max_videos', settings.load().get('max_videos', MAX_VIDEOS)))
        if max_videos < 1 or max_videos > 200:
            return jsonify({'success': False, 'message': 'max_videos 必须在 1-200 之间'}), 400

        model_type = data.get('model_type') or settings.load().get('provider', MODEL_TYPE)
        if model_type not in key_provider.PROVIDERS:
            return jsonify({'success': False, 'message': f'不支持的 model_type：{model_type}'}), 400

        # 生产模式下，未配置自有 key 则提示先到设置面板填写（避免内置共享 key）
        blocked = _require_key(model_type)
        if blocked:
            return blocked

        # 组装后台任务参数（key 由后端统一解析，绝不接收前端传来的 key）
        params = {
            'uid': uid,
            'max_videos': max_videos,
            'model_type': model_type,
            'api_keys': _resolve_api_keys(),
            'temperature': settings.load().get('temperature', TEMPERATURE),
            'max_tokens': settings.load().get('max_tokens', MAX_TOKENS),
        }
        task_id = task_mgr.create(params)
        log.info("创建提取任务 %s uid=%s model=%s", task_id, uid, model_type)
        return jsonify({'success': True, 'data': {'task_id': task_id, 'status': 'pending'}})
    except Exception as e:
        return jsonify({'success': False, 'message': f'创建任务失败：{str(e)}'}), 500


@app.route('/api/task/<task_id>/status', methods=['GET'])
def task_status(task_id):
    """轮询真实进度。"""
    task = task_mgr.get(task_id)
    if not task:
        return jsonify({'success': False, 'message': '任务不存在'}), 404
    return jsonify({'success': True, 'data': task.to_status()})


@app.route('/api/task/<task_id>/result', methods=['GET'])
def task_result(task_id):
    """任务完成后取最终结果。"""
    task = task_mgr.get(task_id)
    if not task:
        return jsonify({'success': False, 'message': '任务不存在'}), 404
    if task.status == 'error':
        return jsonify({'success': False, 'message': task.error or '任务执行出错',
                        'data': task.to_result()}), 500
    if task.status != 'done':
        return jsonify({'success': False, 'message': '任务尚未完成',
                        'data': task.to_status()}), 202
    return jsonify({'success': True, 'data': task.to_result()})


@app.route('/api/settings', methods=['GET'])
def get_settings():
    """拉取设置；绝不返回 key 明文，仅返回 has_key 标记。"""
    prefs = settings.load()
    provider = prefs.get('provider', MODEL_TYPE)
    return jsonify({
        'success': True,
        'data': {
            'provider': provider,
            'has_key': key_svc.has(provider),  # 仅标记是否已设置自有 key
            'temperature': prefs.get('temperature', TEMPERATURE),
            'max_tokens': prefs.get('max_tokens', MAX_TOKENS),
            'max_videos': prefs.get('max_videos', MAX_VIDEOS),
            'save_path': prefs.get('save_path', SAVE_PATH),
        }
    })


@app.route('/api/settings', methods=['POST'])
def post_settings():
    """保存设置：key 经 KeyProvider 落系统凭据/加密文件；偏好落 prefs.json。"""
    try:
        data = request.json or {}
        provider = data.get('provider') or settings.load().get('provider', MODEL_TYPE)
        if provider not in key_provider.PROVIDERS:
            return jsonify({'success': False, 'message': f'不支持的 provider：{provider}'}), 400

        # 仅当用户填写了 key 才更新密钥库（不回显、不落前端）
        api_key = data.get('api_key')
        if api_key:
            key_svc.set(provider, api_key)
            log.info("已保存 provider=%s 的用户密钥（不记录明文）", provider)

        prefs = {
            'provider': provider,
            'temperature': data.get('temperature', settings.load().get('temperature', TEMPERATURE)),
            'max_tokens': data.get('max_tokens', settings.load().get('max_tokens', MAX_TOKENS)),
            'max_videos': data.get('max_videos', settings.load().get('max_videos', MAX_VIDEOS)),
            'save_path': data.get('save_path', settings.load().get('save_path', SAVE_PATH)),
        }
        settings.save(prefs)
        return jsonify({'success': True, 'data': {'has_key': key_svc.has(provider)}})
    except Exception as e:
        return jsonify({'success': False, 'message': f'保存设置失败：{str(e)}'}), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    """历史列表。"""
    return jsonify({'success': True, 'data': {'sessions': history.list()}})


@app.route('/api/history', methods=['POST'])
def post_history():
    """追加一条历史（支持清空：body 含 {clear:true}）。"""
    try:
        data = request.json or {}
        if data.get('clear'):
            history.clear()
            return jsonify({'success': True})
        session = data.get('session')
        if not session:
            return jsonify({'success': False, 'message': '缺少 session'}), 400
        history.add(session)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': f'保存历史失败：{str(e)}'}), 500


@app.route('/api/history', methods=['DELETE'])
def delete_history():
    """清空历史。"""
    history.clear()
    return jsonify({'success': True})


@app.route('/api/export', methods=['POST'])
def export_result():
    """导出结果到安全输出目录（修复 H1 路径穿越）。

    - 文件名参数仅允许 basename：拒绝含 /、\\、.. 或绝对路径的输入。
    - 导出始终写入指定安全目录（%APPDATA%/BiliInsight/exports），不允许任意路径写文件。
    """
    try:
        data = request.json or {}
        fmt = (data.get('format') or 'excel').lower()
        # 先校验格式，避免非法格式继续处理
        if fmt not in ('json', 'markdown', 'excel'):
            return jsonify({'success': False, 'message': f'不支持的导出格式：{fmt}'}), 400

        results = data.get('results', [])
        overall_summary = data.get('overall_summary', '')
        path = data.get('path')  # 桌面端由 showSaveDialog 提供（仅取文件名）

        # 安全输出目录：程序数据目录下的 exports/（与用户无关、固定白名单）
        safe_dir = os.path.join(
            os.environ.get("APPDATA", os.path.expanduser("~")), "BiliInsight", "exports"
        )
        os.makedirs(safe_dir, exist_ok=True)

        ext = {'excel': 'xlsx', 'json': 'json', 'markdown': 'md'}[fmt]

        if path:
            # 仅允许 basename：拒绝任何目录穿越 / 绝对路径
            if (
                any(sep in path for sep in ('/', '\\'))
                or '..' in path
                or os.path.isabs(path)
            ):
                return jsonify({
                    'success': False,
                    'message': '非法的导出路径：仅允许文件名（basename），不允许目录或绝对路径',
                }), 400
            fname = path
            # 强制扩展名与格式一致，避免伪装（如把 .exe 当 json 导出）
            if not fname.lower().endswith('.' + ext):
                fname = fname.rsplit('.', 1)[0] + '.' + ext
            out_path = os.path.join(safe_dir, fname)
        else:
            ts = __import__('time').strftime('%Y%m%d_%H%M%S')
            out_path = os.path.join(safe_dir, f'up_core_views_{ts}.{ext}')

        if fmt == 'json':
            with open(out_path, 'w', encoding='utf-8') as f:
                import json as _json
                _json.dump(results, f, ensure_ascii=False, indent=2)
        elif fmt == 'markdown':
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write('# B站UP主视频核心观点汇总\n\n')
                f.write(f'**生成时间**: {__import__("time").strftime("%Y-%m-%d %H:%M:%S")}\n\n')
                f.write('## 整体总结\n\n')
                f.write(overall_summary + '\n\n')
                f.write('## 视频核心观点列表\n\n')
                for i, r in enumerate(results):
                    f.write(f'### {i+1}. {r.get("视频标题", "")}\n')
                    f.write(f'**视频链接**: {r.get("视频链接", "")}\n')
                    f.write(f'**发布时间**: {r.get("发布时间", "")}\n')
                    f.write(f'**核心观点**:\n{r.get("核心观点", "")}\n\n')
        elif fmt == 'excel':
            import pandas as pd
            df = pd.DataFrame(results)
            df.to_excel(out_path, index=False, engine='openpyxl')

        return jsonify({'success': True, 'data': {'path': out_path}})
    except Exception as e:
        return jsonify({'success': False, 'message': f'导出失败：{str(e)}'}), 500


@app.route('/api/chat', methods=['POST'])
def chat():
    """智能问答（走统一 key 解析，不接收前端 key）。"""
    try:
        data = request.json or {}
        context = data.get('context', '')
        question = data.get('question', '')
        # 生产模式下校验用户是否已配置自有 key
        blocked = _require_key(settings.load().get('provider', MODEL_TYPE))
        if blocked:
            return blocked
        if not question:
            return jsonify({'success': False, 'message': '缺少问题参数'}), 400
        crawler = _make_crawler('0', 0)
        answer = crawler._call_model(
            f"基于以下UP主视频分析内容，回答用户的问题：\n\n{context}\n\n用户问题：{question}\n\n"
            "请基于上述分析内容，给出一个详细、准确的回答。"
        )
        return jsonify({'success': True, 'data': {'answer': answer}})
    except Exception as e:
        return jsonify({'success': False, 'message': f'聊天请求失败：{str(e)}'}), 500


@app.route('/', methods=['GET'])
def index():
    """桌面端不托管前端；返回简短健康检查信息。"""
    return jsonify({'success': True, 'message': 'BiliInsight 后端运行中', 'api': '/api/test'})


# 便于外部以线程方式启动（backend-launcher 也会直接 exec 本文件）
def run_server(host='127.0.0.1', port=5000):
    app.run(host=host, port=port, debug=False, use_reloader=False)


if __name__ == '__main__':
    # 直接运行：监听 127.0.0.1:5000（已关闭 0.0.0.0 局域网暴露）
    run_server('127.0.0.1', 5000)
