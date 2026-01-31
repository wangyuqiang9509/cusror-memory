#!/usr/bin/env node

/**
 * PreCompact Hook - 在上下文压缩前保存状态
 *
 * 跨平台支持 (Windows, macOS, Linux)
 *
 * 在 Claude 压缩上下文之前运行，给您一个机会来
 * 保留可能在摘要中丢失的重要状态。
 */

// 导入 Node.js 内置的 path 模块，用于处理文件路径
const path = require('path');

// 从工具库中导入所需的函数
const {
  getSessionsDir,      // 获取会话目录路径
  getDateTimeString,   // 获取格式化的日期时间字符串
  getTimeString,       // 获取格式化的时间字符串
  findFiles,           // 查找文件
  ensureDir,           // 确保目录存在
  appendFile,          // 向文件追加内容
  log                  // 日志记录函数
} = require('../lib/utils');

/**
 * 主函数 - 执行预压缩前的状态保存操作
 */
async function main() {
  // 获取会话目录的路径
  const sessionsDir = getSessionsDir();

  // 构建压缩日志文件的完整路径
  const compactionLog = path.join(sessionsDir, 'compaction-log.txt');

  // 确保会话目录存在，如果不存在则创建
  ensureDir(sessionsDir);

  // 记录压缩事件并附带时间戳
  const timestamp = getDateTimeString();
  appendFile(compactionLog, `[${timestamp}] Context compaction triggered\n`);

  // 如果存在活跃的会话文件，在其中记录压缩事件
  // 查找所有 .tmp 格式的会话文件
  const sessions = findFiles(sessionsDir, '*.tmp');

  // 如果找到了活跃的会话文件
  if (sessions.length > 0) {
    // 获取第一个（通常也是最新的）活跃会话文件的路径
    const activeSession = sessions[0].path;

    // 获取当前时间字符串
    const timeStr = getTimeString();

    // 在活跃会话文件中追加压缩标记，格式为：
    // ---
    // **[Compaction occurred at HH:MM:SS]** - Context was summarized
    appendFile(activeSession, `\n---\n**[Compaction occurred at ${timeStr}]** - Context was summarized\n`);
  }

  // 记录预压缩钩子执行完成的信息
  log('[PreCompact] State saved before compaction');

  // 正常退出程序
  process.exit(0);
}

// 执行主函数，如果发生错误则捕获并处理
main().catch(err => {
  // 输出错误信息到控制台
  console.error('[PreCompact] Error:', err.message);

  // 即使发生错误也正常退出，避免影响压缩过程
  process.exit(0);
});
