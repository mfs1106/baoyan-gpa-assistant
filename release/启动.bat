@echo off
chcp 65001 >nul
title 保研绩点助手
echo ========================================
echo   保研绩点助手 正在启动...
echo ========================================
echo.
echo   正在启动服务器，请稍候...
echo.

cd /d "%~dp0"

start "" /min "%~dp0node.exe" server.cjs

echo   等待服务器就绪...
timeout /t 2 /nobreak >nul

echo   正在打开浏览器...
start http://localhost:3000

echo.
echo ========================================
echo   保研绩点助手 已启动！
echo   浏览器应该已自动打开
echo ========================================
echo.
echo   如需停止，请运行 停止.bat
echo.
pause
