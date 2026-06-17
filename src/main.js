import './styles.css'
import apiHandler from './utils/api-handler.js'
import stateManager, { AI_PROVIDERS } from './core/state-manager.js'
import TemplateManager, { CREATIVE_TEMPLATES, WRITING_STYLES, OUTPUT_LENGTHS } from './modules/template-manager.js'
import HistoryManager from './modules/history-manager.js'
import { validatePromptInput, validateApiKey, validateCustomEndpoint } from './utils/validators.js'
import { formatDate, truncateText } from './utils/formatters.js'

class InkverseApp {
    constructor() {
        this.state = stateManager.getState();
        this.templateManager = new TemplateManager(stateManager);
        this.historyManager = new HistoryManager(stateManager);
        this._historyCurrentPage = 0;
        this._lastHistorySearchQuery = '';
        this._initialized = false;
        this._autoSaveInterval = null;

        this.initApp();
    }

    async initApp() {
        await this.loadState();
        this.state = stateManager.getState();
        this.initUI();
        this.bindEvents();
        this.autoSaveDraft();
        this.autoFetchModels();
        this._initialized = true;
    }

    async loadState() {
        await stateManager.load();
        this.state = stateManager.getState();
    }

    saveState() {
        stateManager.save();
    }

    initUI() {
        this.renderCategories();
        this.renderTemplates();
        this.renderStyles();
        this.renderLengths();
        this.renderHistory();
        this.updateModelOptions();
        this.applyTheme();
        
        // 初始化思考模式相关UI状态
        this.updateThinkingUI();
    }
    
    updateThinkingUI() {
        // 更新设置面板的复选框
        const enableThinkingEl = document.getElementById('enable-thinking');
        const showThinkingEl = document.getElementById('show-thinking');
        const enableThinkingToggle = document.getElementById('enable-thinking-toggle');
        const showThinkingToggle = document.getElementById('show-thinking-toggle');
        
        if (enableThinkingEl) enableThinkingEl.checked = this.state.enableThinking;
        if (showThinkingEl) showThinkingEl.checked = this.state.showThinking;
        if (enableThinkingToggle) enableThinkingToggle.checked = this.state.enableThinking;
        if (showThinkingToggle) showThinkingToggle.checked = this.state.showThinking;
    }

    applyTheme() {
        document.body.classList.toggle('light-theme', this.state.theme === 'dark' ? false : this.state.theme === 'light');
    }

