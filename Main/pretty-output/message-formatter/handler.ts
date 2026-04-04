// 消息格式化钩子的处理函数

/**
 * 处理微信通道内容（纯文本兼容）
 * 将代码块转换为单反引号格式
 */
export function processWeChatContent(content: string): string {
    const lines = content.split('\n');
    const processedLines: string[] = [];
    let inCodeBlock = false;
    const codeLines: string[] = [];

    for (const line of lines) {
        if (line.trim().startsWith('```')) {
            if (!inCodeBlock) {
                inCodeBlock = true;
                processedLines.push('`');
            } else {
                inCodeBlock = false;
                if (codeLines.length > 0) {
                    processedLines.push(...codeLines);
                }
                processedLines.push('`');
                codeLines.length = 0;
            }
            continue;
        }

        if (inCodeBlock) {
            codeLines.push('  ' + line);
        } else {
            processedLines.push(line);
        }
    }

    if (inCodeBlock && codeLines.length > 0) {
        processedLines.push('`');
        processedLines.push(...codeLines);
        processedLines.push('`');
    }

    return processedLines.join('\n');
}

/**
 * 处理 Markdown 通道内容
 */
export function processMarkdownContent(content: string): string {
    const lines = content.split('\n');
    const processedLines: string[] = [];
    let inCodeBlock = false;
    let codeLanguage: string | null = null;
    const codeLines: string[] = [];

    for (const line of lines) {
        if (line.trim().startsWith('```')) {
            if (!inCodeBlock) {
                inCodeBlock = true;
                const match = line.trim().match(/^```(\w+)?/);
                codeLanguage = match ? match[1] || '' : '';
                codeLines.length = 0;
            } else {
                inCodeBlock = false;
                if (codeLines.length > 0) {
                    const lang = codeLanguage || '';
                    processedLines.push('```' + lang);
                    processedLines.push(...codeLines);
                    processedLines.push('```');
                }
                codeLines.length = 0;
            }
            continue;
        }

        if (inCodeBlock) {
            codeLines.push(line);
        } else {
            processedLines.push(line);
        }
    }

    if (inCodeBlock && codeLines.length > 0) {
        const lang = codeLanguage || '';
        processedLines.push('```' + lang);
        processedLines.push(...codeLines);
        processedLines.push('```');
    }

    return processedLines.join('\n');
}

/**
 * 检测是否为 YAML
 */
export function isYAML(content: string): boolean {
    const yamlPatterns = [
        /^\s*\w+\s*:\s*\S+/m,
        /^\s*-\s+\S+/m,
    ];
    return yamlPatterns.some(pattern => pattern.test(content));
}

/**
 * 检测是否为 JSON
 */
export function isJSON(content: string): boolean {
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
export function isShell(content: string): boolean {
    const shellKeywords = ['#!/bin/bash', '#!/bin/sh', 'if [', 'for ', 'while ', 'echo ', 'export ', 'source '];
    return shellKeywords.some(keyword => content.includes(keyword));
}

/**
 * 检测是否为配置文件
 */
export function isConfig(content: string): boolean {
    const configPatterns = [
        /^\s*\w+\s*:\s*\w+/m,
        /^\s*\w+\s*=\s*\w+/m,
        /^\s*\[\w+]/m,
    ];
    return configPatterns.some(pattern => pattern.test(content));
}

/**
 * 格式化 JSON
 */
export function formatJSON(content: string): string {
    try {
        const data = JSON.parse(content);
        return JSON.stringify(data, null, 2);
    } catch {
        return content;
    }
}

/**
 * 添加表情符号标记
 */
export function addEmojiMarkers(content: string): string {
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
        // Check if already has the emoji
        if (content.includes(replacement)) {
            continue;
        }
        // Use word boundary to avoid partial matches
        // For Chinese, we need to check before and after the keyword
        const regex = new RegExp(`([^\w]|^)${keyword}([^\w]|$)`, "g");
        const matches = content.match(regex);
        if (matches) {
            content = content.replace(regex, `$1${replacement}$2`);
        }
    }
    return content;
}

