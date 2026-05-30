import './styles.css'

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
        models: ["deepseek-chat", "deepseek-reasoner"],
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

const CREATIVE_TEMPLATES = {
    novels: {
        category: "小说创作",
        emoji: "📖",
        templates: [
            { id: "opening", name: "小说开头", prompt: "请创作一个引人入胜的小说开头，能够立即抓住读者的注意力。故事背景：{theme}\n要求：制造悬念，建立氛围，引入主角。", example: "一个发生在民国时期的爱情故事" },
            { id: "plot_twist", name: "情节转折", prompt: "请设计一个意外但合乎逻辑的情节转折，让故事走向全新的方向。当前情节：{theme}\n要求：震撼但不突兀，改变人物命运。", example: "主角发现自己最好的朋友背叛了自己" },
            { id: "character_intro", name: "人物介绍", prompt: "请用生动的方式向读者介绍这个角色。人物设定：{theme}\n要求：外貌、性格、背景、动机融为一体。", example: "一位神秘的古董商人" },
            { id: "scene_build", name: "场景描写", prompt: "请描写这个场景，营造氛围。场景：{theme}\n要求：调动多种感官，与情节结合。", example: "雨夜的古老图书馆" },
            { id: "dialogue", name: "对话写作", prompt: "请创作符合人物性格的对话。情境：{theme}\n要求：推动情节，展现关系，语言鲜明。", example: "情侣在雨中争吵" },
            { id: "ending", name: "小说结尾", prompt: "请创作一个令人回味的结局。故事概要：{theme}\n要求：回应主题，情感满足，留有余韵。", example: "历尽磨难的两人最终重逢" },
            { id: "worldbuilding", name: "世界观设定", prompt: "请构建一个完整的世界观。设定：{theme}\n要求：地理、历史、文化、力量体系。", example: "东方仙侠世界" },
            { id: "conflict", name: "冲突设计", prompt: "请设计多层次的冲突。背景：{theme}\n要求：内部冲突、外部冲突、人际冲突。", example: "主角在道义与亲情间抉择" },
            { id: "foreshadow", name: "伏笔埋设", prompt: "请埋设巧妙的伏笔。伏笔对象：{theme}\n要求：自然融入情节，日后有呼应。", example: "某个物品将成为关键线索" },
            { id: "climax", name: "高潮场景", prompt: "请创作故事的最高潮。情节铺垫：{theme}\n要求：所有矛盾爆发，情感达到顶点。", example: "最终决战即将开始" },
            { id: "flashback", name: "回忆插叙", prompt: "请写一段回忆，揭示{theme}\n要求：与现在形成呼应，深化人物动机。", example: "主角童年的一次关键经历" },
            { id: "letter", name: "书信体叙事", prompt: "请以书信的形式讲述{theme}\n要求：展现写信人的情感与秘密。", example: "一封无法寄出的情书" },
            { id: "dream", name: "梦境描写", prompt: "请描写关于{theme}的梦境\n要求：隐喻丰富，虚实交错，暗示情节。", example: "预示未来的怪梦" }
        ]
    },
    characters: {
        category: "人物设计",
        emoji: "👤",
        templates: [
            { id: "hero", name: "主角设定", prompt: "请设计一个立体的主角。类型：{theme}\n要求：优点、缺点、动机、成长弧光。", example: "平凡少年拯救世界" },
            { id: "villain", name: "反派塑造", prompt: "请设计有魅力的反派。类型：{theme}\n要求：不脸谱化，有动机，有魅力。", example: "被误解的悲剧性反派" },
            { id: "mentor", name: "导师角色", prompt: "请设计引导主角的导师。设定：{theme}\n要求：智慧，有自己的秘密，与主角形成对比。", example: "隐世的神秘老人" },
            { id: "love_interest", name: "爱情对象", prompt: "请设计令人心动的爱情对象。设定：{theme}\n要求：有个性，与主角有化学反应，不是花瓶。", example: "独立强大的女性角色" },
            { id: "rival", name: "竞争对手", prompt: "请设计旗鼓相当的竞争对手。设定：{theme}\n要求：互相促进，亦敌亦友。", example: "主角的宿命对手" },
            { id: "sidekick", name: "伙伴/助手", prompt: "请设计一个得力助手。设定：{theme}\n要求：互补主角，推动剧情，有自己的故事。", example: "搞笑但可靠的助手" },
            { id: "antihero", name: "反英雄", prompt: "请设计一个复杂的反英雄。设定：{theme}\n要求：道德灰色，魅力十足，有自己的原则。", example: "做坏事但有底线的人" },
            { id: "mythical", name: "神秘生物", prompt: "请设计一个幻想生物。设定：{theme}\n要求：外形、能力、背景、与人类关系。", example: "东方神龙" },
            { id: "transformation", name: "角色成长", prompt: "请设计角色的成长轨迹。初始设定：{theme}\n要求：有低谷、转折点、觉醒。", example: "从懦弱到勇敢" },
            { id: "side_char", name: "配角弧光", prompt: "给配角{theme}设计完整的故事线\n要求：有自己的目标、挣扎、结局。", example: "酒馆老板" },
            { id: "family", name: "家庭关系", prompt: "设计主角的家庭：{theme}\n要求：复杂的情感纽带与矛盾。", example: "重组家庭" }
        ]
    },
    writing_tools: {
        category: "写作工具",
        emoji: "✍️",
        templates: [
            { id: "title_gen", name: "标题生成", prompt: "请为以下内容生成吸引人的标题。内容：{theme}\n要求：提供5个不同风格的标题选项。", example: "一个穿越回古代的现代人故事" },
            { id: "synopsis", name: "剧情概要", prompt: "请把以下剧情浓缩成吸引人的简介。剧情：{theme}\n要求：150-300字，悬念感。", example: "长篇小说的详细剧情" },
            { id: "chapter_outline", name: "章节大纲", prompt: "请为以下故事设计章节划分和大纲。故事：{theme}\n要求：每章有小高潮，整体节奏良好。", example: "整个故事的构思" },
            { id: "expand", name: "扩写", prompt: "请把以下内容扩写成更详细的段落。原文：{theme}\n要求：增加细节、描写、对话。", example: "简短的草稿" },
            { id: "rewrite", name: "改写优化", prompt: "请改写以下内容，让它更出色。原文：{theme}\n要求：保持原意，提升文采。", example: "需要润色的段落" },
            { id: "style_emulate", name: "风格模仿", prompt: "请用特定作家的风格来写。风格/作家：{theme}\n要求：学习风格但不抄袭。", example: "模仿鲁迅风格" },
            { id: "cut_trim", name: "精简压缩", prompt: "请把以下内容精简到一半长度。原文：{theme}\n要求：保留所有重要信息，更精炼。", example: "过于冗长的内容" },
            { id: "polish", name: "语言润色", prompt: "请润色以下文字，让它更优美。原文：{theme}\n要求：用词精准，句式优美，节奏好。", example: "写得有些粗糙的文字" }
        ]
    },
    genres: {
        category: "类型文学",
        emoji: "🎭",
        templates: [
            { id: "xianxia", name: "仙侠修真", prompt: "请创作仙侠修真风格的内容。设定：{theme}\n要求：境界、功法、丹药、门派、天地灵气。", example: "一个资质平庸的弟子的崛起" },
            { id: "fantasy", name: "奇幻魔法", prompt: "请创作西方奇幻风格内容。设定：{theme}\n要求：魔法、种族、王国、冒险。", example: "一个魔法师的成长故事" },
            { id: "scifi", name: "科幻", prompt: "请创作科幻故事。设定：{theme}\n要求：科技、未来、太空、AI。", example: "宇航员在遥远星系的奇遇" },
            { id: "mystery", name: "悬疑推理", prompt: "请创作悬疑推理故事。设定：{theme}\n要求：线索、误导、逻辑、反转。", example: "密室杀人案" },
            { id: "romance", name: "浪漫爱情", prompt: "请创作甜蜜的爱情故事。设定：{theme}\n要求：心动、误会、和解、甜蜜。", example: "霸道总裁与灰姑娘" },
            { id: "horror", name: "恐怖惊悚", prompt: "请创作恐怖氛围的故事。设定：{theme}\n要求：紧张、悬念、心理压迫。", example: "发生在废弃医院的怪事" },
            { id: "comedy", name: "幽默搞笑", prompt: "请创作搞笑幽默的内容。设定：{theme}\n要求：笑点、反差、机智。", example: "一连串的倒霉事" },
            { id: "historical", name: "历史穿越", prompt: "请创作历史或穿越故事。设定：{theme}\n要求：符合或改变历史。", example: "穿越到唐朝" }
        ]
    },
    content: {
        category: "内容创作",
        emoji: "📝",
        templates: [
            { id: "essay", name: "散文随笔", prompt: "请创作一篇优美的散文。主题：{theme}\n要求：真挚、文采、意境。", example: "关于故乡的回忆" },
            { id: "poem", name: "现代诗", prompt: "请创作一首现代诗。主题：{theme}\n要求：意象、节奏、情感。", example: "孤独的主题" },
            { id: "gu_poetry", name: "古风诗词", prompt: "请创作古风诗词。主题：{theme}\n要求：押韵、意境、用典。", example: "送别友人" },
            { id: "speech", name: "演讲稿", prompt: "请创作一篇有感染力的演讲稿。主题：{theme}\n要求：有逻辑、有情感、有气势。", example: "关于梦想的演讲" },
            { id: "marketing", name: "营销文案", prompt: "请创作吸引人的营销文案。产品/服务：{theme}\n要求：痛点、卖点、行动号召。", example: "一款智能产品" },
            { id: "story", name: "短篇故事", prompt: "请创作一个完整的短篇故事。主题：{theme}\n要求：有起承转合。", example: "陌生人之间的温暖故事" },
            { id: "copywriting", name: "公众号推文", prompt: "请创作一篇适合公众号的文章。主题：{theme}\n要求：标题吸睛、结构清晰、有共鸣。", example: "关于年轻人生活的话题" },
            { id: "product_desc", name: "产品描述", prompt: "请创作出色的产品描述。产品：{theme}\n要求：突出优势、建立信任、激发购买欲。", example: "一款保温杯" },
            { id: "review", name: "书评影评", prompt: "请写一篇深度评论。作品：{theme}\n要求：有观点、有分析、有文采。", example: "一部让你感动的电影" },
            { id: "news", name: "新闻报道", prompt: "请写一篇客观的新闻报道。事件：{theme}\n要求：5W1H、中立、清晰。", example: "社区活动" },
            { id: "diary", name: "日记随笔", prompt: "请写一篇情感真挚的日记。今日主题：{theme}\n要求：细节、真实、有温度。", example: "一个难忘的瞬间" },
            { id: "travel", name: "游记攻略", prompt: "请写一篇引人入胜的游记。目的地：{theme}\n要求：风景、感受、实用信息。", example: "一次难忘的旅行" }
        ]
    },
    ideation: {
        category: "创意灵感",
        emoji: "💡",
        templates: [
            { id: "prompt_generator", name: "提示词生成", prompt: "请为以下目标设计一个详细的AI提示词。创作目标：{theme}\n要求：详细、结构清晰、可直接使用。", example: "写一篇短篇小说" },
            { id: "story_ideas", name: "故事点子", prompt: "请为以下类型提供10个故事创意。类型：{theme}\n要求：每个点子有一句话简介。", example: "都市奇幻" },
            { id: "world_ideas", name: "世界观构思", prompt: "请构思一个新颖的世界观设定。类型：{theme}\n要求：有特色、有冲突、有故事可能性。", example: "时间可以交易的世界" },
            { id: "character_ideas", name: "人物创意", prompt: "请提供5个有趣的人物设定。类型：{theme}\n要求：独特、有故事性。", example: "配角也精彩" },
            { id: "scene_ideas", name: "场景灵感", prompt: "请提供10个令人印象深刻的场景构思。类型：{theme}\n要求：有画面感、有故事性。", example: "重逢的场景" },
            { id: "dialogue_ideas", name: "对话创意", prompt: "请提供5个有趣的对话情境。类型：{theme}\n要求：有张力、有潜台词。", example: "充满秘密的对话" }
        ]
    },
    advanced: {
        category: "高级功能",
        emoji: "🚀",
        templates: [
            { id: "co_writer", name: "AI协作写作", prompt: "请作为写作助手，与我一起完成创作。当前内容：{theme}\n要求：提供建议、补充描写、丰富对话。", example: "开头已经写好，请继续" },
            { id: "editor", name: "AI编辑", prompt: "请作为专业编辑，审阅以下内容。文章：{theme}\n要求：指出优点、不足、修改建议。", example: "写好的小说章节" },
            { id: "critic", name: "AI评论", prompt: "请作为文学评论家，评论以下作品。作品：{theme}\n要求：客观、深入、有建设性。", example: "写完的短篇故事" },
            { id: "teacher", name: "写作教学", prompt: "请教我如何提升特定写作能力。要学习：{theme}\n要求：讲解、范例、练习建议。", example: "如何把人物写活" },
            { id: "brainstorm", name: "头脑风暴", prompt: "请围绕以下主题进行头脑风暴。主题：{theme}\n要求：提出尽可能多的可能性。", example: "下个故事写什么" },
            { id: "translate_style", name: "风格转换", prompt: "请将以下内容转换成另一种风格。内容和风格：{theme}\n要求：保持内容，改变风格。", example: "把悲剧改成喜剧版本" }
        ]
    },
    writing_prompts: {
        category: "写作提示词",
        emoji: "✨",
        templates: [
            { id: "prop_prompt", name: "物品提示", prompt: "请以这个物品为核心来写。物品：{theme}\n要求：物品在故事中有关键作用。", example: "一张泛黄的旧照片" },
            { id: "sentence_prompt", name: "第一句", prompt: "请从这句话开始写。第一句：{theme}\n要求：保持这个开头。", example: "那天她才知道，自己其实不是人类" },
            { id: "emotion_prompt", name: "情感提示", prompt: "请写一段能唤起以下情感的文字。情感：{theme}\n要求：让读者感同身受。", example: "孤独感" },
            { id: "image_prompt", name: "画面提示", prompt: "请描写一个这样的场景。画面描述：{theme}\n要求：有画面感，有气氛。", example: "阳光穿过老房子的窗户" },
            { id: "theme_prompt", name: "主题提示", prompt: "请创作围绕这个主题的内容。主题：{theme}\n要求：探讨主题，有深度。", example: "选择与代价" }
        ]
    },
    professional: {
        category: "专业写作",
        emoji: "💼",
        templates: [
            { id: "business_plan", name: "商业计划书", prompt: "请为以下项目写一份商业计划。项目：{theme}\n要求：市场、产品、运营、财务。", example: "一家咖啡店" },
            { id: "resume", name: "简历优化", prompt: "请帮助优化简历。个人信息：{theme}\n要求：突出优势、专业、量化成果。", example: "软件工程师的简历" },
            { id: "cover_letter", name: "求职信", prompt: "请写一封有说服力的求职信。申请职位：{theme}\n要求：针对职位、展示优势、有个性。", example: "产品经理岗位" },
            { id: "article", name: "专业文章", prompt: "请写一篇专业领域的文章。主题：{theme}\n要求：有深度、有干货、结构清。", example: "关于人工智能的发展" },
            { id: "report", name: "分析报告", prompt: "请为以下主题写一份分析报告。主题：{theme}\n要求：数据、分析、结论、建议。", example: "市场分析报告" }
        ]
    }
};

