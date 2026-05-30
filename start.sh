#!/bin/bash
echo "===================================="
echo "  墨韵 AI - 快速启动"
echo "===================================="
echo ""
echo "正在打开墨韵 AI 应用..."
echo ""

if [ -f "dist/index.html" ]; then
    echo "找到构建文件，正在打开..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "dist/index.html"
    else
        xdg-open "dist/index.html" 2>/dev/null || \
        gnome-open "dist/index.html" 2>/dev/null || \
        echo "请在浏览器中打开: $(pwd)/dist/index.html"
    fi
else
    echo "构建文件不存在，请先运行构建！"
    echo "运行: npm run build"
    exit 1
fi

echo ""
echo "✅ 墨韵 AI 已在浏览器中打开！"
echo ""
echo "如果需要下载中心，请打开: dist/download.html"
echo ""
