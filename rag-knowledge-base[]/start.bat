@echo off
chcp 65001 >nul
title=RAG 知识库问答 - 本地启动

echo ========================================
echo   RAG 知识库问答系统 - 正在启动...
echo ========================================
echo.

:: --- 后端（优先用 backend\.venv，否则用系统 python）---
echo [1/2] 启动后端 (FastAPI :8000)...
if exist "%~dp0backend\.venv\Scripts\activate.bat" (
    start "RAG-Backend" cmd /c "cd /d "%~dp0backend" && call .venv\Scripts\activate.bat && python -m uvicorn app.main:app --port 8000 --reload"
) else (
    start "RAG-Backend" cmd /c "cd /d "%~dp0backend" && python -m uvicorn app.main:app --port 8000 --reload"
)

:: --- 前端 ---
echo [2/2] 启动前端 (Vite :3000)...
start "RAG-Frontend" cmd /c "cd /d "%~dp0frontend" && npx vite --host"

:: --- 等待 ---
timeout /t 8 /nobreak >nul

:: --- 提示 ---
echo.
echo ========================================
echo   启动完成，浏览器即将打开...
echo   前端:    http://localhost:3000
echo   API文档: http://localhost:8000/docs
echo   管理员:  admin  /  密码见 backend\.env 的 ADMIN_PASSWORD
echo ========================================
start "" http://localhost:3000

echo 按任意键退出...
pause >nul
