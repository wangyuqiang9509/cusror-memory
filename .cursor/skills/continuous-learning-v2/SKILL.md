---
name: continuous-learning-v2
description: 基于本能的学习系统，通过钩子观察会话，创建带置信度评分的原子级本能，并将其演化为技能/命令/智能体。
version: 2.0.0
---

# 持续学习 v2 - 本能驱动架构

一套先进的学习系统，通过原子级"本能"（带置信度评分的微型习得行为）将 Claude Code 会话转化为可复用的知识。

## v2 新特性

| 特性 | v1 | v2 |
|---------|----|----|
| 观察机制 | Stop 钩子（会话结束时） | PreToolUse/PostToolUse（100% 可靠） |
| 分析方式 | 主上下文 | 后台智能体（Haiku） |
| 粒度 | 完整技能 | 原子级"本能" |
| 置信度 | 无 | 0.3-0.9 加权评分 |
| 演化路径 | 直接生成技能 | 本能 → 聚类 → 技能/命令/智能体 |
| 共享能力 | 无 | 导出/导入本能 |

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
      │ 钩子捕获提示词 + 工具调用（100% 可靠）
      ▼
┌─────────────────────────────────────────┐
│         observations.jsonl              │
│   （提示词、工具调用、执行结果）           │
└─────────────────────────────────────────┘
      │
      │ 观察者智能体读取（后台运行，Haiku）
      ▼
┌─────────────────────────────────────────┐
│           模式检测                       │
│   • 用户修正 → 本能                      │
│   • 错误解决 → 本能                      │
│   • 重复工作流 → 本能                    │
└─────────────────────────────────────────┘
      │
      │ 创建/更新
      ▼
┌─────────────────────────────────────────┐
│         instincts/personal/             │
│   • prefer-functional.md (0.7)          │
│   • always-test-first.md (0.9)          │
│   • use-zod-validation.md (0.6)         │
└─────────────────────────────────────────┘
      │
      │ /evolve 聚类
      ▼
┌─────────────────────────────────────────┐
│              evolved/                   │
│   • commands/new-feature.md             │
│   • skills/testing-workflow.md          │
│   • agents/refactor-specialist.md       │
└─────────────────────────────────────────┘
```

## 快速开始

### 1. 启用观察钩子

在 `~/.claude/settings.json` 中添加：

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/skills/continuous-learning-v2/hooks/observe.sh pre"
      }]
    }],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/skills/continuous-learning-v2/hooks/observe.sh post"
      }]
    }]
  }
}
```

### 2. 初始化目录结构

```bash
mkdir -p ~/.claude/homunculus/{instincts/{personal,inherited},evolved/{agents,skills,commands}}
touch ~/.claude/homunculus/observations.jsonl
```

### 3. 运行观察者智能体（可选）

观察者可在后台持续分析观察记录：

```bash
# 启动后台观察者
~/.claude/skills/continuous-learning-v2/agents/start-observer.sh
```

## 命令列表

| 命令 | 说明 |
|---------|-------------|
| `/instinct-status` | 显示所有已学习的本能及其置信度 |
| `/evolve` | 将相关本能聚类为技能/命令 |
| `/instinct-export` | 导出本能用于分享 |
| `/instinct-import <file>` | 从他人处导入本能 |

## 配置说明

编辑 `config.json`：

```json
{
  "version": "2.0",
  "observation": {
    "enabled": true,
    "store_path": "~/.claude/homunculus/observations.jsonl",
    "max_file_size_mb": 10,
    "archive_after_days": 7
  },
  "instincts": {
    "personal_path": "~/.claude/homunculus/instincts/personal/",
    "inherited_path": "~/.claude/homunculus/instincts/inherited/",
    "min_confidence": 0.3,
    "auto_approve_threshold": 0.7,
    "confidence_decay_rate": 0.05
  },
  "observer": {
    "enabled": true,
    "model": "haiku",
    "run_interval_minutes": 5,
    "patterns_to_detect": [
      "user_corrections",
      "error_resolutions",
      "repeated_workflows",
      "tool_preferences"
    ]
  },
  "evolution": {
    "cluster_threshold": 3,
    "evolved_path": "~/.claude/homunculus/evolved/"
  }
}
```

## 文件结构

```
~/.claude/homunculus/
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

## 与 Skill Creator 集成

使用 [Skill Creator GitHub App](https://skill-creator.app) 时，现在会同时生成：
- 传统 SKILL.md 文件（向后兼容）
- 本能集合（适用于 v2 学习系统）

从仓库分析生成的本能会标记 `source: "repo-analysis"` 并包含源仓库 URL。

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

## 为何用钩子而非技能进行观察？

> "v1 依赖技能进行观察。技能是概率性的——根据 Claude 的判断，触发率约 50-80%。"

钩子 **100% 确定性触发**，这意味着：
- 每次工具调用都被观察
- 不遗漏任何模式
- 学习全面覆盖

## 向后兼容

v2 与 v1 完全兼容：
- 现有 `~/.claude/skills/learned/` 技能仍可正常工作
- Stop 钩子仍会运行（同时也会馈入 v2）
- 渐进迁移路径：可并行运行两个版本

## 隐私保护

- 观察记录 **仅保存在本地**
- 只有 **本能**（模式）可被导出
- 不会分享任何实际代码或对话内容
- 导出内容完全由你控制

## 相关资源

- [Skill Creator](https://skill-creator.app) - 从仓库历史生成本能
- [Homunculus](https://github.com/humanplane/homunculus) - v2 架构灵感来源
- [完整指南](https://x.com/affaanmustafa/status/2014040193557471352) - 持续学习章节

---

*本能驱动学习：逐次观察，逐步教会 Claude 你的习惯模式。*
