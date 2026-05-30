@echo off
echo ====================================
echo   墨韵 AI - 快速启动
echo ====================================
echo.
echo 正在打开墨韵 AI 应用...
echo.

REM 检查文件是否存在
if exist "dist\index.html" (
    echo 找到构建文件存在，正在打开...
    start "" "dist\index.html"
) else (
    echo 构建文件不存在，请先运行构建！
    echo 运行: npm run build
    pause
    exit /b
)

echo.
echo ✅ 墨韵 AI 已在浏览器中打开！
echo.
echo 如果需要下载中心，请打开: dist\download.html
echo.
pause
