const fs = require("fs");
const content = `@echo off
title Home Video Platform
cd /d "%~dp0"
chcp 65001 >nul
echo Checking Node.js...
where node >nul 2>&1 || (echo ERROR: Node.js not found! & pause & exit /b 1)
echo OK: Node.js found
echo Building backend...
npm run build:server || (echo ERROR: Backend build failed! & pause & exit /b 1)
echo Building frontend...
