---
name: Pretty Output
slug: Pretty Output
version: 1.0.0
description: >
  【回复后处理器】自动美化 OpenClaw 所有输出：
  - 长文本分段、加列表、加标题
  - 代码/配置/JSON/YAML/Shell 自动包裹代码块
  - 按通道适配：飞书完整 Markdown / 微信降级友好
  - 修复换行、缩进、挤成一团问题
  - 全程自动触发，无需用户指令
author: your-name
license: MIT
# 关键：设为 post-processor，自动处理所有回复
metadata:
  openclaw:
    type: post-processor  # 核心：后处理器（自动拦截所有AI回复）
    priority: 9999        # 最高优先级，确保最后执行
    channels: [feishu, wechat, lark, dingtalk]
---

# 智能回复美化处理器
## 核心功能
1. 自动拦截OpenClaw所有回复内容
2. 根据发送通道自动适配格式
3. 自动识别代码、配置、脚本、JSON、YAML、Shell
4. 修复换行、缩进、排版混乱问题
5. 微信端完全兼容，不显示任何Markdown无效符号

## 通道格式化规则（自动执行）
### 【飞书通道】- 专业Markdown格式
- 保留 ```代码块，自动识别语言类型(yaml/json/sh/nginx/conf)
- 支持加粗、列表、分段、代码高亮
- 长文本自动排版，结构清晰

### 【微信通道】- 纯文本兼容格式
- 自动删除所有 ``` 代码标记
- 代码/配置每行前添加2个空格缩进
- 整块代码使用 ` 符号包裹
- 保留正常换行与缩进，微信显示整齐美观
- 不使用任何微信不支持的Markdown语法


## 格式化示例
原始AI输出：
server:
port: 8080
host: 0.0.0.0

美化后输出：
```yaml
server:
  port: 8080
  host: 0.0.0.0
```

## 处理规则（按通道）

### 1. 飞书 / Lark（完整 Markdown）
- 开启：`markdown: true`
- 代码自动识别语言：` ```yaml ` ` ```json ` ` ```sh ` ` ```conf `
- 保留**所有换行、缩进**
- 长文本分段、加小标题、有序/无序列表
- 关键配置项（port、host、url、username）**加粗**
- 示例：
  ```yaml
  server:
    port: 8080
    host: 0.0.0.0
  database:
    url: mongodb://localhost:27017/db
  ```


## 三、配置启用（必做）
编辑 `~/.openclaw/config.yaml`
```yaml
agents:
  defaults:
    postSkills:
      - auto-response-beautifier

channels:
  feishu:
    enabled: true
    markdown: true
  wechat:
    enabled: true
    markdown: false
    compact: true
```