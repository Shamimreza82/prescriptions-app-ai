@echo off
chcp 65001 >nul
echo ============================================
echo  Prescription App - Load Test Runner
echo ============================================
echo.

:: Check prerequisites
where k6 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] k6 not found. Please install k6 first:
    echo   winget install k6
    echo   or visit: https://k6.io/docs/getting-started/installation/
    exit /b 1
)

:: Step 1: Seed test data
echo [1/3] Seeding test data...
cd /d "%~dp0..\backend"
set NODE_ENV=test
npx ts-node prisma/seed-load-test.ts
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Seeding failed.
    exit /b 1
)
echo.

:: Step 2: Start backend in test mode
echo [2/3] Starting backend in test mode...
start "Backend" cmd /c "set NODE_ENV=test && npx ts-node src/server.ts"
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

:: Verify backend health
curl -s http://localhost:5000/api/health >nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Backend not responding on port 5000.
    exit /b 1
)
echo Backend is running on http://localhost:5000
echo.

:: Step 3: Run k6 test
echo [3/3] Running k6 load test...
cd /d "%~dp0"
k6 run prescribing-flow.js --out csv=results.csv
echo.

echo Results saved to: load-tests\results.csv
echo ============================================
pause
