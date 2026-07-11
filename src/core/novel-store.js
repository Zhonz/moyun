/**
 * 小说存储管理器
 * 使用 IndexedDB 独立存储小说和章节数据
 */

const NOVEL_DB_NAME = 'inkverse_novels';
const NOVEL_DB_VERSION = 2;
const NOVELS_STORE = 'novels';
const CHAPTERS_STORE = 'chapters';

class NovelStore {
    constructor() {
        this.db = null;
        this.ready = this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(NOVEL_DB_NAME, NOVEL_DB_VERSION);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const oldVersion = event.oldVersion;

                if (oldVersion < 1) {
                    if (!db.objectStoreNames.contains(NOVELS_STORE)) {
                        const novelStore = db.createObjectStore(NOVELS_STORE, { keyPath: 'id' });
                        novelStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                        novelStore.createIndex('status', 'status', { unique: false });
                    }

                    if (!db.objectStoreNames.contains(CHAPTERS_STORE)) {
                        const chapterStore = db.createObjectStore(CHAPTERS_STORE, { keyPath: 'id' });
                        chapterStore.createIndex('novelId', 'novelId', { unique: false });
                        chapterStore.createIndex('novelId_index', ['novelId', 'index'], { unique: true });
                    }
                }

                if (oldVersion < 2) {
                    // 升级：添加更多字段（通过cursor更新现有记录）
                    // 新字段会在读写时自动添加，这里主要确保索引存在
                }
            };
        });
    }

    async ensureReady() {
        if (this.db) return this.db;
        return this.ready;
    }

    // ===== Novel CRUD =====

    async createNovel(novelData) {
        await this.ensureReady();
        const novel = {
            id: this.generateId(),
            title: novelData.title || '未命名小说',
            cover: novelData.cover || '📖',
            coverColor: novelData.coverColor || this.randomCoverColor(),
            outline: novelData.outline || '',
            foreshadowing: novelData.foreshadowing || '',
            writingStyle: novelData.writingStyle || '',
            genre: novelData.genre || 'medium',
            targetChapters: novelData.targetChapters || 30,
            genreHint: novelData.genreHint || '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            status: 'outlining',
            currentChapter: 0,
            totalWords: 0,
            userPrompt: novelData.userPrompt || '',
            outlinePrompt: novelData.outlinePrompt || '',
            lastGeneratedContent: '',
            lastReadChapter: 0,
            autoContinue: false
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([NOVELS_STORE], 'readwrite');
            const store = transaction.objectStore(NOVELS_STORE);
            const request = store.add(novel);
            request.onsuccess = () => resolve(novel);
            request.onerror = () => reject(request.error);
        });
    }

    async updateNovel(novelId, updates) {
        await this.ensureReady();
        const novel = await this.getNovel(novelId);
        if (!novel) throw new Error('小说不存在');

        const updated = { ...novel, ...updates, updatedAt: Date.now() };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([NOVELS_STORE], 'readwrite');
            const store = transaction.objectStore(NOVELS_STORE);
            const request = store.put(updated);
            request.onsuccess = () => resolve(updated);
            request.onerror = () => reject(request.error);
        });
    }

    async getNovel(novelId) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([NOVELS_STORE], 'readonly');
            const store = transaction.objectStore(NOVELS_STORE);
            const request = store.get(novelId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllNovels() {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([NOVELS_STORE], 'readonly');
            const store = transaction.objectStore(NOVELS_STORE);
            const request = store.getAll();
            request.onsuccess = () => {
                const novels = request.result.sort((a, b) => b.updatedAt - a.updatedAt);
                resolve(novels);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteNovel(novelId) {
        await this.ensureReady();
        // 先删除所有章节
        await this.deleteChaptersByNovelId(novelId);
        // 再删除小说
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([NOVELS_STORE], 'readwrite');
            const store = transaction.objectStore(NOVELS_STORE);
            const request = store.delete(novelId);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // ===== Chapter CRUD =====

    async createChapter(chapterData) {
        await this.ensureReady();
        const chapter = {
            id: this.generateId(),
            novelId: chapterData.novelId,
            index: chapterData.index,
            title: chapterData.title || `第${chapterData.index + 1}章`,
            content: chapterData.content || '',
            status: chapterData.status || 'pending', // pending/generating/completed
            wordCount: chapterData.wordCount || 0,
            createdAt: Date.now()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([CHAPTERS_STORE], 'readwrite');
            const store = transaction.objectStore(CHAPTERS_STORE);
            const request = store.add(chapter);
            request.onsuccess = () => resolve(chapter);
            request.onerror = () => reject(request.error);
        });
    }

    async updateChapter(chapterId, updates) {
        await this.ensureReady();
        const chapter = await this.getChapter(chapterId);
        if (!chapter) throw new Error('章节不存在');

        const updated = { ...chapter, ...updates };
        if (updates.content) {
            updated.wordCount = updates.content.length;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([CHAPTERS_STORE], 'readwrite');
            const store = transaction.objectStore(CHAPTERS_STORE);
            const request = store.put(updated);
            request.onsuccess = () => resolve(updated);
            request.onerror = () => reject(request.error);
        });
    }

    async getChapter(chapterId) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([CHAPTERS_STORE], 'readonly');
            const store = transaction.objectStore(CHAPTERS_STORE);
            const request = store.get(chapterId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getChaptersByNovelId(novelId) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([CHAPTERS_STORE], 'readonly');
            const store = transaction.objectStore(CHAPTERS_STORE);
            const index = store.index('novelId');
            const request = index.getAll(novelId);
            request.onsuccess = () => {
                const chapters = request.result.sort((a, b) => a.index - b.index);
                resolve(chapters);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteChaptersByNovelId(novelId) {
        await this.ensureReady();
        const chapters = await this.getChaptersByNovelId(novelId);
        const transaction = this.db.transaction([CHAPTERS_STORE], 'readwrite');
        const store = transaction.objectStore(CHAPTERS_STORE);

        return Promise.all(chapters.map(ch =>
            new Promise((resolve, reject) => {
                const request = store.delete(ch.id);
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            })
        ));
    }

    // ===== Utility =====

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    }

    randomCoverColor() {
        const colors = [
            '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
            '#F59E0B', '#10B981', '#06B6D4', '#64748B', '#0EA5E9'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    async getNovelStats(novelId) {
        const chapters = await this.getChaptersByNovelId(novelId);
        const completedChapters = chapters.filter(c => c.status === 'completed');
        const totalWords = completedChapters.reduce((sum, c) => sum + c.wordCount, 0);
        return {
            totalChapters: chapters.length,
            completedChapters: completedChapters.length,
            totalWords
        };
    }

    async getActiveWritingNovel() {
        const novels = await this.getAllNovels();
        return novels.find(n => n.status === 'writing' && n.autoContinue) || null;
    }

    async getAutoContinueNovels() {
        const novels = await this.getAllNovels();
        return novels.filter(n => n.status === 'writing' && n.autoContinue);
    }
}

const novelStore = new NovelStore();
export default novelStore;
