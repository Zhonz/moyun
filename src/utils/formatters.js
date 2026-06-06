/**
 * 格式化函数
 * 提供日期格式化、文本处理等工具函数
 */

/**
 * 格式化日期为本地字符串
 * @param {number|Date} date - 日期戳或 Date 对象
 * @param {string} locale - 本地化标识，默认 'zh-CN'
 * @returns {string}
 */
function formatDate(date, locale = 'zh-CN') {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    
    if (isNaN(d.getTime())) return '';
    
    return d.toLocaleString(locale);
}

/**
 * 格式化日期为相对时间
 * @param {number|Date} date - 日期戳或 Date 对象
 * @returns {string}
 */
function formatRelativeTime(date) {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    
    if (isNaN(d.getTime())) return '';
    
    const now = Date.now();
    const diff = now - d.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (seconds < 60) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    if (weeks < 4) return `${weeks} 周前`;
    if (months < 12) return `${months} 个月前`;
    return `${years} 年前`;
}

/**
 * 格式化日期为短格式
 * @param {number|Date} date - 日期戳或 Date 对象
 * @returns {string}
 */
function formatShortDate(date) {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    
    if (isNaN(d.getTime())) return '';
    
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === d.toDateString();
    
    if (isToday) {
        return `今天 ${formatTime(d)}`;
    }
    
    if (isYesterday) {
        return `昨天 ${formatTime(d)}`;
    }
    
    return `${d.getMonth() + 1}/${d.getDate()} ${formatTime(d)}`;
}

/**
 * 格式化时间
 * @param {number|Date} date - 日期戳或 Date 对象
 * @returns {string}
 */
function formatTime(date) {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    
    if (isNaN(d.getTime())) return '';
    
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
}

/**
 * 截断文本并添加省略号
 * @param {string} text - 输入文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 省略号，默认 '...'
 * @returns {string}
 */
function truncateText(text, maxLength = 100, suffix = '...') {
    if (!text || typeof text !== 'string') return '';
    
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 转义 HTML 特殊字符
 * @param {string} text - 输入文本
 * @returns {string}
 */
function escapeHtml(text) {
    if (!text || typeof text !== 'string') return '';
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * 反转义 HTML
 * @param {string} text - 输入文本
 * @returns {string}
 */
function unescapeHtml(text) {
    if (!text || typeof text !== 'string') return '';
    
    const map = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#039;': "'"
    };
    
    return text.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, entity => map[entity]);
}

/**
 * 转义正则表达式特殊字符
 * @param {string} text - 输入文本
 * @returns {string}
 */
function escapeRegExp(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 清理空白字符
 * @param {string} text - 输入文本
 * @param {boolean} preserveNewlines - 是否保留换行
 * @returns {string}
 */
function cleanWhitespace(text, preserveNewlines = true) {
    if (!text || typeof text !== 'string') return '';
    
    if (preserveNewlines) {
        return text
            .replace(/[ \t]+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }
    
    return text
        .replace(/[ \t]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * 高亮搜索关键词
 * @param {string} text - 原始文本
 * @param {string} keyword - 关键词
 * @param {string} tag - 包裹标签，默认 'mark'
 * @returns {string}
 */
function highlightKeyword(text, keyword, tag = 'mark') {
    if (!text || !keyword || typeof text !== 'string') return text;
    
    const escaped = escapeRegExp(keyword);
    const regex = new RegExp(`(${escaped})`, 'gi');
    
    return text.replace(regex, `<${tag}>$1</${tag}>`);
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string}
 */
function formatFileSize(bytes) {
    if (typeof bytes !== 'number' || bytes < 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let size = bytes;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(unitIndex > 0 ? 2 : 0)} ${units[unitIndex]}`;
}

/**
 * 格式化数字
 * @param {number} num - 数字
 * @param {string} locale - 本地化标识
 * @returns {string}
 */
function formatNumber(num, locale = 'zh-CN') {
    if (typeof num !== 'number') return '0';
    
    return num.toLocaleString(locale);
}

/**
 * 将 Markdown 转换为纯文本
 * @param {string} markdown - Markdown 文本
 * @returns {string}
 */
function markdownToPlainText(markdown) {
    if (!markdown || typeof markdown !== 'string') return '';
    
    return markdown
        .replace(/#{1,6}\s?/g, '') // 移除标题标记
        .replace(/\*\*(.+?)\*\*/g, '$1') // 移除粗体
        .replace(/\*(.+?)\*/g, '$1') // 移除斜体
        .replace(/`(.+?)`/g, '$1') // 移除行内代码
        .replace(/```[\s\S]*?```/g, '') // 移除代码块
        .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 移除链接
        .replace(/!\[.*?\]\(.+?\)/g, '') // 移除图片
        .replace(/^\s*[-*+]\s/gm, '') // 移除列表标记
        .replace(/^\s*\d+\.\s/gm, '') // 移除有序列表标记
        .replace(/^\s*>\s?/gm, '') // 移除引用
        .trim();
}

/**
 * 提取文本摘要
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @returns {string}
 */
function extractSummary(text, maxLength = 150) {
    if (!text || typeof text !== 'string') return '';
    
    // 移除 Markdown 格式
    const plain = markdownToPlainText(text);
    
    // 截断
    return truncateText(plain, maxLength);
}

/**
 * 首字母大写
 * @param {string} text - 输入文本
 * @returns {string}
 */
function capitalize(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * 将字符串转换为 URL 友好的格式
 * @param {string} text - 输入文本
 * @returns {string}
 */
function slugify(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export {
    formatDate,
    formatRelativeTime,
    formatShortDate,
    formatTime,
    truncateText,
    escapeHtml,
    unescapeHtml,
    escapeRegExp,
    cleanWhitespace,
    highlightKeyword,
    formatFileSize,
    formatNumber,
    markdownToPlainText,
    extractSummary,
    capitalize,
    slugify
};