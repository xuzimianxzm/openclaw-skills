#!/usr/bin/env python3
"""
Pretty Output - OpenClaw 回复后处理器
自动美化所有输出，适配不同通道格式
"""

import re
import json
import yaml
from typing import Dict, Any, Optional

class PrettyOutputProcessor:
    """回复美化处理器"""
    
    def __init__(self, channel: str = "wechat"):
        """
        初始化处理器
        
        Args:
            channel: 通道类型 (feishu, wechat, lark, dingtalk)
        """
        self.channel = channel.lower()
        self.config = {
            "feishu": {
                "markdown": True,
                "code_blocks": True,
                "formatting": True
            },
            "wechat": {
                "markdown": False,
                "code_blocks": False,
                "formatting": False
            },
            "lark": {
                "markdown": True,
                "code_blocks": True,
                "formatting": True
            },
            "dingtalk": {
                "markdown": True,
                "code_blocks": True,
                "formatting": True
            }
        }
    
    def process(self, content: str) -> str:
        """
        处理回复内容
        
        Args:
            content: 原始内容
            
        Returns:
            处理后的内容
        """
        if not content:
            return content
        
        # 根据通道选择处理方式
        if self.channel == "wechat":
            return self._process_wechat(content)
        else:
            return self._process_markdown(content)
    
    def _process_wechat(self, content: str) -> str:
        """
        处理微信通道内容（纯文本兼容）
        
        Args:
            content: 原始内容
            
        Returns:
            处理后的内容
        """
        lines = content.split('\n')
        processed_lines = []
        in_code_block = False
        code_lines = []
        
        for line in lines:
            # 检测代码块开始
            if line.strip().startswith('```'):
                if not in_code_block:
                    in_code_block = True
                    # 开始代码块，添加标记
                    processed_lines.append('`')
                else:
                    in_code_block = False
                    # 结束代码块，添加标记
                    if code_lines:
                        processed_lines.extend(code_lines)
                    processed_lines.append('`')
                    code_lines = []
                continue
            
            # 在代码块中
            if in_code_block:
                # 每行前添加2个空格缩进
                code_lines.append('  ' + line)
            else:
                processed_lines.append(line)
        
        # 处理未闭合的代码块
        if in_code_block and code_lines:
            processed_lines.append('`')
            processed_lines.extend(code_lines)
            processed_lines.append('`')
        
        return '\n'.join(processed_lines)
    
    def _process_markdown(self, content: str) -> str:
        """
        处理 Markdown 通道内容（飞书、Lark、钉钉）
        
        Args:
            content: 原始内容
            
        Returns:
            处理后的内容
        """
        lines = content.split('\n')
        processed_lines = []
        in_code_block = False
        code_language = None
        code_lines = []
        
        for line in lines:
            # 检测代码块开始
            if line.strip().startswith('```'):
                if not in_code_block:
                    in_code_block = True
                    # 提取语言类型
                    match = re.match(r'```(\w+)?', line.strip())
                    code_language = match.group(1) if match else ''
                    code_lines = []
                else:
                    in_code_block = False
                    # 结束代码块
                    if code_lines:
                        # 添加代码块
                        lang = code_language if code_language else ''
                        processed_lines.append(f'```{lang}')
                        processed_lines.extend(code_lines)
                        processed_lines.append('```')
                    code_lines = []
                continue
            
            # 在代码块中
            if in_code_block:
                code_lines.append(line)
            else:
                processed_lines.append(line)
        
        # 处理未闭合的代码块
        if in_code_block and code_lines:
            lang = code_language if code_language else ''
            processed_lines.append(f'```{lang}')
            processed_lines.extend(code_lines)
            processed_lines.append('```')
        
        return '\n'.join(processed_lines)
    
    def detect_and_format_code(self, content: str) -> str:
        """
        自动检测并格式化代码块
        
        Args:
            content: 原始内容
            
        Returns:
            格式化后的内容
        """
        # 检测 YAML
        if self._is_yaml(content):
            return self._format_yaml(content)
        
        # 检测 JSON
        if self._is_json(content):
            return self._format_json(content)
        
        # 检测 Shell 脚本
        if self._is_shell(content):
            return self._format_shell(content)
        
        # 检测配置文件
        if self._is_config(content):
            return self._format_config(content)
        
        return content
    
    def _is_yaml(self, content: str) -> bool:
        """检测是否为 YAML"""
        try:
            yaml.safe_load(content)
            return True
        except:
            return False
    
    def _is_json(self, content: str) -> bool:
        """检测是否为 JSON"""
        try:
            json.loads(content)
            return True
        except:
            return False
    
    def _is_shell(self, content: str) -> bool:
        """检测是否为 Shell 脚本"""
        shell_keywords = ['#!/bin/bash', '#!/bin/sh', 'if [', 'for ', 'while ', 'echo ', 'export ', 'source ']
        return any(keyword in content for keyword in shell_keywords)
    
    def _is_config(self, content: str) -> bool:
        """检测是否为配置文件"""
        config_patterns = [
            r'^\s*\w+\s*:\s*\w+',  # key: value
            r'^\s*\w+\s*=\s*\w+',  # key=value
            r'^\s*\[\w+\]',         # [section]
        ]
        return any(re.match(pattern, line) for line in content.split('\n') for pattern in config_patterns)
    
    def _format_yaml(self, content: str) -> str:
        """格式化 YAML"""
        try:
            data = yaml.safe_load(content)
            return yaml.dump(data, default_flow_style=False, allow_unicode=True)
        except:
            return content
    
    def _format_json(self, content: str) -> bool:
        """格式化 JSON"""
        try:
            data = json.loads(content)
            return json.dumps(data, indent=2, ensure_ascii=False)
        except:
            return content
    
    def _format_shell(self, content: str) -> str:
        """格式化 Shell 脚本"""
        # Shell 脚本保持原样，只添加代码块标记
        return content
    
    def _format_config(self, content: str) -> str:
        """格式化配置文件"""
        # 配置文件保持原样，只添加代码块标记
        return content


def main():
    """主函数 - 测试"""
    processor = PrettyOutputProcessor(channel="wechat")
    
    # 测试用例
    test_content = """server:
  port: 8080
  host: 0.0.0.0
database:
  url: mongodb://localhost:27017/db"""
    
    result = processor.process(test_content)
    print("原始内容：")
    print(test_content)
    print("\n处理后内容：")
    print(result)


if __name__ == "__main__":
    main()
