@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 
cd /d "%~dp0..\.."

REM 
echo Installing npm packages...
call npm install

if %errorlevel% equ 0 (
    echo ✓ Installation completed successfully!

    REM 
    echo.
    echo Installing global packages...
    call npm install -g vite
    call npm install -g @yahal-even-chen/mcp-uploader

    if %errorlevel% equ 0 (
        echo ✓ Global packages installed successfully!
    ) else (
        echo ⚠ Warning: Some global packages installation failed ^(may require administrator^)
    )

    REM 
    echo.
    echo Running mcp auth...
    call mcp auth

    if %errorlevel% equ 0 (
        echo ✓ mcp auth completed successfully!

        REM
        echo.
        echo Running mcp login...
        call mcp login

        if %errorlevel% equ 0 (
            echo ✓ mcp login completed successfully!
        ) else (
            echo ⚠ Warning: mcp login failed
        )
    ) else (
        echo ⚠ Warning: mcp auth failed
    )

    echo.
    echo All tasks completed! This window will close in 5 seconds...
    timeout /t 5 /nobreak >nul
    exit
) else (
    echo ✗ Installation failed!
    pause
    exit /b 1
)
