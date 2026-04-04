#!/usr/bin/env node

/**
 * 消息格式化器安装脚本
 * 
 * 功能：
 * 1. 自动配置 OpenClaw 的 message-formatter 目录
 * 2. 启用 message-formatter message-formatter
 * 3. 提示用户重启 Gateway
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// 配置路径
const CONFIG_PATH = path.join(os.homedir(), '.openclaw', 'openclaw.json');
const HOOK_DIR = __dirname;

// 颜色输出
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// 读取配置文件
function readConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    logWarning(`无法读取配置文件: ${error.message}`);
  }
  return {};
}

// 写入配置文件
function writeConfig(config) {
  try {
    // 确保目录存在
    const configDir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // 写入配置文件（使用 2 空格缩进）
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (error) {
    logError(`无法写入配置文件: ${error.message}`);
    return false;
  }
}

// 检查并更新配置
function updateConfig() {
  const config = readConfig();
  
  // 初始化 hooks 配置
  if (!config.hooks) {
    config.hooks = {};
  }
  if (!config.hooks.internal) {
    config.hooks.internal = {};
  }
  if (!config.hooks.internal.load) {
    config.hooks.internal.load = {};
  }
  
  // 获取当前的 extraDirs
  let extraDirs = config.hooks.internal.load.extraDirs || [];
  
  // 确保是数组
  if (!Array.isArray(extraDirs)) {
    extraDirs = [];
  }
  
  // 检查是否已配置 message-formatter 目录
  const hookDirPath = path.resolve(HOOK_DIR);
  const alreadyConfigured = extraDirs.some(dir => {
    const resolved = path.resolve(dir);
    return resolved === hookDirPath || resolved.includes('pretty-output');
  });
  
  if (alreadyConfigured) {
    logInfo('Hook 目录已配置，跳过');
    return true;
  }
  
  // 添加 message-formatter 目录
  extraDirs.push(HOOK_DIR);
  config.hooks.internal.load.extraDirs = extraDirs;
  
  // 确保 internal hooks 已启用
  config.hooks.internal.enabled = true;
  
  if (writeConfig(config)) {
    logSuccess(`已添加 hook 目录配置: ${HOOK_DIR}`);
    return true;
  }
  
  return false;
}

// 运行 openclaw hooks enable 命令
function enableHook() {
  const { execSync } = require('child_process');
  
  try {
    logInfo('正在启用 message-formatter message-formatter...');
    execSync('openclaw hooks enable message-formatter', { 
      stdio: 'inherit',
      cwd: os.homedir()
    });
    logSuccess('Hook 已启用');
    return true;
  } catch (error) {
    // 如果 message-formatter 不在发现列表中，尝试列出所有可用的 message-formatter
    logWarning('自动启用失败，尝试列出可用的 hooks...');
    try {
      execSync('openclaw hooks list', { 
        stdio: 'inherit',
        cwd: os.homedir()
      });
    } catch (e) {
      // 忽略错误
    }
    logWarning('请手动运行: openclaw hooks enable message-formatter');
    return false;
  }
}

// 主函数
function main() {
  log('🎨 消息格式化器安装脚本', 'cyan');
  log('=' .repeat(40), 'cyan');
  log('');
  
  // 1. 检查 message-formatter 目录是否存在
  if (!fs.existsSync(HOOK_DIR)) {
    logError(`Hook 目录不存在: ${HOOK_DIR}`);
    process.exit(1);
  }
  
  // 2. 更新配置文件
  log('步骤 1: 配置 message-formatter 目录...');
  if (!updateConfig()) {
    logError('配置失败');
    process.exit(1);
  }
  log('');
  
  // 3. 启用 message-formatter
  log('步骤 2: 启用 message-formatter...');
  enableHook();
  log('');
  
  // 4. 提示重启
  log('=' .repeat(40), 'cyan');
  logSuccess('安装完成！');
  log('');
  log('请重启 Gateway 使配置生效:');
  log('  openclaw gateway restart', 'cyan');
  log('');
  log('验证安装:');
  log('  openclaw hooks list', 'cyan');
  log('');
}

// 运行主函数
main();