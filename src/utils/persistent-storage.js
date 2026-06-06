/**
 * 持久化存储管理器
 * 使用 IndexedDB 存储所有应用数据，确保在应用更新时数据不丢失
 * IndexedDB 的数据存储在应用的私有目录中，更新应用不会清除这些数据
 */

const PERSISTENT_DB_NAME = 'inkverse_persistent';
const PERSISTENT_DB_VERSION = 1;
const SETTINGS_STORE = 'settings';
const DATA_VERSION_KEY = 'data_version';
const CURRENT_DATA_VERSION = 2; // 升级时用于数据迁移

class PersistentStorage {
    constructor() {
        this.db = null;
        this.ready = this.init();
        this.isInitialized = false;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(PERSISTENT_DB_NAME, PERSISTENT_DB_VERSION);

            request.onerror = () => {
                console.error('持久化存储打开失败:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 创建设置存储
                if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                    db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
                }
            };
        });
    }

    async ensureReady() {
        if (this.db) return this.db;
        return this.ready;
    }

    /**
     * 保存设置项
     */
    async setItem(key, value) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([SETTINGS_STORE], 'readwrite');
            const store = transaction.objectStore(SETTINGS_STORE);

            const request = store.put({ key, value, updatedAt: Date.now() });
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取设置项
     */
    async getItem(key, defaultValue = null) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([SETTINGS_STORE], 'readonly');
            const store = transaction.objectStore(SETTINGS_STORE);

            const request = store.get(key);
            request.onsuccess = () => {
                resolve(request.result ? request.result.value : defaultValue);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 删除设置项
     */
    async removeItem(key) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([SETTINGS_STORE], 'readwrite');
            const store = transaction.objectStore(SETTINGS_STORE);

            const request = store.delete(key);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 批量保存设置
     */
    async setItems(items) {
        await this.ensureReady();
        const transaction = this.db.transaction([SETTINGS_STORE], 'readwrite');
        const store = transaction.objectStore(SETTINGS_STORE);

        const promises = Object.entries(items).map(([key, value]) => {
            return new Promise((resolve, reject) => {
                const request = store.put({ key, value, updatedAt: Date.now() });
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        });

        return Promise.all(promises);
    }

    /**
     * 获取所有设置
     */
    async getAllItems() {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([SETTINGS_STORE], 'readonly');
            const store = transaction.objectStore(SETTINGS_STORE);

            const request = store.getAll();
            request.onsuccess = () => {
                const result = {};
                request.result.forEach(item => {
                    result[item.key] = item.value;
                });
                resolve(result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 清除所有数据
     */
    async clear() {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([SETTINGS_STORE], 'readwrite');
            const store = transaction.objectStore(SETTINGS_STORE);

            const request = store.clear();
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取数据版本
     */
    async getDataVersion() {
        const version = await this.getItem(DATA_VERSION_KEY, 1);
        return version;
    }

    /**
     * 设置数据版本
     */
    async setDataVersion(version) {
        return await this.setItem(DATA_VERSION_KEY, version);
    }

    /**
     * 执行数据迁移
     * 当检测到数据版本变化时，执行相应的迁移逻辑
     */
    async migrateIfNeeded() {
        const currentVersion = await this.getDataVersion();

        if (currentVersion < CURRENT_DATA_VERSION) {
            console.log(`数据迁移: v${currentVersion} -> v${CURRENT_DATA_VERSION}`);

            // v1 -> v2: 从 localStorage 迁移数据到 IndexedDB
            if (currentVersion < 2) {
                await this.migrateFromLocalStorage();
            }

            await this.setDataVersion(CURRENT_DATA_VERSION);
            console.log('数据迁移完成');
        }
    }

    /**
     * 从 localStorage 迁移数据
     */
    async migrateFromLocalStorage() {
        try {
            const STORAGE_KEY = 'inkverse_state';
            const saved = localStorage.getItem(STORAGE_KEY);

            if (saved) {
                const parsed = JSON.parse(saved);

                // 迁移关键数据到 IndexedDB
                await this.setItems({
                    provider: parsed.provider,
                    model: parsed.model,
                    apiKey: parsed.apiKey,
                    customEndpoint: parsed.customEndpoint,
                    theme: parsed.theme,
                    cachedModels: parsed.cachedModels,
                    favorites: parsed.favorites || [],
                    customTemplates: parsed.customTemplates || [],
                    // 保留历史记录引用（如果存在）
                    historyVersion: parsed.history?.length || 0
                });

                console.log('数据从 localStorage 迁移到 IndexedDB 完成');
            }
        } catch (e) {
            console.error('数据迁移失败:', e);
        }
    }

    /**
     * 导出所有数据（用于备份）
     */
    async exportAllData() {
        const items = await this.getAllItems();
        return {
            version: CURRENT_DATA_VERSION,
            exportedAt: new Date().toISOString(),
            data: items
        };
    }

    /**
     * 导入数据（用于恢复）
     */
    async importData(backup) {
        if (!backup || !backup.data) {
            throw new Error('无效的备份数据');
        }

        await this.setItems(backup.data);
        console.log('数据导入完成');
    }
}

// 导出单例
const persistentStorage = new PersistentStorage();

export { persistentStorage, PersistentStorage };
export default persistentStorage;