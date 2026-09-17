@echo off
chcp 936 >nul
cd /d "%~dp0digital-advisor-team"

set "PY=C:\Users\terri\AppData\Local\Programs\Python\Python311\python.exe"

if not exist "%PY%" (
  echo [错误] 找不到 Python: %PY%
  echo 请修改本文件中的 PY 路径为你自己的 python.exe
  pause
  exit /b 1
)

echo Python: & "%PY%" --version

"%PY%" -c "import fastapi, uvicorn" >nul 2>&1
if errorlevel 1 (
  echo 首次运行，正在安装依赖，请稍候...
  "%PY%" -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
)

netstat -ano | findstr ":8000" | findstr "LISTENING" >nul
if errorlevel 1 (
  echo 正在启动服务...
  start "VellumAPI" /b "%PY%" main.py api --port 8000
  timeout /t 10 /nobreak >nul
) else (
  echo 服务已在运行，直接打开页面
)

start "" http://127.0.0.1:8000

echo.
echo 主页:     http://127.0.0.1:8000
echo 接口文档: http://127.0.0.1:8000/docs
echo.
echo 本窗口可关闭，服务继续在后台运行。
echo 要停止服务: 任务管理器结束 python.exe，或命令行执行
echo   netstat -ano ^| findstr :8000   找到 PID 后 taskkill /F /PID 该PID
echo.
timeout /t 15 /nobreak >nul