    toggleTheme() {
        const currentTheme = stateManager.get('theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        stateManager.set('theme', newTheme);
        this.applyTheme();
        this.saveState();
    }

    renderCategories() {
        const container = document.getElementById('categories');
        if (!container) return;

        const categories = this.templateManager.getCategories();
        container.innerHTML = categories.map(cat => `
            <button class="category-btn ${cat.key === this.state.currentCategory ? 'active' : ''}" data-category="${cat.key}">
                <span class="category-emoji">${cat.emoji}</span>
                <span>${cat.name}</span>
            </button>
        `).join('');

        container.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                stateManager.set('currentCategory', btn.dataset.category);
                this.state.currentCategory = btn.dataset.category;
                this.renderCategories();
                this.renderTemplates();
            });
        });
    }

    renderTemplates() {
        const container = document.getElementById('templates');
        if (!container) return;

        const templates = this.templateManager.filterTemplates(
            this.state.currentCategory,
            this.state.templateSearchQuery
        );
        
        if (templates.length === 0) {
            container.innerHTML = '<div class="empty-state">没有找到匹配的模板</div>';
            return;
        }

        container.innerHTML = templates.map(t => `
            <div class="template-card ${this.state.currentTemplate?.id === t.id ? 'selected' : ''}" data-id="${t.id}">
                <div class="template-header">
                    <h4>${t.name}</h4>
                    <button class="favorite-btn" data-fav-id="${t.id}" title="收藏">
                        ${this.templateManager.isFavorite(t.id) ? '⭐' : '☆'}
                    </button>
                </div>
                <p class="template-hint">示例：${t.example}</p>
            </div>
        `).join('');

        // 事件委托：模板卡片点击和收藏按钮
        container.onclick = (e) => {
            const favoriteBtn = e.target.closest('.favorite-btn');
            if (favoriteBtn) {
                e.stopPropagation();
                const isFavorited = this.templateManager.toggleFavorite(favoriteBtn.dataset.favId);
                this.showToast(isFavorited ? '已收藏' : '已取消收藏');
                this.renderTemplates();
                return;
            }

            const templateCard = e.target.closest('.template-card');
            if (templateCard) {
                const template = this.templateManager.findTemplateById(templateCard.dataset.id);
                if (template) {
                    this.selectTemplate(template);
                }
            }
        };
    }

    selectTemplate(template) {
        stateManager.set('currentTemplate', template);
        this.state.currentTemplate = template;
        document.getElementById('prompt-input').value = `\n\n<!-- 在这里输入你的主题/内容 -->`;
        
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.id === template.id);
        });
        
        this.showToast(`已选择：${template.name}`);
    }

    renderStyles() {
        const container = document.getElementById('style-select');
        if (!container) return;

        const styles = this.templateManager.getWritingStyles();
        container.innerHTML = Object.entries(styles).map(([key, style]) => `
            <button class="style-chip ${key === this.state.style ? 'active' : ''}" data-style="${key}">
                ${style.name}
            </button>
        `).join('');

        container.querySelectorAll('.style-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                stateManager.set('style', chip.dataset.style);
                this.state.style = chip.dataset.style;
                this.renderStyles();
            });
        });
    }

    renderLengths() {
        const container = document.getElementById('length-select');
        if (!container) return;

        const lengths = this.templateManager.getOutputLengths();
        container.innerHTML = Object.entries(lengths).map(([key, len]) => `
            <button class="length-chip ${key === this.state.length ? 'active' : ''}" data-length="${key}">
                ${len.name}
            </button>
        `).join('');

        container.querySelectorAll('.length-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                stateManager.set('length', chip.dataset.length);
                this.state.length = chip.dataset.length;
                this.renderLengths();
            });
        });
    }

    renderHistory() {
        const container = document.getElementById('history');
        if (!container) return;

        let filteredHistory = this.historyManager.searchHistory(this.state.searchQuery);

        if (filteredHistory.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无创作记录</div>';
            return;
        }

        // 重置虚拟滚动索引（当搜索查询改变时）
        if (this.state.searchQuery !== this._lastHistorySearchQuery) {
            this.historyManager.resetVirtualScroll();
            this._historyCurrentPage = 0;
            this._lastHistorySearchQuery = this.state.searchQuery;
        }

        // 使用虚拟滚动获取当前页数据
        const pageData = this.historyManager.getVirtualScrollPage(this._historyCurrentPage || 0, 20);
        const { items, hasMore, total } = pageData;

        if (items.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无创作记录</div>';
            return;
        }

        container.innerHTML = items.map((item, index) => `
            <div class="history-item" data-index="${index}" data-actual-index="${this.state.history.length - 1 - (this._historyCurrentPage * 20 + index)}">
                <div class="history-header">
                    <span class="history-title">${item.templateName || '创作'} · ${formatDate(item.timestamp)}</span>
                    <button class="delete-history-btn" data-delete-index="${this._historyCurrentPage * 20 + index}" title="删除">🗑️</button>
                </div>
                <div class="history-preview">${truncateText(item.prompt, 80)}...</div>
                <div class="history-actions">
                    <button class="history-action-btn" data-action="copy" data-action-index="${this._historyCurrentPage * 20 + index}">📋 复制</button>
                    <button class="history-action-btn" data-action="share" data-action-index="${this._historyCurrentPage * 20 + index}">🔗 分享</button>
                    <button class="history-action-btn" data-action="regenerate" data-action-index="${this._historyCurrentPage * 20 + index}">🔄 重新生成</button>
                </div>
            </div>
        `).join('');

        // 添加加载更多按钮
        if (hasMore) {
            container.innerHTML += `
                <button class="load-more-btn" id="load-more-history">
                    加载更多 (${total - (this._historyCurrentPage + 1) * 20} 条剩余)
                </button>
            `;
        }

        // 事件委托：处理所有历史记录操作
        container.onclick = (e) => {
            const deleteBtn = e.target.closest('.delete-history-btn');
            if (deleteBtn) {
                e.stopPropagation();
                const actualIndex = parseInt(deleteBtn.dataset.deleteIndex);
                this.historyManager.deleteHistoryItem(actualIndex);
                this.state.history = this.historyManager.getHistory();
                this.renderHistory();
                this.showToast('已删除');
                return;
            }

            const actionBtn = e.target.closest('.history-action-btn');
            if (actionBtn) {
                e.stopPropagation();
                const action = actionBtn.dataset.action;
                const actualIndex = parseInt(actionBtn.dataset.actionIndex);
                const historyItem = this.state.history[actualIndex];

                if (action === 'copy') {
                    navigator.clipboard.writeText(historyItem.result);
                    this.showToast('已复制到剪贴板！');
                } else if (action === 'share') {
                    this.shareResult(historyItem.result);
                } else if (action === 'regenerate') {
                    document.getElementById('prompt-input').value = historyItem.prompt;
                    this.generate();
                }
                return;
            }

            const loadMoreBtn = e.target.closest('.load-more-btn');
            if (loadMoreBtn) {
                this._historyCurrentPage++;
                this.renderHistory();
                return;
            }

            const historyItem = e.target.closest('.history-item');
            if (historyItem && !e.target.closest('.history-action-btn') && !e.target.closest('.delete-history-btn')) {
                const actualIndex = parseInt(historyItem.dataset.actualIndex);
                const item = this.state.history[actualIndex];
                if (item) {
                    this.displayResult(item.result, '历史作品');
                }
            }
        };
    }

    switchMode(mode) {
        stateManager.set('currentMode', mode);
        this.state.currentMode = mode;
        
        const createPanel = document.getElementById('create-panel');
        const chatPanel = document.getElementById('chat-panel');
        const modeCreateBtn = document.getElementById('mode-create');
        const modeChatBtn = document.getElementById('mode-chat');
        
        if (mode === 'create') {
            createPanel.style.display = 'block';
            chatPanel.style.display = 'none';
            modeCreateBtn?.classList.add('active');
            modeChatBtn?.classList.remove('active');
        } else {
            createPanel.style.display = 'none';
            chatPanel.style.display = 'flex';
            modeChatBtn?.classList.add('active');
            modeCreateBtn?.classList.remove('active');
            this.renderChatHistory();
        }
        
        this.saveState();
    }

    renderChatHistory() {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        
        if (this.state.chatHistory.length === 0) {
            container.innerHTML = `
                <div class="chat-welcome">
                    <div class="chat-avatar">墨</div>
                    <div class="chat-message bot">
                        你好！我是墨韵AI写作助手。我可以帮你创作小说、诗歌、文章，或者陪你讨论写作话题。有什么我可以帮你的吗？
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.state.chatHistory.map(msg => `
            <div class="chat-message-item ${msg.role}">
                ${msg.role === 'user' ? '<div class="chat-avatar">👤</div>' : '<div class="chat-avatar">墨</div>'}
                <div class="chat-message ${msg.role === 'user' ? 'user' : 'bot'}">${msg.content}</div>
            </div>
        `).join('');
        
        container.scrollTop = container.scrollHeight;
    }

    async sendChatMessage() {
        const input = document.getElementById('chat-input');
        if (!input) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        if (!this.state.apiKey) {
            this.showToast('请先设置API Key！', 'error');
            this.toggleSettings();
            return;
        }
        
        if (!this.state.model) {
            this.showToast('请先选择或获取模型！', 'error');
            this.toggleSettings();
            return;
        }
        
        const chatHistory = [...this.state.chatHistory];
        chatHistory.push({ role: 'user', content: message });
        stateManager.set('chatHistory', chatHistory);
        this.state.chatHistory = chatHistory;
        
        input.value = '';
        input.style.height = 'auto';
        this.renderChatHistory();
        
        const container = document.getElementById('chat-messages');
        container.innerHTML += `
            <div class="chat-message-item bot" id="typing-indicator">
                <div class="chat-avatar">墨</div>
                <div class="chat-message bot">正在思考...</div>
            </div>
        `;
        container.scrollTop = container.scrollHeight;
        
        try {
            const response = await this.callChatAPI(message);
            
            document.getElementById('typing-indicator')?.remove();
            
            const updatedHistory = [...this.state.chatHistory];
            updatedHistory.push({ role: 'assistant', content: response });
            stateManager.set('chatHistory', updatedHistory);
            this.state.chatHistory = updatedHistory;
            this.saveState();
            this.renderChatHistory();
            
        } catch (e) {
            document.getElementById('typing-indicator')?.remove();
            this.showToast(`发送失败：${e.message}`, 'error');
            const failedHistory = [...this.state.chatHistory];
            failedHistory.pop();
            stateManager.set('chatHistory', failedHistory);
            this.state.chatHistory = failedHistory;
            this.renderChatHistory();
        }
    }

    async callChatAPI(userMessage) {
        const messages = [
            { role: 'system', content: '你是一位才华横溢的文学创作助手，精通各种文体创作。请用优美的中文进行回复。如果用户询问写作相关问题，提供专业建议；如果是闲聊，保持友好亲切。' },
            ...this.state.chatHistory.slice(-10).map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
            })),
            { role: 'user', content: userMessage }
        ];
        
        return await this.makeAPICall(messages);
    }

    autoSaveDraft() {
        if (this._autoSaveInterval) {
            clearInterval(this._autoSaveInterval);
        }
        this._autoSaveInterval = setInterval(() => {
            this.saveDraft();
        }, 5000);
    }

    saveDraft() {
        const promptInput = document.getElementById('prompt-input');
        if (!promptInput) return;
        
        const content = promptInput.value.trim();
        if (content && content.length > 10) {
            stateManager.set('draft', {
                content: content,
                template: this.state.currentTemplate?.id || null,
                timestamp: Date.now()
            });
            this.state.draft = stateManager.get('draft');
            this.saveState();
        }
    }

    loadDraft() {
        const draft = stateManager.get('draft');
        if (draft && draft.content) {
            const promptInput = document.getElementById('prompt-input');
            if (promptInput) {
                promptInput.value = draft.content;
            }
            
            if (draft.template) {
                const template = this.templateManager.findTemplateById(draft.template);
                if (template) {
                    this.selectTemplate(template);
                }
            }
        }
    }

    async autoFetchModels() {
        if (!this.state.apiKey) return;
        
        const provider = this.state.provider;
        const cachedModels = this.state.cachedModels[provider];
        
        if (!cachedModels || cachedModels.length === 0) {
            await this.fetchModelsFromAPI();
        }
    }

    async fetchModelsFromAPI() {
        const provider = stateManager.get('provider');
        const providerConfig = AI_PROVIDERS[provider];
        const infoEl = document.getElementById('model-update-info');
        
        if (!providerConfig.modelsEndpoint) {
            infoEl.textContent = `${providerConfig.name} 已提供默认模型`;
            this.showToast(`${providerConfig.name} 使用默认模型`, 'info');
            return;
        }
        
        if (!this.state.apiKey) {
            infoEl.textContent = '请先设置 API Key';
            this.showToast('请先设置 API Key', 'error');
            return;
        }
        
        try {
            infoEl.textContent = '正在获取模型列表...';
            const apiKey = stateManager.getApiKey();
            const customEndpoint = stateManager.getCustomEndpoint();
            
            let modelsEndpoint = providerConfig.modelsEndpoint;
            if (provider === 'custom' && customEndpoint) {
                const baseUrl = customEndpoint.replace(/\/chat\/completions$/, '');
                modelsEndpoint = `${baseUrl}/models`;
            }
            
            const response = await apiHandler.callWithRetry(modelsEndpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }, 3);
            
            if (!response.ok) {
                throw new Error(`API请求失败：${response.status}`);
            }
            
            const data = await response.json();
            let apiModels = [];
            
            if (data.data && Array.isArray(data.data)) {
                apiModels = data.data
                    .map(m => m.id)
                    .filter(id => {
                        const chatKeywords = ['gpt', 'claude', 'deepseek', 'qwen', 'glm', 'moonshot', 'doubao', 'yi', 'chat', 'model', 'llama', 'mistral', 'yi-', 'glm-', 'qwen-'];
                        return chatKeywords.some(keyword => id.toLowerCase().includes(keyword));
                    })
                    .sort();
            }
            
            const defaultModels = providerConfig.models || [];
            const combinedModels = [...new Set([...defaultModels, ...apiModels])].sort();
            
            if (combinedModels.length === 0) {
                infoEl.textContent = '未找到可用模型，请手动添加';
                this.showToast('未找到可用模型，请手动添加', 'error');
                return;
            }
            
            const cachedModels = { ...this.state.cachedModels };
            cachedModels[provider] = combinedModels;
            stateManager.set('cachedModels', cachedModels);
            this.state.cachedModels = cachedModels;
            this.saveState();
            
            this.updateModelOptions();
            this.renderCurrentModelsList();
            infoEl.textContent = `成功获取 ${apiModels.length} 个模型，共 ${combinedModels.length} 个可用`;
            this.showToast(`成功更新模型列表！共 ${combinedModels.length} 个模型`, 'success');
            
        } catch (e) {
            console.error('获取模型列表失败:', e);
            if (providerConfig.models && providerConfig.models.length > 0) {
                const cachedModels = { ...this.state.cachedModels };
                if (!cachedModels[provider] || cachedModels[provider].length === 0) {
                    cachedModels[provider] = [...providerConfig.models];
                    stateManager.set('cachedModels', cachedModels);
                    this.state.cachedModels = cachedModels;
                    this.saveState();
                    this.updateModelOptions();
                    this.renderCurrentModelsList();
                }
                infoEl.textContent = `使用默认模型 (${e.message})`;
                this.showToast(`使用默认模型，您也可以手动添加`, 'info');
            } else {
                infoEl.textContent = `获取失败：${e.message}`;
                this.showToast(`获取失败：${e.message}`, 'error');
            }
        }
    }
    
    renderCurrentModelsList() {
        const listEl = document.getElementById('current-models-list');
        if (!listEl) return;
        
        const provider = this.state.provider;
        const cachedModels = this.state.cachedModels[provider];
        const models = cachedModels || [];
        
        if (models.length === 0) {
            listEl.innerHTML = '<div style="color: var(--ink-wash);">暂无模型，请点击"获取模型列表"按钮</div>';
            return;
        }
        
        listEl.innerHTML = models.map((model, index) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span>${model}</span>
                <button data-remove-model="${index}" style="background: none; border: none; color: #ff6b6b; cursor: pointer; font-size: 12px;">删除</button>
            </div>
        `).join('');
        
        listEl.querySelectorAll('[data-remove-model]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.removeModel);
                this.removeModel(index);
            });
        });
    }
    
    addManualModel() {
        const input = document.getElementById('manual-model-input');
        const modelName = input.value.trim();
        
        if (!modelName) {
            this.showToast('请输入模型名称', 'error');
            return;
        }
        
        const provider = this.state.provider;
        const cachedModels = { ...this.state.cachedModels };
        let models = cachedModels[provider] || [];
        
        if (models.includes(modelName)) {
            this.showToast('该模型已存在', 'error');
            return;
        }
        
        models.push(modelName);
        models.sort();
        
        cachedModels[provider] = models;
        stateManager.set('cachedModels', cachedModels);
        this.state.cachedModels = cachedModels;
        this.saveState();
        
        this.updateModelOptions();
        this.renderCurrentModelsList();
        input.value = '';
        this.showToast('模型添加成功');
    }
    
    removeModel(index) {
        const provider = this.state.provider;
        const cachedModels = { ...this.state.cachedModels };
        let models = cachedModels[provider] || [];
        
        if (index < 0 || index >= models.length) return;
        
        const removedModel = models[index];
        models.splice(index, 1);
        
        cachedModels[provider] = models;
        stateManager.set('cachedModels', cachedModels);
        this.state.cachedModels = cachedModels;
        this.saveState();
        
        this.updateModelOptions();
        this.renderCurrentModelsList();
        this.showToast(`已删除模型: ${removedModel}`);
    }

    shareResult(result) {
        if (navigator.share) {
            navigator.share({
                title: '墨韵AI创作',
                text: result
            }).catch(err => {
                console.log('分享失败:', err);
            });
        } else {
            navigator.clipboard.writeText(result);
            this.showToast('已复制到剪贴板，可以粘贴分享！');
        }
    }

    updateModelOptions() {
        const select = document.getElementById('model-select');
        if (!select) return;
        
        const provider = this.state.provider;
        const cachedModels = this.state.cachedModels[provider];
        const models = cachedModels || [];
        
        if (models.length === 0) {
            select.innerHTML = '<option value="">请先获取模型列表</option>';
            select.disabled = true;
            return;
        }
        
        select.disabled = false;
        select.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('');
        
        if (models.includes(this.state.model)) {
            select.value = this.state.model;
        } else {
            stateManager.set('model', models[0]);
            this.state.model = models[0];
            select.value = this.state.model;
        }
    }

    bindEvents() {
        document.getElementById('generate-btn')?.addEventListener('click', () => this.generate());
        document.getElementById('continue-btn')?.addEventListener('click', () => this.continueGeneration());
        document.getElementById('settings-btn')?.addEventListener('click', () => this.toggleSettings());
        document.getElementById('save-settings-btn')?.addEventListener('click', () => this.saveApiSettings());
        document.getElementById('close-settings')?.addEventListener('click', () => this.toggleSettings());
        document.getElementById('manage-templates-btn')?.addEventListener('click', () => this.toggleTemplatesPanel());
        document.getElementById('close-templates')?.addEventListener('click', () => this.toggleTemplatesPanel());
        document.getElementById('add-template-btn')?.addEventListener('click', () => this.addCustomTemplate());
        
        document.getElementById('provider-select')?.addEventListener('change', (e) => {
            const newProvider = e.target.value;
            stateManager.set('provider', newProvider);
            stateManager.set('model', '');
            this.state.provider = newProvider;
            this.state.model = '';
            
            // 加载新provider的API密钥和端点
            const newApiKey = stateManager.getApiKey(newProvider);
            const newEndpoint = stateManager.getCustomEndpoint(newProvider);
            document.getElementById('api-key').value = newApiKey;
            document.getElementById('custom-endpoint').value = newEndpoint;
            
            this.updateModelOptions();
            this.renderCurrentModelsList();
            
            if (newApiKey) {
                setTimeout(() => {
                    this.fetchModelsFromAPI();
                }, 500);
            }
        });
        
        document.getElementById('model-select')?.addEventListener('change', (e) => {
            stateManager.set('model', e.target.value);
            this.state.model = e.target.value;
        });
        
        document.getElementById('creativity-slider')?.addEventListener('input', (e) => {
            stateManager.set('creativity', parseFloat(e.target.value));
            this.state.creativity = parseFloat(e.target.value);
            document.getElementById('creativity-value').textContent = this.state.creativity.toFixed(1);
        });
        
        document.getElementById('search-input')?.addEventListener('input', (e) => {
            stateManager.set('searchQuery', e.target.value);
            this.state.searchQuery = e.target.value;
            this.renderHistory();
        });
        
        document.getElementById('templates-search')?.addEventListener('input', (e) => {
            stateManager.set('templateSearchQuery', e.target.value);
            this.state.templateSearchQuery = e.target.value;
            this.renderTemplates();
        });

        document.getElementById('batch-export-btn')?.addEventListener('click', () => {
            this.batchExportHistory();
        });

        document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        document.getElementById('mode-create')?.addEventListener('click', () => {
            this.switchMode('create');
        });

        document.getElementById('mode-chat')?.addEventListener('click', () => {
            this.switchMode('chat');
        });

        document.getElementById('chat-send-btn')?.addEventListener('click', () => {
            this.sendChatMessage();
        });

        const chatInput = document.getElementById('chat-input');
        chatInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendChatMessage();
            }
        });

        chatInput?.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
        });

        const promptInput = document.getElementById('prompt-input');
        // 移除之前的监听器（如果存在）以避免重复绑定
        promptInput?.removeEventListener('input', this._promptInputHandler);
        // 使用箭头函数保持this引用
        this._promptInputHandler = (e) => {
            // 保存光标位置
            const start = promptInput.selectionStart;
            const end = promptInput.selectionEnd;
            
            this.saveDraft();
            
            // 恢复光标位置
            requestAnimationFrame(() => {
                promptInput.setSelectionRange(start, end);
            });
        };
        promptInput?.addEventListener('input', this._promptInputHandler);

        document.getElementById('refresh-models-btn')?.addEventListener('click', () => {
            this.fetchModelsFromAPI();
        });

        document.getElementById('auto-fetch-models-btn')?.addEventListener('click', () => {
            this.fetchModelsFromAPI();
        });

        document.getElementById('add-manual-model-btn')?.addEventListener('click', () => {
            this.addManualModel();
        });

        document.getElementById('manual-model-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.addManualModel();
            }
        });
        
        // 思考模式相关事件绑定
        const bindThinkingToggle = (id, stateKey) => {
            document.getElementById(id)?.addEventListener('change', (e) => {
                stateManager.set(stateKey, e.target.checked);
                this.state[stateKey] = e.target.checked;
                this.updateThinkingUI();
                this.saveState();
            });
        };
        
        bindThinkingToggle('enable-thinking', 'enableThinking');
        bindThinkingToggle('show-thinking', 'showThinking');
        bindThinkingToggle('enable-thinking-toggle', 'enableThinking');
        bindThinkingToggle('show-thinking-toggle', 'showThinking');

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (!this.state.isGenerating) {
                    this.generate();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (this.state.currentResult) {
                    this.saveResult('txt');
                }
            }
            if (e.key === 'Escape') {
                const settingsPanel = document.getElementById('settings-panel');
                const templatesPanel = document.getElementById('templates-panel');
                if (settingsPanel?.classList.contains('open')) {
                    this.toggleSettings();
                } else if (templatesPanel?.classList.contains('open')) {
                    this.toggleTemplatesPanel();
                }
            }
        });
    }

    async generate() {
        const input = document.getElementById('prompt-input').value.trim();
        
        const validation = validatePromptInput(input);
        if (!validation.valid) {
            this.showToast(validation.message, 'error');
            return;
        }
        
        if (!this.state.apiKey) {
            this.showToast('请先设置API Key！', 'error');
            this.toggleSettings();
            return;
        }

        if (!this.state.model) {
            this.showToast('请先选择或获取模型！', 'error');
            this.toggleSettings();
            return;
        }

        stateManager.set('isGenerating', true);
        this.state.isGenerating = true;
        
        const btn = document.getElementById('generate-btn');
        const loadingIndicator = document.getElementById('loading-indicator');
        if (btn) btn.disabled = true;
        if (loadingIndicator) loadingIndicator.style.display = 'flex';

        this.displayStreamingResult('正在创作中...');

        try {
            const result = await this.callAIWithStreaming(input, (chunk) => {
                this.updateStreamingResult(chunk);
            });
            
            stateManager.set('currentResult', result);
            this.state.currentResult = result;
            
            this.historyManager.addHistoryItem(
                input,
                result,
                this.state.currentTemplate?.name
            );
            this.state.history = this.historyManager.getHistory();
            this.state.stats = this.historyManager.getStats();
            
            this.saveState();
            this.renderHistory();
            
            this.displayResult(result, 'AI创作结果');
            
            this.showToast(`生成成功！✨ 总创作: ${this.state.stats.totalCreations}次`);
        } catch (e) {
            this.showToast(`生成失败：${e.message}`, 'error');
            document.getElementById('result').innerHTML = '';
        } finally {
            stateManager.set('isGenerating', false);
            this.state.isGenerating = false;
            if (btn) btn.disabled = false;
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }

    displayStreamingResult(initialText) {
        document.getElementById('result').innerHTML = `
            <div class="result-title">✨ 正在创作中...</div>
            <div class="streaming-content" id="streaming-content">
                <span class="streaming-text" id="streaming-text"></span><span class="streaming-cursor">▌</span>
            </div>
            <style>
                .streaming-content {
                    padding: 16px; background: var(--charcoal); border: 1px solid var(--gold-dim);
                    border-radius: 12px; font-family: var(--font-body); font-size: 15px;
                    line-height: 1.9; white-space: pre-wrap; color: var(--rice-white);
                    min-height: 100px;
                }
                .streaming-cursor {
                    display: inline-block;
                    color: var(--gold);
                    animation: cursor-blink 0.8s infinite;
                }
                @keyframes cursor-blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
            </style>
        `;
        if (initialText) {
            document.getElementById('streaming-text').textContent = initialText;
        }
    }

    updateStreamingResult(chunk) {
        const textEl = document.getElementById('streaming-text');
        const cursorEl = document.querySelector('.streaming-cursor');
        if (textEl && cursorEl) {
            textEl.textContent += chunk;
            const contentEl = document.getElementById('streaming-content');
            contentEl.scrollTop = contentEl.scrollHeight;
        }
    }

    displayResult(result, title) {
        document.getElementById('result').innerHTML = `
            <div class="result-title">✨ ${title}</div>
            <div class="result-content">${result}</div>
            <div class="result-actions">
                <button class="result-action-btn" id="copy-btn">📋 复制</button>
                <button class="result-action-btn" id="save-txt-btn">💾 保存为TXT</button>
                <button class="result-action-btn" id="save-md-btn">📝 保存为Markdown</button>
                <button class="result-action-btn" id="share-btn">🔗 分享</button>
            </div>
        `;
        
        document.getElementById('copy-btn')?.addEventListener('click', () => this.copyResult());
        document.getElementById('save-txt-btn')?.addEventListener('click', () => this.saveResult('txt'));
        document.getElementById('save-md-btn')?.addEventListener('click', () => this.saveResult('md'));
        document.getElementById('share-btn')?.addEventListener('click', () => this.shareResult(result));
    }

    async continueGeneration() {
        if (!this.state.currentResult) {
            this.showToast('没有可延续的内容', 'error');
            return;
        }

        stateManager.set('isGenerating', true);
        this.state.isGenerating = true;

        const btn = document.getElementById('continue-btn');
        if (btn) btn.disabled = true;

        try {
            // 将原文本发送给AI，让AI在已生成文本的基础上续写
            const continuationPrompt = `请续写以下文本，保持相同的风格、语调和叙事连续性。只输出续写内容，不要重复已写部分。\n\n=== 原文 ===\n${this.state.currentResult}\n=== 续写开始 ===`;
            const continuation = await this.callAIWithStreaming(continuationPrompt, (chunk) => {
                this.updateStreamingResult(chunk);
            });
            const newResult = this.state.currentResult + '\n\n' + continuation;

            stateManager.set('currentResult', newResult);
            this.state.currentResult = newResult;

            // 更新对话历史，用于后续可能的多次续写
            const conversationHistory = this.state.conversationHistory || [];
            conversationHistory.push({ role: 'user', content: continuationPrompt });
            conversationHistory.push({ role: 'assistant', content: continuation });
            stateManager.set('conversationHistory', conversationHistory);
            this.state.conversationHistory = conversationHistory;

            this.displayResult(newResult, 'AI创作结果（已续写）');

            this.showToast('续写成功！');
        } catch (e) {
            this.showToast(`续写失败：${e.message}`, 'error');
        } finally {
            stateManager.set('isGenerating', false);
            this.state.isGenerating = false;
            if (btn) btn.disabled = false;
        }
    }

    async callAI(userPrompt) {
        const style = WRITING_STYLES[this.state.style].prompt;
        const length = OUTPUT_LENGTHS[this.state.length];
        
        let prompt = '';
        if (this.state.currentTemplate) {
            prompt = this.templateManager.applyTemplate(this.state.currentTemplate, userPrompt);
        } else {
            prompt = userPrompt;
        }
        
        let genreHint = '';
        if (this.state.currentTemplate && this.state.currentTemplate.id) {
            const template = this.state.currentTemplate;
            const templateName = template.name || '';
            const categoryName = this.templateManager.getTemplateCategoryName(template);
            genreHint = `\n\n【创作题材】：${categoryName} - ${templateName}`;
        }
        
        const fullPrompt = `${style}${genreHint}\n\n请生成 ${length.min}-${length.max} 字的内容。\n\n${prompt}`;
        
        const messages = [
            { role: 'system', content: '你是一位才华横溢的文学创作助手，精通各种文体。请用优美的中文进行创作。' },
            { role: 'user', content: fullPrompt }
        ];
        
        stateManager.set('conversationHistory', [...messages]);
        this.state.conversationHistory = messages;
        return await this.makeAPICall(messages);
    }

    async callAIWithStreaming(userPrompt, onChunk) {
        const style = WRITING_STYLES[this.state.style].prompt;
        const length = OUTPUT_LENGTHS[this.state.length];
        
        let prompt = '';
        if (this.state.currentTemplate) {
            prompt = this.templateManager.applyTemplate(this.state.currentTemplate, userPrompt);
        } else {
            prompt = userPrompt;
        }
        
        let genreHint = '';
        if (this.state.currentTemplate && this.state.currentTemplate.id) {
            const template = this.state.currentTemplate;
            const templateName = template.name || '';
            const categoryName = this.templateManager.getTemplateCategoryName(template);
            genreHint = `\n\n【创作题材】：${categoryName} - ${templateName}`;
        }
        
        const fullPrompt = `${style}${genreHint}\n\n请生成 ${length.min}-${length.max} 字的内容。\n\n${prompt}`;
        
        const messages = [
            { role: 'system', content: '你是一位才华横溢的文学创作助手，精通各种文体。请用优美的中文进行创作。' },
            { role: 'user', content: fullPrompt }
        ];
        
        stateManager.set('conversationHistory', [...messages]);
        this.state.conversationHistory = messages;
        return await this.makeStreamingAPICall(messages, onChunk);
    }

    // 包装思考内容，添加视觉标识
    wrapThinkingContent(content, isInReasoning) {
        if (!isInReasoning) {
            // 开始思考模式时添加开始标记
            return `<span class="thinking-content">💭 ${content}`;
        }
        return content;
    }
    
    // 结束思考内容的标记
    endThinkingContent() {
        return `</span>\n`;
    }
    
    async makeStreamingAPICall(messages, onChunk) {
        const providerConfig = AI_PROVIDERS[this.state.provider];
        
        if (providerConfig.type === 'anthropic') {
            return await this.callAnthropicStreaming(messages, providerConfig, onChunk);
        } else {
            return await this.callOpenAIStreaming(messages, providerConfig, onChunk);
        }
    }

    async callOpenAIStreaming(messages, providerConfig, onChunk) {
        const apiKey = stateManager.getApiKey();
        const customEndpoint = stateManager.getCustomEndpoint();
        const endpoint = this.state.provider === 'custom' ? 
            customEndpoint : providerConfig.endpoint;
        
        const requestBody = {
            model: this.state.model,
            messages: messages,
            temperature: this.state.creativity,
            max_tokens: 3000,
            stream: true
        };
        
        // 如果启用思考模式，添加思考相关参数
        if (this.state.enableThinking) {
            // 为支持 reasoning 的模型添加相关参数
            // 不同提供商可能有不同的参数名，我们这里使用通用的处理方式
            // DeepSeek 等模型使用 reasoning_effort
            requestBody.reasoning_effort = 'medium';
        }
        
        const response = await apiHandler.fetchWithTimeout(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API请求失败：${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let isInReasoning = false;
        const showThinking = this.state.showThinking;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(data);
                        const delta = parsed.choices?.[0]?.delta;
                        
                        if (delta) {
                            // 检查是否有思考内容 (reasoning 或 thinking)
                            if (delta.reasoning_content || delta.reasoning) {
                                const reasoningContent = delta.reasoning_content || delta.reasoning;
                                if (showThinking) {
                                    const wrappedContent = this.wrapThinkingContent(reasoningContent, isInReasoning);
                                    if (!isInReasoning) isInReasoning = true;
                                    fullContent += reasoningContent;
                                    onChunk(wrappedContent);
                                } else {
                                    fullContent += reasoningContent;
                                }
                            }
                            
                            // 普通内容
                            if (delta.content) {
                                if (isInReasoning && showThinking) {
                                    // 结束思考模式的标记
                                    onChunk(this.endThinkingContent());
                                    isInReasoning = false;
                                }
                                fullContent += delta.content;
                                onChunk(delta.content);
                            }
                        }
                    } catch (e) {
                    }
                }
            }
        }
        
        // 如果最后还在思考模式，结束它
        if (isInReasoning && showThinking) {
            onChunk(this.endThinkingContent());
        }

        return fullContent;
    }

    async callAnthropicStreaming(messages, providerConfig, onChunk) {
        const apiKey = stateManager.getApiKey();
        const systemMessage = messages.find(m => m.role === 'system');
        const otherMessages = messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content
        }));
        
        const requestBody = {
            model: this.state.model,
            max_tokens: 2048,
            stream: true,
            system: systemMessage?.content || '',
            messages: otherMessages
        };
        
        // 如果启用思考模式，添加思考相关参数 (Anthropic 的 thinking 模式)
        if (this.state.enableThinking) {
            // Anthropic Claude 的 thinking 模式使用 thinking 参数
            requestBody.thinking = {
                type: 'enabled',
                budget_tokens: 1024
            };
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
        });

        if (!response.ok) {
            throw new Error(`API请求失败：${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let isInReasoning = false;
        const showThinking = this.state.showThinking;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(data);
                        
                        // 检查是否有思考内容
                        if (parsed.type === 'thinking_delta') {
                            const thinkingContent = parsed.thinking_delta?.thinking;
                            if (thinkingContent && showThinking) {
                                const wrappedContent = this.wrapThinkingContent(thinkingContent, isInReasoning);
                                if (!isInReasoning) isInReasoning = true;
                                fullContent += thinkingContent;
                                onChunk(wrappedContent);
                            } else if (thinkingContent) {
                                fullContent += thinkingContent;
                            }
                        }
                        
                        // 检查普通内容
                        if (parsed.type === 'content_block_delta' || parsed.delta?.text) {
                            const content = parsed.delta?.text;
                            if (content) {
                                if (isInReasoning && showThinking) {
                                    onChunk(this.endThinkingContent());
                                    isInReasoning = false;
                                }
                                fullContent += content;
                                onChunk(content);
                            }
                        }
                    } catch (e) {
                    }
                }
            }
        }
        
        // 如果最后还在思考模式，结束它
        if (isInReasoning && showThinking) {
            onChunk(this.endThinkingContent());
        }

        return fullContent;
    }

    async callAIWithHistory(additionalPrompt) {
        const conversationHistory = [...this.state.conversationHistory];
        const messages = [
            ...conversationHistory,
            { role: 'user', content: additionalPrompt }
        ];
        const result = await this.makeAPICall(messages);
        
        conversationHistory.push({ role: 'user', content: additionalPrompt });
        conversationHistory.push({ role: 'assistant', content: result });
        stateManager.set('conversationHistory', conversationHistory);
        this.state.conversationHistory = conversationHistory;
        
        return result;
    }

    async makeAPICall(messages) {
        const providerConfig = AI_PROVIDERS[this.state.provider];
        
        if (providerConfig.type === 'anthropic') {
            return await this.callAnthropic(messages, providerConfig);
        } else {
            return await this.callOpenAICompatible(messages, providerConfig);
        }
    }

    async callOpenAICompatible(messages, providerConfig) {
        const apiKey = stateManager.getApiKey();
        const customEndpoint = stateManager.getCustomEndpoint();
        const endpoint = this.state.provider === 'custom' ? 
            customEndpoint : providerConfig.endpoint;
        
        const response = await apiHandler.callWithRetry(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: this.state.model,
                messages: messages,
                temperature: this.state.creativity,
                max_tokens: 3000
            })
        });

        if (!response.ok) {
            throw new Error(`API请求失败：${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async callAnthropic(messages, providerConfig) {
        const apiKey = stateManager.getApiKey();
        const systemMessage = messages.find(m => m.role === 'system');
        const otherMessages = messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content
        }));
        
        const response = await apiHandler.callWithRetry(providerConfig.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.state.model,
                max_tokens: 2048,
                system: systemMessage?.content || '',
                messages: otherMessages
            })
        });

        if (!response.ok) {
            throw new Error(`API请求失败：${response.status}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    copyResult() {
        if (!this.state.currentResult) return;
        navigator.clipboard.writeText(this.state.currentResult);
        this.showToast('已复制到剪贴板！');
    }

    saveResult(format = 'txt') {
        if (!this.state.currentResult) return;
        
        const extension = format;
        const mimeType = format === 'md' ? 'text/markdown' : 'text/plain';
        const blob = new Blob([this.state.currentResult], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inkverse-${Date.now()}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('文件已保存！');
    }

    toggleSettings() {
        const panel = document.getElementById('settings-panel');
        panel?.classList.toggle('open');
        
        if (panel?.classList.contains('open')) {
            // 获取当前provider的API密钥和端点
            const currentApiKey = stateManager.getApiKey();
            const currentEndpoint = stateManager.getCustomEndpoint();
            document.getElementById('api-key').value = currentApiKey;
            document.getElementById('custom-endpoint').value = currentEndpoint;
            document.getElementById('provider-select').value = this.state.provider;
            this.updateModelOptions();
            document.getElementById('model-select').value = this.state.model;
            this.renderCurrentModelsList();
            // 更新思考模式的UI状态
            this.updateThinkingUI();
        }
    }

    saveApiSettings() {
        const apiKey = document.getElementById('api-key').value;
        const customEndpoint = document.getElementById('custom-endpoint').value;
        const provider = document.getElementById('provider-select').value;
        const model = document.getElementById('model-select').value;
        const enableThinking = document.getElementById('enable-thinking').checked;
        const showThinking = document.getElementById('show-thinking').checked;
        
        // Validate
        const validation = validateApiKey(apiKey, provider);
        if (!validation.valid) {
            this.showToast(validation.message, 'error');
            return;
        }
        
        if (provider === 'custom') {
            const endpointValidation = validateCustomEndpoint(customEndpoint);
            if (!endpointValidation.valid) {
                this.showToast(endpointValidation.message, 'error');
                return;
            }
        }
        
        // 保存到对应的provider
        stateManager.setApiKey(apiKey, provider);
        stateManager.setCustomEndpoint(customEndpoint, provider);
        stateManager.set('provider', provider);
        stateManager.set('model', model);
        stateManager.set('enableThinking', enableThinking);
        stateManager.set('showThinking', showThinking);
        
        this.state.apiKeys = stateManager.state.apiKeys;
        this.state.customEndpoints = stateManager.state.customEndpoints;
        this.state.provider = provider;
        this.state.model = model;
        this.state.apiKey = apiKey;
        this.state.customEndpoint = customEndpoint;
        this.state.enableThinking = enableThinking;
        this.state.showThinking = showThinking;
        
        this.saveState();
        this.toggleSettings();
        
        if (apiKey) {
            setTimeout(() => {
                this.fetchModelsFromAPI();
            }, 1000);
        }
        
        this.showToast('设置已保存！');
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    toggleTemplatesPanel() {
        const panel = document.getElementById('templates-panel');
        panel?.classList.toggle('open');
        this.renderCustomTemplates();
    }

    renderCustomTemplates() {
        const container = document.getElementById('custom-templates-container');
        if (!container) return;

        const customTemplates = this.state.customTemplates || [];

        if (customTemplates.length === 0) {
            container.innerHTML = '<div class="empty-state">还没有自定义模板</div>';
            return;
        }

        container.innerHTML = customTemplates.map((template, index) => `
            <div class="custom-template-item">
                <div class="custom-template-item-header">
                    <h4>${template.name}</h4>
                    <div class="custom-template-item-actions">
                        <button class="custom-template-item-btn" data-edit-id="${index}">编辑</button>
                        <button class="custom-template-item-btn delete" data-delete-id="${index}">删除</button>
                    </div>
                </div>
                <div class="custom-template-item-preview">${truncateText(template.prompt, 80)}...</div>
            </div>
        `).join('');

        container.querySelectorAll('[data-edit-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.editId);
                this.editCustomTemplate(index);
            });
        });

        container.querySelectorAll('[data-delete-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.deleteId);
                this.deleteCustomTemplate(index);
            });
        });
    }

    addCustomTemplate() {
        const name = document.getElementById('new-template-name')?.value.trim();
        const prompt = document.getElementById('new-template-prompt')?.value.trim();
        const example = document.getElementById('new-template-example')?.value.trim();

        if (!name || !prompt) {
            this.showToast('请填写模板名称和提示词！', 'error');
            return;
        }

        this.templateManager.addCustomTemplate(name, prompt, example);
        this.state.customTemplates = stateManager.get('customTemplates');
        this.renderCustomTemplates();
        this.renderTemplates();

        document.getElementById('new-template-name').value = '';
        document.getElementById('new-template-prompt').value = '';
        document.getElementById('new-template-example').value = '';

        this.showToast('模板添加成功！');
    }

    editCustomTemplate(index) {
        const customTemplates = this.state.customTemplates || [];
        const template = customTemplates[index];
        if (!template) return;

        document.getElementById('new-template-name').value = template.name;
        document.getElementById('new-template-prompt').value = template.prompt;
        document.getElementById('new-template-example').value = template.example;

        customTemplates.splice(index, 1);
        stateManager.set('customTemplates', customTemplates);
        this.state.customTemplates = customTemplates;
        this.saveState();
        this.renderCustomTemplates();
        this.renderTemplates();

        this.showToast('请修改后重新添加');
    }

    deleteCustomTemplate(index) {
        this.templateManager.deleteCustomTemplate(index);
        this.state.customTemplates = stateManager.get('customTemplates');
        this.renderCustomTemplates();
        this.renderTemplates();
        this.showToast('模板已删除');
    }

    batchExportHistory() {
        const count = this.historyManager.batchExport();
        if (count === null) {
            this.showToast('暂无历史记录可导出', 'error');
        } else {
            this.showToast(`已导出 ${count} 条记录！`);
        }
    }
}

const app = new InkverseApp();
window.app = app;