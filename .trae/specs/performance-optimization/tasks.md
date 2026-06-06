# 性能优化任务列表

## Phase 1: 基础优化（第 1-2 周）

### 任务 1.1: CSS 优化
- [ ] 1.1.1 创建 CSS 文件结构（theme.css, base.css, components.css, animations.css）
- [ ] 1.1.2 移除 .template-card 重复定义
- [ ] 1.1.3 移除 .template-hint 重复定义
- [ ] 1.1.4 移除 backdrop-filter blur(20px)，改为 blur(10px) 或简化
- [ ] 1.1.5 简化径向梯度背景
- [ ] 1.1.6 添加 GPU 加速优化（will-change）
- [ ] 1.1.7 实现 prefers-reduced-motion 支持
- [ ] 1.1.8 更新 index.html 导入新的 CSS 文件

### 任务 1.2: Vite 配置优化
- [ ] 1.2.1 创建 vite.config.js 配置文件
- [ ] 1.2.2 配置代码分割（vendors, core, ui, api, chat）
- [ ] 1.2.3 配置 terser 压缩（移除 console.log）
- [ ] 1.2.4 启用 CSS 代码分离
- [ ] 1.2.5 配置资源内联限制

### 任务 1.3: 字体加载优化
- [ ] 1.3.1 分析当前字体使用情况
- [ ] 1.3.2 生成字体子集（WOFF2 格式）
- [ ] 1.3.3 实现 @font-face 优化配置
- [ ] 1.3.4 添加字体预加载
- [ ] 1.3.5 更新 index.html 字体加载方式

## Phase 2: 中级优化（第 3-4 周）

### 任务 2.1: JavaScript 模块化
- [ ] 2.1.1 创建 src/core/app.js（提取 App 类）
- [ ] 2.1.2 创建 src/core/state-manager.js（状态管理）
- [ ] 2.1.3 创建 src/modules/ui-renderer.js（UI 渲染）
- [ ] 2.1.4 创建 src/modules/api-handler.js（API 调用）
- [ ] 2.1.5 创建 src/modules/template-manager.js（模板管理）
- [ ] 2.1.6 创建 src/modules/history-manager.js（历史管理）
- [ ] 2.1.7 创建 src/utils/validators.js（验证函数）
- [ ] 2.1.8 创建 src/utils/formatters.js（格式化函数）
- [ ] 2.1.9 更新 main.js 作为入口点
- [ ] 2.1.10 更新 vite.config.js 配置模块分割

### 任务 2.2: API Handler 优化
- [ ] 2.2.1 实现 fetchWithTimeout 方法（30秒超时）
- [ ] 2.2.2 实现 callWithRetry 方法（3次重试）
- [ ] 2.2.3 实现指数退避重试策略
- [ ] 2.2.4 实现请求缓存（5分钟 TTL）
- [ ] 2.2.5 实现 AbortController 取消请求

### 任务 2.3: 虚拟滚动实现
- [ ] 2.3.1 实现 HistoryManager 类
- [ ] 2.3.2 实现 updateVisibleRange 方法
- [ ] 2.3.3 实现 DocumentFragment 批量更新
- [ ] 2.3.4 添加缓冲区域（上下各5项）
- [ ] 2.3.5 集成虚拟滚动到 main.js

### 任务 2.4: Service Worker 实现
- [ ] 2.4.1 创建 public/sw.js 文件
- [ ] 2.4.2 实现静态资源缓存
- [ ] 2.4.3 实现 API 请求网络优先策略
- [ ] 2.4.4 在 main.js 中注册 Service Worker
- [ ] 2.4.5 测试离线功能

## Phase 3: 高级优化（第 5-6 周）

### 任务 3.1: IndexedDB 缓存
- [ ] 3.1.1 创建 src/utils/db.js 文件
- [ ] 3.1.2 实现 HistoryDB 类
- [ ] 3.1.3 实现 saveHistory 方法
- [ ] 3.1.4 实现 getHistory 方法
- [ ] 3.1.5 集成 IndexedDB 到历史管理

