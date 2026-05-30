#!/bin/bash
# APK Build Script with Retry Logic

export ANDROID_HOME=/opt/android-sdk
export ANDROID_SDK_ROOT=/opt/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

cd /workspace/inkverse-app/android

MAX_RETRIES=10
RETRY_DELAY=5

for i in $(seq 1 $MAX_RETRIES); do
    echo "=== Attempt $i of $MAX_RETRIES ==="
    ./gradlew assembleDebug --no-daemon 2>&1 | tail -50

    if [ -f app/build/outputs/apk/debug/app-debug.apk ]; then
        echo "✅ APK build successful!"
        ls -la app/build/outputs/apk/debug/
        exit 0
    fi

    if [ $i -lt $MAX_RETRIES ]; then
        echo "⚠️ Build failed, retrying in $RETRY_DELAY seconds..."
        sleep $RETRY_DELAY
    fi
done

echo "❌ Build failed after $MAX_RETRIES attempts"
exit 1
