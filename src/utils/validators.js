/**
 * 验证函数
 * 提供 API密钥验证、输入验证等功能
 */

/**
 * 验证 API Key 格式
 * @param {string} apiKey - API Key
 * @param {string} provider - 提供商名称
 * @returns {Object} { valid: boolean, message: string }
 */
function validateApiKey(apiKey, provider) {
    if (!apiKey || typeof apiKey !== 'string') {
        return { valid: false, message: 'API Key 不能为空' };
    }

    const trimmedKey = apiKey.trim();
    
    if (trimmedKey.length < 10) {
        return { valid: false, message: 'API Key 长度太短' };
    }

    // 不同提供商的验证规则
    const rules = {
        openai: {
            pattern: /^sk-[A-Za-z0-9_-]{20,}$/,
            message: 'OpenAI API Key 格式不正确，应以 sk- 开头'
        },
        anthropic: {
            pattern: /^sk-ant-[A-Za-z0-9_-]{20,}$/,
            message: 'Anthropic API Key 格式不正确，应以 sk-ant- 开头'
        },
        deepseek: {
            pattern: /^sk-[A-Za-z0-9]{30,}$/,
            message: 'DeepSeek API Key 格式不正确'
        },
        qwen: {
            pattern: /^[A-Za-z0-9]{20,}$/,
            message: '千问 API Key 格式不正确'
        },
        glm: {
            pattern: /^[A-Za-z0-9]{20,}$/,
            message: '智谱 AI API Key 格式不正确'
        },
        moonshot: {
            pattern: /^sk-[A-Za-z0-9]{20,}$/,
            message: '月之暗面 API Key 格式不正确'
        },
        doubao: {
            pattern: /^[A-Za-z0-9_-]{20,}$/,
            message: '豆包 API Key 格式不正确'
        },
        yi: {
            pattern: /^丝[A-Za-z0-9]{20,}$/,
            message: '零一万物 API Key 格式不正确'
        },
        custom: {
            pattern: /.+/,
            message: '自定义端点 URL 不能为空'
        }
    };

    const rule = rules[provider] || rules.custom;
    
    if (!rule.pattern.test(trimmedKey)) {
        return { valid: false, message: rule.message };
    }

    return { valid: true, message: '验证通过' };
}

/**
 * 验证 URL 格式
 * @param {string} url - URL 字符串
 * @returns {boolean}
 */
function isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

/**
 * 验证自定义端点
 * @param {string} endpoint - 端点 URL
 * @returns {Object} { valid: boolean, message: string }
 */
function validateCustomEndpoint(endpoint) {
    if (!endpoint || typeof endpoint !== 'string') {
        return { valid: false, message: '端点地址不能为空' };
    }

    const trimmed = endpoint.trim();
    
    if (!isValidUrl(trimmed)) {
        return { valid: false, message: '端点地址格式不正确，请输入完整的 URL' };
    }

    // 检查是否包含 /chat/completions
    if (!trimmed.includes('/chat/completions')) {
        return { valid: false, message: '端点地址应包含 /chat/completions 路径' };
    }

    return { valid: true, message: '验证通过' };
}

/**
 * 验证模型名称
 * @param {string} model - 模型名称
 * @returns {Object} { valid: boolean, message: string }
 */