const WRITING_STYLES = {
    general: { name: "通用", prompt: "" },
    classical: { name: "古风", prompt: "请使用古雅、凝练的中文，追求意境和韵味。用词考究，句法工整。" },
    modern: { name: "现代", prompt: "请使用自然流畅的现代白话文，简洁有力，贴近生活。" },
    lyric: { name: "诗意", prompt: "请使用优美抒情的语言，富有韵律和画面感，情感细腻。" },
    suspense: { name: "悬疑", prompt: "请营造悬念氛围，节奏紧凑，信息逐步释放，保持紧张感。" },
    romance: { name: "浪漫", prompt: "请注重情感表达，细腻温柔，营造浪漫氛围。" },
    humor: { name: "幽默", prompt: "请使用幽默风趣的语言，轻松有趣，让人会心一笑。" },
    epic: { name: "史诗", prompt: "请使用宏大叙事的笔触，气势磅礴，视野广阔。" },
    minimal: { name: "极简", prompt: "请使用简洁凝练的语言，惜墨如金，言简意赅。" }
};

const OUTPUT_LENGTHS = {
    short: { name: "短篇", min: 100, max: 300 },
    medium: { name: "中篇", min: 300, max: 800 },
    long: { name: "长篇", min: 800, max: 2000 },
    very_long: { name: "超长篇", min: 2000, max: 5000 }
};

