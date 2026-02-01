#!/usr/bin/env node
/**
 * 持续学习 - 会话评估器 (Continuous Learning - Session Evaluator)
 *
 * 跨平台支持 (Windows, macOS, Linux)
 * 兼容 Cursor IDE 和 Claude Code 环境
 *
 * 在 sessionEnd 钩子上运行，提示用户评估会话中的可复用模式
 *
 * 为什么选择 sessionEnd 而不是每条消息后触发：
 * - sessionEnd 在会话结束时只运行一次（轻量级）
 * - 避免在每条消息时增加延迟
 *
 * 主要功能：
 * 1. 在会话结束时输出提示信息
 * 2. 提醒用户可以使用 /learn 命令手动提取模式
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
  log                   // 日志记录函数
} = require('../lib/utils');

/**
 * 主函数 - 执行会话结束时的评估提示
 * 该函数在会话结束时被调用，输出学习提示信息
 */
async function main() {
  // 获取脚本所在目录，用于定位配置文件
  const scriptDir = __dirname;
  // 构建配置文件路径：scripts/hooks/../../skills/continuous-learning/config.json
  const configFile = path.join(scriptDir, '..', '..', 'skills', 'continuous-learning', 'config.json');

  // 默认学习技能保存目录
  let learnedSkillsPath = getLearnedSkillsDir();

  // 尝试加载配置文件
  const configContent = readFile(configFile);
  if (configContent) {
    try {
      // 解析JSON配置文件
      const config = JSON.parse(configContent);

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

  // 输出会话结束提示信息
  // 提醒用户可以使用 /learn 命令手动提取模式
  log(`[ContinuousLearning] 会话结束 - 如有可复用模式，使用 /learn 命令提取`);
  log(`[ContinuousLearning] 学习技能保存目录: ${learnedSkillsPath}`);

  // 正常退出
  process.exit(0);
}

// 执行主函数并处理可能的错误
main().catch(err => {
  // 记录错误信息到控制台，但不中断程序流程
  console.error('[ContinuousLearning] 错误:', err.message);
  process.exit(0);
});
