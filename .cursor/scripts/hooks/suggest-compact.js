#!/usr/bin/env node
/**
 * 战略性压缩建议器 (Strategic Compact Suggester)
 *
 * 跨平台支持 (Windows, macOS, Linux)
 *
 * 在 PreToolUse 钩子或定期运行，在逻辑间隔点建议手动压缩
 *
 * 为什么选择手动压缩而不是自动压缩：
 * - 自动压缩在任意时间点发生，通常在任务进行中
 * - 战略性压缩保持上下文通过逻辑阶段
 * - 在探索后、执行前进行压缩
 * - 在完成里程碑后、开始下一阶段前进行压缩
 */

// 导入 Node.js 内置模块
const path = require('path');  // 路径处理模块
const fs = require('fs');      // 文件系统模块

// 从工具库导入辅助函数
const {
  getTempDir,  // 获取临时目录路径
  readFile,    // 读取文件内容
  writeFile,   // 写入文件内容
  log          // 日志输出函数
} = require('../lib/utils');

/**
 * 主函数：跟踪工具调用次数并在适当时机建议压缩
 */
async function main() {
  // ============================================
  // 初始化配置和会话信息
  // ============================================

  // 获取会话ID：优先使用环境变量中的CLAUDE_SESSION_ID，
  // 如果没有则使用父进程ID，最后回退到'default'
  // 这样可以确保每个会话有独立的计数器文件
  const sessionId = process.env.CLAUDE_SESSION_ID || process.ppid || 'default';

  // 构建计数器文件路径：存储在临时目录中，文件名包含会话ID
  // 格式：claude-tool-count-{sessionId}
  const counterFile = path.join(getTempDir(), `claude-tool-count-${sessionId}`);

  // 获取压缩阈值：从环境变量COMPACT_THRESHOLD读取，默认为50次工具调用
  // 这个值决定了第一次建议压缩的时间点
  const threshold = parseInt(process.env.COMPACT_THRESHOLD || '50', 10);

  // ============================================
  // 读取和更新工具调用计数
  // ============================================

  // 初始化计数为1（本次调用）
  let count = 1;

  // 尝试读取已存在的计数文件内容
  const existing = readFile(counterFile);
  if (existing) {
    // 如果文件存在，将现有计数加1
    // 使用trim()去除可能的空白字符，然后转换为整数
    count = parseInt(existing.trim(), 10) + 1;
  }

  // 将更新后的计数保存到文件
  // 转换为字符串格式存储
  writeFile(counterFile, String(count));

  // ============================================
  // 压缩建议逻辑
  // ============================================

  // 当达到初始阈值时，建议进行压缩
  // 这通常是在任务的早期阶段，当工具调用次数达到设定阈值时触发
  if (count === threshold) {
    log(`[StrategicCompact] ${threshold} tool calls reached - consider /compact if transitioning phases`);
    // 日志消息提示：已达到阈值，如果正在转换阶段，考虑使用 /compact 命令
  }

  // 在超过阈值后，每隔25次工具调用进行定期提醒
  // 这为用户提供了持续的检查点，即使他们错过了初始建议
  if (count > threshold && count % 25 === 0) {
    log(`[StrategicCompact] ${count} tool calls - good checkpoint for /compact if context is stale`);
    // 日志消息提示：这是个检查点，如果上下文变得陈旧，建议使用 /compact 命令
  }

  // 正常退出程序
  process.exit(0);
}

// ============================================
// 错误处理和程序入口
// ============================================

// 执行主函数，如果发生错误则捕获并处理
main().catch(err => {
  // 输出错误信息到标准错误流
  // 使用 StrategicCompact 前缀标识错误来源
  console.error('[StrategicCompact] Error:', err.message);

  // 即使发生错误也正常退出（exit code 0）
  // 避免因为计数器脚本的错误影响主程序流程
  process.exit(0);
});
