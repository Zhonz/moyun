/**
 * 状态管理器
 * 负责应用状态的加载、保存和初始化
 * 支持热更新：数据存储在 IndexedDB 中，更新应用不丢失数据
 */
import { persistentStorage } from '../utils/persistent-storage.js';

const AI_PROVIDERS = {
    openai: {
        name: "OpenAI",
        models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
        endpoint: "https://api.openai.com/v1/chat/completions",
        modelsEndpoint: "https://api.openai.com/v1/models",
        requiresAuth: true,
        type: "openai"
    },
    anthropic: {
        name: "Anthropic",
        models: ["claude-3-5-sonnet-20241022", "claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
        endpoint: "https://api.anthropic.com/v1/messages",
        modelsEndpoint: null,
        requiresAuth: true,
        type: "anthropic"
    },
    deepseek: {
        name: "DeepSeek",
        models: ["deepseek-v4-pro", "deepseek-v4-flash"],
        endpoint: "https://api.deepseek.com/v1/chat/completions",
        modelsEndpoint: "https://api.deepseek.com/v1/models",
        requiresAuth: true,
        type: "openai"
    },
    qwen: {
        name: "阿里千问",
        models: ["qwen-turbo", "qwen-plus", "qwen-max", "qwen-coder-plus"],
        endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        modelsEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/models",
        requiresAuth: true,
        type: "openai"
    },
    glm: {
        name: "智谱AI",
        models: ["glm-4-flash", "glm-4-plus", "glm-4-long", "glm-4", "glm-3-turbo"],
        endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        modelsEndpoint: "https://open.bigmodel.cn/api/paas/v4/models",
        requiresAuth: true,
        type: "openai"
    },
    moonshot: {
        name: "月之暗面",
        models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
        endpoint: "https://api.moonshot.cn/v1/chat/completions",
        modelsEndpoint: "https://api.moonshot.cn/v1/models",
        requiresAuth: true,
        type: "openai"
    },
    doubao: {
        name: "字节豆包",
        models: ["ep-20241204153318-5n6lh", "doubao-seed-pro-32k", "doubao-seed-lite-32k"],
        endpoint: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
        modelsEndpoint: "https://ark.cn-beijing.volces.com/api/v1/models",
        requiresAuth: true,
        type: "openai"
    },
    yi: {
        name: "零一万物",
        models: ["yi-lightning", "yi-large", "yi-large-turbo", "yi-medium"],
        endpoint: "https://api.lingyiwanwu.com/v1/chat/completions",
        modelsEndpoint: "https://api.lingyiwanwu.com/v1/models",
        requiresAuth: true,
        type: "openai"
    },
    custom: {
        name: "自定义",
        endpoint: "",
        models: [],
        requiresAuth: true,
        type: "openai"
    }
};

const STORAGE_KEY = 'inkverse_state';
const MAX_HISTORY_ITEMS = 200;

class StateManager {
    constructor() {
        this.state = this.getDefaultState();
        this.listeners = new Map();
        this.usePersistentStorage = true; // 默认使用持久化存储
        this.isLoaded = false;
    }

    getDefaultState() {
        return {
            currentMode: 'create',
            currentTemplate: null,
            currentCategory: 'novels',
            style: 'general',
            length: 'medium',
            creativity: 0.7,
            provider: 'deepseek',
            model: '',
            apiKeys: {}, // 每个provider对应的API密钥
            customEndpoints: {}, // 每个provider对应的自定义端点
            history: [],
            favorites: [],
            customTemplates: [],
            currentResult: null,
            isGenerating: false,
            conversationHistory: [],
            theme: 'dark',
            searchQuery: '',
            templateSearchQuery: '',
            showFavoritesOnly: false,
            stats: {
                totalCreations: 0,
                templatesUsed: {},
                lastUsed: null
            },
            chatHistory: [],
            draft: {
                content: '',
                template: null,
                timestamp: null
            },
            cachedModels: {},
            // 思考模式相关
            enableThinking: false, // 是否启用思考模式
            showThinking: false    // 是否显示思考内容
        };
    }

    /**
     * 获取当前provider的API密钥
     */
    getApiKey(provider = null) {
        const p = provider || this.state.provider;
        return this.state.apiKeys[p] || '';
    }

    /**
     * 设置当前或指定provider的API密钥
     */
    setApiKey(apiKey, provider = null) {
        const p = provider || this.state.provider;
        const apiKeys = { ...this.state.apiKeys, [p]: apiKey };
        this.state.apiKeys = apiKeys;
    }

    /**
     * 获取当前provider的自定义端点
     */
    getCustomEndpoint(provider = null) {
        const p = provider || this.state.provider;
        return this.state.customEndpoints[p] || '';
    }

    /**
     * 设置当前或指定provider的自定义端点
     */
    setCustomEndpoint(endpoint, provider = null) {
        const p = provider || this.state.provider;
        const customEndpoints = { ...this.state.customEndpoints, [p]: endpoint };
        this.state.customEndpoints = customEndpoints;
    }

    /**
     * 加载保存的状态
     * 优先从 IndexedDB 加载，支持热更新
     */
    async load() {
        try {
            // 首先执行数据迁移（如果需要）
            await persistentStorage.migrateIfNeeded();

            // 尝试从 IndexedDB 加载
            const persistentData = await persistentStorage.getAllItems();

            if (persistentData && Object.keys(persistentData).length > 0) {
                // 从持久化存储加载
                this.state = {
                ...this.getDefaultState(),
                provider: persistentData.provider || this.state.provider,
                model: persistentData.model || this.state.model,
                apiKeys: persistentData.apiKeys || this.state.apiKeys,
                customEndpoints: persistentData.customEndpoints || this.state.customEndpoints,
                theme: persistentData.theme || this.state.theme,
                cachedModels: persistentData.cachedModels || this.state.cachedModels,
                favorites: persistentData.favorites || [],
                customTemplates: persistentData.customTemplates || [],
                enableThinking: persistentData.enableThinking !== undefined ? persistentData.enableThinking : false,
                showThinking: persistentData.showThinking !== undefined ? persistentData.showThinking : false
            };
                // 兼容旧版本的单个apiKey
                if (persistentData.apiKey && !this.state.apiKeys[this.state.provider]) {
                    this.state.apiKeys[this.state.provider] = persistentData.apiKey;
                }
                if (persistentData.customEndpoint && !this.state.customEndpoints[this.state.provider]) {
                    this.state.customEndpoints[this.state.provider] = persistentData.customEndpoint;
                }
                this.ensureDefaultModels();
                this.isLoaded = true;
                return this.state;
            }

            // 如果没有数据，尝试从 localStorage 加载（兼容旧版本）
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.getDefaultState(), ...parsed };

                // 将数据迁移到持久化存储
                await this.saveToPersistent();
                this.ensureDefaultModels();
                this.isLoaded = true;
                return this.state;
            }

            this.ensureDefaultModels();
            this.isLoaded = true;
            return this.state;
        } catch (e) {
            console.log('No saved state or load error:', e);
            this.ensureDefaultModels();
            this.isLoaded = true;
            return this.state;
        }
    }

    /**
     * 确保每个提供商都有默认模型
     */
    ensureDefaultModels() {
        for (const [provider, config] of Object.entries(AI_PROVIDERS)) {
            if (!this.state.cachedModels[provider] || this.state.cachedModels[provider].length === 0) {
                if (config.models && config.models.length > 0) {
                    this.state.cachedModels[provider] = [...config.models];
                }
            }
        }
    }

    /**
     * 保存状态到 IndexedDB（持久化存储，支持热更新）
     * 同时保留 localStorage 备份
     */
    async save() {
        // 保存到 IndexedDB（主要存储，支持热更新）
        if (this.usePersistentStorage) {
            try {
                await persistentStorage.setItems({
                    provider: this.state.provider,
                    model: this.state.model,
                    apiKeys: this.state.apiKeys,
                    customEndpoints: this.state.customEndpoints,
                    theme: this.state.theme,
                    cachedModels: this.state.cachedModels,
                    favorites: this.state.favorites,
                    customTemplates: this.state.customTemplates,
                    enableThinking: this.state.enableThinking,
                    showThinking: this.state.showThinking
                });
            } catch (e) {
                console.error('保存到持久化存储失败:', e);
            }
        }

        // 同时保存到 localStorage（备份）
        const toSave = {
            provider: this.state.provider,
            model: this.state.model,
            apiKeys: this.state.apiKeys,
            customEndpoints: this.state.customEndpoints,
            history: this.state.history.slice(-MAX_HISTORY_ITEMS),
            favorites: this.state.favorites,
            customTemplates: this.state.customTemplates,
            theme: this.state.theme,
            cachedModels: this.state.cachedModels,
            enableThinking: this.state.enableThinking,
            showThinking: this.state.showThinking
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }

    /**
     * 保存到持久化存储
     */
    async saveToPersistent() {
        try {
            await persistentStorage.setItems({
                provider: this.state.provider,
                model: this.state.model,
                apiKeys: this.state.apiKeys,
                customEndpoints: this.state.customEndpoints,
                theme: this.state.theme,
                cachedModels: this.state.cachedModels,
                favorites: this.state.favorites,
                customTemplates: this.state.customTemplates,
                enableThinking: this.state.enableThinking,
                showThinking: this.state.showThinking
            });
        } catch (e) {
            console.error('保存到持久化存储失败:', e);
        }
    }

    /**
     * 获取当前状态
     */
    getState() {
        return this.state;
    }

    /**
     * 更新状态（浅合并）
     */
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notifyListeners(updates);
    }

    /**
     * 获取特定状态字段
     */
    get(key) {
        return this.state[key];
    }

    /**
     * 设置特定状态字段
     */
    set(key, value) {
        this.state[key] = value;
        this.notifyListeners({ [key]: value });
    }

    /**
     * 添加状态变更监听器
     */
    addListener(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
    }

    /**
     * 移除状态变更监听器
     */
    removeListener(key, callback) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).delete(callback);
        }
    }

    /**
     * 通知监听器状态变更
     */
    notifyListeners(updates) {
        for (const key of Object.keys(updates)) {
            if (this.listeners.has(key)) {
                this.listeners.get(key).forEach(callback => callback(updates[key]));
            }
        }
    }

    /**
     * 重置状态到默认值
     */
    reset() {
        this.state = this.getDefaultState();
        this.save();
    }

    /**
     * 获取 AI 提供商配置
     */
    getProviderConfig(provider) {
        return AI_PROVIDERS[provider] || null;
    }

    /**
     * 获取所有 AI 提供商
     */
    getProviders() {
        return AI_PROVIDERS;
    }
}

// 导出单例
const stateManager = new StateManager();

export { stateManager, AI_PROVIDERS };
export default stateManager;