# 性能优化检查清单

## Phase 1: CSS 优化验证

- [ ] 所有 CSS 变量定义在 theme.css 中
- [ ] 基础样式重置在 base.css 中
- [ ] 组件样式在 components.css 中
- [ ] 动画样式在 animations.css 中
- [ ] .template-card 没有重复定义
- [ ] .template-hint 没有重复定义
- [ ] backdrop-filter blur 已优化或移除
- [ ] 径向梯度背景已简化
- [ ] GPU 加速优化已添加（will-change）
- [ ] prefers-reduced-motion 支持已实现
- [ ] index.html 正确导入所有 CSS 文件

## Phase 1: Vite 配置验证

- [ ] vite.config.js 文件已创建
- [ ] 代码分割配置正确（vendors, core, ui, api, chat）
- [ ] terser 压缩已配置
- [ ] console.log 在生产环境已移除
- [ ] CSS 代码分离已启用
- [ ] 资源内联限制已配置
- [ ] bundle size 分析可用

## Phase 1: 字体优化验证

- [ ] 字体子集已生成（WOFF2 格式）
- [ ] @font-face 配置正确
- [ ] font-display: swap 已设置
- [ ] 字体预加载已实现
- [ ] Unicode 范围正确（Latin + CJK）
- [ ] 字体文件大小 < 50KB
- [ ] 无字体加载阻塞渲染

## Phase 2: JavaScript 模块化验证

- [ ] src/core/app.js 已创建并导出 App 类
- [ ] src/core/state-manager.js 已创建并导出 StateManager 类
- [ ] src/modules/ui-renderer.js 已创建并导出 UIRenderer 类
- [ ] src/modules/api-handler.js 已创建并导出 APIHandler 类
- [ ] src/modules/template-manager.js 已创建并导出 TemplateManager 类
- [ ] src/modules/history-manager.js 已创建并导出 HistoryManager 类
- [ ] src/utils/validators.js 已创建并导出验证函数
- [ ] src/utils/formatters.js 已创建并导出格式化函数
- [ ] main.js 仅作为入口点，不包含所有逻辑
- [ ] 所有模块可以独立导入
- [ ] 模块之间无循环依赖

## Phase 2: API Handler 验证

- [ ] fetchWithTimeout 方法实现正确（30秒超时）
- [ ] callWithRetry 方法实现正确（3次重试）
- [ ] 指数退避重试策略实现正确
- [ ] 请求缓存（5分钟 TTL）实现正确
- [ ] AbortController 取消请求功能正常
- [ ] 4xx 错误不触发重试
- [ ] 超时和重试有适当的错误处理

## Phase 2: 虚拟滚动验证

- [ ] HistoryManager 类实现正确
- [ ] updateVisibleRange 方法正确计算可见范围
- [ ] DocumentFragment 用于批量 DOM 更新
- [ ] 缓冲区域正确实现（上下各5项）
- [ ] 滚动性能流畅（60fps）
- [ ] 内存使用优化（仅渲染可见项）
- [ ] 滚动时无闪烁或跳动
- [ ] 可以正确处理 100+ 条历史记录

## Phase 2: Service Worker 验证

- [ ] public/sw.js 文件存在
- [ ] 安装事件正确缓存静态资源
- [ ] 获取事件实现缓存策略
- [ ] API 请求使用网络优先策略
- [ ] 静态资源使用缓存优先策略
- [ ] Service Worker 在 main.js 中正确注册
- [ ] 离线功能正常工作
- [ ] 缓存版本管理正确
- [ ] 旧缓存可以正确清理

## Phase 3: IndexedDB 验证

- [ ] src/utils/db.js 文件已创建
- [ ] HistoryDB 类实现正确
- [ ] IndexedDB 数据库初始化成功
- [ ] saveHistory 方法正确保存数据
- [ ] getHistory 方法正确获取数据
- [ ] 历史记录按时间戳排序
- [ ] 可以正确处理大量历史记录

## Phase 3: 延迟加载验证

- [ ] ChatModule 可以动态导入
- [ ] 动画 CSS 可以延迟加载
- [ ] 模块加载顺序优化
- [ ] 非关键模块不阻塞首屏渲染
- [ ] 预加载和懒加载配置正确

## Phase 3: 性能监控验证

- [ ] src/utils/metrics.js 文件已创建
- [ ] LCP 监控正确收集数据
- [ ] FID 监控正确收集数据
- [ ] CLS 监控正确收集数据
- [ ] 性能指标可以上报到服务器
- [ ] 监控代码在生产环境不阻塞渲染

## Phase 4: APK 优化验证

- [ ] android/app/build.gradle 配置更新
- [ ] 代码分割已启用（language, density, abi）
- [ ] 不必要的文件已排除
- [ ] 仅包含必需的 Capacitor 插件
- [ ] APK 大小显著减小
- [ ] 应用启动时间优化
- [ ] 延迟加载策略正确实现

## 性能指标检查

- [ ] JS Bundle Size < 50KB（压缩后）
- [ ] 首屏加载时间 < 2秒
- [ ] LCP < 2.5秒
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] 历史列表渲染使用虚拟滚动
- [ ] 字体加载时间 < 200ms
- [ ] API 超时设置正确（30秒）
- [ ] API 重试机制正常工作

## 功能完整性检查

- [ ] 所有模板功能正常工作
- [ ] API 调用和响应正确
- [ ] 历史记录保存和加载正确
- [ ] 收藏功能正常工作
- [ ] 聊天功能正常工作
- [ ] 离线模式功能正常
- [ ] 主题切换功能正常
- [ ] 模型选择功能正常

## 跨浏览器兼容性检查

- [ ] Chrome 最新版本测试通过
- [ ] Safari 最新版本测试通过
- [ ] Android Chrome 测试通过
- [ ] iOS Safari 测试通过
- [ ] Firefox 最新版本测试通过
- [ ] Microsoft Edge 最新版本测试通过

## 移动端兼容性检查

- [ ] Android APK 可以正常构建
- [ ] APK 可以正常安装
- [ ] 应用启动流畅
- [ ] 虚拟滚动在移动端流畅
- [ ] 触摸交互正常
- [ ] 虚拟键盘适配正确
- [ ] 沉浸式模式正常工作

## 构建和部署检查

- [ ] npm run build 可以成功执行
- [ ] 构建产物大小符合预期
- [ ] Gzip 压缩正确配置
- [ ] CDN 配置正确
- [ ] 环境变量正确配置
- [ ] GitHub Actions 工作流正确
- [ ] APK 可以成功发布到 GitHub Releases
