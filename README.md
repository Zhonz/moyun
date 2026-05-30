# 墨韵 AI - 智能文学创作与阅读应用

## 📱 应用简介

**墨韵 AI** 是一款融合传统水墨美学与现代 AI 技术的智能文学创作与阅读应用，参考千文、猫箱等优秀应用设计。

## ✨ 核心功能

### 🎨 AI 创作模式
- **8种写作模板**: 小说开头、情节转折、人物描写、环境渲染、对话生成、结尾升华、角色扮演、世界观构建
- **6种写作风格**: 通用、古风、现代、悬疑、浪漫、恐怖
- **可调参数**: 创意程度(0-1)、输出长度(短/中/长)
- **支持主流AI API**: OpenAI GPT-4/3.5、Anthropic Claude、自定义端点

### 💬 角色扮演对话
- **预设角色**: 小墨(AI助手)、古风诗人、悬疑作家
- **自定义角色**: 创建独一无二的 AI 角色
- **对话历史**: 保存和管理多轮对话
- **沉浸体验**: 保持角色一致性

### 📚 阅读模式
- **书架管理**: 添加、分类、收藏书籍
- **沉浸式阅读器**:
  - 字体大小调节 (14-28px)
  - 行高调节 (1.5-2.5)
  - 3种主题: 墨色、羊皮、护眼
  - 点击/滑动翻页
  - 阅读进度追踪

### 👤 个人中心
- 创作统计: 字数、AI生成次数、对话次数
- 数据导出/清除缓存
- 深色模式切换

## 🚀 快速开始

### 方式一：直接使用 Web 版本
```bash
# 使用 Python 启动本地服务器
cd inkverse-app
python3 -m http.server 8080
# 访问 http://localhost:8080
```

### 方式二：构建 APK (推荐)

#### 前置要求
- Node.js 18+
- npm 或 yarn
- Android SDK
- Java 17+

#### 构建步骤

```bash
# 1. 安装依赖
cd inkverse-app
npm install

# 2. 构建 Web 应用
npm run build

# 3. 添加 Android 平台
npx cap add android

# 4. 同步到 Android
npx cap sync android

# 5. 构建 APK
cd android
./gradlew assembleDebug

# APK 输出位置: android/app/build/outputs/apk/debug/app-debug.apk
```

### 方式三：Windows 用户

```powershell
# 使用 PowerShell
cd inkverse-app
npm install
npm run build
npx cap add android
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

## 🔧 配置 AI API

1. 打开应用，进入「我的」→「API 设置」
2. 选择 AI 提供商 (OpenAI/Anthropic/自定义)
3. 输入你的 API Key
4. 选择模型
5. 保存设置

### API Key 获取
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/settings/keys

## 📁 项目结构

```
inkverse-app/
├── src/
│   ├── main.js        # 主应用逻辑
│   └── styles.css     # 样式文件
├── index.html         # HTML 入口
├── android/           # Android 原生项目
│   └── app/
├── dist/              # 编译输出
├── capacitor.config.json
└── package.json
```

## 🎨 设计特点

- **墨韵主题**: 深邃墨黑背景 + 古铜金点缀 + 翠玉绿辅助色
- **精选字体**: 站酷小薇体(标题) + Noto Serif SC(正文)
- **流畅动效**: 页面切换、卡片悬停、按钮反馈
- **移动端优化**: 底部导航、安全区域适配、触控优化

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
