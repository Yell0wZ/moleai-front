@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 
cd /d "%~dp0..\.."

REM
echo Running mcp deploy...
echo This may take a while, please wait...
echo.

call mcp deploy

REM 
if %errorlevel% equ 0 (
    echo.
    echo ✓ Deployment completed successfully!
) else (
    echo.
    echo ✗ Deployment failed!
)

echo.
pause
exit
