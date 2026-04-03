// 消息格式化钩子的处理函数
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

    // ========== 格式化逻辑 ==========

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
    if (event.context?.channelId === 'feishu' || event.context?.channelId === 'wechat') {
        // 避免重复添加签名
        if (!content.includes('🤖 OpenClaw')) {
            content += `\n\n---\n🤖 *OpenClaw AI 助手* | 回复 /reset 开始新对话`;
        }
    }

    // ========== 应用格式化结果 ==========

    // 修改消息内容（这是关键！）
    event.context.content =  content;

    // 可选：向会话中添加一条调试消息（用户不可见，仅开发者可见）
    // event.messages.push(`[格式化完成] ${content.length} 字符`);

    console.log(`[message-formatter] 格式化完成`);
    console.log(`  格式化后长度: ${content.length}`);
    console.log(`  增加字符数: ${content.length - (event.context?.originalLength || 0)}`);
};

export default messageFormatterHandler;