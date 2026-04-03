// 消息格式化钩子的处理函数

/**
 * 处理微信通道内容（纯文本兼容）
 * 将代码块转换为单反引号格式
 */
function processWeChatContent(content: string): string {
    const lines = content.split('\n');
    const processedLines: string[] = [];
    let inCodeBlock = false;
    const codeLines: string[] = [];

    for (const line of lines) {
        // 检测代码块开始
        if (line.trim().startsWith('```')) {
            if (!inCodeBlock) {
                inCodeBlock = true;
                // 开始代码块，添加标记
                processedLines.push('`');
            } else {
                inCodeBlock = false;
                // 结束代码块，添加标记
                if (codeLines.length > 0) {
                    processedLines.push(...codeLines);
                }
                processedLines.push('`');
                codeLines.length = 0; // 清空数组
            }
            continue;
        }

        // 在代码块中
        if (inCodeBlock) {
            // 每行前添加2个空格缩进
            codeLines.push('  ' + line);
        } else {
            processedLines.push(line);
        }
    }

    // 处理未闭合的代码块
    if (inCodeBlock && codeLines.length > 0) {
        processedLines.push('`');
        processedLines.push(...codeLines);
        processedLines.push('`');
    }

    return processedLines.join('\n');
}

/**
 * 处理 Markdown 通道内容（飞书、Lark、钉钉）
 * 保持代码块格式，支持语言标记
 */
function processMarkdownContent(content: string): string {
    const lines = content.split('\n');
    const processedLines: string[] = [];
    let inCodeBlock = false;
    let codeLanguage: string | null = null;
    const codeLines: string[] = [];

    for (const line of lines) {
        // 检测代码块开始
        if (line.trim().startsWith('```')) {
            if (!inCodeBlock) {
                inCodeBlock = true;
                // 提取语言类型
                const match = line.trim().match(/^```(\w+)?/);
                codeLanguage = match ? match[1] || '' : '';
                codeLines.length = 0; // 清空数组
            } else {
                inCodeBlock = false;
                // 结束代码块
                if (codeLines.length > 0) {
                    const lang = codeLanguage || '';
                    processedLines.push(`\`\`\`${lang}`);
                    processedLines.push(...codeLines);
                    processedLines.push('```');
                }
                codeLines.length = 0; // 清空数组
            }
            continue;
        }

        // 在代码块中
        if (inCodeBlock) {
            codeLines.push(line);
        } else {
            processedLines.push(line);
        }
    }

    // 处理未闭合的代码块
    if (inCodeBlock && codeLines.length > 0) {
        const lang = codeLanguage || '';
        processedLines.push(`\`\`\`${lang}`);
        processedLines.push(...codeLines);
        processedLines.push('```');
    }

    return processedLines.join('\n');
}

/**
 * 检测是否为 YAML
 */