class InkverseApp {
    constructor() {
        this.state = {
            currentMode: 'create',
            currentTemplate: null,
            currentCategory: 'novels',
            style: 'general',
            length: 'medium',
            creativity: 0.7,
            provider: 'deepseek',
            model: '',
            apiKey: '',
            customEndpoint: '',
            history: [],
            favorites: [],
            customTemplates: [],
            currentResult: null,
            isGenerating: false,
            conversationHistory: [],
            theme: 'dark',
            searchQuery: '',
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
            cachedModels: {}
        };

        this.loadState();
        this.initUI();
        this.bindEvents();
        this.autoSaveDraft();
        this.autoFetchModels();
    }

    loadState() {
        try {
            const saved = localStorage.getItem('inkverse_state');
            if (saved) {
                this.state = { ...this.state, ...JSON.parse(saved) };
            }
            // 确保默认模型被加载
            this.ensureDefaultModels();
        } catch (e) {
            console.log('No saved state');
        }
    }

    ensureDefaultModels() {
        // 为每个提供商设置默认模型（如果没有缓存）
        for (const [provider, config] of Object.entries(AI_PROVIDERS)) {
            if (!this.state.cachedModels[provider] || this.state.cachedModels[provider].length === 0) {
                if (config.models && config.models.length > 0) {
                    this.state.cachedModels[provider] = [...config.models];
                }
            }
        }
    }

