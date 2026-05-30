@echo off
chcp 65001 >nul

echo ===================================
echo    InkVerse AI - APK Build Script
echo ===================================
echo.

cd /d "%~dp0"

REM Step 0: Find Android SDK
echo Step 0: Detecting Android SDK...

if defined ANDROID_HOME (
    if exist "%ANDROID_HOME%" (
        set ANDROID_SDK=%ANDROID_HOME%
        echo Found via ANDROID_HOME
    )
)

if not defined ANDROID_SDK (
    if defined ANDROID_SDK_ROOT (
        if exist "%ANDROID_SDK_ROOT%" (
            set ANDROID_SDK=%ANDROID_SDK_ROOT%
            echo Found via ANDROID_SDK_ROOT
        )
    )
)

if not defined ANDROID_SDK (
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set ANDROID_SDK=%LOCALAPPDATA%\Android\Sdk
        echo Found at LOCALAPPDATA
    )
)

if not defined ANDROID_SDK (
    if exist "C:\Users\%USERNAME%\AppData\Local\Android\Sdk" (
        set ANDROID_SDK=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
        echo Found at USERNAME path
    )
)

if not defined ANDROID_SDK (
    echo ERROR: Android SDK not found!
    echo Please install Android Studio: https://developer.android.com/studio
    pause
    exit /b 1
)

echo Using SDK: %ANDROID_SDK%
echo.

REM Set environment variables for Gradle
set ANDROID_HOME=%ANDROID_SDK%
set JAVA_TOOL_OPTIONS=-Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8

REM Convert to short path (8.3) format
for %%i in ("%ANDROID_SDK%") do set ANDROID_SDK_SHORT=%%~si

REM Create local.properties with both paths
echo sdk.dir=%ANDROID_SDK_SHORT% > android\local.properties
echo android.ndkPath=%ANDROID_SDK_SHORT%\ndk >> android\local.properties
echo android.sdkPath=%ANDROID_SDK% >> android\local.properties

echo Created android\local.properties:
type android\local.properties
echo.

REM Step 1: Install dependencies
echo Step 1: Installing dependencies...
call npm install
if errorlevel 1 goto failed

echo.
echo Step 2: Building web app...
call npm run build
if errorlevel 1 goto failed

echo.
echo Step 3: Syncing to Android...
call npx cap sync android

echo.
echo Step 4: Building APK...
echo Using JAVA_TOOL_OPTIONS=%JAVA_TOOL_OPTIONS%
echo.

cd android
call gradlew.bat assembleDebug --no-daemon --stacktrace
if errorlevel 1 (
    cd ..
    goto failed
)
cd ..

echo.
echo ===================================
echo    Build Successful!
echo ===================================
echo.
echo APK: %~dp0android\app\build\outputs\apk\debug\app-debug.apk
echo.
explorer.exe "%~dp0android\app\build\outputs\apk\debug\"
pause
exit /b 0

:failed
echo.
echo ===================================
echo    Build Failed!
echo ===================================
echo.
echo Checking local.properties:
type android\local.properties
echo.
echo Checking Android SDK exists:
if exist "%ANDROID_SDK%" (
    echo SDK exists at: %ANDROID_SDK%
) else (
    echo SDK NOT FOUND at: %ANDROID_SDK%
)
echo.
pause
exit /b 1
