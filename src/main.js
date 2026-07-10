import './styles.css'
import apiHandler from './utils/api-handler.js'
import stateManager, { AI_PROVIDERS } from './core/state-manager.js'
import novelStore from './core/novel-store.js'

const GENRE_CHAPTER_MAP = {
    short: { min: 10, max: 30, target: 20 },
    medium: { min: 30, max: 100, target: 50 },
    long: { min: 100, max: 999, target: 150 },
    ultra: { min: 300, max: 9999, target: 300 }
}

const BOOK_EMOJIS = ['📖', '📚', '✨', '🌙', '🔥', '💎', '🌸', '🎭', '⚔️', '🏔️', '🌊', '🎪']

class InkverseApp {
    constructor() {
        this.state = stateManager.getState()
        this.currentPage = 'bookshelf'
        this.currentNovelId = null
        this.currentGenre = 'medium'
        this.currentTargetChapters = 50
        this.isGenerating = false
        this.isWriting = false
        this._abortWriting = false
        this.readerState = { novelId: null, chapterIndex: 0, chapters: [], novel: null }

        this.initApp()
    }

    async initApp() {
        await this.loadState()
        this.initUI()
        this.bindEvents()
    }

    async loadState() {
        await stateManager.load()
        this.state = stateManager.getState()
    }

    saveState() {
        stateManager.save()
    }

    initUI() {
        this.applyTheme()
        this.renderBookshelf()
        this.updateModelOptions()
        this.updateThinkingUI()
        this.renderStats()
        this.loadApiSettingsUI()
    }

    // ========== Page Navigation ==========

