@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM Navigate to the project root directory (FRONT folder)
cd /d "%~dp0..\.."

REM Start from default Vite port
set PORT=5173

echo Starting development server...
echo.

:CHECK_PORT
REM Check if port is in use
netstat -ano | findstr ":%PORT%" >nul 2>nul
if %errorlevel% equ 0 (
    echo ⚠ Port %PORT% is already in use
    set /a PORT+=1
    goto CHECK_PORT
)

echo ✓ Using port %PORT%
echo.
echo ==========================================
echo 🚀 Development Server Starting...
echo ==========================================
echo.
echo 📱 Local:   http://localhost:%PORT%
echo 🌐 Network: Check the output below
echo.
echo ==========================================
echo Press Ctrl+C to stop the server
echo ==========================================
echo.

REM Run dev server with the available port
set PORT=%PORT%
call npm run dev

REM Keep terminal open if server crashes
if %errorlevel% neq 0 (
    echo.
    echo ✗ Development server failed to start!
    echo.
    pause
)
