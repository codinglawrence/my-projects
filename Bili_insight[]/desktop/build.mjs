/**
 * 聚合构建脚本（桌面端）
 * 步骤：
 *   1) 构建 React 前端（npm run build） -> biliinsight-pro/dist
 *   2) 拷贝 dist 到 desktop/app/dist
 *   3) 拷贝 pyinstaller/dist/backend.exe 到 desktop/app/backend.exe（若存在）
 * 之后可运行 `cd desktop && npm run dist` 生成 Windows 安装包。
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const desktopApp = path.join(__dirname, 'app');

/** 递归拷贝目录 */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function run(cmd, cwd) {
  // eslint-disable-next-line no-console
  console.log('> ' + cmd);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function main() {
  // 1) 构建 React 前端
  const feDir = path.join(root, 'biliinsight-pro');
  // eslint-disable-next-line no-console
  console.log('构建 React 前端...');
  run('npm run build', feDir);
  const feDist = path.join(feDir, 'dist');
  if (!fs.existsSync(feDist)) throw new Error('React 构建失败：缺少 biliinsight-pro/dist');

  // 2) 聚合 dist -> desktop/app/dist
  fs.mkdirSync(desktopApp, { recursive: true });
  const targetDist = path.join(desktopApp, 'dist');
  fs.rmSync(targetDist, { recursive: true, force: true });
  copyDir(feDist, targetDist);
  // eslint-disable-next-line no-console
  console.log('React dist -> desktop/app/dist');

  // 3) 拷贝 backend.exe（可选）
  // 说明：build_backend.py 以 ROOT 为 cwd 调用 PyInstaller，产物默认落在 ROOT/dist/backend.exe
  const builtExe = path.join(root, 'dist', 'backend.exe');
  if (fs.existsSync(builtExe)) {
    fs.copyFileSync(builtExe, path.join(desktopApp, 'backend.exe'));
    // eslint-disable-next-line no-console
    console.log('backend.exe -> desktop/app/backend.exe');
  } else {
    // eslint-disable-next-line no-console
    console.warn('提示：未找到 pyinstaller/dist/backend.exe，请先运行 `python pyinstaller/build_backend.py`');
  }

  // eslint-disable-next-line no-console
  console.log('聚合完成。下一步：cd desktop && npm run dist');
}

try {
  main();
} catch (e) {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
}
