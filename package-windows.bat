@echo off
echo ========================================
echo AutoDJ Windows Packaging Script
echo ========================================
echo.

echo Step 1: Checking prerequisites...
if not exist "package.json" (
    echo ERROR: package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

echo Step 2: Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo Step 3: Installing Python dependencies...
call npm run install-python-deps
if %errorlevel% neq 0 (
    echo WARNING: Failed to install Python dependencies. Continuing anyway...
)

echo Step 4: Building React application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build React application
    pause
    exit /b 1
)

echo Step 5: Packaging for Windows...
call npm run electron-pack-win
if %errorlevel% neq 0 (
    echo ERROR: Failed to package application
    pause
    exit /b 1
)

echo.
echo ========================================
echo Packaging completed successfully!
echo ========================================
echo.
echo Generated files are in the 'dist' directory:
if exist "dist" (
    dir /b dist
)
echo.
echo Next steps:
echo 1. Test the packaged application
echo 2. Sign the application (recommended)
echo 3. Upload to your distribution platform
echo.
pause 