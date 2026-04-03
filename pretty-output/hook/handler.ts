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
    try {
        // 简单检测：包含键值对格式
        const yamlPattern = /^\s*\w+\s*:\s*\S+/m;
        return yamlPattern.test(content);
    } catch {
        return false;
    }
}

/**
 * 检测是否为 JSON
 */
function isJSON(content: string): boolean {
    try {
        JSON.parse(content);
        return true;
    } catch {
        return false;
    }
}

/**
 * 检测是否为 Shell 脚本
 */
function isShell(content: string): boolean {
    const shellKeywords = ['#!/bin/bash', '#!/bin/sh', 'if [', 'for ', 'while ', 'echo ', 'export ', 'source '];
    return shellKeywords.some(keyword => content.includes(keyword));
}

/**
 * 检测是否为配置文件
 */
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

    if (!content) {
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
        // 避免重复添加表情符号
        if (content.includes(keyword) && !content.includes(replacement)) {
            content = content.replace(new RegExp(keyword, 'g'), replacement);
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
};

export default messageFormatterHandler;
