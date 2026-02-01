---
name: skill-evolution-manager
description: 在对话结束时复盘用户反馈，提取经验并持久化到 Skill 中。用于保存成功的解决方案、失败的教训和特定的代码规范，使 Skills 库持续演进。
license: MIT
---

# Skill Evolution Manager

AI 技能系统的"进化中枢"，负责优化单个 Skill 和跨 Skill 的经验复盘与沉淀。

## When to Use

- 用户说 `/evolve` 或 "复盘一下刚才的对话"
- 用户反馈 "刚才那个工具不太好用，记录一下"
- 用户要求 "把这个经验保存到 Skill 里"
- 对话结束时需要总结经验教训

## 核心职责

1. **复盘诊断 (Session Review)** - 分析被调用 Skill 的表现
2. **经验提取 (Experience Extraction)** - 将用户反馈转化为结构化 JSON
3. **智能缝合 (Smart Stitching)** - 将经验写入 SKILL.md 并确保版本更新不丢失

## 工作流

### 1. 经验复盘 (Review & Extract)

扫描对话上下文，找出用户满意/不满意的点，定位相关 Skill，生成 JSON 结构：

```json
{
  "preferences": ["用户希望下载默认静音"],
  "fixes": ["Windows 下 ffmpeg 路径需转义"],
  "custom_prompts": "在执行前总是先打印预估耗时"
}
```

### 2. 经验持久化 (Persist)

运行增量合并脚本，将 JSON 写入目标 Skill 的 `evolution.json`：

```bash
python scripts/merge_evolution.py <skill_path> '<json_string>'
```

### 3. 文档缝合 (Stitch)

将 `evolution.json` 内容转为 Markdown 追加到 SKILL.md：

```bash
python scripts/smart_stitch.py <skill_path>
```

### 4. 全量对齐 (Align All)

批量更新后，将所有已保存的经验重新缝合回对应的 SKILL.md：

```bash
python scripts/align_all.py [skills_root]
```

## Scripts 说明

| 脚本 | 用途 |
|------|------|
| `scripts/merge_evolution.py` | 增量合并工具，读取旧 JSON 去重合并后保存 |
| `scripts/smart_stitch.py` | 文档生成工具，在 SKILL.md 末尾生成/更新经验章节 |
| `scripts/align_all.py` | 全量对齐工具，遍历所有 Skill 重新缝合经验 |

## Cursor IDE 集成

支持 Cursor 的多级 Skills 目录：

| 位置 | 范围 |
|------|------|
| `.cursor/skills/` | 项目级 |
| `.claude/skills/` | 项目级 (兼容) |
| `~/.cursor/skills/` | 用户级 (全局) |
| `~/.claude/skills/` | 用户级 (全局, 兼容) |

## 最佳实践

- **不要直接修改 SKILL.md 正文**：通过 `evolution.json` 通道进行经验修正，保证 Skill 升级时经验不丢失
- **多 Skill 协同**：一次对话涉及多个 Skill 时，依次为每个执行上述流程
