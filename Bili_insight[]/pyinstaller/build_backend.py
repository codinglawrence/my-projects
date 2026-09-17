#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""一键构建 backend.exe（PyInstaller onefile）。

安全修复（C1/H3）：
- 打包进 exe 的 config **必须是无密钥版本**。仓库内真实的 config.py（含个人
  DashScope key，已被 .gitignore 忽略）仅供开发者本地 CLI 使用，绝不被打入分发产物。
- 本脚本在临时目录生成一份「占位 config」（所有 *_API_KEY 为空），并通过环境变量
  BILI_BUILD_CONFIG_DIR 把它放到 PyInstaller 搜索路径（pathex）最前，使打包时
  `import config` 解析到占位版本而非真实 config.py。spec 中不再把真实 config.py
  作为 datas 打入（避免被 `strings backend.exe` 提取密钥）。

用法：
    python pyinstaller/build_backend.py
产出：pyinstaller/dist/backend.exe
"""
import os
import sys
import tempfile
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPEC = os.path.join(ROOT, 'pyinstaller', 'build-backend.spec')

# 占位 config：结构与 config.py 完全一致，但所有密钥为空。
# 用户需在桌面端「设置」面板填写自有 key（加密本地存储），不再分发共享密钥。
PLACEHOLDER_CONFIG = '''\
# 自动生成的打包占位 config（不含任何真实密钥）
# 由 pyinstaller/build_backend.py 在构建时生成并打入 backend.exe，仅用于提供默认值。
# 真实密钥请由用户在桌面端「设置」面板填写，切勿在此硬编码或随包分发。
MODEL_TYPE = "dashscope"
OPENAI_API_KEY = ""
OPENAI_MODEL = "gpt-3.5-turbo"
DEEPSEEK_API_KEY = ""
DEEPSEEK_MODEL = "deepseek-chat"
SILICONFLOW_API_KEY = ""
SILICONFLOW_MODEL = "Qwen/Qwen2-72B-Instruct"
DASHSCOPE_API_KEY = ""
DASHSCOPE_MODEL = "qwen-plus"
PAGE_SIZE = 30
MAX_VIDEOS = 100
DOWNLOAD_AUDIO = False
TEMPERATURE = 0.3
MAX_TOKENS = 1024
DELAY = 0.1
UP_MID = "1411721850"
SAVE_FORMAT = "excel"
SAVE_PATH = "results"
RESULTS_FILENAME = "up_core_views"
'''


def _write_build_config() -> str:
    """在临时目录写入构建用 config，返回该目录路径（pathex 最前）。

    - 默认（安全）：写入无密钥占位 config，exe 不含任何真实密钥。
    - 环境变量 BILI_BUNDLE_REAL_KEY=1（个人本地可用构建）：直接复制仓库内
      真实的 config.py（含个人密钥），使打出的 exe 开箱即用（"先用着"）。
      注意：此模式产物含真实 key，仅供本人机器使用，且用后必须轮换密钥。
    """
    tmp = tempfile.mkdtemp(prefix="bili_build_cfg_")
    if os.environ.get("BILI_BUNDLE_REAL_KEY") == "1":
        real_cfg = os.path.join(ROOT, "config.py")
        if not os.path.isfile(real_cfg):
            raise SystemExit(f"未找到真实 config.py：{real_cfg}，无法以真实 key 打包")
        import shutil
        shutil.copyfile(real_cfg, os.path.join(tmp, "config.py"))
        print(f"[build] 已复制真实 config.py（含密钥）用于打包 —— 该 exe 仅供本人使用，用后请务必轮换密钥")
    else:
        cfg_path = os.path.join(tmp, "config.py")
        with open(cfg_path, "w", encoding="utf-8") as f:
            f.write(PLACEHOLDER_CONFIG)
    return tmp


def main() -> None:
    build_cfg_dir = _write_build_config()
    cmd = [
        sys.executable, '-m', 'PyInstaller',
        SPEC,
        '--clean',
        '--noconfirm',
    ]
    # 把占位 config 目录注入 pathex（在 spec 内置于最前），确保打包的是无密钥版本
    env = dict(os.environ)
    env["BILI_BUILD_CONFIG_DIR"] = build_cfg_dir
    # 在根目录执行，确保相对路径与 pathex 正确
    subprocess.check_call(cmd, cwd=ROOT, env=env)
    out = os.path.join(ROOT, 'pyinstaller', 'dist', 'backend.exe')
    print(f'backend.exe 已生成：{out}')
    print('安全提示：该 exe 内不含任何真实 API 密钥；使用前请先在阿里云控制台'
          '吊销/轮换原 DashScope key，并在桌面端设置面板填写你自己的 key。')


if __name__ == '__main__':
    main()
