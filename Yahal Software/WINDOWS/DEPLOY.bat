@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM Navigate to the project root directory (FRONT folder)
cd /d "%~dp0..\.."

REM Run mcp deploy
echo Running mcp deploy...
echo This may take a while, please wait...
echo.

call mcp deploy

REM Check if deployment was successful
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
