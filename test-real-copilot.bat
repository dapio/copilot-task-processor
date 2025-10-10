@echo off
echo 🚀 Testing Real GitHub Copilot Provider...
echo.

REM Check if GitHub token is set
if "%GITHUB_TOKEN%"=="" (
    echo ❌ GITHUB_TOKEN environment variable is not set
    echo Please set your GitHub token:
    echo   set GITHUB_TOKEN=your_github_token_here
    echo.
    echo To get a GitHub token:
    echo   1. Go to https://github.com/settings/personal-access-tokens/tokens
    echo   2. Generate new token (classic)
    echo   3. Select 'repo' and 'user' scopes
    echo   4. Copy the token and set it in GITHUB_TOKEN
    echo.
    pause
    exit /b 1
)

echo 🔑 GitHub token found: %GITHUB_TOKEN:~0,8%...
echo.

cd /d "%~dp0\backend"

echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 goto error

echo 🔨 Compiling TypeScript...
call npx tsc --noEmit
if %errorlevel% neq 0 goto error

echo 🧪 Running real GitHub Copilot provider test...
call npx ts-node src/test-real-copilot.ts
if %errorlevel% neq 0 goto error

echo.
echo ✅ Test completed successfully!
goto end

:error
echo.
echo ❌ Test failed with error code %errorlevel%
pause
exit /b %errorlevel%

:end
echo.
echo Press any key to continue...
pause > nul