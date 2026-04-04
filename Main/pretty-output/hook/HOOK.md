---
name: message-formatter
description: "在发送消息前自动格式化输出内容，添加表情符号、美化列表和代码块"
homepage: https://docs.openclaw.ai/automation/hooks
metadata:
  { "openclaw": { "emoji": "🎨", "events": ["message:preprocessed"], "requires": { "bins": ["node"] } } }
---

# 消息格式化钩子

## 功能说明

在 AI 回复消息发送给用户之前，自动对消息内容进行格式化处理：
- 添加表情符号标记（✅ 成功、❌ 错误、⚠️ 警告、💡 建议）
- 美化列表格式
- 确保代码块正确闭合
- 添加友好的分隔线
- 针对代码，配置等格式进行美化处理

## 触发条件

- 事件类型：`message:preprocessed`
- 在消息发送到chat（包含飞书/微信）之前执行

## 配置

无需额外配置，开箱即用。