function isYAML(content: string): boolean {
    // 更准确的 YAML 检测：检查 YAML 特征
    const yamlPatterns = [
        /^\s*\w+\s*:\s*\S+/m,        // key: value
        /^\s*-\s+\S+/m,              // - item
        /^\s*\w+\s*:\s*\n\s*-/m,     // key:\n  - item
        /^\s*\w+\s*:\s*\n\s*\w+/m   // key:\n  value
    ];
    
    // 检查是否有 YAML 特征
    const hasYamlFeatures = yamlPatterns.some(pattern => pattern.test(content));
    
    // 检查是否有明显的非 YAML 内容
    const hasNonYamlContent = /\b(if|for|while|function|class|import|export)\b/.test(content);
    
    return hasYamlFeatures && !hasNonYamlContent;
function isJSON(content: string): boolean {
    try {
        JSON.parse(content);
        return true;
    } catch {
        // 检查代码块内是否包含 JSON
        const codeBlockMatch = content.match(/`\`\`json\\n([\s\S]*?)`\`\`/);
        if (codeBlockMatch) {
            try {
                JSON.parse(codeBlockMatch[1]);
                return true;
            } catch {
                return false;
            }
        }
        return false;
    }
function isShell(content: string): boolean {
    // 更准确的 Shell 检测：检查多个特征
    const shellPatterns = [
        /^#!/bin\/(bash|sh|zsh)/m,          // Shebang 行
        /^\s*if\s+\[/m,                     // if 语句
        /^\s*for\s+\w+\s+in\s+/m,          // for 循环
        /^\s*while\s+\[/m,                  // while 循环
        /^\s*echo\s+/m,                     // echo 命令
        /^\s*export\s+/m,                   // export 命令
        /^\s*source\s+/m,                   // source 命令
        /^\s*\$\w+/m,                      // 变量引用
        /^\s*\$\{\w+\}/m,                 // 变量引用
        /^\s*\|\s+/m,                      // 管道
        /^\s*\&\&\s+/m,                   // 逻辑与
        /^\s*\|\|\s+/m,                   // 逻辑或
        /^\s*\(\s*/m,                      // 命令替换
        /^\s*\)\s*$/m                      // 命令替换结束
    ];
    
    // 检查是否有足够的 Shell 特征
    const shellFeatureCount = shellPatterns.filter(pattern => pattern.test(content)).length;
    
    // 检查是否有明显的非 Shell 内容
    const hasNonShellContent = /(function|class|import|export|const|let|var|=>|\{\})\b/.test(content);
    
    // 至少需要 2 个 Shell 特征，且不能有非 Shell 内容
    return shellFeatureCount >= 2 && !hasNonShellContent;
function isConfig(content: string): boolean {
    const configPatterns = [
        /^\s*\w+\s*:\s*\w+/m,  // key: value
        /^\s*\w+\s*=\s*\w+/m,  // key=value
        /^\s*\[\w+\]/m,         // [section]
    ];
    return configPatterns.some(pattern => pattern.test(content));
}

/**
 * 格式化 JSON
 */
function formatJSON(content: string): string {
    try {
        const data = JSON.parse(content);
        return JSON.stringify(data, null, 2);
    } catch {
        return content;
    }
}

/**
 * 自动检测并格式化代码块
 */
function detectAndFormatCode(content: string, channel: string): string {
    // 检测 JSON
    if (isJSON(content)) {
        console.log(`[message-formatter] 检测到 JSON，进行格式化`);
        return formatJSON(content);
    }

    // 检测 YAML
    if (isYAML(content)) {
        console.log(`[message-formatter] 检测到 YAML`);
        // YAML 保持原样，只添加代码块标记
        return content;
    }

    // 检测 Shell 脚本
    if (isShell(content)) {
        console.log(`[message-formatter] 检测到 Shell 脚本`);
        // Shell 脚本保持原样，只添加代码块标记
        return content;
    }

    // 检测配置文件
    if (isConfig(content)) {
        console.log(`[message-formatter] 检测到配置文件`);
        // 配置文件保持原样，只添加代码块标记
        return content;
    }

    return content;
}

/**
 * 主处理函数
 */
const messageFormatterHandler = async (event: any) => {
    try {
        // 输入验证
        if (!event) {
            console.warn('[message-formatter] 事件对象为空，跳过处理');
            return;
        }

        if (!event.context) {
            console.warn('[message-formatter] 事件缺少 context，跳过处理');
            return;
        }

        // 只处理消息发送事件
        if (event.type !== "message" || event.action !== "preprocessed") {
            console.log(`[message-formatter] 不需要格式化消息`);
            return;
        }

        console.log(`[message-formatter] 正在格式化消息...`);
        console.log(`  渠道: ${event.context?.channelId}`);
        console.log(`  原始长度: ${event.context?.content?.length || 0}`);

        // 获取原始消息内容
        let content = event.context?.content || "";

        // 验证 content 是否为字符串
        if (typeof content !== 'string') {
            console.warn('[message-formatter] 内容不是字符串，跳过处理');
            return;
        }

        if (!content) {
            console.log('[message-formatter] 内容为空，跳过处理');
            return;
        }

        // 获取通道类型
        const channel = event.context?.channelId || "wechat";
        console.log(`[message-formatter] 检测到通道: ${channel}`);

    // 根据通道类型选择处理方式
    if (channel === "wechat") {
        console.log(`[message-formatter] 使用微信格式化（纯文本兼容）`);
        content = processWeChatContent(content);
    } else {
        console.log(`[message-formatter] 使用 Markdown 格式化`);
        content = processMarkdownContent(content);
    }

    // 代码检测和格式化
    content = detectAndFormatCode(content, channel);

    // ========== 通用格式化逻辑 ==========

    // 1. 移除多余空行（保留最多2个连续换行）
    content = content.replace(/\n{3,}/g, '\n\n');

    // 2. 添加表情符号标记
    const emojiMap: Record<string, string> = {
        "错误": "❌ 错误",
        "失败": "❌ 失败",
        "成功": "✅ 成功",
        "完成": "✅ 完成",
        "警告": "⚠️ 警告",
        "注意": "📌 注意",
        "重要": "🔴 重要",
        "建议": "💡 建议",
        "步骤": "📋 步骤",
        "示例": "📝 示例",
        "总结": "📊 总结"
    };

    for (const [keyword, replacement] of Object.entries(emojiMap)) {
        try {
            // 使用词边界确保只匹配完整的单词，避免误匹配（如"错误信息"不会被匹配）
            // 使用负向预查确保不会重复替换已带 emoji 的内容
            const regex = new RegExp(f'(?<![❌✅⚠📌🔴💡📋📝📊])\b{keyword}\b(?!\w)', 'g');
            if (regex.test(content)) {
                content = content.replace(regex, replacement);
            }
        } catch (error) {
            print(f'[message-formatter] emoji 替换失败: {keyword}')
        }
    }

    // 3. 美化列表格式（确保 - 开头项有正确缩进）
    const lines = content.split('\n');
    const formattedLines: string[] = [];
    let inList = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
            if (!inList && formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
                formattedLines.push(''); // 列表前加空行
            }
            inList = true;
            formattedLines.push(`  ${trimmed}`);
        } else {
            inList = false;
            formattedLines.push(line);
        }
    }
    content = formattedLines.join('\n');

    // 4. 确保代码块正确闭合
    const codeBlockCount = (content.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
        content += '\n```';
        console.log(`[message-formatter] 补全了未闭合的代码块`);
    }

    // 5. 长文本添加美观分隔线
    if (content.length > 500 && !content.includes('---')) {
        content = `---\n${content}\n---`;
    }

    // 6. 添加友好的签名（可选，仅在特定渠道）
    if (channel === 'feishu' || channel === 'wechat') {
        // 避免重复添加签名
        if (!content.includes('🤖 OpenClaw')) {
            content += `\n\n---\n🤖 *OpenClaw AI 助手* | 回复 /reset 开始新对话`;
        }
    }

    // ========== 应用格式化结果 ==========

    // 修改消息内容（这是关键！）
    event.context.content = content;

    // 可选：向会话中添加一条调试消息（用户不可见，仅开发者可见）
    // event.messages.push(`[格式化完成] ${content.length} 字符`);

    console.log(`[message-formatter] 格式化完成`);
    console.log(`  格式化后长度: ${content.length}`);
    console.log(`  增加字符数: ${content.length - (event.context?.originalLength || 0)}`);
    } catch (error) {
        console.error('[message-formatter] 处理失败:', error);
        // 不抛出错误，避免影响消息发送
    }
};

export default messageFormatterHandler;
