/**
 * 模板管理器
 * 负责模板的缓存、搜索和过滤
 */

const CREATIVE_TEMPLATES = {
    novels: {
        category: "小说创作",
        emoji: "📖",
        templates: [
            { id: "opening", name: "小说开头", prompt: "请创作一个引人入胜的小说开头，能够立即抓住读者的注意力。故事背景：{theme}要求：制造悬念，建立氛围，引入主角。", example: "一个发生在民国时期的爱情故事" },
            { id: "plot_twist", name: "情节转折", prompt: "请设计一个意外但合乎逻辑的情节转折，让故事走向全新的方向。当前情节：{theme}要求：震撼但不突兀，改变人物命运。", example: "主角发现自己最好的朋友背叛了自己" },
            { id: "character_intro", name: "人物介绍", prompt: "请用生动的方式向读者介绍这个角色。人物设定：{theme}要求：外貌、性格、背景、动机融为一体。", example: "一位神秘的古董商人" },
            { id: "scene_build", name: "场景描写", prompt: "请描写这个场景，营造氛围。场景：{theme}要求：调动多种感官，与情节结合。", example: "雨夜的古老图书馆" },
            { id: "dialogue", name: "对话写作", prompt: "请创作符合人物性格的对话。情境：{theme}要求：推动情节，展现关系，语言鲜明。", example: "情侣在雨中争吵" },
            { id: "ending", name: "小说结尾", prompt: "请创作一个令人回味的结局。故事概要：{theme}要求：回应主题，情感满足，留有余韵。", example: "历尽磨难的两人最终重逢" },
            { id: "worldbuilding", name: "世界观设定", prompt: "请构建一个完整的世界观。设定：{theme}要求：地理、历史、文化、力量体系。", example: "东方仙侠世界" },
            { id: "conflict", name: "冲突设计", prompt: "请设计多层次的冲突。背景：{theme}要求：内部冲突、外部冲突、人际冲突。", example: "主角在道义与亲情间抉择" },
            { id: "foreshadow", name: "伏笔埋设", prompt: "请埋设巧妙的伏笔。伏笔对象：{theme}要求：自然融入情节，日后有呼应。", example: "某个物品将成为关键线索" },
            { id: "climax", name: "高潮场景", prompt: "请创作故事的最高潮。情节铺垫：{theme}要求：所有矛盾爆发，情感达到顶点。", example: "最终决战即将开始" },
            { id: "flashback", name: "回忆插叙", prompt: "请写一段回忆，揭示{theme}要求：与现在形成呼应，深化人物动机。", example: "主角童年的一次关键经历" },
            { id: "letter", name: "书信体叙事", prompt: "请以书信的形式讲述{theme}要求：展现写信人的情感与秘密。", example: "一封无法寄出的情书" },
            { id: "dream", name: "梦境描写", prompt: "请描写关于{theme}的梦境，要求：隐喻丰富，虚实交错，暗示情节。", example: "预示未来的怪梦" }
        ]
    },
    characters: {
        category: "人物设计",
        emoji: "👤",
        templates: [
            { id: "hero", name: "主角设定", prompt: "请设计一个立体的主角。类型：{theme}要求：优点、缺点、动机、成长弧光。", example: "平凡少年拯救世界" },
            { id: "villain", name: "反派塑造", prompt: "请设计有魅力的反派。类型：{theme}要求：不脸谱化，有动机，有魅力。", example: "被误解的悲剧性反派" },
            { id: "mentor", name: "导师角色", prompt: "请设计引导主角的导师。设定：{theme}要求：智慧，有自己的秘密，与主角形成对比。", example: "隐世的神秘老人" },
            { id: "love_interest", name: "爱情对象", prompt: "请设计令人心动的爱情对象。设定：{theme}要求：有个性，与主角有化学反应，不是花瓶。", example: "独立强大的女性角色" },
            { id: "rival", name: "竞争对手", prompt: "请设计旗鼓相当的竞争对手。设定：{theme}要求：互相促进，亦敌亦友。", example: "主角的宿命对手" },
            { id: "sidekick", name: "伙伴/助手", prompt: "请设计一个得力助手。设定：{theme}要求：互补主角，推动剧情，有自己的故事。", example: "搞笑但可靠的助手" },
            { id: "antihero", name: "反英雄", prompt: "请设计一个复杂的反英雄。设定：{theme}要求：道德灰色，魅力十足，有自己的原则。", example: "做坏事但有底线的人" },
            { id: "mythical", name: "神秘生物", prompt: "请设计一个幻想生物。设定：{theme}要求：外形、能力、背景、与人类关系。", example: "东方神龙" },
            { id: "transformation", name: "角色成长", prompt: "请设计角色的成长轨迹。初始设定：{theme}要求：有低谷、转折点、觉醒。", example: "从懦弱到勇敢" },
            { id: "side_char", name: "配角弧光", prompt: "给配角{theme}设计完整的故事线，要求：有自己的目标、挣扎、结局。", example: "酒馆老板" },
            { id: "family", name: "家庭关系", prompt: "设计主角的家庭：{theme}要求：复杂的情感纽带与矛盾。", example: "重组家庭" }
        ]
    },
    writing_tools: {
        category: "写作工具",
        emoji: "✍️",
        templates: [
            { id: "title_gen", name: "标题生成", prompt: "请为以下内容生成吸引人的标题。内容：{theme}要求：提供5个不同风格的标题选项。", example: "一个穿越回古代的现代人故事" },
            { id: "synopsis", name: "剧情概要", prompt: "请把以下剧情浓缩成吸引人的简介。剧情：{theme}要求：150-300字，悬念感。", example: "长篇小说的详细剧情" },
            { id: "chapter_outline", name: "章节大纲", prompt: "请为以下故事设计章节划分和大纲。故事：{theme}要求：每章有小高潮，整体节奏良好。", example: "整个故事的构思" },
            { id: "expand", name: "扩写", prompt: "请把以下内容扩写成更详细的段落。原文：{theme}要求：增加细节、描写、对话。", example: "简短的草稿" },
            { id: "rewrite", name: "改写优化", prompt: "请改写以下内容，让它更出色。原文：{theme}要求：保持原意，提升文采。", example: "需要润色的段落" },
            { id: "style_emulate", name: "风格模仿", prompt: "请用特定作家的风格来写。风格/作家：{theme}要求：学习风格但不抄袭。", example: "模仿鲁迅风格" },
            { id: "cut_trim", name: "精简压缩", prompt: "请把以下内容精简到一半长度。原文：{theme}要求：保留所有重要信息，更精炼。", example: "过于冗长的内容" },
            { id: "polish", name: "语言润色", prompt: "请润色以下文字，让它更优美。原文：{theme}要求：用词精准，句式优美，节奏好。", example: "写得有些粗糙的文字" }
        ]
    },
    genres: {
        category: "类型文学",
        emoji: "🎭",
        templates: [
            { id: "xianxia", name: "仙侠修真", prompt: "请创作仙侠修真风格的内容。设定：{theme}要求：境界、功法、丹药、门派、天地灵气。", example: "一个资质平庸的弟子的崛起" },
            { id: "fantasy", name: "奇幻魔法", prompt: "请创作西方奇幻风格内容。设定：{theme}要求：魔法、种族、王国、冒险。", example: "一个魔法师的成长故事" },
            { id: "scifi", name: "科幻", prompt: "请创作科幻故事。设定：{theme}要求：科技、未来、太空、AI。", example: "宇航员在遥远星系的奇遇" },
            { id: "mystery", name: "悬疑推理", prompt: "请创作悬疑推理故事。设定：{theme}要求：线索、误导、逻辑、反转。", example: "密室杀人案" },
            { id: "romance", name: "浪漫爱情", prompt: "请创作甜蜜的爱情故事。设定：{theme}要求：心动、误会、和解、甜蜜。", example: "霸道总裁与灰姑娘" },
            { id: "horror", name: "恐怖惊悚", prompt: "请创作恐怖氛围的故事。设定：{theme}要求：紧张、悬念、心理压迫。", example: "发生在废弃医院的怪事" },
            { id: "comedy", name: "幽默搞笑", prompt: "请创作搞笑幽默的内容。设定：{theme}要求：笑点、反差、机智。", example: "一连串的倒霉事" },
            { id: "historical", name: "历史穿越", prompt: "请创作历史或穿越故事。设定：{theme}要求：符合或改变历史。", example: "穿越到唐朝" }
        ]
    },
    content: {
        category: "内容创作",
        emoji: "📝",
        templates: [
            { id: "essay", name: "散文随笔", prompt: "请创作一篇优美的散文。主题：{theme}要求：真挚、文采、意境。", example: "关于故乡的回忆" },
            { id: "poem", name: "现代诗", prompt: "请创作一首现代诗。主题：{theme}要求：意象、节奏、情感。", example: "孤独的主题" },
            { id: "gu_poetry", name: "古风诗词", prompt: "请创作古风诗词。主题：{theme}要求：押韵、意境、用典。", example: "送别友人" },
            { id: "speech", name: "演讲稿", prompt: "请创作一篇有感染力的演讲稿。主题：{theme}要求：有逻辑、有情感、有气势。", example: "关于梦想的演讲" },
            { id: "marketing", name: "营销文案", prompt: "请创作吸引人的营销文案。产品/服务：{theme}要求：痛点、卖点、行动号召。", example: "一款智能产品" },
            { id: "story", name: "短篇故事", prompt: "请创作一个完整的短篇故事。主题：{theme}要求：有起承转合。", example: "陌生人之间的温暖故事" },
            { id: "copywriting", name: "公众号推文", prompt: "请创作一篇适合公众号的文章。主题：{theme}要求：标题吸睛、结构清晰、有共鸣。", example: "关于年轻人生活的话题" },
            { id: "product_desc", name: "产品描述", prompt: "请创作出色的产品描述。产品：{theme}要求：突出优势、建立信任、激发购买欲。", example: "一款保温杯" },
            { id: "review", name: "书评影评", prompt: "请写一篇深度评论。作品：{theme}要求：有观点、有分析、有文采。", example: "一部让你感动的电影" },
            { id: "news", name: "新闻报道", prompt: "请写一篇客观的新闻报道。事件：{theme}要求：5W1H、中立、清晰。", example: "社区活动" },
            { id: "diary", name: "日记随笔", prompt: "请写一篇情感真挚的日记。今日主题：{theme}要求：细节、真实、有温度。", example: "一个难忘的瞬间" },
            { id: "travel", name: "游记攻略", prompt: "请写一篇引人入胜的游记。目的地：{theme}要求：风景、感受、实用信息。", example: "一次难忘的旅行" }
        ]
    },
    ideation: {
        category: "创意灵感",
        emoji: "💡",
        templates: [
            { id: "prompt_generator", name: "提示词生成", prompt: "请为以下目标设计一个详细的AI提示词。创作目标：{theme}要求：详细、结构清晰、可直接使用。", example: "写一篇短篇小说" },
            { id: "story_ideas", name: "故事点子", prompt: "请为以下类型提供10个故事创意。类型：{theme}要求：每个点子有一句话简介。", example: "都市奇幻" },
            { id: "world_ideas", name: "世界观构思", prompt: "请构思一个新颖的世界观设定。类型：{theme}要求：有特色、有冲突、有故事可能性。", example: "时间可以交易的世界" },
            { id: "character_ideas", name: "人物创意", prompt: "请提供5个有趣的人物设定。类型：{theme}要求：独特、有故事性。", example: "配角也精彩" },
            { id: "scene_ideas", name: "场景灵感", prompt: "请提供10个令人印象深刻的场景构思。类型：{theme}要求：有画面感、有故事性。", example: "重逢的场景" },
            { id: "dialogue_ideas", name: "对话创意", prompt: "请提供5个有趣的对话情境。类型：{theme}要求：有张力、有潜台词。", example: "充满秘密的对话" }
        ]
    },
    advanced: {
        category: "高级功能",
        emoji: "🚀",
        templates: [
            { id: "co_writer", name: "AI协作写作", prompt: "请作为写作助手，与我一起完成创作。当前内容：{theme}要求：提供建议、补充描写、丰富对话。", example: "开头已经写好，请继续" },
            { id: "editor", name: "AI编辑", prompt: "请作为专业编辑，审阅以下内容。文章：{theme}要求：指出优点、不足、修改建议。", example: "写好的小说章节" },
            { id: "critic", name: "AI评论", prompt: "请作为文学评论家，评论以下作品。作品：{theme}要求：客观、深入、有建设性。", example: "写完的短篇故事" },
            { id: "teacher", name: "写作教学", prompt: "请教我如何提升特定写作能力。要学习：{theme}要求：讲解、范例、练习建议。", example: "如何把人物写活" },
            { id: "brainstorm", name: "头脑风暴", prompt: "请围绕以下主题进行头脑风暴。主题：{theme}要求：提出尽可能多的可能性。", example: "下个故事写什么" },
            { id: "translate_style", name: "风格转换", prompt: "请将以下内容转换成另一种风格。内容和风格：{theme}要求：保持内容，改变风格。", example: "把悲剧改成喜剧版本" }
        ]
    },
    writing_prompts: {
        category: "写作提示词",
        emoji: "✨",
        templates: [
            { id: "prop_prompt", name: "物品提示", prompt: "请以这个物品为核心来写。物品：{theme}要求：物品在故事中有关键作用。", example: "一张泛黄的旧照片" },
            { id: "sentence_prompt", name: "第一句", prompt: "请从这句话开始写。第一句：{theme}要求：保持这个开头。", example: "那天她才知道，自己其实不是人类" },
            { id: "emotion_prompt", name: "情感提示", prompt: "请写一段能唤起以下情感的文字。情感：{theme}要求：让读者感同身受。", example: "孤独感" },
            { id: "image_prompt", name: "画面提示", prompt: "请描写一个这样的场景。画面描述：{theme}要求：有画面感，有气氛。", example: "阳光穿过老房子的窗户" },
            { id: "theme_prompt", name: "主题提示", prompt: "请创作围绕这个主题的内容。主题：{theme}要求：探讨主题，有深度。", example: "选择与代价" }
        ]
    },
    professional: {
        category: "专业写作",
        emoji: "💼",
        templates: [
            { id: "business_plan", name: "商业计划书", prompt: "请为以下项目写一份商业计划。项目：{theme}要求：市场、产品、运营、财务。", example: "一家咖啡店" },
            { id: "resume", name: "简历优化", prompt: "请帮助优化简历。个人信息：{theme}要求：突出优势、专业、量化成果。", example: "软件工程师的简历" },
            { id: "cover_letter", name: "求职信", prompt: "请写一封有说服力的求职信。申请职位：{theme}要求：针对职位、展示优势、有个性。", example: "产品经理岗位" },
            { id: "article", name: "专业文章", prompt: "请写一篇专业领域的文章。主题：{theme}要求：有深度、有干货、结构清。", example: "关于人工智能的发展" },
            { id: "report", name: "分析报告", prompt: "请为以下主题写一份分析报告。主题：{theme}要求：数据、分析、结论、建议。", example: "市场分析报告" }
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

class TemplateManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.cache = new Map();
    }

    /**
     * 获取所有模板
     */
    getAllTemplates() {
        return CREATIVE_TEMPLATES;
    }

    /**
     * 获取写作风格
     */
    getWritingStyles() {
        return WRITING_STYLES;
    }

    /**
     * 获取输出长度配置
     */
    getOutputLengths() {
        return OUTPUT_LENGTHS;
    }

    /**
     * 获取指定分类的模板
     */
    getTemplatesByCategory(categoryKey) {
        return CREATIVE_TEMPLATES[categoryKey] || null;
    }

    /**
     * 搜索所有模板
     */
    searchAllTemplates(query) {
        const allTemplates = [];
        Object.values(CREATIVE_TEMPLATES).forEach(cat => {
            allTemplates.push(...cat.templates);
        });
        
        const state = this.stateManager.getState();
        if (state.customTemplates && state.customTemplates.length > 0) {
            allTemplates.push(...state.customTemplates);
        }
        
        if (!query || !query.trim()) {
            return allTemplates;
        }
        
        const lowerQuery = query.toLowerCase();
        return allTemplates.filter(t => 
            t.name.toLowerCase().includes(lowerQuery) || 
            t.example.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * 根据分类和搜索过滤模板
     */
    filterTemplates(categoryKey, searchQuery = '') {
        let data = CREATIVE_TEMPLATES[categoryKey];
        if (!data) return [];
        
        let templates = [...data.templates];
        
        const state = this.stateManager.getState();
        if (state.customTemplates && state.customTemplates.length > 0 && categoryKey === 'novels') {
            templates = [...templates, ...state.customTemplates];
        }
        
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            templates = templates.filter(t => 
                t.name.toLowerCase().includes(query) || 
                t.example.toLowerCase().includes(query)
            );
        }
        
        return templates;
    }

    /**
     * 通过ID查找模板
     */
    findTemplateById(id) {
        for (const category of Object.values(CREATIVE_TEMPLATES)) {
            const found = category.templates.find(t => t.id === id);
            if (found) return found;
        }
        
        const state = this.stateManager.getState();
        if (state.customTemplates) {
            const found = state.customTemplates.find(t => t.id === id);
            if (found) return found;
        }
        
        return null;
    }

    /**
     * 获取模板所属分类名
     */
    getTemplateCategoryName(template) {
        for (const categoryKey in CREATIVE_TEMPLATES) {
            const category = CREATIVE_TEMPLATES[categoryKey];
            if (category.templates && category.templates.includes(template)) {
                return category.category;
            }
        }
        return '';
    }

    /**
     * 检查模板是否已收藏
     */
    isFavorite(templateId) {
        const favorites = this.stateManager.get('favorites') || [];
        return favorites.includes(templateId);
    }

    /**
     * 切换收藏状态
     */
    toggleFavorite(templateId) {
        const favorites = [...(this.stateManager.get('favorites') || [])];
        const index = favorites.indexOf(templateId);
        
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(templateId);
        }
        
        this.stateManager.set('favorites', favorites);
        this.stateManager.save();
        
        return index === -1;
    }

    /**
     * 获取收藏的模板
     */
    getFavorites() {
        const favorites = this.stateManager.get('favorites') || [];
        return favorites.map(id => this.findTemplateById(id)).filter(Boolean);
    }

    /**
     * 获取所有分类
     */
    getCategories() {
        return Object.entries(CREATIVE_TEMPLATES).map(([key, cat]) => ({
            key,
            name: cat.category,
            emoji: cat.emoji
        }));
    }

    /**
     * 添加自定义模板
     */
    addCustomTemplate(name, prompt, example) {
        const customTemplates = [...(this.stateManager.get('customTemplates') || [])];
        const newTemplate = {
            id: `custom_${Date.now()}`,
            name,
            prompt,
            example: example || '自定义模板'
        };
        customTemplates.push(newTemplate);
        this.stateManager.set('customTemplates', customTemplates);
        this.stateManager.save();
        return newTemplate;
    }

    /**
     * 更新自定义模板
     */
    updateCustomTemplate(index, updates) {
        const customTemplates = [...(this.stateManager.get('customTemplates') || [])];
        if (index < 0 || index >= customTemplates.length) return null;
        
        customTemplates[index] = { ...customTemplates[index], ...updates };
        this.stateManager.set('customTemplates', customTemplates);
        this.stateManager.save();
        return customTemplates[index];
    }

    /**
     * 删除自定义模板
     */
    deleteCustomTemplate(index) {
        const customTemplates = [...(this.stateManager.get('customTemplates') || [])];
        if (index < 0 || index >= customTemplates.length) return false;
        
        customTemplates.splice(index, 1);
        this.stateManager.set('customTemplates', customTemplates);
        this.stateManager.save();
        return true;
    }

    /**
     * 应用模板提示词
     */
    applyTemplate(template, userInput) {
        if (!template) return userInput;
        return template.prompt.replace('{theme}', userInput);
    }
}

export { TemplateManager, CREATIVE_TEMPLATES, WRITING_STYLES, OUTPUT_LENGTHS };
export default TemplateManager;