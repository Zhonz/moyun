# 墨韵AI 小说阅读器重构计划

**Goal:** 将纯生成工具重构为「书架 + 创作 + 阅读」三合一小说应用，类似番茄小说体验

**Architecture:** 底部导航切换三大页面（书架/创作/我的），创作流程改为"先大纲后逐章"，章节生成后存入本地书库，书架展示已有小说，点击进入番茄风格阅读器

**Tech Stack:** 纯 HTML/CSS/JS，IndexedDB 持久化，流式 API 调用

---

## Design Direction

- **Visual Thesis**: 清水出芙蓉 — 白底、细线、留白、呼吸感，一个蓝色强调色贯穿始终
- **Typography**: Noto Serif SC（正文）+ Inter（UI），克制而清晰
- **Interaction**: 页面切换滑动过渡，章节生成进度动画，阅读器翻页流畅

## File Structure

| File | Purpose |
|------|---------|
| `index.html` | 重写：底部导航 + 三页面容器 |
| `src/styles.css` | 重写：清新简洁全量样式 |
| `src/main.js` | 重写：App 类 + 页面路由 + 业务逻辑 |
| `src/core/state-manager.js` | 扩展：小说/章节数据结构 |
| `src/core/novel-store.js` | 新建：小说CRUD + IndexedDB |
| `src/modules/template-manager.js` | 保留：模板系统 |
| `src/modules/history-manager.js` | 保留但简化 |
| `src/utils/api-handler.js` | 保留 |

## Data Model

```
Novel {
  id: string (uuid)
  title: string
  cover: string (颜色或emoji)
  outline: string (AI生成的大纲)
  foreshadowing: string (伏笔设计)
  writingStyle: string (写法说明)
  genre: string (短篇/中篇/长篇/超长篇)
  targetChapters: number
  createdAt: timestamp
  updatedAt: timestamp
  chapters: Chapter[]
  status: 'outlining' | 'writing' | 'completed'
}

Chapter {
  id: string
  novelId: string
  index: number
  title: string
  content: string
  status: 'pending' | 'generating' | 'completed'
  wordCount: number
}
```

## Page Structure

### 1. 书架页 (Bookshelf)
- 网格展示已有小说（封面色块 + 标题 + 进度）
- 点击小说 → 进入阅读器
- 空状态 → 引导去创作

### 2. 创作页 (Create)
- 步骤1：填写基本信息（标题、题材、篇幅选择）
- 步骤2：AI生成大纲（伏笔、写法、内容规划）
- 步骤3：确认大纲后逐章生成
- 生成中的章节显示进度条
- 生成完一章自动保存，可立即阅读

### 3. 我的页 (Profile)
- 设置（API配置等）
- 历史记录
- 主题切换

### 阅读器 (Reader) — 覆盖层
- 番茄风格：大行高、舒适字号、白色背景
- 顶部：小说名 + 章节名
- 中部：正文滚动阅读
- 底部：章节切换（上一章/下一章）
- 点击中间区域 → 显示/隐藏控制栏
