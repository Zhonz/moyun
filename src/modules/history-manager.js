/**
 * 历史记录管理器
 * 负责历史记录的 CRUD 操作和虚拟滚动支持
 */

const MAX_HISTORY_ITEMS = 200;

class HistoryManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.virtualScrollIndex = 0;
        this.itemsPerPage = 20;
    }

    /**
     * 获取所有历史记录
     */
    getHistory() {
        return this.stateManager.get('history') || [];
    }

    /**
     * 添加历史记录
     */
    addHistoryItem(prompt, result, templateName) {
        const history = [...this.getHistory()];
        const historyItem = {
            prompt,
            result,
            templateName: templateName || '创作',
            timestamp: Date.now()
        };
        
        history.push(historyItem);
        
        // 限制历史记录数量
        if (history.length > MAX_HISTORY_ITEMS) {
            history.shift();
        }
        
        this.stateManager.set('history', history);
        this.stateManager.save();
        
        // 更新统计
        this.updateStats(templateName);
        
        return historyItem;
    }

    /**
     * 更新统计信息
     */
    updateStats(templateName) {
        const stats = { ...this.stateManager.get('stats') };
        stats.totalCreations = (stats.totalCreations || 0) + 1;
        stats.lastUsed = Date.now();
        
        if (templateName) {
            stats.templatesUsed = stats.templatesUsed || {};
            stats.templatesUsed[templateName] = (stats.templatesUsed[templateName] || 0) + 1;
        }
        
        this.stateManager.set('stats', stats);
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return this.stateManager.get('stats') || {
            totalCreations: 0,
            templatesUsed: {},
            lastUsed: null
        };
    }

    /**
     * 删除历史记录
     */
    deleteHistoryItem(index) {
        const history = [...this.getHistory()];
        if (index < 0 || index >= history.length) return false;
        
        history.splice(index, 1);
        this.stateManager.set('history', history);
        this.stateManager.save();
        return true;
    }

    /**
     * 清空所有历史
     */
    clearHistory() {
        this.stateManager.set('history', []);
        this.stateManager.save();
    }

    /**
     * 搜索历史记录
     */
    searchHistory(query) {
        const history = this.getHistory();
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
     * 获取虚拟滚动数据（分页）
     */
    getVirtualScrollPage(page = 0, pageSize = 20) {
        const history = this.getHistory();
        const reversed = [...history].reverse();
        const start = page * pageSize;
        const end = start + pageSize;
        
        return {
            items: reversed.slice(start, end),
            total: history.length,
            page,
            pageSize,
            hasMore: end < history.length
        };
    }

    /**
     * 加载更多历史（虚拟滚动）
     */
    loadMore() {
        this.virtualScrollIndex++;
        return this.getVirtualScrollPage(this.virtualScrollIndex, this.itemsPerPage);
    }

    /**
     * 重置虚拟滚动位置
     */
    resetVirtualScroll() {
        this.virtualScrollIndex = 0;
    }

    /**
     * 根据索引获取历史记录
     */
    getHistoryItem(index) {
        const history = this.getHistory();
        return history[index] || null;
    }

    /**
     * 获取反向索引（用于显示）
     */
    getDisplayIndex(actualIndex) {
        const history = this.getHistory();
        return history.length - 1 - actualIndex;
    }

    /**
     * 导出所有历史为 Markdown
     */
    exportToMarkdown() {
        const history = this.getHistory();
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

    /**
     * 批量导出历史
     */
    batchExport() {
        const content = this.exportToMarkdown();
        if (!content) {
            return null;
        }

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inkverse-export-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);

        return history.length;
    }

    /**
     * 获取最近 N 条历史
     */
    getRecentHistory(count = 10) {
        const history = this.getHistory();
        return history.slice(-count).reverse();
    }

    /**
     * 按模板名筛选历史
     */
    filterByTemplate(templateName) {
        const history = this.getHistory();
        return history.filter(item => item.templateName === templateName);
    }

    /**
     * 按日期范围筛选历史
     */
    filterByDateRange(startDate, endDate) {
        const history = this.getHistory();
        const start = startDate instanceof Date ? startDate.getTime() : startDate;
        const end = endDate instanceof Date ? endDate.getTime() : endDate;
        
        return history.filter(item => {
            const timestamp = item.timestamp;
            return timestamp >= start && timestamp <= end;
        });
    }

    /**
     * 获取历史记录的总数
     */
    getTotalCount() {
        return this.getHistory().length;
    }

    /**
     * 检查是否有历史记录
     */
    hasHistory() {
        return this.getHistory().length > 0;
    }
}

export { HistoryManager, MAX_HISTORY_ITEMS };
export default HistoryManager;