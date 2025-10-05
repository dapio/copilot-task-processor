@echo off
title ThinkCode AI Platform - Stop All Services
color 0C

echo ================================================================================
echo                    🛑 STOPPING THINKCODE AI PLATFORM 🛑
echo ================================================================================
echo.

echo 🔄 Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo 🔄 Stopping Python HTTP servers...
taskkill /F /IM python.exe >nul 2>&1

echo 🔄 Cleaning up ports 3001, 3002, 3003, 8080...

REM Kill processes using specific ports
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do (
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3003') do (
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do (
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo.
echo ================================================================================
echo                        ✅ ALL SERVICES STOPPED SUCCESSFULLY!
echo ================================================================================
echo.
echo 🎯 All ThinkCode AI Platform services have been terminated.
echo    You can now safely restart the platform using start-platform.bat
echo.
pause