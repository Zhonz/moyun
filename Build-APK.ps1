# InkVerse AI - Build APK Script

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "   InkVerse AI - APK Build" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Get project root
$projectRoot = $PSScriptRoot
Set-Location $projectRoot

# Step 0: Find Android SDK
Write-Host "Step 0: Detecting Android SDK..." -ForegroundColor Yellow

$androidSDK = $null

if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) {
    $androidSDK = $env:ANDROID_HOME
    Write-Host "Found via ANDROID_HOME" -ForegroundColor Green
}
elseif ($env:ANDROID_SDK_ROOT -and (Test-Path $env:ANDROID_SDK_ROOT)) {
    $androidSDK = $env:ANDROID_SDK_ROOT
    Write-Host "Found via ANDROID_SDK_ROOT" -ForegroundColor Green
}

if (-not $androidSDK) {
    $sdkPaths = @(
        "$env:LOCALAPPDATA\Android\Sdk",
        "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
    )
    
    foreach ($path in $sdkPaths) {
        if (Test-Path $path) {
            $androidSDK = $path
            Write-Host "Found at: $path" -ForegroundColor Green
            break
        }
    }
}

if (-not $androidSDK) {
    Write-Host "ERROR: Android SDK not found!" -ForegroundColor Red
    Write-Host "Please install Android Studio: https://developer.android.com/studio" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "SDK: $androidSDK" -ForegroundColor Cyan
Write-Host ""

# Set environment variables
$env:ANDROID_HOME = $androidSDK
$env:JAVA_TOOL_OPTIONS = "-Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8"

# Convert SDK path to short format
$shortPath = (New-Object System.IO.FileInfo($androidSDK)).FullName
Write-Host "Short path: $shortPath" -ForegroundColor Gray

# Create local.properties
$localPropsPath = Join-Path $projectRoot "android\local.properties"
$writer = [System.IO.StreamWriter]::new($localPropsPath, $false, [System.Text.Encoding]::UTF8)
$writer.WriteLine("sdk.dir=$shortPath")
$writer.Close()

Write-Host "Created: android\local.properties" -ForegroundColor Green

# Verify
$content = Get-Content $localPropsPath -Raw
Write-Host "Content: $content" -ForegroundColor Gray
Write-Host ""

# Step 1: Install dependencies
Write-Host "Step 1: Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed" -ForegroundColor Red
    Read-Host "Press Enter"
    exit 1
}

# Step 2: Build web app
Write-Host ""
Write-Host "Step 2: Building web app..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed" -ForegroundColor Red
    Read-Host "Press Enter"
    exit 1
}

# Step 3: Sync to Android
Write-Host ""
Write-Host "Step 3: Syncing to Android..." -ForegroundColor Yellow
npx cap sync android

# Step 4: Build APK
Write-Host ""
Write-Host "Step 4: Building APK..." -ForegroundColor Yellow
Write-Host "JAVA_TOOL_OPTIONS: $env:JAVA_TOOL_OPTIONS" -ForegroundColor Gray
Write-Host ""

Set-Location android
& cmd /c "gradlew.bat assembleDebug --no-daemon --stacktrace 2>&1"

if ($LASTEXITCODE -ne 0) {
    Set-Location $projectRoot
    Write-Host ""
    Write-Host "Build failed!" -ForegroundColor Red
    Write-Host "local.properties:" -ForegroundColor Yellow
    Get-Content $localPropsPath
    Read-Host "Press Enter"
    exit 1
}

Set-Location $projectRoot

Write-Host ""
Write-Host "===================================" -ForegroundColor Green
Write-Host "   Build Successful!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""
Write-Host "APK: $projectRoot\android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Cyan
Write-Host ""

explorer.exe "$projectRoot\android\app\build\outputs\apk\debug\"
