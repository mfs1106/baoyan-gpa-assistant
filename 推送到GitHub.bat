@echo off
chcp 65001 >nul
title 保研绩点助手 - 推送到 GitHub
cd /d "%~dp0"

echo ========================================
echo   保研绩点助手 ^| 推送到 GitHub
echo ========================================
echo.

where git >nul 2>&1
if %errorlevel% neq 0 (
  echo [错误] 检测不到 Git 命令！请先安装 Git for Windows
  echo        下载地址：https://git-scm.com/download/win
  pause
  exit /b 1
)

if not exist ".git" (
  echo [错误] 还不是 Git 仓库！请先运行"上传到GitHub.bat"
  pause
  exit /b 1
)

REM ---- 检查是否有远程仓库 ----
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
  echo [错误] 还没绑定远程仓库！请先运行"上传到GitHub.bat"
  pause
  exit /b 1
)

REM ---- 先提交可能的新改动 ----
git add -A 2>nul
git diff --cached --quiet 2>nul
if %errorlevel% neq 0 (
  set /p MSG=有新改动，请输入更新描述（直接回车=默认）：
  if "%MSG%"=="" set "MSG=更新代码"
  git commit -q -m "%MSG%  (%date% %time%)"
  echo       已提交
) else (
  echo 没有新改动，直接推送...
)

echo.
echo [推送中] 正在推送到 GitHub，请稍等...
echo.
git push -u origin main
if %errorlevel% neq 0 (
  echo.
  echo [提示] 如果弹出登录窗口，请选择"在浏览器中登录"或输入您的 GitHub 凭据
  echo        登录成功后脚本会自动完成推送
)

echo.
echo ========================================
echo   ✅ 推送完成！
echo   访问地址：https://github.com/mfs1106/baoyan-gpa-assistant
echo ========================================
echo.
pause
