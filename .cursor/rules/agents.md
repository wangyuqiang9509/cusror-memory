# Agent 编排调度

## 可用 Agent 列表

位于 `~/.cursor/agents/` 目录：

| Agent | 用途 | 使用场景 |
|-------|------|----------|
| planner | 实现方案规划 | 复杂功能开发、代码重构 |
| architect | 系统架构设计 | 架构决策 |
| tdd-guide | 测试驱动开发 | 新功能开发、Bug 修复 |
| code-reviewer | 代码审查 | 代码编写完成后 |
| security-reviewer | 安全分析 | 提交代码前 |
| build-error-resolver | 构建错误修复 | 构建失败时 |
| e2e-runner | 端到端测试 | 关键用户流程 |
| refactor-cleaner | 死代码清理 | 代码维护 |
| doc-updater | 文档更新 | 更新文档时 |

## 自动触发 Agent

无需用户提示，主动调用：
1. 复杂功能需求 - 使用 **planner** agent
2. 刚完成代码编写/修改 - 使用 **code-reviewer** agent
3. Bug 修复或新功能 - 使用 **tdd-guide** agent
4. 架构决策 - 使用 **architect** agent

## 并行任务执行

对于相互独立的操作，**必须**采用并行 Task 执行：

```markdown
# 正确：并行执行
同时启动 3 个 agent：
1. Agent 1: 对 auth.ts 进行安全分析
2. Agent 2: 对缓存系统进行性能审查
3. Agent 3: 对 utils.ts 进行类型检查

# 错误：无必要的串行执行
先执行 agent 1，再执行 agent 2，最后执行 agent 3
```

## 多视角分析

处理复杂问题时，采用角色拆分的子 agent：
- 事实核查员
- 资深工程师
- 安全专家
- 一致性审查员
- 冗余检测员