    saveState() {
        const toSave = {
            provider: this.state.provider,
            model: this.state.model,
            apiKey: this.state.apiKey,
            customEndpoint: this.state.customEndpoint,
            history: this.state.history.slice(-200),
            favorites: this.state.favorites,
            customTemplates: this.state.customTemplates,
            theme: this.state.theme,
            cachedModels: this.state.cachedModels
        };
        localStorage.setItem('inkverse_state', JSON.stringify(toSave));
    }

    initUI() {
        this.renderCategories();
        this.renderTemplates();
        this.renderStyles();
        this.renderLengths();
        this.renderHistory();
        this.updateModelOptions();
        this.applyTheme();
    }

    applyTheme() {
        document.body.classList.toggle('light-theme', this.state.theme === 'light');
    }

    toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        this.saveState();
    }

    renderCategories() {
        const container = document.getElementById('categories');
        if (!container) return;

        container.innerHTML = Object.entries(CREATIVE_TEMPLATES).map(([key, cat]) => `
            <button class="category-btn ${key === this.state.currentCategory ? 'active' : ''}" data-category="${key}">
                <span class="category-emoji">${cat.emoji}</span>
                <span>${cat.category}</span>
            </button>
        `).join('');

        container.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.currentCategory = btn.dataset.category;
                this.renderCategories();
                this.renderTemplates();
            });
        });
    }

    renderTemplates() {
        const container = document.getElementById('templates');
        if (!container) return;

        let data = CREATIVE_TEMPLATES[this.state.currentCategory];
        let templates = [...data.templates];
        
        if (this.state.customTemplates.length > 0 && this.state.currentCategory === 'novels') {
            templates = [...templates, ...this.state.customTemplates];
        }

        container.innerHTML = templates.map(t => `
            <div class="template-card ${this.state.currentTemplate?.id === t.id ? 'selected' : ''}" data-id="${t.id}">
                <div class="template-header">
                    <h4>${t.name}</h4>
                    <button class="favorite-btn" data-fav-id="${t.id}" title="收藏">
                        ${this.isFavorite(t.id) ? '⭐' : '☆'}
                    </button>
                </div>
                <p class="template-hint">示例：${t.example}</p>
            </div>
        `).join('');

        container.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                const allTemplates = this.state.currentCategory === 'novels' 
                    ? [...CREATIVE_TEMPLATES.novels.templates, ...this.state.customTemplates]
                    : CREATIVE_TEMPLATES[this.state.currentCategory].templates;
                const template = allTemplates.find(t => t.id === card.dataset.id);
                if (template) {
                    this.selectTemplate(template);
                }
            });
        });

        container.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(btn.dataset.favId);
            });
        });
    }

    isFavorite(templateId) {
        return this.state.favorites.includes(templateId);
    }

    toggleFavorite(templateId) {
        if (this.isFavorite(templateId)) {
            this.state.favorites = this.state.favorites.filter(id => id !== templateId);
            this.showToast('已取消收藏');
        } else {
            this.state.favorites.push(templateId);
            this.showToast('已收藏');
        }
        this.saveState();
        this.renderTemplates();
    }

    selectTemplate(template) {
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

        container.innerHTML = Object.entries(WRITING_STYLES).map(([key, style]) => `
            <button class="style-chip ${key === this.state.style ? 'active' : ''}" data-style="${key}">
                ${style.name}
            </button>
        `).join('');

        container.querySelectorAll('.style-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.state.style = chip.dataset.style;
                this.renderStyles();
            });
        });
    }

    renderLengths() {
        const container = document.getElementById('length-select');
        if (!container) return;

        container.innerHTML = Object.entries(OUTPUT_LENGTHS).map(([key, len]) => `
            <button class="length-chip ${key === this.state.length ? 'active' : ''}" data-length="${key}">
                ${len.name}
            </button>
        `).join('');

        container.querySelectorAll('.length-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.state.length = chip.dataset.length;
                this.renderLengths();
            });
        });
    }

    renderHistory() {
        const container = document.getElementById('history');
        if (!container) return;

        let filteredHistory = this.state.history.slice();
        
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            filteredHistory = filteredHistory.filter(item => 
                item.prompt.toLowerCase().includes(query) || 
                item.result.toLowerCase().includes(query)
            );
        }

        if (filteredHistory.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无创作记录</div>';
            return;
        }

        container.innerHTML = filteredHistory.slice().reverse().map((item, index) => `
            <div class="history-item" data-index="${index}">
                <div class="history-header">
                    <span class="history-title">${item.templateName || '创作'} · ${new Date(item.timestamp).toLocaleString()}</span>
                    <button class="delete-history-btn" data-delete-id="${index}" title="删除">🗑️</button>
                </div>
                <div class="history-preview">${item.prompt.substring(0, 80)}...</div>
                <div class="history-actions">
                    <button class="history-action-btn" data-copy-id="${index}">📋 复制</button>
                    <button class="history-action-btn" data-share-id="${index}">🔗 分享</button>
                    <button class="history-action-btn" data-regenerate-id="${index}">🔄 重新生成</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-history-btn') && !e.target.closest('.history-action-btn')) {
                    const historyIndex = parseInt(item.dataset.index);
                    const historyItem = this.state.history[this.state.history.length - 1 - historyIndex];
                    if (historyItem) {
                        this.displayResult(historyItem.result, '历史作品');
                    }
                }
            });
        });

        container.querySelectorAll('.delete-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.deleteId);
                const actualIndex = this.state.history.length - 1 - index;
                this.state.history.splice(actualIndex, 1);
                this.saveState();
                this.renderHistory();
                this.showToast('已删除');
            });
        });

        container.querySelectorAll('.history-action-btn').forEach(btn => {
            if (btn.dataset.copyId !== undefined) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(btn.dataset.copyId);
                    const historyItem = this.state.history[this.state.history.length - 1 - index];
                    navigator.clipboard.writeText(historyItem.result);
                    this.showToast('已复制到剪贴板！');
                });
            } else if (btn.dataset.shareId !== undefined) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(btn.dataset.shareId);
                    const historyItem = this.state.history[this.state.history.length - 1 - index];
                    this.shareResult(historyItem.result);
                });
            } else if (btn.dataset.regenerateId !== undefined) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(btn.dataset.regenerateId);
                    const historyItem = this.state.history[this.state.history.length - 1 - index];
                    document.getElementById('prompt-input').value = historyItem.prompt;
                    this.generate();
                });
            }
        });
    }

    switchMode(mode) {
        this.state.currentMode = mode;
        
        const createPanel = document.getElementById('create-panel');
        const chatPanel = document.getElementById('chat-panel');
        const modeCreateBtn = document.getElementById('mode-create');
        const modeChatBtn = document.getElementById('mode-chat');
        
        if (mode === 'create') {
            createPanel.style.display = 'block';
            chatPanel.style.display = 'none';
            modeCreateBtn.classList.add('active');
            modeChatBtn.classList.remove('active');
        } else {
            createPanel.style.display = 'none';
            chatPanel.style.display = 'flex';
            modeChatBtn.classList.add('active');
            modeCreateBtn.classList.remove('active');
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
        
        this.state.chatHistory.push({ role: 'user', content: message });
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
            
            this.state.chatHistory.push({ role: 'assistant', content: response });
            this.saveState();
            this.renderChatHistory();
            
        } catch (e) {
            document.getElementById('typing-indicator')?.remove();
            this.showToast(`发送失败：${e.message}`, 'error');
            this.state.chatHistory.pop();
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
        setInterval(() => {
            this.saveDraft();
        }, 5000);
    }

    saveDraft() {
        const promptInput = document.getElementById('prompt-input');
        if (!promptInput) return;
        
        const content = promptInput.value.trim();
        if (content && content.length > 10) {
            this.state.draft = {
                content: content,
                template: this.state.currentTemplate?.id || null,
                timestamp: Date.now()
            };
            this.saveState();
        }
    }

    loadDraft() {
        if (this.state.draft && this.state.draft.content) {
            const promptInput = document.getElementById('prompt-input');
            if (promptInput) {
                promptInput.value = this.state.draft.content;
            }
            
            if (this.state.draft.template) {
                const template = this.findTemplateById(this.state.draft.template);
                if (template) {
                    this.selectTemplate(template);
                }
            }
        }
    }

    findTemplateById(id) {
        for (const category of Object.values(CREATIVE_TEMPLATES)) {
            const found = category.templates.find(t => t.id === id);
            if (found) return found;
        }
        return null;
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
        const provider = this.state.provider;
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
            
            let modelsEndpoint = providerConfig.modelsEndpoint;
            if (provider === 'custom' && this.state.customEndpoint) {
                const baseUrl = this.state.customEndpoint.replace(/\/chat\/completions$/, '');
                modelsEndpoint = `${baseUrl}/models`;
            }
            
            const response = await fetch(modelsEndpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.state.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
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
            
            // 合并默认模型和API获取的模型，去重
            const defaultModels = providerConfig.models || [];
            const combinedModels = [...new Set([...defaultModels, ...apiModels])].sort();
            
            if (combinedModels.length === 0) {
                infoEl.textContent = '未找到可用模型，请手动添加';
                this.showToast('未找到可用模型，请手动添加', 'error');
                return;
            }
            
            this.state.cachedModels[provider] = combinedModels;
            this.saveState();
            
            this.updateModelOptions();
            this.renderCurrentModelsList();
            infoEl.textContent = `成功获取 ${apiModels.length} 个模型，共 ${combinedModels.length} 个可用`;
            this.showToast(`成功更新模型列表！共 ${combinedModels.length} 个模型`, 'success');
            
        } catch (e) {
            console.error('获取模型列表失败:', e);
            // 如果API获取失败，检查是否有默认模型
            if (providerConfig.models && providerConfig.models.length > 0) {
                if (!this.state.cachedModels[provider] || this.state.cachedModels[provider].length === 0) {
                    this.state.cachedModels[provider] = [...providerConfig.models];
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
        let models = this.state.cachedModels[provider] || [];
        
        if (models.includes(modelName)) {
            this.showToast('该模型已存在', 'error');
            return;
        }
        
        models.push(modelName);
        models.sort();
        
        this.state.cachedModels[provider] = models;
        this.saveState();
        
        this.updateModelOptions();
        this.renderCurrentModelsList();
        input.value = '';
        this.showToast('模型添加成功');
    }
    
    removeModel(index) {
        const provider = this.state.provider;
        let models = this.state.cachedModels[provider] || [];
        
        if (index < 0 || index >= models.length) return;
        
        const removedModel = models[index];
        models.splice(index, 1);
        
        this.state.cachedModels[provider] = models;
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
            this.state.provider = e.target.value;
            this.state.model = '';
            this.updateModelOptions();
            this.renderCurrentModelsList();
            
            if (this.state.apiKey) {
                setTimeout(() => {
                    this.fetchModelsFromAPI();
                }, 500);
            }
        });
        
        document.getElementById('model-select')?.addEventListener('change', (e) => {
            this.state.model = e.target.value;
        });
        
        document.getElementById('creativity-slider')?.addEventListener('input', (e) => {
            this.state.creativity = parseFloat(e.target.value);
            document.getElementById('creativity-value').textContent = this.state.creativity.toFixed(1);
        });
        
        document.getElementById('search-input')?.addEventListener('input', (e) => {
            this.state.searchQuery = e.target.value;
            this.renderHistory();
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
        promptInput?.addEventListener('input', () => {
            this.saveDraft();
        });

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
        if (!input) {
            this.showToast('请输入内容！', 'error');
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
            
            this.state.currentResult = result;
            
            const historyItem = {
                prompt: input,
                result: result,
                templateName: this.state.currentTemplate?.name,
                timestamp: Date.now()
            };
            this.state.history.push(historyItem);
            
            this.state.stats.totalCreations++;
            this.state.stats.lastUsed = Date.now();
            if (this.state.currentTemplate) {
                this.state.stats.templatesUsed[this.state.currentTemplate.id] = 
                    (this.state.stats.templatesUsed[this.state.currentTemplate.id] || 0) + 1;
            }
            
            this.saveState();
            this.renderHistory();
            
            this.displayResult(result, 'AI创作结果');
            
            this.showToast(`生成成功！✨ 总创作: ${this.state.stats.totalCreations}次`);
        } catch (e) {
            this.showToast(`生成失败：${e.message}`, 'error');
            document.getElementById('result').innerHTML = '';
        } finally {
            this.state.isGenerating = false;
            if (btn) btn.disabled = false;
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }

    displayStreamingResult(initialText) {
        document.getElementById('result').innerHTML = `
            <div class="result-title">✨ 正在创作中...</div>
            <div class="streaming-content" id="streaming-content">
                <span class="streaming-cursor">|</span>${initialText}
            </div>
            <style>
                .streaming-content {
                    padding: 16px; background: var(--charcoal); border: 1px solid var(--gold-dim);
                    border-radius: 12px; font-family: var(--font-body); font-size: 15px;
                    line-height: 1.9; white-space: pre-wrap; color: var(--rice-white);
                    min-height: 100px;
                }
                .streaming-cursor {
                    animation: blink 1s infinite;
                    color: var(--gold);
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
            </style>
        `;
    }

    updateStreamingResult(chunk) {
        const contentEl = document.getElementById('streaming-content');
        if (contentEl) {
            const cursor = '<span class="streaming-cursor">|</span>';
            contentEl.innerHTML = contentEl.textContent + chunk + cursor;
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

        this.state.isGenerating = true;
        const btn = document.getElementById('continue-btn');
        if (btn) btn.disabled = true;

        try {
            const continuation = await this.callAIWithHistory('请继续上文创作，保持风格一致');
            const newResult = this.state.currentResult + '\n\n' + continuation;
            this.state.currentResult = newResult;
            
            this.displayResult(newResult, 'AI创作结果（已续写）');
            
            this.showToast('续写成功！');
        } catch (e) {
            this.showToast(`续写失败：${e.message}`, 'error');
        } finally {
            this.state.isGenerating = false;
            if (btn) btn.disabled = false;
        }
    }

    async callAI(userPrompt) {
        const style = WRITING_STYLES[this.state.style].prompt;
        const length = OUTPUT_LENGTHS[this.state.length];
        
        let prompt = '';
        if (this.state.currentTemplate) {
            prompt = this.state.currentTemplate.prompt.replace('{theme}', userPrompt);
        } else {
            prompt = userPrompt;
        }
        
        const fullPrompt = `${style}\n\n请生成 ${length.min}-${length.max} 字的内容。\n\n${prompt}`;
        
        const messages = [
            { role: 'system', content: '你是一位才华横溢的文学创作助手，精通各种文体。请用优美的中文进行创作。' },
            { role: 'user', content: fullPrompt }
        ];
        
        this.state.conversationHistory = [...messages];
        return await this.makeAPICall(messages);
    }

    async callAIWithStreaming(userPrompt, onChunk) {
        const style = WRITING_STYLES[this.state.style].prompt;
        const length = OUTPUT_LENGTHS[this.state.length];
        
        let prompt = '';
        if (this.state.currentTemplate) {
            prompt = this.state.currentTemplate.prompt.replace('{theme}', userPrompt);
        } else {
            prompt = userPrompt;
        }
        
        const fullPrompt = `${style}\n\n请生成 ${length.min}-${length.max} 字的内容。\n\n${prompt}`;
        
        const messages = [
            { role: 'system', content: '你是一位才华横溢的文学创作助手，精通各种文体。请用优美的中文进行创作。' },
            { role: 'user', content: fullPrompt }
        ];
        
        this.state.conversationHistory = [...messages];
        return await this.makeStreamingAPICall(messages, onChunk);
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
        const endpoint = this.state.provider === 'custom' ? 
            this.state.customEndpoint : providerConfig.endpoint;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.state.apiKey}`
            },
            body: JSON.stringify({
                model: this.state.model,
                messages: messages,
                temperature: this.state.creativity,
                max_tokens: 3000,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`API请求失败：${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

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
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            fullContent += content;
                            onChunk(content);
                        }
                    } catch (e) {
                    }
                }
            }
        }

        return fullContent;
    }

    async callAnthropicStreaming(messages, providerConfig, onChunk) {
        const systemMessage = messages.find(m => m.role === 'system');
        const otherMessages = messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content
        }));
        
        const response = await fetch(providerConfig.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.state.apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: this.state.model,
                max_tokens: 2048,
                stream: true,
                system: systemMessage?.content || '',
                messages: otherMessages
            })
        });

        if (!response.ok) {
            throw new Error(`API请求失败：${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

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
                        const content = parsed.delta?.text;
                        if (content) {
                            fullContent += content;
                            onChunk(content);
                        }
                    } catch (e) {
                    }
                }
            }
        }

        return fullContent;
    }

    async callAIWithHistory(additionalPrompt) {
        const messages = [
            ...this.state.conversationHistory,
            { role: 'user', content: additionalPrompt }
        ];
        const result = await this.makeAPICall(messages);
        this.state.conversationHistory.push({ role: 'user', content: additionalPrompt });
        this.state.conversationHistory.push({ role: 'assistant', content: result });
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
        const endpoint = this.state.provider === 'custom' ? 
            this.state.customEndpoint : providerConfig.endpoint;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.state.apiKey}`
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
        const systemMessage = messages.find(m => m.role === 'system');
        const otherMessages = messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content
        }));
        
        const response = await fetch(providerConfig.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.state.apiKey,
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
            document.getElementById('api-key').value = this.state.apiKey;
            document.getElementById('custom-endpoint').value = this.state.customEndpoint;
            document.getElementById('provider-select').value = this.state.provider;
            this.updateModelOptions();
            document.getElementById('model-select').value = this.state.model;
            this.renderCurrentModelsList();
        }
    }

    saveApiSettings() {
        this.state.apiKey = document.getElementById('api-key').value;
        this.state.customEndpoint = document.getElementById('custom-endpoint').value;
        this.state.provider = document.getElementById('provider-select').value;
        this.state.model = document.getElementById('model-select').value;
        this.saveState();
        this.toggleSettings();
        
        if (this.state.apiKey) {
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

        if (this.state.customTemplates.length === 0) {
            container.innerHTML = '<div class="empty-state">还没有自定义模板</div>';
            return;
        }

        container.innerHTML = this.state.customTemplates.map((template, index) => `
            <div class="custom-template-item">
                <div class="custom-template-item-header">
                    <h4>${template.name}</h4>
                    <div class="custom-template-item-actions">
                        <button class="custom-template-item-btn" data-edit-id="${index}">编辑</button>
                        <button class="custom-template-item-btn delete" data-delete-id="${index}">删除</button>
                    </div>
                </div>
                <div class="custom-template-item-preview">${template.prompt.substring(0, 80)}...</div>
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

        const newTemplate = {
            id: `custom_${Date.now()}`,
            name,
            prompt,
            example: example || '自定义模板'
        };

        this.state.customTemplates.push(newTemplate);
        this.saveState();
        this.renderCustomTemplates();
        this.renderTemplates();

        document.getElementById('new-template-name').value = '';
        document.getElementById('new-template-prompt').value = '';
        document.getElementById('new-template-example').value = '';

        this.showToast('模板添加成功！');
    }

    editCustomTemplate(index) {
        const template = this.state.customTemplates[index];
        if (!template) return;

        document.getElementById('new-template-name').value = template.name;
        document.getElementById('new-template-prompt').value = template.prompt;
        document.getElementById('new-template-example').value = template.example;

        this.state.customTemplates.splice(index, 1);
        this.saveState();
        this.renderCustomTemplates();
        this.renderTemplates();

        this.showToast('请修改后重新添加');
    }

    deleteCustomTemplate(index) {
        this.state.customTemplates.splice(index, 1);
        this.saveState();
        this.renderCustomTemplates();
        this.renderTemplates();
        this.showToast('模板已删除');
    }

    batchExportHistory() {
        if (this.state.history.length === 0) {
            this.showToast('暂无历史记录可导出', 'error');
            return;
        }

        const exportContent = this.state.history.map((item, index) => {
            const date = new Date(item.timestamp).toLocaleString('zh-CN');
            return `# ${index + 1}. ${item.templateName || '创作'} - ${date}\n\n## 创作内容\n${item.prompt}\n\n## AI生成\n${item.result}\n\n---\n`;
        }).join('\n');

        const header = `# 墨韵AI创作记录导出\n\n导出时间: ${new Date().toLocaleString('zh-CN')}\n共 ${this.state.history.length} 条创作记录\n\n---\n\n`;

        const fullContent = header + exportContent;

        const blob = new Blob([fullContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inkverse-export-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast(`已导出 ${this.state.history.length} 条记录！`);
    }
}

const app = new InkverseApp();
window.app = app;
