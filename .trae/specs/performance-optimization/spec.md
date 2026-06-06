# 墨韵 AI 性能优化规格说明

## 背景

当前墨韵 AI 应用存在以下性能问题：
- **单文件 JS**: 1673 行，74.9 KB（未压缩）
- **CSS 重复定义**: 15+ 个类重复声明
- **无代码分割**: 整个应用一次性加载
- **字体加载**: 3个字体文件，多个权重
- **无虚拟滚动**: 历史列表全部DOM渲染
- **CSS 动画**: 13+ 个 @keyframes 持续执行
- **Backdrop Filter**: GPU密集型操作

## 优化目标

将应用性能提升至生产级别标准：
- 首屏加载时间 < 2秒
- JavaScript  bundlesize < 50KB（压缩后）
- 实现代码分割，按需加载
- 优化 CSS 渲染性能
- 实现虚拟滚动处理大量历史记录
- 优化字体加载策略

## 架构重构

### 1. 代码分割方案

**新的项目结构**：
```
src/
├── main.js                 # 入口点（仅初始化）
├── core/
│   ├── app.js             # App 类（主应用逻辑）
│   ├── state-manager.js   # 状态管理（localStorage）
│   └── event-bus.js       # 事件总线
├── modules/
│   ├── ui-renderer.js     # UI 渲染（所有 render* 方法）
│   ├── api-handler.js     # API 调用（所有 call* 方法）
│   ├── template-manager.js # 模板管理
│   ├── chat-handler.js     # 聊天功能
│   └── history-manager.js # 历史管理
├── utils/
│   ├── validators.js      # 验证函数
│   ├── formatters.js      # 格式化函数
│   └── constants.js       # 常量定义
└── styles/
    ├── theme.css          # 主题变量
    ├── base.css           # 基础样式
    ├── components.css     # 组件样式
    └── animations.css     # 动画样式（延迟加载）
```

### 2. Vite 构建配置优化

**代码分割配置**：
- `vendors`: tslib 等依赖
- `core`: 核心应用代码
- `ui`: UI 模块
- `api`: API 模块
- `chat`: 聊天功能（可异步加载）

**压缩优化**：
- 生产环境移除 console.log
- 使用 terser 压缩
- 分离 CSS 代码

## CSS 优化

### 1. 移除重复定义

- 合并 `.template-card` 相关样式
- 合并 `.template-hint` 相关样式
- 统一按钮和输入框样式

### 2. 移除昂贵的视觉效果

- 移除 `backdrop-filter: blur(20px)`（改为 10px 或移除）
- 简化梯度背景（从两个径向梯度简化为一个）
- 使用 `will-change` 优化 GPU 加速

### 3. 动画优化

- 仅在首次加载时使用动画
- 使用 `translate3d` 启用 GPU 加速
- 添加 `prefers-reduced-motion` 支持

### 4. CSS 文件结构

```
src/styles/
├── theme.css        # CSS 变量定义
├── base.css         # 基础样式重置
├── components.css   # 组件样式
└── animations.css   # 动画（延迟加载）
```

## JavaScript 优化

### 1. 分解大型方法

**renderTemplates 优化**：
- 使用 DocumentFragment 减少重排
- 实现模板 HTML 缓存
- 使用事件委托（只绑定一次）

**API Handler 优化**：
- 添加请求超时（30秒）
- 实现重试机制（最多3次）
- 指数退避重试策略
- 实现请求缓存（5分钟 TTL）

### 2. 虚拟滚动实现

**HistoryManager**：
- 仅渲染可视区域内的项目
- 支持动态高度项目
- 缓冲区域（上下各5项）
- 使用 DocumentFragment 批量 DOM 更新

### 3. 延迟加载聊天功能

```javascript
// 动态导入聊天模块
const { ChatModule } = await import('./modules/chat-handler.js');
this.chatModule = new ChatModule(this.state);
```

## 网络和缓存优化

### Service Worker 实现

- 静态资源：缓存优先
- API 请求：网络优先，有缓存后备
- 缓存版本管理

## 字体加载优化

### 自托管字体方案

- 使用 WOFF2 格式
- 生成字体子集（仅常用字符）
- 使用 `font-display: swap`
- 预加载关键字体
- 降低字体文件大小至 < 50KB

### Unicode 范围优化

```
Basic Latin: U+0020-007F
CJK Unified Ideographs: U+4E00-9FFF
```

## 性能指标目标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| JS Bundle Size | 74.9 KB | < 50 KB |
| 首屏加载时间 | ~3秒 | < 2秒 |
| 历史列表渲染 | 全部DOM | 仅可视区域 |
| 字体加载 | ~800ms | < 200ms |
| API 超时 | 无 | 30秒 |
| API 重试 | 无 | 3次 |

## 兼容性要求

- 支持所有现代浏览器
- 支持 iOS Safari 14+
- 支持 Android Chrome 90+
- 提供 Service Worker 后备方案

## 影响范围

**受影响的文件**：
- `src/main.js` → 分解为多个模块
- `src/styles.css` → 拆分为多个 CSS 文件
- `vite.config.js` → 新增/更新构建配置
- `index.html` → 更新字体加载方式
- `public/sw.js` → 新增 Service Worker

**新增文件**：
- `src/core/app.js`
- `src/core/state-manager.js`
- `src/modules/ui-renderer.js`
- `src/modules/api-handler.js`
- `src/modules/template-manager.js`
- `src/modules/chat-handler.js`
- `src/modules/history-manager.js`
- `src/utils/validators.js`
- `src/utils/formatters.js`
- `src/utils/constants.js`
- `src/styles/theme.css`
- `src/styles/base.css`
- `src/styles/components.css`
- `src/styles/animations.css`
- `public/sw.js`
