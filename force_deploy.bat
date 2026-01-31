@echo off
echo =================================================
echo   FORCE DEPLOY THALEXA_V2 TO GITHUB
echo =================================================
echo Repository: https://github.com/EmmyPencilAI/Thalexa-Sui
echo.

REM Check if we're in the right directory
if not exist "Thalexa_V2" (
    echo ❌ ERROR: Not in Thalexa_V2 directory!
    echo Please run this from INSIDE Thalexa_V2 folder
    pause
    exit /b 1
)

echo [1/4] Initializing Git repository...
git init
echo ✓ Git initialized

echo [2/4] Adding all files to Git...
git add .
echo ✓ Files added

echo [3/4] Creating initial commit...
git commit -m "🚀 Thalexa V2 Deployment - Complete Project

- Smart Contracts: Sui Move escrow system
- Frontend: React + TypeScript + Vite
- Backend: Node.js API structure
- Docs: Comprehensive documentation
- Features: zkLogin, IPFS, Multi-currency

Deployed: %date% %time%"
echo ✓ Committed changes

echo [4/4] FORCE PUSHING TO GITHUB...
echo WARNING: This will OVERWRITE everything in the remote repository!
echo.

REM Set remote URL
git remote add origin https://github.com/EmmyPencilAI/Thalexa-Sui.git

REM Create main branch and force push
git branch -M main
git push -u origin main --force

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCESS! Project deployed to GitHub!
    echo 🌐 View at: https://github.com/EmmyPencilAI/Thalexa-Sui
) else (
    echo.
    echo ❌ Failed to push to GitHub
    echo Possible reasons:
    echo 1. No internet connection
    echo 2. Invalid credentials
    echo 3. Repository doesn't exist or no access
)

pause