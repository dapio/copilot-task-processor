@echo off
title ThinkCode AI Platform - Status Check
color 0A

echo ================================================================================
echo                    📊 THINKCODE AI PLATFORM STATUS CHECK 📊
echo ================================================================================
echo.

echo 🔍 Checking active Node.js processes...
echo.
tasklist /FI "IMAGENAME eq node.exe" /FO TABLE 2>nul | findstr /V "INFO:"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ No Node.js processes running
) else (
    echo ✅ Node.js processes found
)

echo.
echo 🔍 Checking active ports...
echo.

REM Check Backend API (Port 3002)
netstat -an | findstr :3002 >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend API Server - Port 3002: ACTIVE
    
    REM Test Backend API health
    powershell -Command "try { (Invoke-WebRequest -Uri 'http://localhost:3002/api/health' -UseBasicParsing -TimeoutSec 5).StatusCode } catch { 'ERROR' }" >temp_result.txt
    set /p API_STATUS=<temp_result.txt
    del temp_result.txt
    
    if "!API_STATUS!"=="200" (
        echo    └─ API Health Check: ✅ HEALTHY
    ) else (
        echo    └─ API Health Check: ❌ NOT RESPONDING
    )
) else (
    echo ❌ Backend API Server - Port 3002: INACTIVE
)

REM Check Agents API (Port 3003)
netstat -an | findstr :3003 >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Agents API Server - Port 3003: ACTIVE
    
    REM Test Agents API health
    powershell -Command "try { (Invoke-WebRequest -Uri 'http://localhost:3003/api/health' -UseBasicParsing -TimeoutSec 5).StatusCode } catch { 'ERROR' }" >temp_result.txt
    set /p AGENTS_STATUS=<temp_result.txt
    del temp_result.txt
    
    if "!AGENTS_STATUS!"=="200" (
        echo    └─ API Health Check: ✅ HEALTHY
    ) else (
        echo    └─ API Health Check: ❌ NOT RESPONDING
    )
) else (
    echo ❌ Agents API Server - Port 3003: INACTIVE
)

REM Check Frontend Demo (Port 8080)
netstat -an | findstr :8080 >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Frontend Demo Server - Port 8080: ACTIVE
) else (
    echo ❌ Frontend Demo Server - Port 8080: INACTIVE
)

echo.
echo ================================================================================
echo 🌐 Quick Access Links:
echo    Frontend Demo:   http://localhost:8080/demo-dashboard.html
echo    Backend Health:  http://localhost:3002/api/health
echo    Agents Health:   http://localhost:3003/api/health
echo ================================================================================
echo.

REM Offer quick actions
echo 🎯 Quick Actions:
echo    [1] Open Frontend Dashboard
echo    [2] Open Backend API Health
echo    [3] Open Agents API Health
echo    [4] Start Platform (if not running)
echo    [5] Stop All Services
echo    [0] Exit
echo.
set /p choice="Enter your choice (0-5): "

if "%choice%"=="1" start http://localhost:8080/demo-dashboard.html
if "%choice%"=="2" start http://localhost:3002/api/health
if "%choice%"=="3" start http://localhost:3003/api/health
if "%choice%"=="4" call start-platform.bat
if "%choice%"=="5" call stop-platform.bat
if "%choice%"=="0" exit /b 0

pause