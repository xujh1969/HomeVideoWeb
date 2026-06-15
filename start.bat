@echo off
title Home Video Platform
cd /d "%~dp0"

:: Switch console to UTF-8 encoding to support Chinese output
chcp 65001 >nul

echo ============================================
echo    Home Video Platform - Production Mode
echo ============================================
echo.

:: Check and kill process using port 3000
echo [Check] Checking if port 3000 is in use...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo [Port] Port 3000 is occupied by PID %%a, terminating...
    taskkill /F /PID %%a >nul 2>&1
    if errorlevel 1 (
        echo [Warning] Failed to terminate PID %%a, but will try to start anyway...
    ) else (
        echo [Port] Successfully terminated PID %%a
    )
    timeout /t 2 /nobreak >nul
)
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

:: Build for production
echo [Build] Building backend...
call npm run build:server
if errorlevel 1 (
    echo [Error] Backend build failed!
    pause
    exit /b 1
)

echo [Build] Building frontend...
call npm run build:client
if errorlevel 1 (
    echo [Error] Frontend build failed!
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Build completed successfully!
echo ============================================
echo.

echo [Start] Launching production server...
echo.
echo ============================================
echo   Waiting for server to start...
echo ============================================
echo.

:: Start production server
call npm start

echo.
echo Services stopped.
pause