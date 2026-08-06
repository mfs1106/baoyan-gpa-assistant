@echo off
chcp 65001 >nul
title 保研绩点助手 - 开发服务器
cd /d "%~dp0"
echo ========================================
echo    保研绩点助手 - 启动开发服务器
echo ========================================
echo.
echo 正在启动服务器，请稍候...
echo.
echo 启动后请在浏览器中访问: http://localhost:5173/
echo.
echo 注意: 请勿关闭此窗口，关闭后服务器将停止运行
echo ========================================
echo.
npm run dev
pause
