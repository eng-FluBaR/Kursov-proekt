@echo off
setlocal enabledelayedexpansion

cd /d "D:\Full-Stack Apps with AI\Kursov proekt\3d-jobs-mobile.worktrees\copilot-npm-workspaces-build-dev-scripts-cbb48097"

echo ========================================
echo STEP 1: Running npm install
echo ========================================
call npm install
if !ERRORLEVEL! NEQ 0 (
    echo STEP 1 FAILED: npm install returned error code !ERRORLEVEL!
    exit /b 1
)
echo STEP 1 SUCCESS: npm install completed
echo.

echo ========================================
echo STEP 2: Running npm run build
echo ========================================
call npm run build
if !ERRORLEVEL! NEQ 0 (
    echo STEP 2 FAILED: npm run build returned error code !ERRORLEVEL!
    exit /b 1
)
echo STEP 2 SUCCESS: npm run build completed
echo.

echo ========================================
echo All verification steps completed successfully
echo ========================================
