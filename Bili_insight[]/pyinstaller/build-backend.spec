# -*- mode: python ; coding: utf-8 -*-
# BiliInsight 后端 onefile 打包 spec
# 入口：web/app.py；产物：单文件 backend.exe（内含 Python 运行时，开箱即用）
import os

# PyInstaller 在加载 spec 时可能定义 SPEC 变量；build_backend.py 以 ROOT 为 cwd 调用，
# 故兜底用「cwd/pyinstaller/build-backend.spec」推断，避免 __file__ 未定义导致 NameError
_SPEC = globals().get('SPEC') or os.path.abspath(os.path.join('pyinstaller', 'build-backend.spec'))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(_SPEC)))
WEB_DIR = os.path.join(ROOT, 'web')

# 构建期可由 build_backend.py 注入 BILI_BUILD_CONFIG_DIR，指向「无密钥占位 config」
# 目录（见 build_backend.py）。放在 pathex 最前，确保打包进 exe 的是占位 config，
# 而非仓库内 gitignored 的真实 config.py（含个人密钥）。
_BUILD_CFG = os.environ.get("BILI_BUILD_CONFIG_DIR")
pathex = ([_BUILD_CFG, ROOT, WEB_DIR] if _BUILD_CFG else [ROOT, WEB_DIR])

a = Analysis(
    # 入口脚本
    [os.path.join(WEB_DIR, 'app.py')],
    # 搜索路径：占位 config 目录（最前）→ 项目根（main/config）→ web/（key_provider 等）
    pathex=pathex,
    binaries=[],
    # 安全修复（C1/H3）：不再把真实 config.py 作为 datas 打入（避免被 strings 提取密钥）。
    # 运行时使用的「无密钥占位 config」由 pathex 解析（见上）；此处仅携带 results 资源目录。
    datas=[
        (os.path.join(ROOT, 'results'), 'results'),
    ],
    hiddenimports=[
        'flask',
        'bilibili_api', 'bilibili_api.user', 'bilibili_api.video',
        'bilibili_api.clients.HTTPXClient', 'bilibili_api.clients.AioHTTPClient',
        'bilibili_api.clients.CurlCFFIClient',
        'openai',
        'pandas', 'openpyxl',
        'keyring', 'keyring.backends.Windows',
        'cryptography', 'cryptography.fernet',
        'requests',
        'main', 'config',
        'key_provider', 'task_manager', 'settings_store', 'history_store',
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    runtime_tmpdir=None,
    console=False,  # 桌面端不弹黑窗口；诊断日志写入 %APPDATA%/BiliInsight/backend.log
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
