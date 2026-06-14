@echo off
title Home Video Platform
cd /d "%~dp0"

:: Switch console to UTF-8 encoding to support Chinese output
chcp 65001 >nul

echo ============================================
echo    Home Video Platform - Starting...
echo ============================================
echo.

:: Check dependencies
if not exist "node_modules" (
    echo [Install] Installing backend dependencies...
    call npm install
    if errorlevel 1 (
        echo [Error] Backend dependency installation failed!
        pause
        exit /b 1
    )
)

if not exist "client\node_modules" (
    echo [Install] Installing frontend dependencies...
    cd client
    call npm install
    if errorlevel 1 (
        echo [Error] Frontend dependency installation failed!
        pause
        exit /b 1
    )
    cd ..
)

echo [Start] Launching backend and frontend services...
echo.
echo ============================================
echo   Backend  > http://localhost:3000
echo   Frontend > http://localhost:5173
echo.
echo   Press Ctrl+C to stop all services
echo ============================================
echo.

:: Use concurrently to run both services in one window with labeled output
call npx concurrently --names "BACKEND,FRONTEND" --prefix-colors "blue,green" "npx nodemon --watch server --ext ts --exec ts-node server/index.ts" "cd client && npx vite --host"

echo.
echo Services stopped.
pause
