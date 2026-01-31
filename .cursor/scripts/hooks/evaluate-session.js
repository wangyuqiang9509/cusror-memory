#!/usr/bin/env node
/**
 * 持续学习 - 会话评估器 (Continuous Learning - Session Evaluator)
 *
 * 跨平台支持 (Windows, macOS, Linux)
 *
 * 在Stop钩子上运行，从Claude Code会话中提取可重用的模式
 *
 * 为什么选择Stop钩子而不是UserPromptSubmit：
 * - Stop钩子在会话结束时只运行一次 (轻量级)
 * - UserPromptSubmit钩子在每次消息时都运行 (重量级，会增加延迟)
 *
 * 主要功能：
 * 1. 检查会话长度是否达到最小阈值
 * 2. 如果足够长，则标记会话需要进行模式提取评估
 * 3. 将学习到的技能保存到指定目录
 */

// 导入Node.js内置模块
const path = require('path');  // 路径处理模块
const fs = require('fs');      // 文件系统模块

// 从工具库导入辅助函数
const {
  getLearnedSkillsDir,  // 获取学习技能目录
  ensureDir,            // 确保目录存在
  readFile,             // 读取文件内容
  countInFile,          // 在文件中计数匹配项
  log                   // 日志记录函数
} = require('../lib/utils');

/**
 * 主函数 - 执行会话评估逻辑
 * 该函数在Claude Code会话结束时被调用，用于评估会话质量并决定是否提取模式
 */
async function main() {
  // 获取脚本所在目录，用于定位配置文件
  const scriptDir = __dirname;
  // 构建配置文件路径：scripts/hooks/../../skills/continuous-learning/config.json
  const configFile = path.join(scriptDir, '..', '..', 'skills', 'continuous-learning', 'config.json');

  // 默认配置参数
  let minSessionLength = 10;        // 最小会话长度（消息数量）
  let learnedSkillsPath = getLearnedSkillsDir();  // 学习技能保存目录

  // 尝试加载配置文件
  const configContent = readFile(configFile);
  if (configContent) {
    try {
      // 解析JSON配置文件
      const config = JSON.parse(configContent);
      // 从配置中读取最小会话长度，默认为10
      minSessionLength = config.min_session_length || 10;

      // 如果配置中指定了学习技能保存路径
      if (config.learned_skills_path) {
        // 处理路径中的~符号，替换为用户主目录
        learnedSkillsPath = config.learned_skills_path.replace(/^~/, require('os').homedir());
      }
    } catch {
      // 配置文件无效，使用默认配置
    }
  }

  // 确保学习技能目录存在，如果不存在则创建
  ensureDir(learnedSkillsPath);

  // 从环境变量获取会话记录文件路径（由Claude Code设置）
  // 这个环境变量包含当前会话的完整对话记录
  const transcriptPath = process.env.CLAUDE_TRANSCRIPT_PATH;

  // 检查会话记录文件是否存在
  // 如果没有记录文件或文件不存在，直接退出（静默处理）
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    process.exit(0);
  }

  // 统计会话中的用户消息数量
  // 通过正则表达式匹配"type":"user"的JSON片段来计数用户消息
  const messageCount = countInFile(transcriptPath, /"type":"user"/g);

  // 跳过过短的会话
  // 只有当会话消息数量达到最小阈值时才进行模式提取评估
  if (messageCount < minSessionLength) {
    log(`[ContinuousLearning] 会话过短 (${messageCount} 条消息)，跳过评估`);
    process.exit(0);
  }

  // 向Claude发出信号，表示该会话应该被评估以提取可重用模式
  // 记录会话统计信息和保存路径
  log(`[ContinuousLearning] 会话包含 ${messageCount} 条消息 - 评估可提取的模式`);
  log(`[ContinuousLearning] 学习技能保存到: ${learnedSkillsPath}`);

  // 正常退出，信号已发出
  process.exit(0);
}

// 执行主函数并处理可能的错误
// 使用catch捕获异步函数中的异常
main().catch(err => {
  // 记录错误信息到控制台，但不中断程序流程
  // 使用静默退出(0)而不是错误退出(1)，避免干扰Claude Code的正常工作
  console.error('[ContinuousLearning] 错误:', err.message);
  process.exit(0);
});
