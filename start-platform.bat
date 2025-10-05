@echo off
title ThinkCode AI Platform Launcher
color 0B

echo ================================================================================
echo                    🚀 THINKCODE AI PLATFORM LAUNCHER 🚀
echo ================================================================================
echo.

REM Check if we're in the correct directory
if not exist "package.json" (
    echo ❌ Error: package.json not found in current directory
    echo    Please run this script from the project root directory
    pause
    exit /b 1
)

REM Kill any existing Node.js processes to ensure clean start
echo 🔄 Cleaning up existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo ✅ Starting ThinkCode AI Platform...
echo.

REM Start Backend API Server (Port 3002)
echo 📡 Starting Backend API Server on port 3002...
start "Backend API" cmd /k "echo 🔧 Backend API Server && npx tsx backend/src/server.ts"
timeout /t 5 /nobreak >nul

REM Start Agents API Server (Port 3003)
echo 🤖 Starting Agents API Server on port 3003...
start "Agents API" cmd /k "echo 🤖 Agents API Server && npx tsx backend/src/agents-server.ts"
timeout /t 5 /nobreak >nul

REM Start Frontend Demo Dashboard (Port 8080)
echo 🌐 Starting Frontend Demo Dashboard on port 8080...
start "Frontend Demo" cmd /k "echo 🌐 Frontend Demo && cd frontend && python -m http.server 8080"
timeout /t 3 /nobreak >nul

echo.
echo ================================================================================
echo                           ✅ PLATFORM STARTED SUCCESSFULLY!
echo ================================================================================
echo.
echo 🌐 Access Points:
echo    Frontend Demo:   http://localhost:8080/demo-dashboard.html
echo    Backend API:     http://localhost:3002/api/health
echo    Agents API:      http://localhost:3003/api/health
echo.
echo 📋 Available Services:
echo    • Document Analysis & AI Processing
echo    • Task Generation & Management
echo    • 9 Specialized AI Agents
echo    • Project & Team Management
echo    • Real-time Monitoring Dashboard
echo.
echo 🎯 Opening Dashboard in Browser...
timeout /t 3 /nobreak >nul

REM Open the dashboard in default browser
start http://localhost:8080/demo-dashboard.html

echo.
echo ================================================================================
echo 🎉 ThinkCode AI Platform is now running!
echo    Press any key to close this launcher (services will continue running)
echo    To stop all services, close the individual terminal windows
echo ================================================================================
pause >nul