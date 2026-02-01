#!/usr/bin/env node
/**
 * Continuous Learning v2 - Initialization Hook for Cursor IDE
 *
 * 在会话开始时初始化目录结构和配置。
 * 此脚本应在 sessionStart 钩子中运行。
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ─────────────────────────────────────────────
// 配置
// ─────────────────────────────────────────────

const CURSOR_DIR = path.join(os.homedir(), '.cursor');
const CONFIG_DIR = path.join(CURSOR_DIR, 'homunculus');

// 需要创建的目录结构
const DIRECTORIES = [
  path.join(CONFIG_DIR, 'instincts', 'personal'),
  path.join(CONFIG_DIR, 'instincts', 'inherited'),
  path.join(CONFIG_DIR, 'evolved', 'skills'),
  path.join(CONFIG_DIR, 'evolved', 'commands'),
  path.join(CONFIG_DIR, 'evolved', 'agents'),
  path.join(CONFIG_DIR, 'observations.archive')
];

// 默认配置
const DEFAULT_CONFIG = {
  version: '2.0',
  observation: {
    enabled: true,
    store_path: path.join(CONFIG_DIR, 'observations.jsonl'),
    max_file_size_mb: 10,
    archive_after_days: 7,
    capture_events: ['file_edit', 'shell_execution'],
    ignore_patterns: ['node_modules', '.git', 'dist', 'build']
  },
  instincts: {
    personal_path: path.join(CONFIG_DIR, 'instincts', 'personal'),
    inherited_path: path.join(CONFIG_DIR, 'instincts', 'inherited'),
    min_confidence: 0.3,
    auto_approve_threshold: 0.7,
    confidence_decay_rate: 0.02,
    max_instincts: 100
  },
  observer: {
    enabled: false, // 手动启用后台观察者
    run_interval_minutes: 5,
    min_observations_to_analyze: 20
  },
  evolution: {
    cluster_threshold: 3,
    evolved_path: path.join(CONFIG_DIR, 'evolved'),
    auto_evolve: false
  }
};

// ─────────────────────────────────────────────
// 主逻辑
// ─────────────────────────────────────────────

function main() {
  try {
    // 创建目录结构
    DIRECTORIES.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // 创建或更新配置文件
    const configPath = path.join(CONFIG_DIR, 'config.json');
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8');
    }

    // 创建 identity.json（如果不存在）
    const identityPath = path.join(CONFIG_DIR, 'identity.json');
    if (!fs.existsSync(identityPath)) {
      const identity = {
        created_at: new Date().toISOString(),
        learning_started: new Date().toISOString(),
        preferences: {
          language: 'zh-CN',
          notification_level: 'summary'
        },
        stats: {
          total_observations: 0,
          total_instincts: 0,
          sessions_analyzed: 0
        }
      };
      fs.writeFileSync(identityPath, JSON.stringify(identity, null, 2), 'utf8');
    }

    // 创建空的 observations.jsonl（如果不存在）
    const observationsPath = path.join(CONFIG_DIR, 'observations.jsonl');
    if (!fs.existsSync(observationsPath)) {
      fs.writeFileSync(observationsPath, '', 'utf8');
    }

    // 静默成功
    process.exit(0);
  } catch (err) {
    // 初始化失败不应阻塞会话
    process.exit(0);
  }
}

main();
