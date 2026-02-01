#!/usr/bin/env node
/**
 * Continuous Learning v2 - Observation Hook for Cursor IDE
 *
 * 捕获工具使用事件用于模式分析。
 * Cursor 通过 stdin 以 JSON 格式传递钩子数据。
 *
 * 支持的钩子事件：
 * - beforeShellExecution: Shell 命令执行前
 * - afterFileEdit: 文件编辑后
 * - stop: 任务完成时
 *
 * 钩子配置 (在 .cursor/hooks.json 中):
 * {
 *   "hooks": {
 *     "afterFileEdit": [{ "command": "node .cursor/skills/continuous-learning-v2/hooks/observe.js", "timeout": 5 }],
 *     "beforeShellExecution": [{ "command": "node .cursor/skills/continuous-learning-v2/hooks/observe.js", "timeout": 5 }],
 *     "stop": [{ "command": "node .cursor/skills/continuous-learning-v2/hooks/observe.js", "timeout": 10 }]
 *   }
 * }
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ─────────────────────────────────────────────
// 配置
// ─────────────────────────────────────────────

// 使用 .cursor 目录作为基础路径，支持跨平台
const CURSOR_DIR = path.join(os.homedir(), '.cursor');
const CONFIG_DIR = path.join(CURSOR_DIR, 'homunculus');
const OBSERVATIONS_FILE = path.join(CONFIG_DIR, 'observations.jsonl');
const DISABLED_FILE = path.join(CONFIG_DIR, 'disabled');
const OBSERVER_PID_FILE = path.join(CONFIG_DIR, '.observer.pid');
const MAX_FILE_SIZE_MB = 10;

// 确保目录存在
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ─────────────────────────────────────────────
// 主逻辑
// ─────────────────────────────────────────────

async function main() {
  try {
    ensureDir(CONFIG_DIR);

    // 检查是否禁用
    if (fs.existsSync(DISABLED_FILE)) {
      process.exit(0);
    }

    // 从 stdin 读取 JSON 数据
    const inputJson = await readStdin();
    if (!inputJson || inputJson.trim() === '') {
      process.exit(0);
    }

    let data;
    try {
      data = JSON.parse(inputJson);
    } catch (e) {
      // 解析失败，记录原始错误
      logObservation({
        event: 'parse_error',
        raw: inputJson.slice(0, 1000),
        error: e.message
      });
      process.exit(0);
    }

    // 解析 Cursor 钩子数据格式
    const observation = parseHookData(data);
    if (observation) {
      // 检查文件大小，必要时归档
      archiveIfNeeded();

      // 写入观察记录
      logObservation(observation);

      // 通知观察者进程（如果正在运行）
      signalObserver();
    }

    process.exit(0);
  } catch (err) {
    // 静默处理错误，避免影响用户体验
    process.exit(0);
  }
}

// ─────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────

/**
 * 从 stdin 读取数据
 */
function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
    process.stdin.on('error', err => {
      resolve('');
    });
    // 设置超时，防止无限等待
    setTimeout(() => resolve(data), 3000);
  });
}

/**
 * 解析 Cursor 钩子数据
 * Cursor 钩子格式可能包含以下字段：
 * - hookType: 钩子类型 (afterFileEdit, beforeShellExecution, stop, etc.)
 * - file_path: 文件路径 (afterFileEdit)
 * - command: 命令 (beforeShellExecution)
 * - 其他上下文信息
 */
function parseHookData(data) {
  // 确定事件类型
  let event = 'unknown';
  let tool = 'unknown';
  let input = null;
  let output = null;

  // 根据数据结构判断钩子类型
  if (data.file_path) {
    // afterFileEdit 钩子
    event = 'file_edit';
    tool = 'Edit';
    input = data.file_path;
  } else if (data.command) {
    // beforeShellExecution 钩子
    event = 'shell_execution';
    tool = 'Shell';
    input = data.command;
  } else if (data.hookType) {
    // 通用钩子格式
    event = data.hookType;
    tool = data.tool || data.hookType;
    input = data.input || data.file_path || data.command;
    output = data.output || data.result;
  } else if (data.type) {
    // 另一种可能的格式
    event = data.type;
    tool = data.tool || data.type;
    input = data.input;
    output = data.output;
  }

  // 截断大型输入/输出
  const maxLen = 5000;
  if (input && typeof input === 'object') {
    input = JSON.stringify(input).slice(0, maxLen);
  } else if (input) {
    input = String(input).slice(0, maxLen);
  }

  if (output && typeof output === 'object') {
    output = JSON.stringify(output).slice(0, maxLen);
  } else if (output) {
    output = String(output).slice(0, maxLen);
  }

  return {
    event,
    tool,
    input,
    output,
    session: process.env.CURSOR_SESSION_ID || data.session_id || 'unknown'
  };
}

/**
 * 记录观察数据到 JSONL 文件
 */
function logObservation(data) {
  const observation = {
    timestamp: new Date().toISOString(),
    ...data
  };

  // 移除 null/undefined 值
  Object.keys(observation).forEach(key => {
    if (observation[key] === null || observation[key] === undefined) {
      delete observation[key];
    }
  });

  fs.appendFileSync(OBSERVATIONS_FILE, JSON.stringify(observation) + '\n', 'utf8');
}

/**
 * 如果观察文件过大则归档
 */
function archiveIfNeeded() {
  if (!fs.existsSync(OBSERVATIONS_FILE)) {
    return;
  }

  try {
    const stats = fs.statSync(OBSERVATIONS_FILE);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB >= MAX_FILE_SIZE_MB) {
      const archiveDir = path.join(CONFIG_DIR, 'observations.archive');
      ensureDir(archiveDir);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const archivePath = path.join(archiveDir, `observations-${timestamp}.jsonl`);

      fs.renameSync(OBSERVATIONS_FILE, archivePath);
    }
  } catch (err) {
    // 静默处理归档错误
  }
}

/**
 * 通知观察者进程有新数据
 */
function signalObserver() {
  if (!fs.existsSync(OBSERVER_PID_FILE)) {
    return;
  }

  try {
    const pid = parseInt(fs.readFileSync(OBSERVER_PID_FILE, 'utf8').trim(), 10);
    if (pid && !isNaN(pid)) {
      // 发送 SIGUSR1 信号
      process.kill(pid, 'SIGUSR1');
    }
  } catch (err) {
    // 静默处理信号发送错误（进程可能已不存在）
  }
}

// 运行主函数
main();
