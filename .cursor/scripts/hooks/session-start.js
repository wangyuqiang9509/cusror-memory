#!/usr/bin/env node
/**
 * 会话启动钩子 - 在新会话开始时加载之前的上下文
 *
 * 跨平台支持 (Windows, macOS, Linux)
 *
 * 当新的 Claude 会话开始时运行。检查最近的会话文件，
 * 并通知 Claude 有可用的上下文可以加载。
 */

// 引入 Node.js 内置的 path 模块，用于处理文件路径
const path = require('path');

// 从工具库中引入必要的函数：
// - getSessionsDir: 获取会话目录路径
// - getLearnedSkillsDir: 获取学习技能目录路径
// - findFiles: 查找文件
// - ensureDir: 确保目录存在
// - log: 日志记录函数
const {
  getSessionsDir,
  getLearnedSkillsDir,
  findFiles,
  ensureDir,
  log
} = require('../lib/utils');

// 从包管理器库中引入必要的函数：
// - getPackageManager: 检测和获取包管理器
// - getSelectionPrompt: 获取包管理器选择提示信息
const { getPackageManager, getSelectionPrompt } = require('../lib/package-manager');

// 主函数 - 会话启动时的主要逻辑
async function main() {
  // 获取会话目录和学习技能目录的路径
  const sessionsDir = getSessionsDir();
  const learnedDir = getLearnedSkillsDir();

  // 确保必要的目录存在，如果不存在则创建它们
  ensureDir(sessionsDir);
  ensureDir(learnedDir);

  // 检查最近7天的会话文件
  // 支持旧格式 (YYYY-MM-DD-session.tmp) 和新格式 (YYYY-MM-DD-shortid-session.tmp)
  // findFiles 函数会根据 maxAge 参数过滤出7天内的文件
  const recentSessions = findFiles(sessionsDir, '*-session.tmp', { maxAge: 7 });

  // 如果找到最近的会话文件，记录日志信息
  if (recentSessions.length > 0) {
    // 获取最新的会话文件（findFiles 返回的结果按修改时间排序）
    const latest = recentSessions[0];
    log(`[SessionStart] Found ${recentSessions.length} recent session(s)`);
    log(`[SessionStart] Latest: ${latest.path}`);
  }

  // 检查学习到的技能文件（.md 文件）
  const learnedSkills = findFiles(learnedDir, '*.md');

  // 如果找到学习技能文件，记录日志信息
  if (learnedSkills.length > 0) {
    log(`[SessionStart] ${learnedSkills.length} learned skill(s) available in ${learnedDir}`);
  }

  // 检测并报告当前使用的包管理器
  const pm = getPackageManager();
  log(`[SessionStart] Package manager: ${pm.name} (${pm.source})`);

  // 如果包管理器是通过 fallback（后备方案）或 default（默认）方式检测到的，
  // 说明没有明确的包管理器偏好设置，需要显示选择提示
  if (pm.source === 'fallback' || pm.source === 'default') {
    log('[SessionStart] No package manager preference found.');
    log(getSelectionPrompt());
  }

  // 正常退出程序
  process.exit(0);
}

// 执行主函数，并处理可能的错误
main().catch(err => {
  // 记录错误信息到标准错误输出
  console.error('[SessionStart] Error:', err.message);
  // 即使出现错误也不要阻塞会话启动，以免影响用户体验
  process.exit(0);
});
