# Orchestrate 命令

用于复杂任务的顺序智能体工作流编排。

## 用法

`/orchestrate [工作流类型] [任务描述]`

## 工作流类型

### feature
完整的功能实现工作流：
```
planner -> tdd-guide -> code-reviewer -> security-reviewer
```

### bugfix
缺陷排查与修复工作流：
```
explorer -> tdd-guide -> code-reviewer
```

### refactor
安全重构工作流：
```
architect -> code-reviewer -> tdd-guide
```

### security
安全专项审查：
```
security-reviewer -> code-reviewer -> architect
```

## 执行模式

工作流中每个智能体按以下流程运行：

1. **调用智能体**，传入上游智能体的上下文
2. **收集输出**，生成结构化交接文档
3. **传递至下游**智能体
4. **汇总结果**，生成最终报告

## 交接文档格式

智能体之间的交接需遵循以下格式：

```markdown
## HANDOFF: [上游智能体] -> [下游智能体]

### Context
[已完成工作概要]

### Findings
[关键发现与决策]

### Files Modified
[已修改文件列表]

### Open Questions
[待解决事项，留给下游智能体]

### Recommendations
[后续步骤建议]
```

## 示例：功能开发工作流

```
/orchestrate feature "添加用户认证功能"
```

执行流程：

1. **Planner 智能体**
   - 分析需求
   - 制定实施计划
   - 识别依赖关系
   - 输出：`HANDOFF: planner -> tdd-guide`

2. **TDD Guide 智能体**
   - 读取 Planner 的交接文档
   - 先编写测试
   - 实现代码以通过测试
   - 输出：`HANDOFF: tdd-guide -> code-reviewer`

3. **Code Reviewer 智能体**
   - 审查实现代码
   - 检查潜在问题
   - 提出改进建议
   - 输出：`HANDOFF: code-reviewer -> security-reviewer`

4. **Security Reviewer 智能体**
   - 安全审计
   - 漏洞检查
   - 最终审批
   - 输出：最终报告

## 最终报告格式

```
ORCHESTRATION REPORT
====================
Workflow: feature
Task: 添加用户认证功能
Agents: planner -> tdd-guide -> code-reviewer -> security-reviewer

SUMMARY
-------
[概要说明，一段话]

AGENT OUTPUTS
-------------
Planner: [概要]
TDD Guide: [概要]
Code Reviewer: [概要]
Security Reviewer: [概要]

FILES CHANGED
-------------
[所有修改文件列表]

TEST RESULTS
------------
[测试通过/失败汇总]

SECURITY STATUS
---------------
[安全检查结果]

RECOMMENDATION
--------------
[SHIP / NEEDS WORK / BLOCKED]
```

## 并行执行

对于相互独立的检查任务，可并行运行多个智能体：

```markdown
### Parallel Phase
同时运行：
- code-reviewer（代码质量）
- security-reviewer（安全审查）
- architect（架构设计）

### Merge Results
合并各智能体输出为统一报告
```

## 参数说明

$ARGUMENTS:
- `feature <描述>` - 完整功能开发工作流
- `bugfix <描述>` - 缺陷修复工作流
- `refactor <描述>` - 重构工作流
- `security <描述>` - 安全审查工作流
- `custom <智能体列表> <描述>` - 自定义智能体序列

## 自定义工作流示例

```
/orchestrate custom "architect,tdd-guide,code-reviewer" "重构缓存层"
```

## 使用建议

1. **复杂功能优先使用 Planner**
2. **合并前必须经过 Code Reviewer 审查**
3. **涉及认证/支付/敏感数据时务必使用 Security Reviewer**
4. **保持交接文档简洁**——聚焦下游智能体所需信息
5. **必要时在智能体之间插入验证环节**
