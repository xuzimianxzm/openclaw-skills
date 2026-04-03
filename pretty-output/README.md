# Pretty Output - OpenClaw 回复美化处理器

## 简介

Pretty Output 是一个 OpenClaw 回复后处理器，自动美化所有 AI 输出，根据不同通道自动适配格式。

## 功能特性

- ✅ 自动拦截 OpenClaw 所有回复内容
- ✅ 根据发送通道自动适配格式
- ✅ 自动识别代码、配置、脚本、JSON、YAML、Shell
- ✅ 修复换行、缩进、排版混乱问题
- ✅ 微信端完全兼容，不显示任何 Markdown 无效符号

## 支持的通道

- **飞书** - 完整 Markdown 格式
- **微信** - 纯文本兼容格式
- **Lark** - 完整 Markdown 格式
- **钉钉** - 完整 Markdown 格式

## 安装

### 1. 复制技能文件

将 `pretty-output` 目录复制到 OpenClaw 技能目录：

```bash
cp -r pretty-output ~/.openclaw/workspace/skills/
```

### 2. 配置 OpenClaw

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

### 3. 重启 OpenClaw

```bash
openclaw gateway restart
```

## 使用方法

Pretty Output 是后处理器，会自动拦截所有 AI 回复，无需手动触发。

### 通道格式化规则

#### 飞书 / Lark / 钉钉（完整 Markdown）

- 保留 ``` 代码块，自动识别语言类型
- 支持加粗、列表、分段、代码高亮
- 长文本自动排版，结构清晰

#### 微信（纯文本兼容）

- 自动删除所有 ``` 代码标记
- 代码/配置每行前添加 2 个空格缩进
- 整块代码使用 ` 符号包裹
- 保留正常换行与缩进，微信显示整齐美观
- 不使用任何微信不支持的 Markdown 语法

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
  server:
    port: 8080
    host: 0.0.0.0
  database:
    url: mongodb://localhost:27017/db
```

## 代码结构

```
pretty-output/
├── SKILL.md           # 技能说明
├── README.md          # 使用说明（本文件）
├── _meta.json         # 元数据
└── pretty_output.py   # 核心代码
```

## 核心类

### pretty-outputProcessor

主要的回复美化处理器类。

#### 方法

- `__init__(channel: str)` - 初始化处理器
- `process(content: str) -> str` - 处理回复内容
- `detect_and_format_code(content: str) -> str` - 自动检测并格式化代码块

## 测试

运行测试：

```bash
cd pretty-output
python3 pretty_output.py
```

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

1.0.0
