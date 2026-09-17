/**
 * 后端拉起模块
 * - 开发态：优先用 pyinstaller/dist/backend.exe，否则回退 python web/app.py
 * - 打包态：spawn process.resourcesPath/backend.exe（electron-builder 经 extraResources 放入）
 * - 轮询 /api/test 直到就绪（默认 30s 超时）
 * - 透传子进程 stdout/stderr 日志
 */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const HOST = '127.0.0.1';
const PORT = 5000;
const HEALTH_URL = `http://${HOST}:${PORT}/api/test`;

/** 轮询端口就绪 */
function waitForReady(timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(HEALTH_URL, (res) => {
        res.resume();
        resolve(true);
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error('后端启动超时（30s），请检查 Python 依赖或端口占用'));
        } else {
          setTimeout(tick, 300);
        }
      });
    };
    tick();
  });
}

/**
 * 启动后端子进程
 * @param {boolean} dev 开发模式
 * @param {(line:string)=>void} onLog 日志回调
 * @param {string} [token] 本地一次性令牌（BILI_LOCAL_TOKEN），用于后端鉴权（修复 H2）
 * @returns 子进程对象
 */
function launchBackend(dev, onLog, token) {
  const projectRoot = path.resolve(__dirname, '..');
  // 把本地令牌注入子进程环境，供后端校验（仅本机 Electron 持有）
  const env = Object.assign({}, process.env);
  if (token) {
    env.BILI_LOCAL_TOKEN = token;
  }
  let child;

  if (dev) {
    const builtExe = path.resolve(projectRoot, 'pyinstaller', 'dist', 'backend.exe');
    if (fs.existsSync(builtExe)) {
      child = spawn(builtExe, [], { windowsHide: true, env });
    } else {
      const appPy = path.resolve(projectRoot, 'web', 'app.py');
      const py = process.platform === 'win32' ? 'python' : 'python3';
      child = spawn(py, [appPy], { cwd: projectRoot, windowsHide: true, env });
    }
  } else {
    const exe = path.join(process.resourcesPath, 'backend.exe');
    child = spawn(exe, [], { windowsHide: true, env });
  }

  const pipe = (stream) => {
    if (!stream) return;
    stream.on('data', (buf) => {
      const line = buf.toString();
      if (onLog) onLog(line);
      // eslint-disable-next-line no-console
      console.log('[backend]', line.trim());
    });
  };
  pipe(child.stdout);
  pipe(child.stderr);
  child.on('error', (err) => {
    if (onLog) onLog('后端启动失败：' + err.message + '\n');
    // eslint-disable-next-line no-console
    console.error('[backend] spawn error:', err);
  });

  return child;
}

module.exports = { launchBackend, waitForReady, HOST, PORT };
