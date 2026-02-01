---
name: continuous-learning-v2
description: 基于本能的学习系统，通过钩子观察会话，创建带置信度评分的原子级本能，并将其演化为技能/命令/智能体。
version: 2.0.0
platform: cursor
---

# 持续学习 v2 - Cursor IDE 版本

通过原子级"本能"（带置信度评分的微型习得行为）将 Cursor 会话转化为可复用的知识。

## 核心特性

| 特性 | 说明 |
|------|------|
| 观察机制 | `afterFileEdit` / `beforeShellExecution` 钩子（100% 可靠） |
| 分析方式 | 会话结束时自动分析 |
| 粒度 | 原子级"本能" |
| 置信度 | 0.3-0.9 加权评分 |
| 演化路径 | 本能 → 聚类 → 技能/命令/智能体 |
| 共享能力 | 导出/导入本能 |

## 本能模型

本能是一种微型习得行为：

```yaml
---
id: prefer-functional-style
trigger: "when writing new functions"
confidence: 0.7
domain: "code-style"
source: "session-observation"
---

# 偏好函数式风格

## 行为
在适当场景下优先使用函数式模式而非类。

## 证据
- 观察到 5 次函数式模式偏好
- 用户于 2025-01-15 将基于类的实现修正为函数式
```

**核心属性：**
- **原子性** — 单一触发条件，单一行为
- **置信度加权** — 0.3 = 试探性，0.9 = 近乎确定
- **领域标签** — code-style、testing、git、debugging、workflow 等
- **证据支撑** — 追溯创建该本能的观察记录

## 工作原理

```
会话活动
      │
      │ 钩子捕获文件编辑 + Shell 命令（100% 可靠）
      ▼
┌─────────────────────────────────────────┐
│         observations.jsonl              │
│   （文件路径、命令、时间戳）              │
└─────────────────────────────────────────┘
      │
      │ 会话结束时自动分析
      ▼
┌─────────────────────────────────────────┐
│           模式检测                       │
│   • 工具序列 → 本能                      │
│   • 文件模式 → 本能                      │
│   • 常用命令 → 本能                      │
└─────────────────────────────────────────┘
      │
      │ /evolve 聚类
      ▼
┌─────────────────────────────────────────┐
│              evolved/                   │
│   • commands/new-feature.md             │
│   • skills/testing-workflow.md          │
└─────────────────────────────────────────┘
```

## 快速开始

### Cursor IDE 配置

在项目的 `.cursor/hooks.json` 中添加以下钩子配置：

```json
{
  "version": 1,
  "hooks": {
    "sessionStart": [
      {
        "command": "node \".cursor/skills/continuous-learning-v2/hooks/init.js\"",
        "timeout": 5
      }
    ],
    "sessionEnd": [
      {
        "command": "node \".cursor/skills/continuous-learning-v2/hooks/session-analyze.js\"",
        "timeout": 15
      }
    ],
    "afterFileEdit": [
      {
        "command": "node \".cursor/skills/continuous-learning-v2/hooks/observe.js\"",
        "timeout": 5
      }
    ],
    "beforeShellExecution": [
      {
        "command": "node \".cursor/skills/continuous-learning-v2/hooks/observe.js\"",
        "timeout": 5
      }
    ]
  }
}
```

**Cursor 支持的钩子类型：**
- `sessionStart` - 会话开始时（初始化目录结构）
- `sessionEnd` - 会话结束时（分析模式）
- `afterFileEdit` - 文件编辑后（记录编辑事件）
- `beforeShellExecution` - Shell 命令执行前（记录命令事件）
- `stop` - 任务完成时

### 目录结构

目录结构会在首次会话开始时由 `init.js` 自动创建，无需手动操作。

## 命令列表

| 命令 | 说明 |
|---------|-------------|
| `/instinct-status` | 显示所有已学习的本能及其置信度 |
| `/evolve` | 将相关本能聚类为技能/命令 |
| `/instinct-export` | 导出本能用于分享 |
| `/instinct-import <file>` | 从他人处导入本能 |

## 配置说明

编辑 `.cursor/skills/continuous-learning-v2/config.json`：

```json
{
  "version": "2.0",
  "platform": "cursor",
  "observation": {
    "enabled": true,
    "store_path": "~/.cursor/homunculus/observations.jsonl",
    "max_file_size_mb": 10,
    "archive_after_days": 7,
    "capture_events": ["file_edit", "shell_execution"],
    "ignore_patterns": ["node_modules", ".git", "dist", "build"]
  },
  "instincts": {
    "personal_path": "~/.cursor/homunculus/instincts/personal/",
    "inherited_path": "~/.cursor/homunculus/instincts/inherited/",
    "min_confidence": 0.3,
    "auto_approve_threshold": 0.7,
    "confidence_decay_rate": 0.02
  },
  "evolution": {
    "cluster_threshold": 3,
    "evolved_path": "~/.cursor/homunculus/evolved/"
  }
}
```

## 文件结构

```
~/.cursor/homunculus/
├── config.json             # 运行时配置
├── identity.json           # 用户画像、技术水平
├── observations.jsonl      # 当前会话观察记录
├── observations.archive/   # 已处理的观察记录
├── instincts/
│   ├── personal/           # 自动学习的本能
│   └── inherited/          # 从他人导入的本能
└── evolved/
    ├── agents/             # 生成的专业智能体
    ├── skills/             # 生成的技能
    └── commands/           # 生成的命令
```

## 置信度评分机制

置信度随时间动态演化：

| 分值 | 含义 | 行为 |
|-------|---------|----------|
| 0.3 | 试探性 | 建议但不强制执行 |
| 0.5 | 中等 | 相关场景下应用 |
| 0.7 | 强 | 自动批准应用 |
| 0.9 | 近乎确定 | 核心行为 |

**置信度提升条件：**
- 模式被重复观察到
- 用户未修正建议的行为
- 来自其他来源的相似本能相互印证

**置信度下降条件：**
- 用户明确修正该行为
- 该模式长期未被观察到
- 出现矛盾证据

## 为何用钩子进行观察？

钩子 **100% 确定性触发**，意味着：
- 每次文件编辑和 Shell 命令都被观察
- 不遗漏任何模式
- 学习全面覆盖

## 隐私保护

- 观察记录 **仅保存在本地**
- 只有 **本能**（模式）可被导出
- 不会分享任何实际代码或对话内容
- 导出内容完全由你控制

---

*本能驱动学习：逐次观察，逐步教会 Cursor 你的习惯模式。*
