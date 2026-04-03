# Pretty Output - OpenClaw 回复美化处理器

## 简介

Pretty Output 是一个基于 **OpenClaw Hook 机制**的智能回复后处理器，通过拦截 AI 输出消息并自动美化格式，根据不同通道（飞书/微信）自动适配最合适的显示格式。

## 技术架构

### Hook 机制说明

本技能使用 OpenClaw 的 Hook 机制实现消息拦截和处理：

- **触发时机**：在 AI 消息发送给用户**之前**拦截（`message:preprocessed` 事件）
- **处理流程**：AI 生成回复 → Hook 拦截 → 格式化处理 → 发送至目标渠道
- **运行环境**：运行在 OpenClaw 的 Node.js 环境中，使用 TypeScript 编写

### 核心处理逻辑

```
用户发送消息 → OpenClaw 处理 → AI 生成回复 → Hook 拦截 
→ 判断通道类型 → 应用对应格式化规则 → 输出美化后的消息
```

## 功能特性

- ✅ 基于 Hook 机制，自动拦截所有 AI 回复
- ✅ 根据发送通道（飞书/微信）自动适配格式
- ✅ 自动识别代码、配置、脚本、JSON、YAML、Shell
- ✅ 修复换行、缩进、排版混乱问题
- ✅ 微信端完全兼容，不显示任何 Markdown 无效符号

## 支持的通道

| 通道 | 格式支持 | 处理方式 |
|------|----------|----------|
| **飞书** | 完整 Markdown | 保留代码块、语言标记、加粗等 |
| **微信** | 纯文本 | 代码块转单引号、移除 Markdown 符号 |
| **Lark** | 完整 Markdown | 同飞书 |
| **钉钉** | 完整 Markdown | 同飞书 |

## 美化功能详解

### 1. 通道差异化处理

#### 飞书 / Lark / 钉钉（完整 Markdown）
- 保留 ` ``` ` 代码块，自动识别语言类型（yaml/json/sh/conf）
- 支持加粗 `**text**`、列表、分段、代码高亮
- 长文本自动排版，结构清晰

#### 微信（纯文本兼容）
- 自动删除所有 ` ``` ` 代码标记
- 代码/配置每行前添加 2 个空格缩进
- 整块代码使用 ` ` 符号包裹
- 保留正常换行与缩进，微信显示整齐美观
- 不使用任何微信不支持的 Markdown 语法

### 2. 代码检测和格式化

自动识别并处理以下内容类型：

- **JSON**：自动格式化缩进
- **YAML**：保持原有格式
- **Shell 脚本**：保持原有格式
- **配置文件**：保持原有格式

### 3. 通用美化功能

- 添加表情符号标记（✅ 成功、❌ 错误、⚠️ 警告、💡 建议）
- 美化列表格式（统一缩进）
- 确保代码块正确闭合
- 长文本添加美观分隔线
- 添加友好的签名

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

#### 2. 配置 OpenClaw
编辑 `~/.openclaw/config.yaml`，添加以下配置：

```yaml
agents:
  defaults:
    postSkills:
      - pretty-output

channels:
  feishu:
    enabled: true
    markdown: true
  wechat:
    enabled: true
    markdown: false
    compact: true
  lark:
    enabled: true
    markdown: true
  dingtalk:
    enabled: true
    markdown: true
```

#### 3. 重启 OpenClaw
```bash
openclaw gateway restart
```

## 安装常见问题

### ⚠️ 问题 1：exec 白名单限制

如果执行 `openclaw` 命令时报错 "Command not in allowlist"，需要配置 exec 白名单：

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

如果需要配置系统级功能（如定时任务、sudo 权限），确保：

1. 当前用户有 sudo 权限
2. 或手动执行需要权限的命令

### ⚠️ 问题 3：Hook 未生效

如果格式化未生效，检查：

1. OpenClaw 是否正确加载技能：查看日志中是否有 `[message-formatter]` 输出
2. 通道配置是否正确：确认 `channelId` 与配置一致
3. 重启 OpenClaw 后测试

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
├── SKILL.md              # 技能说明
├── README.md             # 使用说明（本文件）
├── _meta.json            # 元数据
├── install.js            # 自动安装脚本
└── hook/
    ├── HOOK.md           # Hook 使用说明
    └── handler.ts        # 核心处理代码（TypeScript）
```

## 核心函数说明

### handler.ts

基于 TypeScript 的消息格式化处理器，运行在 OpenClaw Hook 环境中。

| 函数 | 说明 |
|------|------|
| `processWeChatContent(content)` | 处理微信通道内容（代码块转单引号） |
| `processMarkdownContent(content)` | 处理 Markdown 通道内容（保留格式） |
| `detectAndFormatCode(content, channel)` | 自动检测并格式化代码块 |
| `messageFormatterHandler(event)` | 主处理函数，Hook 入口 |

## 注意事项

1. **优先级**：Pretty Output 设置为最高优先级（9999），确保最后执行
2. **通道适配**：根据不同通道自动选择合适的格式化方式
3. **代码识别**：自动识别 YAML、JSON、Shell 脚本和配置文件
4. **微信兼容**：微信端完全兼容，不会显示无效的 Markdown 符号

## 许可证

MIT License

## 作者

徐自勉 (xuzimianxzm)

## 版本

1.1.0