    switchPage(pageName) {
        this.currentPage = pageName
        stateManager.set('currentPage', pageName)

        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active')
        })
        const targetPage = document.getElementById(`page-${pageName}`)
        if (targetPage) targetPage.classList.add('active')

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName)
        })

        if (pageName === 'bookshelf') {
            this.renderBookshelf()
        } else if (pageName === 'profile') {
            this.renderStats()
            this.loadApiSettingsUI()
        }
    }

    // ========== Bookshelf Page ==========

    async renderBookshelf() {
        const container = document.getElementById('bookshelf-content')
        if (!container) return

        const novels = await novelStore.getAllNovels()

        if (novels.length === 0) {
            container.innerHTML = `
                <div class="book-empty">
                    <div class="book-empty-icon">📚</div>
                    <div class="book-empty-text">还没有小说，去创作第一本吧</div>
                    <button class="primary-btn" id="go-create-btn">开始创作</button>
                </div>
            `
            const goCreateBtn = document.getElementById('go-create-btn')
            if (goCreateBtn) {
                goCreateBtn.addEventListener('click', () => this.switchPage('create'))
            }
            return
        }

        const bookItemsHtml = await Promise.all(novels.map(async novel => {
            const stats = await novelStore.getNovelStats(novel.id)
            const emoji = novel.cover || BOOK_EMOJIS[Math.abs(this.hashString(novel.id)) % BOOK_EMOJIS.length]
            const progress = stats.totalChapters > 0
                ? Math.round((stats.completedChapters / novel.targetChapters) * 100)
                : 0
            const wordCount = this.formatWordCount(stats.totalWords)

            return `
                <div class="book-item" data-novel-id="${novel.id}">
                    <div class="book-cover" style="background:${novel.coverColor || '#3B82F6'}">
                        <span class="book-cover-title">${emoji} ${this.escapeHtml(novel.title)}</span>
                    </div>
                    <div class="book-title">${this.escapeHtml(novel.title)}</div>
                    <div class="book-progress">
                        <div class="book-progress-fill" style="width:${progress}%"></div>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);font-family:var(--font-ui);">
                        <span>${stats.completedChapters}/${novel.targetChapters}章</span>
                        <span>${wordCount}字</span>
                    </div>
                    <button class="book-delete-btn" data-delete-id="${novel.id}" title="删除">✕</button>
                </div>
            `
        }))

        container.innerHTML = `<div class="book-grid">${bookItemsHtml.join('')}</div>`

        container.querySelectorAll('.book-item').forEach(item => {
            const novelId = item.dataset.novelId
            const deleteBtn = item.querySelector('.book-delete-btn')

            deleteBtn?.addEventListener('click', async (e) => {
                e.stopPropagation()
                if (confirm('确定要删除这本小说吗？所有章节也会被删除。')) {
                    await novelStore.deleteNovel(novelId)
                    this.showToast('小说已删除')
                    this.renderBookshelf()
                }
            })

            item.addEventListener('click', (e) => {
                if (e.target.closest('.book-delete-btn')) return
                this.openReader(novelId, -1)
            })
        })
    }

    // ========== Create Page - Step Workflow ==========

    setCreateStep(stepId) {
        document.querySelectorAll('.create-step').forEach(step => {
            step.classList.remove('active')
        })
        const target = document.getElementById(stepId)
        if (target) target.classList.add('active')
    }

    async generateOutline() {
        const title = document.getElementById('novel-title')?.value.trim()
        const genreHint = document.getElementById('novel-genre-hint')?.value.trim()

        if (!title) {
            this.showToast('请输入小说名称', 'error')
            return
        }

        if (!stateManager.getApiKey()) {
            this.showToast('请先在"我的"页面设置 API Key', 'error')
            this.switchPage('profile')
            return
        }

        if (!this.state.model) {
            this.showToast('请先选择模型', 'error')
            this.switchPage('profile')
            return
        }

        // Create novel in store
        const novel = await novelStore.createNovel({
            title,
            genre: this.currentGenre,
            targetChapters: this.currentTargetChapters,
            genreHint: genreHint || '',
            cover: BOOK_EMOJIS[Math.abs(this.hashString(title)) % BOOK_EMOJIS.length],
            status: 'outlining'
        })

        this.currentNovelId = novel.id
        this.isGenerating = true

        this.setCreateStep('step-outline')
        document.getElementById('outline-loading').style.display = 'flex'
        document.getElementById('outline-content').style.display = 'none'
        document.getElementById('outline-actions').style.display = 'none'

        const prompt = `你是一位小说策划大师。请为以下小说生成完整的创作大纲和策划方案。

小说名称：《${title}》
题材描述：${genreHint || '由你自由发挥'}
篇幅：${GENRE_CHAPTER_MAP[this.currentGenre].min}-${GENRE_CHAPTER_MAP[this.currentGenre].max}章，共${this.currentTargetChapters}章

请严格按以下格式输出：

【故事大纲】
请生成完整的故事大纲，包含：
- 核心设定（世界观、时代背景等）
- 主要角色设定
- 完整的情节主线（按章节段划分）
- 结局走向

【伏笔设计】
请设计贯穿全文的伏笔系统，包含：
- 关键伏笔列表（每个伏笔的埋设章节和揭示章节）
- 悬念节点
- 情节反转设计

【写法说明】
请给出写作风格指导，包含：
- 叙事视角和人称
- 语言风格（如古风、现代、口语化等）
- 节奏控制建议
- 氛围营造方法`

        const messages = [
            { role: 'system', content: '你是一位专业的小说策划大师，精通各种题材的小说创作策划。请严格按照指定格式输出。' },
            { role: 'user', content: prompt }
        ]

        try {
            const result = await this.callAIWithStreaming(messages, (chunk) => {
                const outlineText = document.getElementById('outline-text')
                if (outlineText) {
                    outlineText.textContent += chunk
                    outlineText.scrollTop = outlineText.scrollHeight
                }
            })

            // Parse the response into sections
            const sections = this.parseOutlineSections(result)

            document.getElementById('outline-text').textContent = sections.outline
            document.getElementById('foreshadowing-text').textContent = sections.foreshadowing
            document.getElementById('writing-style-text').textContent = sections.writingStyle

            document.getElementById('outline-loading').style.display = 'none'
            document.getElementById('outline-content').style.display = 'block'
            document.getElementById('outline-actions').style.display = 'flex'

            // Store outline data in novel
            await novelStore.updateNovel(novel.id, {
                outline: sections.outline,
                foreshadowing: sections.foreshadowing,
                writingStyle: sections.writingStyle,
                status: 'outlining'
            })

        } catch (e) {
            this.showToast(`大纲生成失败：${e.message}`, 'error')
            document.getElementById('outline-loading').style.display = 'none'
            document.getElementById('outline-content').style.display = 'block'
            document.getElementById('outline-text').textContent = `生成失败：${e.message}`
        } finally {
            this.isGenerating = false
        }
    }

    parseOutlineSections(text) {
        const result = { outline: '', foreshadowing: '', writingStyle: '' }

        const outlineMatch = text.match(/【故事大纲】\s*([\s\S]*?)(?=【伏笔设计】|$)/)
        const foreshadowMatch = text.match(/【伏笔设计】\s*([\s\S]*?)(?=【写法说明】|$)/)
        const writingStyleMatch = text.match(/【写法说明】\s*([\s\S]*?)$/)

        result.outline = outlineMatch ? outlineMatch[1].trim() : text
        result.foreshadowing = foreshadowMatch ? foreshadowMatch[1].trim() : ''
        result.writingStyle = writingStyleMatch ? writingStyleMatch[1].trim() : ''

        return result
    }

    async confirmOutline() {
        if (!this.currentNovelId) {
            this.showToast('请先生成大纲', 'error')
            return
        }

        const novel = await novelStore.getNovel(this.currentNovelId)
        if (!novel) {
            this.showToast('小说不存在', 'error')
            return
        }

        // Create chapter records
        for (let i = 0; i < novel.targetChapters; i++) {
            await novelStore.createChapter({
                novelId: novel.id,
                index: i,
                title: `第${i + 1}章`,
                status: 'pending',
                content: ''
            })
        }

        await novelStore.updateNovel(novel.id, {
            status: 'writing',
            currentChapter: 0
        })

        this.setCreateStep('step-writing')
        this.renderChapterList()
    }

    async startWriting() {
        if (this.isWriting) {
            this.showToast('正在写作中，请等待当前章节完成', 'error')
            return
        }

        if (!this.currentNovelId) {
            this.showToast('请先确认大纲', 'error')
            return
        }

        const novel = await novelStore.getNovel(this.currentNovelId)
        if (!novel) {
            this.showToast('小说不存在', 'error')
            return
        }

        this.isWriting = true
        this._abortWriting = false

        const chapters = await novelStore.getChaptersByNovelId(novel.id)

        for (let i = 0; i < chapters.length; i++) {
            if (this._abortWriting) break

            const chapter = chapters[i]
            if (chapter.status === 'completed') continue

            // Update status to generating
            await novelStore.updateChapter(chapter.id, { status: 'generating' })
            this.renderChapterList()
            this.updateWritingProgress(i, chapters.length)

            // Build prompt with FRESH session (no conversation history)
            const previousChapterSummary = await this.getPreviousChapterSummary(novel.id, i)
            const chapterTitle = `第${i + 1}章`

            const prompt = `你是一位小说家，正在创作小说《${novel.title}》。

【故事大纲】
${novel.outline}

【伏笔设计】
${novel.foreshadowing}

【写法说明】
${novel.writingStyle}

${previousChapterSummary}

请写第${i + 1}章，标题为：${chapterTitle}
要求：
1. 字数2000-6000字
2. 使用小说标准格式：章节标题用 {标题} 格式
3. 保持与前文风格一致
4. 自然推进剧情
5. 只输出正文内容，不要解释`

            const messages = [
                { role: 'system', content: '你是一位才华横溢的小说家，擅长创作引人入胜的故事。请严格按照格式要求输出。' },
                { role: 'user', content: prompt }
            ]

            try {
                const content = await this.callAIWithStreaming(messages, () => {})

                await novelStore.updateChapter(chapter.id, {
                    status: 'completed',
                    content: content,
                    wordCount: content.length
                })

                // Extract chapter title from content if present
                const titleMatch = content.match(/\{(.+?)\}/)
                if (titleMatch) {
                    await novelStore.updateChapter(chapter.id, { title: titleMatch[1] })
                }

                // Update novel stats
                const stats = await novelStore.getNovelStats(novel.id)
                await novelStore.updateNovel(novel.id, {
                    currentChapter: i + 1,
                    totalWords: stats.totalWords
                })

            } catch (e) {
                this.showToast(`第${i + 1}章生成失败：${e.message}`, 'error')
                await novelStore.updateChapter(chapter.id, { status: 'pending' })
                this.isWriting = false
                this.renderChapterList()
                return
            }

            this.renderChapterList()
            this.updateWritingProgress(i + 1, chapters.length)
        }

        this.isWriting = false

        // Check if all chapters completed
        const finalStats = await novelStore.getNovelStats(novel.id)
        if (finalStats.completedChapters >= novel.targetChapters) {
            await novelStore.updateNovel(novel.id, { status: 'completed' })
            this.showToast('🎉 小说创作完成！')
        }
    }

    async getPreviousChapterSummary(novelId, currentChapterIndex) {
        if (currentChapterIndex === 0) return ''

        const chapters = await novelStore.getChaptersByNovelId(novelId)
        const prevChapter = chapters[currentChapterIndex - 1]

        if (!prevChapter || prevChapter.status !== 'completed') return ''

        // Take last 500 characters as summary reference
        const content = prevChapter.content
        const summary = content.length > 500
            ? `...${content.slice(-500)}`
            : content

        return `【上一章内容摘要】
第${currentChapterIndex}章：${prevChapter.title}
${summary}`
    }

    renderChapterList() {
        const container = document.getElementById('chapter-list')
        if (!container || !this.currentNovelId) return

        novelStore.getChaptersByNovelId(this.currentNovelId).then(chapters => {
            container.innerHTML = chapters.slice(0, 20).map((ch, i) => {
                const statusClass = ch.status === 'completed' ? 'done'
                    : ch.status === 'generating' ? 'writing' : 'pending'
                const statusText = ch.status === 'completed' ? '完成'
                    : ch.status === 'generating' ? '写作中' : '待写'
                const wordCount = ch.status === 'completed' ? `${ch.wordCount}字` : ''

                return `
                    <div class="chapter-item" data-chapter-index="${i}" data-novel-id="${this.currentNovelId}">
                        <span class="chapter-index">${i + 1}</span>
                        <span class="chapter-title">${this.escapeHtml(ch.title)}</span>
                        <span class="chapter-status ${statusClass}">${statusText}</span>
                        <span class="chapter-words">${wordCount}</span>
                    </div>
                `
            }).join('') + (chapters.length > 20
                ? `<div style="text-align:center;color:var(--text-muted);padding:12px;font-size:13px;">共${chapters.length}章，显示前20章</div>`
                : '')

            container.querySelectorAll('.chapter-item').forEach(item => {
                item.addEventListener('click', () => {
                    const idx = parseInt(item.dataset.chapterIndex)
                    const nid = item.dataset.novelId
                    const ch = chapters[idx]
                    if (ch && ch.status === 'completed') {
                        this.openReader(nid, idx)
                    }
                })
            })
        })
    }

    updateWritingProgress(completed, total) {
        const progressFill = document.getElementById('progress-fill')
        const progressText = document.getElementById('progress-text')
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0

        if (progressFill) progressFill.style.width = `${pct}%`
        if (progressText) progressText.textContent = `${completed} / ${total} 章 (${pct}%)`
    }

    // ========== Reader Overlay ==========

    async openReader(novelId, chapterIndex) {
        const novel = await novelStore.getNovel(novelId)
        if (!novel) {
            this.showToast('小说不存在', 'error')
            return
        }

        const chapters = await novelStore.getChaptersByNovelId(novelId)
        const completedChapters = chapters.filter(c => c.status === 'completed')

        if (completedChapters.length === 0) {
            this.showToast('还没有已完成的章节', 'error')
            return
        }

        // If chapterIndex is -1, open at last read chapter or first completed
        let targetIndex = chapterIndex
        if (targetIndex < 0) {
            targetIndex = novel.currentChapter > 0
                ? Math.min(novel.currentChapter - 1, completedChapters.length - 1)
                : 0
            // Find the chapter index in the full chapters array
            const targetChapter = completedChapters[targetIndex]
            targetIndex = chapters.findIndex(c => c.id === targetChapter.id)
        }

        // Make sure the target chapter is completed
        if (chapters[targetIndex] && chapters[targetIndex].status !== 'completed') {
            // Fall back to first completed chapter
            targetIndex = chapters.findIndex(c => c.status === 'completed')
        }

        if (targetIndex < 0) targetIndex = 0

        this.readerState = {
            novelId,
            chapterIndex: targetIndex,
            chapters,
            novel
        }

        this.renderReader()

        const overlay = document.getElementById('reader-overlay')
        if (overlay) overlay.style.display = 'flex'
    }

    renderReader() {
        const { chapters, novel, chapterIndex } = this.readerState
        const chapter = chapters[chapterIndex]

        if (!chapter) return

        document.getElementById('reader-book-title').textContent = novel.title
        document.getElementById('reader-chapter-title').textContent = chapter.title

        const contentEl = document.getElementById('reader-content')
        contentEl.innerHTML = this.parseNovelFormat(chapter.content)

        // Update navigation
        const completedIndices = chapters
            .map((c, i) => c.status === 'completed' ? i : -1)
            .filter(i => i >= 0)

        const prevBtn = document.getElementById('prev-chapter-btn')
        const nextBtn = document.getElementById('next-chapter-btn')
        const indicator = document.getElementById('chapter-indicator')

        const currentPosInCompleted = completedIndices.indexOf(chapterIndex) + 1
        indicator.textContent = `${currentPosInCompleted} / ${completedIndices.length}`

        const prevCompletedIdx = this.findPrevCompleted(chapters, chapterIndex)
        const nextCompletedIdx = this.findNextCompleted(chapters, chapterIndex)

        prevBtn.disabled = prevCompletedIdx === null
        nextBtn.disabled = nextCompletedIdx === null

        // Scroll to top
        document.getElementById('reader-body')?.scrollTo(0, 0)
    }

    findPrevCompleted(chapters, currentIndex) {
        for (let i = currentIndex - 1; i >= 0; i--) {
            if (chapters[i] && chapters[i].status === 'completed') return i
        }
        return null
    }

    findNextCompleted(chapters, currentIndex) {
        for (let i = currentIndex + 1; i < chapters.length; i++) {
            if (chapters[i] && chapters[i].status === 'completed') return i
        }
        return null
    }

    closeReader() {
        const overlay = document.getElementById('reader-overlay')
        if (overlay) overlay.style.display = 'none'

        // Save last read position
        if (this.readerState.novelId && this.readerState.chapterIndex >= 0) {
            novelStore.updateNovel(this.readerState.novelId, {
                currentChapter: this.readerState.chapterIndex + 1
            })
        }

        this.readerState = { novelId: null, chapterIndex: 0, chapters: [], novel: null }
    }

    parseNovelFormat(text) {
        if (!text) return ''

        const lines = text.split('\n')
        const processedLines = lines.map(line => {
            const titleMatch = line.match(/^\s*\{(.+?)\}\s*$/)
            if (titleMatch) {
                return `<div class="chapter-title">${this.escapeHtml(titleMatch[1])}</div>`
            }

            const trimmed = line.trim()
            if (!trimmed) return ''

            const escapedLine = this.escapeHtml(trimmed)
            return `<p>${escapedLine}</p>`
        })

        return processedLines.filter(l => l !== '').join('\n')
    }

    // ========== Profile Page ==========

    loadApiSettingsUI() {
        const providerSelect = document.getElementById('provider-select')
        const apiKeyInput = document.getElementById('api-key')
        const customEndpointInput = document.getElementById('custom-endpoint')
        const customEndpointGroup = document.getElementById('custom-endpoint-group')
        const enableThinkingEl = document.getElementById('enable-thinking')
        const showThinkingEl = document.getElementById('show-thinking')

        if (providerSelect) providerSelect.value = this.state.provider
        if (apiKeyInput) apiKeyInput.value = stateManager.getApiKey()
        if (customEndpointInput) customEndpointInput.value = stateManager.getCustomEndpoint()
        if (customEndpointGroup) {
            customEndpointGroup.style.display = this.state.provider === 'custom' ? 'block' : 'none'
        }
        if (enableThinkingEl) enableThinkingEl.checked = this.state.enableThinking
        if (showThinkingEl) showThinkingEl.checked = this.state.showThinking

        this.updateModelOptions()
    }

    updateThinkingUI() {
        const enableThinkingEl = document.getElementById('enable-thinking')
        const showThinkingEl = document.getElementById('show-thinking')
        if (enableThinkingEl) enableThinkingEl.checked = this.state.enableThinking
        if (showThinkingEl) showThinkingEl.checked = this.state.showThinking
    }

    async saveApiSettings() {
        const apiKey = document.getElementById('api-key')?.value.trim()
        const customEndpoint = document.getElementById('custom-endpoint')?.value.trim()
        const provider = document.getElementById('provider-select')?.value
        const model = document.getElementById('model-select')?.value
        const enableThinking = document.getElementById('enable-thinking')?.checked
        const showThinking = document.getElementById('show-thinking')?.checked

        if (!apiKey) {
            this.showToast('请输入 API Key', 'error')
            return
        }

        if (provider === 'custom' && !customEndpoint) {
            this.showToast('自定义提供商需要设置端点', 'error')
            return
        }

        stateManager.setApiKey(apiKey, provider)
        stateManager.setCustomEndpoint(customEndpoint, provider)
        stateManager.set('provider', provider)
        stateManager.set('model', model)
        stateManager.set('enableThinking', enableThinking)
        stateManager.set('showThinking', showThinking)

        this.state = stateManager.getState()
        this.saveState()

        this.showToast('设置已保存')

        if (apiKey) {
            setTimeout(() => this.fetchModelsFromAPI(), 500)
        }
    }

    async renderStats() {
        const container = document.getElementById('stats-grid')
        if (!container) return

        const novels = await novelStore.getAllNovels()
        let totalNovels = novels.length
        let totalChapters = 0
        let totalWords = 0

        for (const novel of novels) {
            const stats = await novelStore.getNovelStats(novel.id)
            totalChapters += stats.completedChapters
            totalWords += stats.totalWords
        }

        container.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${totalNovels}</div>
                <div class="stat-label">小说数量</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${totalChapters}</div>
                <div class="stat-label">已完成章节</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${this.formatWordCount(totalWords)}</div>
                <div class="stat-label">总字数</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${this.state.provider || '-'}</div>
                <div class="stat-label">当前提供商</div>
            </div>
        `
    }

    // ========== API Call Methods ==========

    async callAIWithStreaming(messages, onChunk) {
        const providerConfig = AI_PROVIDERS[this.state.provider]

        if (providerConfig.type === 'anthropic') {
            return await this.callAnthropicStreaming(messages, providerConfig, onChunk)
        } else {
            return await this.callOpenAIStreaming(messages, providerConfig, onChunk)
        }
    }

    async callOpenAIStreaming(messages, providerConfig, onChunk) {
        const apiKey = stateManager.getApiKey()
        const customEndpoint = stateManager.getCustomEndpoint()
        const endpoint = this.state.provider === 'custom'
            ? customEndpoint
            : providerConfig.endpoint

        const requestBody = {
            model: this.state.model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 8000,
            stream: true
        }

        if (this.state.enableThinking) {
            requestBody.reasoning_effort = 'medium'
        }

        const response = await apiHandler.fetchWithTimeout(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        }, 120000)

        if (!response.ok) {
            throw new Error(`API请求失败：${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''
        let isInReasoning = false
        const showThinking = this.state.showThinking

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6)
                    if (data === '[DONE]') continue
                    try {
                        const parsed = JSON.parse(data)
                        const delta = parsed.choices?.[0]?.delta

                        if (delta) {
                            if (delta.reasoning_content || delta.reasoning) {
                                const reasoningContent = delta.reasoning_content || delta.reasoning
                                if (showThinking) {
                                    const wrappedContent = this.wrapThinkingContent(reasoningContent, isInReasoning)
                                    if (!isInReasoning) isInReasoning = true
                                    fullContent += reasoningContent
                                    onChunk(wrappedContent)
                                } else {
                                    fullContent += reasoningContent
                                }
                            }

                            if (delta.content) {
                                if (isInReasoning && showThinking) {
                                    onChunk(this.endThinkingContent())
                                    isInReasoning = false
                                }
                                fullContent += delta.content
                                onChunk(delta.content)
                            }
                        }
                    } catch (e) {
                        // Ignore parse errors in streaming
                    }
                }
            }
        }

        if (isInReasoning && showThinking) {
            onChunk(this.endThinkingContent())
        }

        return fullContent
    }

    async callAnthropicStreaming(messages, providerConfig, onChunk) {
        const apiKey = stateManager.getApiKey()
        const systemMessage = messages.find(m => m.role === 'system')
        const otherMessages = messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content
        }))

        const requestBody = {
            model: this.state.model,
            max_tokens: 8192,
            stream: true,
            system: systemMessage?.content || '',
            messages: otherMessages
        }

        if (this.state.enableThinking) {
            requestBody.thinking = {
                type: 'enabled',
                budget_tokens: 1024
            }
        }

        const response = await apiHandler.fetchWithTimeout(providerConfig.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify(requestBody)
        }, 120000)

        if (!response.ok) {
            throw new Error(`API请求失败：${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''
        let isInReasoning = false
        const showThinking = this.state.showThinking

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6)
                    if (data === '[DONE]') continue
                    try {
                        const parsed = JSON.parse(data)

                        if (parsed.type === 'thinking_delta') {
                            const thinkingContent = parsed.thinking_delta?.thinking
                            if (thinkingContent && showThinking) {
                                const wrappedContent = this.wrapThinkingContent(thinkingContent, isInReasoning)
                                if (!isInReasoning) isInReasoning = true
                                fullContent += thinkingContent
                                onChunk(wrappedContent)
                            } else if (thinkingContent) {
                                fullContent += thinkingContent
                            }
                        }

                        if (parsed.type === 'content_block_delta' || parsed.delta?.text) {
                            const content = parsed.delta?.text
                            if (content) {
                                if (isInReasoning && showThinking) {
                                    onChunk(this.endThinkingContent())
                                    isInReasoning = false
                                }
                                fullContent += content
                                onChunk(content)
                            }
                        }
                    } catch (e) {
                        // Ignore parse errors in streaming
                    }
                }
            }
        }

        if (isInReasoning && showThinking) {
            onChunk(this.endThinkingContent())
        }

        return fullContent
    }

    // ========== Thinking Mode ==========

    wrapThinkingContent(content, isInReasoning) {
        if (!isInReasoning) {
            return `<span class="thinking-content">💭 ${content}`
        }
        return content
    }

    endThinkingContent() {
        return `</span>\n`
    }

    // ========== Theme ==========

    applyTheme() {
        document.body.classList.toggle('dark-theme', this.state.theme === 'dark')
    }

    toggleTheme() {
        const currentTheme = stateManager.get('theme')
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
        stateManager.set('theme', newTheme)
        this.state.theme = newTheme
        this.applyTheme()
        this.saveState()
    }

    // ========== Model Management ==========

    updateModelOptions() {
        const select = document.getElementById('model-select')
        if (!select) return

        const provider = this.state.provider
        const cachedModels = this.state.cachedModels?.[provider]
        const models = cachedModels || []

        if (models.length === 0) {
            select.innerHTML = '<option value="">请先获取模型列表</option>'
            select.disabled = true
            return
        }

        select.disabled = false
        select.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('')

        if (models.includes(this.state.model)) {
            select.value = this.state.model
        } else {
            stateManager.set('model', models[0])
            this.state.model = models[0]
            select.value = models[0]
        }
    }

    async autoFetchModels() {
        if (!stateManager.getApiKey()) return

        const provider = this.state.provider
        const cachedModels = this.state.cachedModels?.[provider]

        if (!cachedModels || cachedModels.length === 0) {
            await this.fetchModelsFromAPI()
        }
    }

    async fetchModelsFromAPI() {
        const provider = stateManager.get('provider')
        const providerConfig = AI_PROVIDERS[provider]

        if (!providerConfig.modelsEndpoint) {
            this.showToast(`${providerConfig.name} 使用默认模型`, 'info')
            return
        }

        const apiKey = stateManager.getApiKey()
        if (!apiKey) {
            this.showToast('请先设置 API Key', 'error')
            return
        }

        try {
            const customEndpoint = stateManager.getCustomEndpoint()
            let modelsEndpoint = providerConfig.modelsEndpoint
            if (provider === 'custom' && customEndpoint) {
                const baseUrl = customEndpoint.replace(/\/chat\/completions$/, '')
                modelsEndpoint = `${baseUrl}/models`
            }

            const response = await apiHandler.callWithRetry(modelsEndpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }, 3)

            if (!response.ok) {
                throw new Error(`API请求失败：${response.status}`)
            }

            const data = await response.json()
            let apiModels = []

            if (data.data && Array.isArray(data.data)) {
                const chatKeywords = ['gpt', 'claude', 'deepseek', 'qwen', 'glm', 'moonshot', 'doubao', 'yi', 'chat', 'model', 'llama', 'mistral']
                apiModels = data.data
                    .map(m => m.id)
                    .filter(id => chatKeywords.some(kw => id.toLowerCase().includes(kw)))
                    .sort()
            }

            const defaultModels = providerConfig.models || []
            const combinedModels = [...new Set([...defaultModels, ...apiModels])].sort()

            if (combinedModels.length === 0) {
                this.showToast('未找到可用模型', 'error')
                return
            }

            const cachedModels = { ...this.state.cachedModels }
            cachedModels[provider] = combinedModels
            stateManager.set('cachedModels', cachedModels)
            this.state.cachedModels = cachedModels
            this.saveState()

            this.updateModelOptions()
            this.showToast(`成功更新模型列表！共 ${combinedModels.length} 个模型`)

        } catch (e) {
            console.error('获取模型列表失败:', e)
            if (providerConfig.models && providerConfig.models.length > 0) {
                const cachedModels = { ...this.state.cachedModels }
                if (!cachedModels[provider] || cachedModels[provider].length === 0) {
                    cachedModels[provider] = [...providerConfig.models]
                    stateManager.set('cachedModels', cachedModels)
                    this.state.cachedModels = cachedModels
                    this.saveState()
                    this.updateModelOptions()
                }
            }
            this.showToast(`获取模型失败：${e.message}`, 'error')
        }
    }

    // ========== Toast ==========

    showToast(message, type = 'success') {
        const existing = document.querySelector('.toast.show')
        if (existing) {
            existing.classList.remove('show')
            setTimeout(() => existing.remove(), 300)
        }

        const toast = document.createElement('div')
        toast.className = `toast ${type}`
        toast.textContent = message
        document.body.appendChild(toast)

        requestAnimationFrame(() => {
            toast.classList.add('show')
        })

        setTimeout(() => {
            toast.classList.remove('show')
            setTimeout(() => toast.remove(), 300)
        }, 2500)
    }

    // ========== Event Bindings ==========

    bindEvents() {
        // Bottom navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.switchPage(item.dataset.page)
            })
        })

        // Genre buttons
        document.querySelectorAll('.genre-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'))
                btn.classList.add('active')
                this.currentGenre = btn.dataset.genre
                this.currentTargetChapters = parseInt(btn.dataset.chapters)
            })
        })

        // Generate outline button
        document.getElementById('generate-outline-btn')?.addEventListener('click', () => {
            this.generateOutline()
        })

        // Regenerate outline button
        document.getElementById('regenerate-outline-btn')?.addEventListener('click', () => {
            this.generateOutline()
        })

        // Confirm outline button
        document.getElementById('confirm-outline-btn')?.addEventListener('click', () => {
            this.confirmOutline()
        })

        // Start writing button
        document.getElementById('start-writing-btn')?.addEventListener('click', () => {
            this.startWriting()
        })

        // Go to bookshelf button
        document.getElementById('go-to-bookshelf-btn')?.addEventListener('click', () => {
            this.switchPage('bookshelf')
        })

        // Reader back button
        document.getElementById('reader-back-btn')?.addEventListener('click', () => {
            this.closeReader()
        })

        // Reader prev/next chapter
        document.getElementById('prev-chapter-btn')?.addEventListener('click', () => {
            const { chapters, chapterIndex } = this.readerState
            const prevIdx = this.findPrevCompleted(chapters, chapterIndex)
            if (prevIdx !== null) {
                this.readerState.chapterIndex = prevIdx
                this.renderReader()
            }
        })

        document.getElementById('next-chapter-btn')?.addEventListener('click', () => {
            const { chapters, chapterIndex } = this.readerState
            const nextIdx = this.findNextCompleted(chapters, chapterIndex)
            if (nextIdx !== null) {
                this.readerState.chapterIndex = nextIdx
                this.renderReader()
            }
        })

        // Settings toggle (on create page header)
        document.getElementById('settings-toggle-btn')?.addEventListener('click', () => {
            this.switchPage('profile')
        })

        // Theme toggle
        document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
            this.toggleTheme()
        })

        // Provider select change
        document.getElementById('provider-select')?.addEventListener('change', (e) => {
            const newProvider = e.target.value
            stateManager.set('provider', newProvider)
            stateManager.set('model', '')
            this.state.provider = newProvider
            this.state.model = ''

            const newApiKey = stateManager.getApiKey(newProvider)
            const newEndpoint = stateManager.getCustomEndpoint(newProvider)
            document.getElementById('api-key').value = newApiKey
            document.getElementById('custom-endpoint').value = newEndpoint

            const customEndpointGroup = document.getElementById('custom-endpoint-group')
            if (customEndpointGroup) {
                customEndpointGroup.style.display = newProvider === 'custom' ? 'block' : 'none'
            }

            this.updateModelOptions()

            if (newApiKey) {
                setTimeout(() => this.fetchModelsFromAPI(), 500)
            }
        })

        // Model select change
        document.getElementById('model-select')?.addEventListener('change', (e) => {
            stateManager.set('model', e.target.value)
            this.state.model = e.target.value
        })

        // Refresh models button
        document.getElementById('refresh-models-btn')?.addEventListener('click', () => {
            this.fetchModelsFromAPI()
        })

        // Save settings button
        document.getElementById('save-settings-btn')?.addEventListener('click', () => {
            this.saveApiSettings()
        })

        // Thinking toggles
        const bindThinkingToggle = (id, stateKey) => {
            document.getElementById(id)?.addEventListener('change', (e) => {
                stateManager.set(stateKey, e.target.checked)
                this.state[stateKey] = e.target.checked
                this.updateThinkingUI()
                this.saveState()
            })
        }

        bindThinkingToggle('enable-thinking', 'enableThinking')
        bindThinkingToggle('show-thinking', 'showThinking')

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const overlay = document.getElementById('reader-overlay')
                if (overlay && overlay.style.display !== 'none') {
                    this.closeReader()
                }
            }
        })
    }

    // ========== Utility Methods ==========

    escapeHtml(text) {
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }

    hashString(str) {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash |= 0
        }
        return hash
    }

    formatWordCount(count) {
        if (count >= 10000) {
            return (count / 10000).toFixed(1) + '万'
        }
        return count.toLocaleString()
    }
}

const app = new InkverseApp()
window.app = app
