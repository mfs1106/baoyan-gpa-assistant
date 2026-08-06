@echo off
chcp 65001 >nul
title 创建桌面快捷方式

set SCRIPT="%TEMP%\CreateShortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = "%USERPROFILE%\Desktop\保研绩点助手.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%~dp0启动.bat" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo oLink.Description = "保研绩点助手" >> %SCRIPT%
echo oLink.IconLocation = "%~dp0node.exe,0" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%

cscript %SCRIPT%
del %SCRIPT%

echo.
echo ========================================
echo   桌面快捷方式已创建！
echo ========================================
echo.
echo   双击桌面图标即可启动
echo.
pause
