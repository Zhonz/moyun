#!/bin/bash
# 生成稳定的debug签名密钥
# 此密钥用于让所有APK使用相同签名，避免覆盖安装冲突

KEYSTORE_DIR="android/app"
KEYSTORE_FILE="$KEYSTORE_DIR/debug.keystore"
KEYSTORE_PROPS="$KEYSTORE_DIR/debug-keystore.properties"

# 检查是否已经存在
if [ -f "$KEYSTORE_FILE" ]; then
    echo "⚠️  签名密钥已存在: $KEYSTORE_FILE"
    exit 0
fi

echo "🔑 生成稳定的debug签名密钥..."

# 创建密钥库
keytool -genkey -v -keystore "$KEYSTORE_FILE" \
    -storepass inkverse-debug \
    -alias inkverse-debug \
    -keypass inkverse-debug \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -dname "CN=inkverse, OU=inkverse, O=inkverse, L=Unknown, ST=Unknown, C=Unknown" 2>/dev/null || true

# 创建属性文件
cat > "$KEYSTORE_PROPS" << 'EOF'
storeFile=debug.keystore
storePassword=inkverse-debug
keyAlias=inkverse-debug
keyPassword=inkverse-debug
EOF

echo "✅ 签名密钥生成完成！"
echo "   密钥文件: $KEYSTORE_FILE"
echo "   属性文件: $KEYSTORE_PROPS"
