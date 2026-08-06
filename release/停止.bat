@echo off
chcp 65001 >nul
title 停止保研绩点助手
echo 正在停止保研绩点助手...
taskkill /f /im node.exe /fi "WINDOWTITLE eq 保研绩点助手*" 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /f /pid %%a 2>nul
)
echo.
echo 服务器已停止
timeout /t 2 /nobreak >nul