/**
 * 美化列表格式
 */
export function formatLists(content: string): string {
    const lines = content.split('\n');
    const formattedLines: string[] = [];
    let inList = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
            if (!inList && formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
                formattedLines.push('');
            }
            inList = true;
            formattedLines.push('  ' + trimmed);
        } else {
            inList = false;
            formattedLines.push(line);
        }
    }
    return formattedLines.join('\n');
}

/**
 * 确保代码块正确闭合
 */
export function ensureCodeBlocksClosed(content: string): string {
    const codeBlockCount = (content.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
        console.log('[message-formatter] Added closing code block');
        return content + '\n```';
    }
    return content;
}

/**
 * 添加长文本分隔线
 */
export function addLongTextSeparator(content: string): string {
    if (content.length > 500 && !content.includes('---')) {
        return '---\n' + content + '\n---';
    }
    return content;
}

/**
 * 添加签名
 */
export function addSignature(content: string, channel: string): string {
    if (channel === 'feishu' || channel === 'wechat') {
        // Avoid duplicate signature
        if (!content.includes('🤖 *OpenClaw AI 助手*')) {
            return content + '\n\n---\n🤖 *OpenClaw AI 助手* | 回复 /reset 开始新对话';
        }
    }
    return content;
}

/**
 * 验证通道类型
 */
export function isValidChannel(channel: string): boolean {
    return ['feishu', 'wechat', 'lark', 'dingtalk'].includes(channel);
}

/**
 * 自动检测并格式化代码块
 */
function detectAndFormatCode(content: string): string {
    if (isJSON(content)) {
        console.log('[message-formatter] Detected JSON, formatting');
        return formatJSON(content);
    }
    if (isYAML(content)) {
        console.log('[message-formatter] Detected YAML');
    }
    if (isShell(content)) {
        console.log('[message-formatter] Detected Shell script');
    }
    if (isConfig(content)) {
        console.log('[message-formatter] Detected config file');
    }
    return content;
}

/**
 * 主处理函数
 */
const messageFormatterHandler = async (event: any) => {
    const startTime = Date.now();

    try {
        if (!event) {
            console.warn('[message-formatter] Event is empty, skipping');
            return;
        }

        if (!event.context) {
            console.warn('[message-formatter] Event missing context, skipping');
            return;
        }

        if (event.type !== "message" || event.action !== "preprocessed") {
            console.log('[message-formatter] Not a message to format');
            return;
        }

        console.log('[message-formatter] Formatting message...');
        console.log('  Channel: ' + event.context?.channelId);
        console.log('  Original length: ' + (event.context?.content?.length || 0));

        let content = event.context?.content || "";
        const originalLength = content.length;

        if (typeof content !== 'string') {
            console.warn('[message-formatter] Content is not a string, skipping');
            return;
        }

        if (!content) {
            console.log('[message-formatter] Content is empty, skipping');
            return;
        }

        const channel = event.context?.channelId || "wechat";
        console.log('[message-formatter] Detected channel: ' + channel);

        if (channel === "wechat") {
            console.log('[message-formatter] Using WeChat formatting (plain text compatible)');
            content = processWeChatContent(content);
        } else {
            console.log('[message-formatter] Using Markdown formatting');
            content = processMarkdownContent(content);
        }

        content = detectAndFormatCode(content);
        content = content.replace(/\n{3,}/g, '\n\n');
        content = addEmojiMarkers(content);
        content = formatLists(content);
        content = ensureCodeBlocksClosed(content);
        content = addLongTextSeparator(content);
        content = addSignature(content, channel);

        event.context.content = content;

        const processingTime = Date.now() - startTime;
        console.log('[message-formatter] Formatting complete');
        console.log('  Formatted length: ' + content.length);
        console.log('  Increased characters: ' + (content.length - originalLength));
        console.log('  Processing time: ' + processingTime + 'ms');
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('[message-formatter] Processing failed:', error);
        console.error('  Processing time: ' + processingTime + 'ms');
    }
};

export default messageFormatterHandler;
