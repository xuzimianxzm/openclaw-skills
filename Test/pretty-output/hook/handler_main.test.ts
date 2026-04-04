import {describe, it, expect, vi} from 'vitest';
import messageFormatterHandler from '../../../Main/pretty-output/hook/handler'


describe('messageFormatterHandler', () => {
    // Mock console.log and console.warn to avoid polluting test output
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {
        });
        vi.spyOn(console, 'warn').mockImplementation(() => {
        });
        vi.spyOn(console, 'error').mockImplementation(() => {
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('应该处理空事件', async () => {
        await messageFormatterHandler(null);
        expect(console.warn).toHaveBeenCalledWith('[message-formatter] Event is empty, skipping');
    });

    it('应该处理缺少 context 的事件', async () => {
        const event = {type: 'message', action: 'preprocessed'};
        await messageFormatterHandler(event as any);
        expect(console.warn).toHaveBeenCalledWith('[message-formatter] Event missing context, skipping');
    });

    it('应该处理非消息事件', async () => {
        const event = {type: 'other', action: 'preprocessed', context: {}};
        await messageFormatterHandler(event as any);
        expect(console.log).toHaveBeenCalledWith('[message-formatter] Not a message to format');
    });

    it('应该处理空内容', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'wechat', content: ''}
        };
        await messageFormatterHandler(event as any);
        expect(console.log).toHaveBeenCalledWith('[message-formatter] Content is empty, skipping');
    });

    it('应该处理微信通道的简单文本', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'wechat', content: '这是一条测试消息'}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toBe('这是一条测试消息');
    });

    it('应该处理微信通道的代码块', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'wechat', content: '```yaml\nkey: value\n```'}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toContain('`');
        expect(event.context.content).toContain('  key: value');
    });

    it('应该处理飞书通道的代码块', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'feishu', content: '```json\n{"key": "value"}\n```'}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toBe('```json\n{"key": "value"}\n```');
    });

    it('应该处理 JSON 格式', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'wechat', content: '{"key":"value"}'}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toContain('{\n  "key": "value"\n}');
    });

    it('应该处理 YAML 格式', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'feishu', content: 'key: value\nnested:\n  item: value'}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toBe('key: value\nnested:\n  item: value');
    });

    it('应该处理 Shell 脚本', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'wechat', content: '#!/bin/bash\necho "Hello"'}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toContain('#!/bin/bash');
        expect(event.context.content).toContain('echo "Hello"');
    });

    it('应该处理配置文件', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'feishu', content: '[section]\nkey=value'}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toBe('[section]\nkey=value');
    });

    it('应该处理多行文本', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'wechat', content: '第一行\n第二行\n第三行'}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toBe('第一行\n第二行\n第三行');
    });

    it('应该处理混合内容', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'feishu', content: '标题\n- item1\n- item2\n```yaml\nkey: value\n```\n内容'}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toContain('标题');
        expect(event.context.content).toContain('- item1');
        expect(event.context.content).toContain('- item2');
        expect(event.context.content).toContain('key: value');
    });

    it('应该处理未闭合的代码块', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'wechat', content: '```yaml\nkey: value'}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toContain('```yaml\nkey: value\n```');
    });

    it('应该处理多段代码块', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {
                channelId: 'feishu',
                content: '第一段\n```yaml\nkey1: value1\n```\n第二段\n```json\n{"key2": "value2"}\n```'
            }
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toContain('key1: value1');
        expect(event.context.content).toContain('{"key2": "value2"}');
    });

    it('应该处理长文本（>500字符）', async () => {
        const longText = 'a'.repeat(501);
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'wechat', content: longText}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toContain('---');
    });

    it('不应该处理短文本（<500字符）', async () => {
        const shortText = 'a'.repeat(100);
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'wechat', content: shortText}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).not.toContain('---');
    });

    it('应该处理 lark 通道', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'lark', content: '测试内容'}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toBe('测试内容');
    });

    it('应该处理 dingtalk 通道', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'dingtalk', content: '测试内容'}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toBe('测试内容');
    });

    it('应该处理包含表情关键词的内容', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'feishu', content: '这是一个错误'}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toContain('❌ 错误');
    });

    it('应该处理包含成功关键词的内容', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'feishu', content: '操作成功'}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toContain('✅ 成功');
    });

    it('应该处理包含多个关键词的内容', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'feishu', content: '操作失败，请检查错误'}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toContain('❌ 失败');
        expect(event.context.content).toContain('❌ 错误');
    });

    it('应该处理包含列表的内容', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'feishu', content: '步骤：\n- 步骤1\n- 步骤2'}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toContain('  - 步骤1');
        expect(event.context.content).toContain('  - 步骤2');
    });

    it('应该处理包含签名的内容', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'wechat', content: '测试内容'}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toContain('🤖 *OpenClaw AI 助手*');
    });

    it('不应该重复添加签名', async () => {
        const event = {
            type: 'message',
            action: 'preprocessed',
            context: {channelId: 'wechat', content: '测试内容\n\n---\n🤖 *OpenClaw AI 助手* | 回复 /reset 开始新对话'}
        };
        await messageFormatterHandler(event as any);
        expect(event.context.content).toBe('测试内容\n\n---\n🤖 *OpenClaw AI 助手* | 回复 /reset 开始新对话');
    });
});