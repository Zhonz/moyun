#!/bin/bash
# 墨韵 AI - APK 构建脚本

echo "===================================="
echo "   墨韵 AI - APK 构建脚本"
echo "===================================="
echo ""

cd "$(dirname "$0")"

echo "[1/6] 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，请先安装: https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js 已安装 ($(node --version))"

echo ""
echo "[2/6] 安装依赖..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi
echo "✅ 依赖安装完成"

echo ""
echo "[3/6] 检查 Android SDK..."
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    echo "⚠️ 未设置 ANDROID_HOME 或 ANDROID_SDK_ROOT"
    echo "   请确保已安装 Android SDK"
fi
echo "✅ Android SDK 配置检查完成"

echo ""
echo "[4/6] 构建 Web 应用..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Web 应用构建失败"
    exit 1
fi
echo "✅ Web 应用构建完成"

echo ""
echo "[5/6] 添加 Android 平台并同步..."
npx cap add android
npx cap sync android
echo "✅ 同步完成"

echo ""
echo "[6/6] 构建 APK..."
cd android

# 尝试使用 Gradle Wrapper
if [ -f "./gradlew" ]; then
    chmod +x ./gradlew
    ./gradlew assembleDebug
else
    gradle assembleDebug
fi

if [ $? -ne 0 ]; then
    echo "❌ APK 构建失败"
    exit 1
fi
cd ..

echo ""
echo "===================================="
echo "✅ 构建成功！"
echo "===================================="
echo ""
echo "APK 文件位置:"
find . -name "*.apk" -type f 2>/dev/null | head -1
echo ""
echo "完整路径: $(pwd)/android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
