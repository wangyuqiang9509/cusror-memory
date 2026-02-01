#!/usr/bin/env node
/**
 * Continuous Learning v2 - Session Analysis Hook for Cursor IDE
 *
 * 在会话结束时分析观察记录并提取模式。
 * 此脚本应在 sessionEnd 或 stop 钩子中运行。
 *
 * 功能：
 * - 读取当前会话的观察记录
 * - 识别重复模式
 * - 生成模式建议（不自动创建本能）
 * - 输出到 stderr 供用户查看
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ─────────────────────────────────────────────
// 配置
// ─────────────────────────────────────────────

const CURSOR_DIR = path.join(os.homedir(), '.cursor');
const CONFIG_DIR = path.join(CURSOR_DIR, 'homunculus');
const OBSERVATIONS_FILE = path.join(CONFIG_DIR, 'observations.jsonl');
const INSTINCTS_DIR = path.join(CONFIG_DIR, 'instincts', 'personal');
const MIN_PATTERN_COUNT = 3; // 最少出现次数才认为是模式

// ─────────────────────────────────────────────
// 主逻辑
// ─────────────────────────────────────────────

async function main() {
  try {
    // 检查观察文件是否存在
    if (!fs.existsSync(OBSERVATIONS_FILE)) {
      process.exit(0);
    }

    // 读取观察记录
    const observations = readObservations();
    if (observations.length < 10) {
      // 观察记录太少，跳过分析
      process.exit(0);
    }

    // 分析模式
    const patterns = analyzePatterns(observations);

    // 如果发现有意义的模式，输出建议
    if (patterns.length > 0) {
      outputSuggestions(patterns, observations.length);
    }

    process.exit(0);
  } catch (err) {
    // 静默处理错误
    process.exit(0);
  }
}

// ─────────────────────────────────────────────
// 分析函数
// ─────────────────────────────────────────────

/**
 * 读取观察记录
 */
function readObservations() {
  const content = fs.readFileSync(OBSERVATIONS_FILE, 'utf8');
  const lines = content.trim().split('\n').filter(Boolean);

  return lines.map(line => {
    try {
      return JSON.parse(line);
    } catch (e) {
      return null;
    }
  }).filter(Boolean);
}

/**
 * 分析观察记录中的模式
 */
function analyzePatterns(observations) {
  const patterns = [];

  // 1. 工具使用频率
  const toolCounts = {};
  observations.forEach(obs => {
    const tool = obs.tool || 'unknown';
    toolCounts[tool] = (toolCounts[tool] || 0) + 1;
  });

  // 2. 工具序列模式（连续使用的工具）
  const sequences = {};
  for (let i = 0; i < observations.length - 1; i++) {
    const seq = `${observations[i].tool || 'unknown'} → ${observations[i + 1].tool || 'unknown'}`;
    sequences[seq] = (sequences[seq] || 0) + 1;
  }

  // 3. 文件编辑模式
  const filePatterns = {};
  observations
    .filter(obs => obs.event === 'file_edit' && obs.input)
    .forEach(obs => {
      const ext = path.extname(obs.input) || 'no-ext';
      filePatterns[ext] = (filePatterns[ext] || 0) + 1;
    });

  // 4. 命令模式
  const commandPatterns = {};
  observations
    .filter(obs => obs.event === 'shell_execution' && obs.input)
    .forEach(obs => {
      // 提取命令的基础部分（第一个词）
      const cmd = obs.input.split(/\s+/)[0];
      commandPatterns[cmd] = (commandPatterns[cmd] || 0) + 1;
    });

  // 生成模式建议
  // 高频工具序列
  Object.entries(sequences)
    .filter(([seq, count]) => count >= MIN_PATTERN_COUNT)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([seq, count]) => {
      patterns.push({
        type: 'workflow',
        description: `工具序列: ${seq}`,
        count,
        suggestion: `当执行 ${seq.split(' → ')[0]} 时，经常会接着使用 ${seq.split(' → ')[1]}`
      });
    });

  // 高频命令
  Object.entries(commandPatterns)
    .filter(([cmd, count]) => count >= MIN_PATTERN_COUNT)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([cmd, count]) => {
      patterns.push({
        type: 'tool-preference',
        description: `常用命令: ${cmd}`,
        count,
        suggestion: `频繁使用 ${cmd} 命令（${count} 次）`
      });
    });

  // 高频文件类型
  Object.entries(filePatterns)
    .filter(([ext, count]) => count >= MIN_PATTERN_COUNT)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([ext, count]) => {
      patterns.push({
        type: 'file-pattern',
        description: `编辑文件类型: ${ext}`,
        count,
        suggestion: `主要编辑 ${ext} 文件（${count} 次）`
      });
    });

  return patterns;
}

/**
 * 输出建议到 stderr（对用户可见）
 */
function outputSuggestions(patterns, totalObservations) {
  if (patterns.length === 0) {
    return;
  }

  console.error('\n[Continuous Learning v2] 会话模式分析');
  console.error('═'.repeat(50));
  console.error(`分析了 ${totalObservations} 个事件，发现 ${patterns.length} 个模式：`);
  console.error('');

  patterns.forEach((pattern, index) => {
    console.error(`${index + 1}. [${pattern.type}] ${pattern.description}`);
    console.error(`   ${pattern.suggestion} (出现 ${pattern.count} 次)`);
    console.error('');
  });

  console.error('提示: 使用 /instinct-status 查看已学习的本能');
  console.error('      使用 /evolve 将本能聚类为技能');
  console.error('═'.repeat(50) + '\n');
}

// 运行主函数
main();
