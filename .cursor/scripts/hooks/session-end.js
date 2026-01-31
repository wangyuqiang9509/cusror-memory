#!/usr/bin/env node

/**
 * 会话结束钩子 (Session End Hook) - 在会话结束时持久化学习内容
 *
 * 跨平台支持 (Windows, macOS, Linux)
 *
 * 当Claude会话结束时运行。创建或更新会话日志文件，
 * 包含时间戳用于连续性跟踪和上下文恢复。
 *
 * 主要功能：
 * 1. 创建每日会话跟踪文件
 * 2. 记录会话开始时间和最后更新时间
 * 3. 为下次会话提供模板和上下文信息
 * 4. 支持多会话并发（通过会话ID区分）
 */

// 导入Node.js核心模块
const path = require('path');  // 路径操作模块
const fs = require('fs');      // 文件系统操作模块

// 从工具库导入所需的工具函数
const {
  getSessionsDir,     // 获取会话目录路径
  getDateString,      // 获取当前日期字符串 (YYYY-MM-DD格式)
  getTimeString,      // 获取当前时间字符串 (HH:MM:SS格式)
  getSessionIdShort,  // 获取简短的会话ID
  ensureDir,          // 确保目录存在，如果不存在则创建
  readFile,           // 读取文件内容
  writeFile,          // 写入文件内容
  replaceInFile,      // 在文件中替换内容
  log                 // 日志记录函数
} = require('../lib/utils');

/**
 * 主函数 - 执行会话结束时的清理和记录工作
 *
 * 处理流程：
 * 1. 获取会话相关路径和时间信息
 * 2. 检查是否已存在当天的会话文件
 * 3. 如果存在则更新最后更新时间
 * 4. 如果不存在则创建新的会话文件模板
 * 5. 记录操作日志
 */
async function main() {
  // 获取会话目录路径（通常是用户数据目录下的sessions文件夹）
  const sessionsDir = getSessionsDir();

  // 获取当前日期字符串，用于文件名和会话记录
  const today = getDateString();

  // 获取简短的会话ID，用于区分同一日期内的多个会话
  const shortId = getSessionIdShort();

  // 构建会话文件名：日期-会话ID-session.tmp
  // 例如：2024-01-15-abc123-session.tmp
  // 包含会话ID以确保每个会话有唯一的跟踪文件
  const sessionFile = path.join(sessionsDir, `${today}-${shortId}-session.tmp`);

  // 确保会话目录存在，如果不存在则创建
  ensureDir(sessionsDir);

  // 获取当前时间字符串，用于记录最后更新时间
  const currentTime = getTimeString();

  // 检查当天的会话文件是否已存在
  // 如果存在，说明这是同一个会话的后续操作，需要更新时间戳
  if (fs.existsSync(sessionFile)) {
    // 使用正则表达式匹配并替换"Last Updated"行
    // 将最后更新时间更新为当前时间
    const success = replaceInFile(
      sessionFile,
      /\*\*Last Updated:\*\*.*/,           // 匹配markdown格式的最后更新行
      `**Last Updated:** ${currentTime}`  // 替换为新的时间戳
    );

    // 如果替换成功，记录更新操作的日志
    if (success) {
      log(`[SessionEnd] Updated session file: ${sessionFile}`);
    }
  } else {
    // 如果会话文件不存在，创建新的会话跟踪文件
    // 使用模板创建一个结构化的markdown文档
    const template = `# Session: ${today}
**Date:** ${today}
**Started:** ${currentTime}
**Last Updated:** ${currentTime}

---

## Current State

[Session context goes here]

### Completed
- [ ]

### In Progress
- [ ]

### Notes for Next Session
-

### Context to Load
\`\`\`
[relevant files]
\`\`\`
`;

    // 将模板内容写入新创建的会话文件
    writeFile(sessionFile, template);

    // 记录创建新会话文件的日志
    log(`[SessionEnd] Created session file: ${sessionFile}`);
  }

  // 正常退出程序，返回退出码0表示成功
  process.exit(0);
}

// 执行主函数，如果发生错误则捕获并处理
main().catch(err => {
  // 在标准错误输出中记录错误信息
  console.error('[SessionEnd] Error:', err.message);

  // 即使发生错误也正常退出，避免影响Claude的正常关闭流程
  process.exit(0);
});