function validateModel(model) {
    if (!model || typeof model !== 'string') {
        return { valid: false, message: '模型名称不能为空' };
    }

    const trimmed = model.trim();
    
    if (trimmed.length < 2) {
        return { valid: false, message: '模型名称太短' };
    }

    if (trimmed.length > 100) {
        return { valid: false, message: '模型名称太长' };
    }

    // 检查是否包含非法字符
    const invalidChars = /[<>\"\'\\|]/;
    if (invalidChars.test(trimmed)) {
        return { valid: false, message: '模型名称包含非法字符' };
    }

    return { valid: true, message: '验证通过' };
}

/**
 * 验证创作输入
 * @param {string} input - 用户输入
 * @returns {Object} { valid: boolean, message: string }
 */
function validatePromptInput(input) {
    if (!input || typeof input !== 'string') {
        return { valid: false, message: '输入内容不能为空' };
    }

    const trimmed = input.trim();
    
    if (trimmed.length < 2) {
        return { valid: false, message: '输入内容太短' };
    }

    if (trimmed.length > 50000) {
        return { valid: false, message: '输入内容太长（最大 50000 字符）' };
    }

    return { valid: true, message: '验证通过' };
}

/**
 * 验证模板名称
 * @param {string} name - 模板名称
 * @returns {Object} { valid: boolean, message: string }
 */
function validateTemplateName(name) {
    if (!name || typeof name !== 'string') {
        return { valid: false, message: '模板名称不能为空' };
    }

    const trimmed = name.trim();
    
    if (trimmed.length < 1) {
        return { valid: false, message: '模板名称不能为空' };
    }

    if (trimmed.length > 50) {
        return { valid: false, message: '模板名称太长（最大 50 字符）' };
    }

    return { valid: true, message: '验证通过' };
}

/**
 * 验证模板提示词
 * @param {string} prompt - 模板提示词
 * @returns {Object} { valid: boolean, message: string }
 */
function validateTemplatePrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') {
        return { valid: false, message: '模板提示词不能为空' };
    }

    const trimmed = prompt.trim();
    
    if (trimmed.length < 5) {
        return { valid: false, message: '模板提示词太短（至少 5 个字符）' };
    }

    if (trimmed.length > 5000) {
        return { valid: false, message: '模板提示词太长（最大 5000 字符）' };
    }

    // 检查是否包含 {theme} 占位符
    if (!trimmed.includes('{theme}')) {
        return { valid: false, message: '模板提示词应包含 {theme} 占位符' };
    }

    return { valid: true, message: '验证通过' };
}

/**
 * 验证创造力参数
 * @param {number} creativity - 创造力值 (0-1)
 * @returns {Object} { valid: boolean, message: string }
 */
function validateCreativity(creativity) {
    if (typeof creativity !== 'number') {
        return { valid: false, message: '创造力值必须是数字' };
    }

    if (creativity < 0 || creativity > 1) {
        return { valid: false, message: '创造力值必须在 0-1 之间' };
    }

    return { valid: true, message: '验证通过' };
}

/**
 * 验证会话消息
 * @param {string} message - 消息内容
 * @returns {Object} { valid: boolean, message: string }
 */
function validateChatMessage(message) {
    if (!message || typeof message !== 'string') {
        return { valid: false, message: '消息内容不能为空' };
    }

    const trimmed = message.trim();
    
    if (trimmed.length < 1) {
        return { valid: false, message: '消息内容不能为空' };
    }

    if (trimmed.length > 10000) {
        return { valid: false, message: '消息内容太长（最大 10000 字符）' };
    }

    return { valid: true, message: '验证通过' };
}

/**
 * 清理和转义字符串（防止 XSS）
 * @param {string} str - 输入字符串
 * @returns {string}
 */
function sanitizeString(str) {
    if (!str || typeof str !== 'string') return '';
    
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * 验证搜索查询
 * @param {string} query - 搜索查询
 * @returns {Object} { valid: boolean, message: string }
 */
function validateSearchQuery(query) {
    if (!query || typeof query !== 'string') {
        return { valid: true, message: '查询可以为空' };
    }

    if (query.length > 200) {
        return { valid: false, message: '搜索查询太长（最大 200 字符）' };
    }

    return { valid: true, message: '验证通过' };
}

export {
    validateApiKey,
    isValidUrl,
    validateCustomEndpoint,
    validateModel,
    validatePromptInput,
    validateTemplateName,
    validateTemplatePrompt,
    validateCreativity,
    validateChatMessage,
    sanitizeString,
    validateSearchQuery
};