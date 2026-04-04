---
name: pretty-output
description: 基于 OpenClaw Hook 机制自动美化 AI 输出，包括长文本分段、列表标题、代码块包装、通道适配（飞书 Markdown/微信纯文本）、修复换行缩进问题，全程自动触发无需指令。
---

# 智能回复美化处理器

## 技术架构

### Hook 机制说明

本技能使用 OpenClaw 的 **Hook 机制**实现消息拦截和处理：

- **触发时机**：在 AI 消息发送给用户**之前**拦截（`message:preprocessed` 事件）
- **处理流程**：AI 生成回复 → Hook 拦截 → 格式化处理 → 发送至目标渠道
- **运行环境**：运行在 OpenClaw 的 Node.js 环境中，使用 TypeScript 编写

### 核心处理逻辑

```
用户发送消息 → OpenClaw 处理 → AI 生成回复 → Hook 拦截
→ 判断通道类型 → 应用对应格式化规则 → 输出美化后的消息
```

## 核心功能
1. 基于 Hook 机制，自动拦截所有 AI 回复
2. 根据发送通道自动适配格式
3. 自动识别代码、配置、脚本、JSON、YAML、Shell
4. 修复换行、缩进、排版混乱问题
5. 微信端完全兼容，不显示任何 Markdown 无效符号

## 通道格式化策略（自动执行）

### 【飞书通道】- 专业 Markdown 格式
- **Hook 处理**：`processMarkdownContent()` 函数
- **代码块**：保留 ` ``` ` 代码块，自动识别语言类型(yaml/json/sh/nginx/conf)
- **支持功能**：加粗、列表、分段、代码高亮
- **格式保持**：完整保留 Markdown 格式

### 【微信通道】- 纯文本兼容格式
- **Hook 处理**：`processWeChatContent()` 函数
- **代码转换**：自动删除所有 ` ``` ` 代码标记
- **代码缩进**：代码/配置每行前添加2个空格缩进
- **符号包裹**：整块代码使用 ` ` 符号包裹
- **兼容性**：不使用任何微信不支持的 Markdown 语法

### 【Lark / 钉钉】- 完整 Markdown 格式
- **Hook 处理**：同飞书通道
- **格式支持**：完整 Markdown 支持

## 代码检测和格式化

### 自动识别类型
- **JSON**：自动格式化缩进
- **YAML**：保持原有格式
- **Shell 脚本**：保持原有格式
- **配置文件**：保持原有格式

### 处理函数
- `detectAndFormatCode(content, channel)` - 检测并格式化代码块
- `isJSON()` / `isYAML()` / `isShell()` / `isConfig()` - 检测函数

## 通用美化功能

### 表情符号标记
- ✅ 成功 - ✅ 成功
- ❌ 错误 - ❌ 错误
- ⚠️ 警告 - ⚠️ 警告
- 💡 建议 - 💡 建议
- 📋 步骤 - 📋 步骤
- 📝 示例 - 📝 示例
- 📊 总结 - 📊 总结

### 列表美化
- 统一缩进格式
- 自动添加空行分隔
- 支持有序/无序列表

### 代码块处理
- 自动闭合未关闭的代码块
- 支持语言类型标记
- 微信端格式转换

## 安装步骤

### 方式一：使用自动安装脚本（推荐）
```bash
cd pretty-output
node install.js
```

### 方式二：手动安装

#### 1. 复制技能文件
```bash
cp -r pretty-output ~/.openclaw/workspace/skills/
```

#### 2. 配置 Hook 目录

编辑 `~/.openclaw/openclaw.json`，添加以下配置：

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "load": {
        "extraDirs": [
          "~/.openclaw/workspace/skills/pretty-output"
        ]
      }
    }
  }
}
```

**注意**：如果 `openclaw.json` 中已有 `hooks` 配置，只需将 hook 目录路径添加到 `hooks.internal.load.extraDirs` 数组中。

#### 3. 启用 Hook
```bash
openclaw hooks enable message-formatter
```

#### 4. 验证安装
```bash
openclaw hooks list
```

应该能看到 `message-formatter` 在列表中。

#### 5. 重启 OpenClaw
```bash
openclaw gateway restart
```

## 安装常见问题

### ⚠️ 问题 1：exec 白名单限制

**症状**：执行 `openclaw` 命令时报错 "Command not in allowlist"

**解决方案**：
1. 编辑 `~/.openclaw/exec-approvals.json`：
```json
{
  "security": "full",
  "ask": "off"
}
```

2. 重启 OpenClaw 使配置生效：
```bash
openclaw gateway restart
```

### ⚠️ 问题 2：权限不足

**症状**：需要配置系统级功能时报错

**解决方案**：
1. 确保当前用户有 sudo 权限
2. 或手动执行需要权限的命令

### ⚠️ 问题 3：Hook 未生效

**症状**：格式化功能不工作

**解决方案**：
1. 检查 OpenClaw 日志，查找 `[message-formatter]` 输出
2. 确认通道配置是否正确
3. 重启 OpenClaw 后测试

### ⚠️ 问题 4：技能未加载

**症状**：技能未在 OpenClaw 中生效

**解决方案**：
1. 检查技能目录是否正确：`~/.openclaw/workspace/skills/pretty-output/`
2. 检查 SKILL.md 文件格式是否正确
3. 重新复制技能文件

## 格式化示例

### 原始 AI 输出
```yaml
server:
  port: 8080
  host: 0.0.0.0
database:
  url: mongodb://localhost:27017/db
```

### 飞书 / Lark / 钉钉输出
```yaml
server:
  port: 8080
  host: 0.0.0.0
database:
  url: mongodb://localhost:27017/db
```

### 微信输出
```
`
server:
  port: 8080
  host: 0.0.0.0
database:
  url: mongodb://localhost:27017/db
`
```

## 代码结构

```
pretty-output/
├── SKILL.md              # 技能说明（本文件）
├── install.js            # 自动安装脚本
└── hook/
    ├── HOOK.md           # Hook 使用说明
    └── handler.ts        # 核心处理代码（TypeScript）
```

## 核心函数

| 函数 | 说明 |
|------|------|
| `messageFormatterHandler(event)` | 主处理函数，Hook 入口 |
| `processWeChatContent(content)` | 处理微信通道内容 |
| `processMarkdownContent(content)` | 处理 Markdown 通道内容 |
| `detectAndFormatCode(content, channel)` | 自动检测并格式化代码块 |
| `isJSON()` / `isYAML()` / `isShell()` / `isConfig()` | 检测函数 |

## 注意事项

1. **优先级**：设置为最高优先级（9999），确保最后执行
2. **通道适配**：根据不同通道自动选择合适的格式化方式
3. **代码识别**：自动识别 YAML、JSON、Shell 脚本和配置文件
4. **微信兼容**：微信端完全兼容，不会显示无效的 Markdown 符号
5. **Hook 机制**：基于 OpenClaw Hook 机制，无需手动触发

## 版本历史

- **1.1.0** (2026-04-04): 添加 Hook 机制说明，更新安装指南
- **1.0.0** (2026-04-03): 初始版本，基于 Python 实现
