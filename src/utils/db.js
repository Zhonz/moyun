/**
 * IndexedDB 数据库管理器
 * 用于存储历史记录，提供比 localStorage 更大的存储容量和更好的性能
 */

const DB_NAME = 'inkverse_db';
const DB_VERSION = 1;
const HISTORY_STORE = 'history';
const STATS_STORE = 'stats';

class HistoryDB {
    constructor() {
        this.db = null;
        this.ready = this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB 打开失败:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 创建历史记录存储
                if (!db.objectStoreNames.contains(HISTORY_STORE)) {
                    const historyStore = db.createObjectStore(HISTORY_STORE, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    historyStore.createIndex('timestamp', 'timestamp', { unique: false });
                    historyStore.createIndex('templateName', 'templateName', { unique: false });
                }

                // 创建统计数据存储
                if (!db.objectStoreNames.contains(STATS_STORE)) {
                    db.createObjectStore(STATS_STORE, { keyPath: 'key' });
                }
            };
        });
    }

    async ensureReady() {
        if (this.db) return this.db;
        return this.ready;
    }

    /**
     * 保存历史记录
     */
    async saveHistoryItem(item) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([HISTORY_STORE], 'readwrite');
            const store = transaction.objectStore(HISTORY_STORE);

            const historyItem = {
                ...item,
                id: Date.now()
            };

            const request = store.add(historyItem);
            request.onsuccess = () => resolve(historyItem);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取所有历史记录（按时间倒序）
     */
    async getAllHistory() {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([HISTORY_STORE], 'readonly');
            const store = transaction.objectStore(HISTORY_STORE);
            const index = store.index('timestamp');

            const request = index.getAll();
            request.onsuccess = () => {
                // 按时间倒序返回
                const results = request.result.reverse();
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取分页历史记录（虚拟滚动支持）
     */
    async getHistoryPage(page = 0, pageSize = 20) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([HISTORY_STORE], 'readonly');
            const store = transaction.objectStore(HISTORY_STORE);
            const index = store.index('timestamp');

            const allRequest = index.getAll();
            allRequest.onsuccess = () => {
                const allHistory = allRequest.result.reverse();
                const start = page * pageSize;
                const end = start + pageSize;
                const items = allHistory.slice(start, end);

                resolve({
                    items,
                    total: allHistory.length,
                    page,
                    pageSize,
                    hasMore: end < allHistory.length
                });
            };
            allRequest.onerror = () => reject(allRequest.error);
        });
    }

    /**
     * 删除历史记录
     */
    async deleteHistoryItem(id) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([HISTORY_STORE], 'readwrite');
            const store = transaction.objectStore(HISTORY_STORE);

            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 清空所有历史
     */
    async clearHistory() {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([HISTORY_STORE], 'readwrite');
            const store = transaction.objectStore(HISTORY_STORE);

            const request = store.clear();
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 搜索历史记录
     */
    async searchHistory(query) {
        const history = await this.getAllHistory();
        if (!query || !query.trim()) {
            return history;
        }

        const lowerQuery = query.toLowerCase();
        return history.filter(item =>
            item.prompt.toLowerCase().includes(lowerQuery) ||
            item.result.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * 获取历史记录总数
     */
    async getHistoryCount() {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([HISTORY_STORE], 'readonly');
            const store = transaction.objectStore(HISTORY_STORE);

            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 保存统计数据
     */
    async saveStats(stats) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STATS_STORE], 'readwrite');
            const store = transaction.objectStore(STATS_STORE);

            const request = store.put({ key: 'stats', ...stats });
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取统计数据
     */
    async getStats() {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STATS_STORE], 'readonly');
            const store = transaction.objectStore(STATS_STORE);

            const request = store.get('stats');
            request.onsuccess = () => resolve(request.result || {
                totalCreations: 0,
                templatesUsed: {},
                lastUsed: null
            });
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 限制存储数量（保留最近的 MAX_HISTORY_ITEMS 条）
     */
    async trimHistory(maxItems = 200) {
        await this.ensureReady();
        const count = await this.getHistoryCount();

        if (count <= maxItems) return;

        const transaction = this.db.transaction([HISTORY_STORE], 'readwrite');
        const store = transaction.objectStore(HISTORY_STORE);
        const index = store.index('timestamp');

        return new Promise((resolve, reject) => {
            const request = index.getAll();
            request.onsuccess = () => {
                const allHistory = request.result;
                const toDelete = count - maxItems;

                if (toDelete > 0) {
                    const toRemove = allHistory.slice(0, toDelete);
                    let deleted = 0;

                    toRemove.forEach(item => {
                        const deleteReq = store.delete(item.id);
                        deleteReq.onsuccess = () => {
                            deleted++;
                            if (deleted === toRemove.length) {
                                resolve(true);
                            }
                        };
                        deleteReq.onerror = () => reject(deleteReq.error);
                    });
                } else {
                    resolve(true);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 导出所有历史为 Markdown
     */
    async exportToMarkdown() {
        const history = await this.getAllHistory();
        if (history.length === 0) {
            return null;
        }

        const exportContent = history.map((item, index) => {
            const date = new Date(item.timestamp).toLocaleString('zh-CN');
            return `# ${index + 1}. ${item.templateName || '创作'} - ${date}\n\n## 创作内容\n${item.prompt}\n\n## AI生成\n${item.result}\n\n---\n`;
        }).join('\n');

        const header = `# 墨韵AI创作记录导出\n\n导出时间: ${new Date().toLocaleString('zh-CN')}\n共 ${history.length} 条创作记录\n\n---\n\n`;

        return header + exportContent;
    }
}

// 导出单例
const historyDB = new HistoryDB();

export { historyDB, HistoryDB };
export default historyDB;