/**
 * API Handler 工具类
 * 提供超时控制、重试机制、请求缓存和请求取消功能
 */
class APIHandler {
    constructor() {
        this.abortControllers = new Map();
        this.cache = new Map();
    }

    /**
     * 生成缓存键
     */
    generateCacheKey(url, options) {
        return `${url}:${JSON.stringify(options)}`;
    }

    /**
     * 清除过期缓存
     */
    cleanExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now > value.expiry) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * 带超时的 fetch 请求
     * @param {string} url - 请求URL
     * @param {Object} options - fetch 选项
     * @param {number} timeout - 超时时间（毫秒），默认30000
     * @returns {Promise<Response>}
     */
    async fetchWithTimeout(url, options = {}, timeout = 30000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`请求超时（${timeout}ms）`);
            }
            throw error;
        }
    }

    /**
     * 带重试的 API 调用（指数退避策略）
     * @param {string} url - 请求URL
     * @param {Object} options - fetch 选项
     * @param {number} maxRetries - 最大重试次数，默认3
     * @returns {Promise<Response>}
     */
    async callWithRetry(url, options = {}, maxRetries = 3) {
        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeout = attempt === 0 ? 30000 : 30000 * (attempt + 1);

                const response = await this.fetchWithTimeout(url, {
                    ...options,
                    signal: controller.signal
                }, timeout);

                // 4xx 错误不触发重试
                if (response.status >= 400 && response.status < 500) {
                    return response;
                }

                // 5xx 或网络错误时重试
                if (!response.ok && attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
                    await this.sleep(delay);
                    continue;
                }

                return response;
            } catch (error) {
                lastError = error;

                // 如果是超时或网络错误，且还有重试次数，则等待后重试
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000;
                    await this.sleep(delay);
                }
            }
        }

        throw lastError || new Error('请求失败');
    }

    /**
     * 睡眠函数
     * @param {number} ms - 毫秒数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 带缓存的 API 调用
     * @param {string} key - 缓存键
     * @param {string} url - 请求URL
     * @param {Object} options - fetch 选项
     * @param {number} ttl - 缓存有效期（毫秒），默认300000（5分钟）
     * @returns {Promise<any>}
     */
    async callCached(key, url, options = {}, ttl = 300000) {
        const cacheKey = key || this.generateCacheKey(url, options);

        // 检查缓存
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() < cached.expiry) {
            return cached.data;
        }

        // 发起请求
        const response = await this.callWithRetry(url, options);

        if (!response.ok) {
            throw new Error(`API请求失败：${response.status}`);
        }

        const data = await response.json();

        // 存储到缓存
        this.cache.set(cacheKey, {
            data: data,
            expiry: Date.now() + ttl
        });

        // 定期清理过期缓存
        if (this.cache.size > 100) {
            this.cleanExpiredCache();
        }

        return data;
    }

    /**
     * 注册请求的 AbortController
     * @param {string} key - 请求标识
     * @param {AbortController} controller - AbortController 实例
     */
    registerRequest(key, controller) {
        this.abortControllers.set(key, controller);
    }

    /**
     * 取消指定请求
     * @param {string} key - 请求标识
     */
    cancelRequest(key) {
        const controller = this.abortControllers.get(key);
        if (controller) {
            controller.abort();
            this.abortControllers.delete(key);
        }
    }

    /**
     * 取消所有请求
     */
    cancelAllRequests() {
        for (const [key, controller] of this.abortControllers.entries()) {
            controller.abort();
        }
        this.abortControllers.clear();
    }

    /**
     * 清除指定缓存
     * @param {string} key - 缓存键
     */
    clearCache(key) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }

    /**
     * 清除过期缓存
     */
    cleanCache() {
        this.cleanExpiredCache();
    }
}

// 导出单例
const apiHandler = new APIHandler();

export default apiHandler;
