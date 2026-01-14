---
name: writing-plans
description: 当你有规格说明或多步骤任务的需求时使用，在编写代码之前
---

# 编写计划

## 概述

编写全面的实现计划，假设工程师对我们的代码库完全没有上下文，且判断力可能不足。记录他们需要知道的一切：每个任务涉及哪些文件、代码、测试、可能需要查阅的文档、如何测试。将完整计划分解为小任务。DRY（不重复）、YAGNI（不过度设计）、TDD（测试驱动开发）、频繁提交。

假设他们是熟练的开发者，但对我们的工具集和问题领域几乎一无所知。假设他们对良好的测试设计不太了解。

**开始时宣布：** "我正在使用 writing-plans 技能来创建实现计划。"

**上下文：** 这应该在专用的工作树中运行（由 brainstorming 技能创建）。

**计划保存位置：** `docs/plans/YYYY-MM-DD-<feature-name>.md`

## 小任务粒度

**每个步骤是一个操作（2-5 分钟）：**
- "编写失败的测试" - 一个步骤
- "运行它确保它失败" - 一个步骤
- "实现最小代码使测试通过" - 一个步骤
- "运行测试确保它们通过" - 一个步骤
- "提交" - 一个步骤

## 计划文档头部

**每个计划必须以此头部开始：**

```markdown
# [功能名称] 实现计划

> **给 Claude：** 必需子技能：使用 executing-plans skill 逐任务实现此计划。

**目标：** [一句话描述要构建什么]

**架构：** [2-3 句话描述方法]

**技术栈：** [关键技术/库]

---
```

## 任务结构

```markdown
### 任务 N: [组件名称]

**文件：**
- 创建: `exact/path/to/file.py`
- 修改: `exact/path/to/existing.py:123-145`
- 测试: `tests/exact/path/to/test.py`

**步骤 1: 编写失败的测试**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**步骤 2: 运行测试验证它失败**

运行: `pytest tests/path/test.py::test_name -v`
预期: 失败，显示 "function not defined"

**步骤 3: 编写最小实现**

```python
def function(input):
    return expected
```

**步骤 4: 运行测试验证它通过**

运行: `pytest tests/path/test.py::test_name -v`
预期: 通过

**步骤 5: 提交**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
```

## 记住
- 始终使用精确的文件路径
- 计划中包含完整代码（而不是"添加验证"这样的描述）
- 精确的命令和预期输出
- 使用 @ 语法引用相关技能
- DRY、YAGNI、TDD、频繁提交

## 执行交接

保存计划后，提供执行选择：

**"计划已完成并保存到 `docs/plans/<filename>.md`。两种执行选项：**

**1. 子代理驱动（本会话）** - 我为每个任务分派新的子代理，任务之间进行审查，快速迭代

**2. 并行会话（独立）** - 使用 executing-plans 打开新会话，批量执行带检查点

**选择哪种方式？"**

**如果选择子代理驱动：**
- **必需子技能：** 使用 subagent-driven-development skill
- 留在本会话
- 每个任务使用新的子代理 + 代码审查

**如果选择并行会话：**
- 引导他们在工作树中打开新会话
- **必需子技能：** 新会话使用 executing-plans skill