### 任务 3.2: 延迟加载模块
- [ ] 3.2.1 实现 ChatModule 动态导入
- [ ] 3.2.2 实现动画 CSS 延迟加载
- [ ] 3.2.3 优化模块加载顺序

### 任务 3.3: 性能监控
- [ ] 3.3.1 创建 src/utils/metrics.js 文件
- [ ] 3.3.2 实现 LCP 监控
- [ ] 3.3.3 实现 FID 监控
- [ ] 3.3.4 实现 CLS 监控
- [ ] 3.3.5 集成性能监控到 main.js

### 任务 3.4: 构建优化
- [ ] 3.4.1 创建 scripts/build.sh 构建脚本
- [ ] 3.4.2 添加 bundle 分析功能
- [ ] 3.4.3 优化 package.json scripts
- [ ] 3.4.4 配置 Gzip 压缩

## Phase 4: Android/Capacitor 优化

### 任务 4.1: APK 大小优化
- [ ] 4.1.1 更新 android/app/build.gradle 配置
- [ ] 4.1.2 启用代码分割（language, density, abi）
- [ ] 4.1.3 配置 packagingOptions 排除不必要文件
- [ ] 4.1.4 仅包含必需的 Capacitor 插件
- [ ] 4.1.5 移除未使用的资源文件

### 任务 4.2: 启动时间优化
- [ ] 4.2.1 优化 MainActivity.java 启动代码
- [ ] 4.2.2 实现延迟加载策略
- [ ] 4.2.3 优化应用启动画面

## Phase 5: 测试和验证

### 任务 5.1: 性能测试
- [ ] 5.1.1 运行 Lighthouse 性能审计
- [ ] 5.1.2 测量首屏加载时间
- [ ] 5.1.3 测量 LCP, FID, CLS 指标
- [ ] 5.1.4 测试虚拟滚动性能
- [ ] 5.1.5 测试 Service Worker 缓存

### 任务 5.2: 功能测试
- [ ] 5.2.1 测试所有模板功能
- [ ] 5.2.2 测试 API 调用和重试
- [ ] 5.2.3 测试历史记录保存
- [ ] 5.2.4 测试离线功能
- [ ] 5.2.5 测试 APK 构建和安装

### 任务 5.3: 跨浏览器测试
- [ ] 5.3.1 测试 Chrome
- [ ] 5.3.2 测试 Safari
- [ ] 5.3.3 测试 Android Chrome
- [ ] 5.3.4 测试 iOS Safari

## 任务依赖关系

```
Phase 1 必须在 Phase 2 之前完成
Phase 2 必须在 Phase 3 之前完成
Phase 4 可以与 Phase 2/3 并行
Phase 5 必须在所有其他阶段之后完成

1.1 (CSS优化) → 1.2 (Vite配置)
1.2 (Vite配置) → 2.1 (JS模块化)
2.1 (JS模块化) → 2.2 (API优化)
2.1 (JS模块化) → 2.3 (虚拟滚动)
2.2 (API优化) → 3.1 (IndexedDB)
3.1 (IndexedDB) → 3.2 (延迟加载)
```

## 优先级排序

**高优先级**（立即实施）:
- 1.1.1 - 1.1.8 (CSS 优化)
- 1.2.1 - 1.2.5 (Vite 配置)
- 2.2.1 - 2.2.5 (API Handler)

**中优先级**（第二周）:
- 2.1.1 - 2.1.10 (JS 模块化)
- 2.3.1 - 2.3.5 (虚拟滚动)
- 2.4.1 - 2.4.5 (Service Worker)

**低优先级**（第三周）:
- 3.1.1 - 3.1.5 (IndexedDB)
- 3.2.1 - 3.2.3 (延迟加载)
- 3.3.1 - 3.3.5 (性能监控)
- 4.1.1 - 4.2.3 (Android 优化)
