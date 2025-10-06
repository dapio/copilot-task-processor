@echo off
title ThinkCode AI Platform Launcher
color 0B

echo ================================================================================
echo                     THINKCODE AI PLATFORM LAUNCHER
echo ================================================================================
echo.

REM Pre-start cleanup to ensure optimal performance
echo [CLEANUP] Czyszczenie systemu przed uruchomieniem...
call npx tsx scripts/cleanup-system.ts
echo.

REM Check if we're in the correct directory
if not exist "package.json" (
    echo [ERROR] package.json not found in current directory
    echo    Please run this script from the project root directory
    pause
    exit /b 1
)

REM Kill any existing Node.js processes to ensure clean start
echo [PROCESS] Cleaning up existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [START] Starting ThinkCode AI Platform...
echo.

REM Start Backend API Server (Port 3002)
echo [BACKEND] Starting Backend API Server on port 3002...
start "Backend API" cmd /k "echo [BACKEND] Backend API Server && npx tsx backend/src/server.ts"
timeout /t 5 /nobreak >nul

REM Start Agents API Server (Port 3006)
echo [AGENTS] Starting Agents API Server on port 3006...
start "Agents API" cmd /k "echo [AGENTS] Agents API Server && npx tsx backend/src/agents/agents-server.ts"
timeout /t 5 /nobreak >nul

REM Start Frontend Next.js Application (Port 3000)
echo [FRONTEND] Starting Frontend Next.js Application on port 3000...
start "Frontend Next.js" cmd /k "echo [FRONTEND] Frontend Next.js && cd frontend && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo ================================================================================
echo                        PLATFORM STARTED SUCCESSFULLY!
echo ================================================================================
echo.
echo [ACCESS] Access Points:
echo    Frontend App:    http://localhost:3000
echo    Admin Panel:     http://localhost:3001  
echo    Backend API:     http://localhost:3002/api/health
echo    Agents API:      http://localhost:3006/api/health
echo.
echo [SERVICES] Available Services:
echo    * Document Analysis ^& AI Processing
echo    * Task Generation ^& Management
echo    * 9 Specialized AI Agents
echo    * Project ^& Team Management
echo    * Real-time Monitoring Dashboard
echo.
echo [BROWSER] Opening Dashboard in Browser...
timeout /t 3 /nobreak >nul

REM Open the dashboard in default browser
start http://localhost:3000

echo.
echo ================================================================================
echo [SUCCESS] ThinkCode AI Platform is now running!
echo    Press any key to close this launcher (services will continue running)
echo    To stop all services, close the individual terminal windows
echo ================================================================================
pause >nul