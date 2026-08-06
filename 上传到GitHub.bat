@echo off
chcp 65001 >nul
title 保研绩点助手 - 一键上传到GitHub
cd /d "%~dp0"

echo ========================================
echo   保研绩点助手 ^| 一键上传到 GitHub
echo ========================================
echo.

REM ---- 1. 检查 Git ----
where git >nul 2>&1
if %errorlevel% neq 0 (
  echo [错误] 检测不到 Git 命令！
  echo.
  echo 解决方法（任选其一）：
  echo   方案1（推荐）：安装 GitHub Desktop
  echo          https://desktop.github.com/
  echo          安装后打开 -^> File -^> Add Local Repository -^> 选本文件夹
  echo.
  echo   方案2：安装 Git for Windows
  echo          https://git-scm.com/download/win
  echo          安装时一路默认即可，装完重启电脑再运行本脚本
  echo.
  pause
  exit /b 1
)

REM ---- 2. 初始化仓库（如果还没.git）----
if not exist ".git" (
  echo [1/4] 首次使用，初始化 Git 仓库...
  git init -q
  git branch -M main
  echo       完成！
)

REM ---- 3. 检查身份配置 ----
for /f "delims=" %%a in ('git config user.name 2^>nul') do set "NAME=%%a"
for /f "delims=" %%a in ('git config user.email 2^>nul') do set "EMAIL=%%a"
if "%NAME%"=="" (
  echo.
  echo [提示] 还没配置 Git 身份，请输入您的 GitHub 信息：
  set /p NAME=GitHub用户名：
  set /p EMAIL=GitHub绑定邮箱：
  git config user.name "%NAME%"
  git config user.email "%EMAIL%"
  echo       身份已保存（以后不用再填）
)

REM ---- 4. 检查是否已绑远程仓库 ----
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo [提示] 还没绑定 GitHub 远程仓库！
  echo 请先在浏览器打开 https://github.com/new 新建一个空仓库
  echo （不要勾选 Add README / .gitignore / LICENSE）
  echo.
  set /p REPO=创建好后，把仓库地址粘贴到这里（如 https://github.com/你的用户名/仓库名.git）：
  git remote add origin "%REPO%"
  echo       远程仓库已绑定！
)

REM ---- 5. 写提交信息 ----
set /p MSG=请输入本次更新描述（直接回车=用默认"更新代码"）：
if "%MSG%"=="" set "MSG=更新代码"
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value ^| find "="') do set DT=%%a
set "STAMP=%DT:~0,4%-%DT:~4,2%-%DT:~6,2% %DT:~8,2%:%DT:~10,2%"

echo.
echo [2/4] 暂存所有更改...
git add -A

echo [3/4] 提交：%MSG%  (%STAMP%)
git commit -q -m "%MSG%  (%STAMP%)"
if %errorlevel% neq 0 (
  echo       没有新的改动，无需上传
  pause
  exit /b 0
)

echo [4/4] 推送到 GitHub...
git push -u origin main 2>nul
if %errorlevel% neq 0 (
  REM 第一次 push 失败的话尝试带 -f
  git push -f -u origin main
)

echo.
echo ========================================
echo   ✅ 已成功上传到 GitHub！
echo ========================================
echo.
pause
