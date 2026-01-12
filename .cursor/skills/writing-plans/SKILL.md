---
name: writing-plans
description: 在你拥有多步骤任务的规范或需求文档时使用，在开始编写代码之前
---

I'm using the writing-plans skill to create the implementation plan.

```markdown
# 开发计划编写规范

## 概述

编写详细的实现计划，假设工程师对我们的代码库毫无了解，并且品味可疑。记录他们需要知道的一切：每个任务需要触碰哪些文件、代码、测试、可能需要查看的文档、如何进行测试。将整个计划拆分成小任务。DRY。YAGNI。TDD。频繁提交。

**开始前声明：** "我正在使用writing-plans技能来创建实现计划。"

**上下文：** 这应该在专用工作树中运行（由头brainstorming skill创建）。

**保存位置：** `docs/plans/YYYY-MM-DD-<feature-name>.md`

## 小任务粒度

**每一步都是一个动作（2-5分钟）：**
- "编写失败的测试" - 步骤
- "运行测试确保它失败" - 步骤
- "实现最小代码让测试通过" - 步骤
- "运行测试确保它们通过" - 步骤
- "提交" - 步骤

## 计划文档头部

**每个计划都必须以此头部开始：**

```markdown
# [功能名称] 实现计划

> **给 Claude：** 必需子技能：使用 executing-plans skill来逐任务实现此计划。

**目标：** [一句话描述要构建的内容]

**架构：** [2-3句话描述方法]

**技术栈：** [关键技术/库]

---
```

## 任务结构

```markdown
### 任务 N: [组件名称]

**文件：**
- 创建：`exact/path/to/file.py`
- 修改：`exact/path/to/existing.py:123-145`
- 测试：`tests/exact/path/to/test.py`

**步骤1：编写失败的测试**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**步骤2：运行测试验证它失败**

运行：`pytest tests/path/test.py::test_name -v`
预期：失败，提示"function not defined"

**步骤3：编写最小实现**

```python
def function(input):
    return expected
```

**步骤4：运行测试验证它通过**

运行：`pytest tests/path/test.py::test_name -v`
预期：通过

```

## 记住
- 始终使用精确的文件路径
- 计划中包含完整代码（不是"添加验证"）
- 使用精确的命令和预期输出
- 使用 @ 语法引用相关技能
- DRY、YAGNI、TDD、频繁提交

## 执行交接

保存计划后，提供执行选择：

**"计划已完成并保存到 `docs/plans/<filename>.md`。两种执行选项：**

**1. 子代理驱动（当前会话）** - 我为每个任务分派新的子代理，任务间进行审查，快速迭代

**2. 并行会话（单独）** - 打开新会话使用 executing-plans，批量执行带检查点

**选择哪种方法？**

**如果选择子代理驱动：**
- **必需子技能：** 使用 subagent-driven-development skill
- 保持当前会话
- 每个任务新子代理 + 代码审查

**如果选择并行会话：**
- 引导他们在工作树中打开新会话
- **必需子技能：** 新会话使用 executing-plans skill
```