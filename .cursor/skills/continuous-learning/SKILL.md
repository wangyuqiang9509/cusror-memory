---
name: continuous-learning
description: 自动从 Claude Code 会话中提取可复用模式，并将其保存为技能以供后续使用。
---

# 持续学习技能

在 Claude Code 会话结束时自动进行评估，提取可复用模式并保存为学习到的技能。

## 工作原理

本技能作为 **Stop 钩子** 在每次会话结束时运行：

1. **会话结束提示**：在会话结束时提醒用户可以提取模式
2. **手动提取**：用户执行 `/learn` 命令识别可提取的模式
3. **技能保存**：将有价值的模式保存至 `~/.cursor/skills/learned/`

## 配置说明

编辑 `config.json` 进行自定义配置：

```json
{
  "min_session_length": 10,
  "extraction_threshold": "medium",
  "auto_approve": false,
  "learned_skills_path": "~/.cursor/skills/learned/",
  "patterns_to_detect": [
    "error_resolution",
    "user_corrections",
    "workarounds",
    "debugging_techniques",
    "project_specific"
  ],
  "ignore_patterns": [
    "simple_typos",
    "one_time_fixes",
    "external_api_issues"
  ]
}
```

## 模式类型

| 模式 | 说明 |
|------|------|
| `error_resolution` | 特定错误的解决方案 |
| `user_corrections` | 用户纠正行为中提取的模式 |
| `workarounds` | 针对框架/库特性的变通方案 |
| `debugging_techniques` | 有效的调试方法 |
| `project_specific` | 项目特定的约定规范 |

## 钩子配置

在项目根目录的 `hooks.json` 中添加以下配置：

```json
{
  "version": 1,
  "hooks": {
    "sessionEnd": [
      {
        "command": "node \".cursor/scripts/hooks/evaluate-session.js\"",
        "timeout": 10
      }
    ]
  }
}
```

## 为什么使用 sessionEnd 钩子？

- **轻量级**：仅在会话结束时运行一次
- **非阻塞**：不会增加每条消息的响应延迟
- **提示作用**：提醒用户回顾会话中的可复用模式

## 相关资源

- [完整指南](https://x.com/affaanmustafa/status/2014040193557471352) - 持续学习章节
- `/learn` 命令 - 会话中手动提取模式

---

## 对比研究笔记（2025 年 1 月）

### 与 Homunculus 的对比 (github.com/humanplane/homunculus)

Homunculus v2 采用了更精细的设计方案：

| 特性 | 本方案 | Homunculus v2 |
|------|--------|---------------|
| 观察机制 | Stop 钩子（会话结束时） | PreToolUse/PostToolUse 钩子（100% 可靠） |
| 分析方式 | 主上下文 | 后台代理（Haiku） |
| 粒度 | 完整技能 | 原子级 "本能" |
| 置信度 | 无 | 0.3-0.9 加权 |
| 演进路径 | 直接生成技能 | 本能 → 聚类 → 技能/命令/代理 |
| 共享能力 | 无 | 导出/导入本能 |

**来自 Homunculus 的关键洞察：**
> "v1 依赖技能进行观察。技能是概率性的——触发率约为 50-80%。v2 使用钩子进行观察（100% 可靠），并将本能作为学习行为的原子单元。"

### v2 潜在增强方向

1. **基于本能的学习** - 更小的原子级行为，带有置信度评分
2. **后台观察者** - Haiku 代理并行分析
3. **置信度衰减** - 被反驳时本能置信度降低
4. **领域标签** - 代码风格、测试、Git、调试等
5. **演进路径** - 将相关本能聚类为技能/命令

详见：`/Users/affoon/Documents/tasks/12-continuous-learning-v2.md` 获取完整规格说明。
