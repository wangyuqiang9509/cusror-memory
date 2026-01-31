# 钩子系统

## 钩子类型

- **PreToolUse**：工具执行前触发（用于校验、参数修改）
- **PostToolUse**：工具执行后触发（用于自动格式化、检查）
- **Stop**：会话结束时触发（用于最终验证）

## 当前钩子配置（位于 ~/.claude/settings.json）

### PreToolUse
- **tmux 提醒**：对长时间运行的命令（npm、pnpm、yarn、cargo 等）建议使用 tmux
- **git push 审查**：推送前自动打开 Zed 进行代码审查
- **文档拦截**：阻止创建不必要的 .md/.txt 文件

### PostToolUse
- **PR 创建**：记录 PR 链接和 GitHub Actions 状态
- **Prettier**：编辑后自动格式化 JS/TS 文件
- **TypeScript 检查**：编辑 .ts/.tsx 文件后运行 tsc
- **console.log 警告**：检测已编辑文件中的 console.log 并发出警告

### Stop
- **console.log 审计**：会话结束前检查所有已修改文件中的 console.log

## 自动授权权限

谨慎使用：
- 仅在可信且明确的计划中启用
- 探索性工作时应禁用
- 禁止使用 dangerously-skip-permissions 标志
- 应通过 `~/.claude.json` 中的 `allowedTools` 进行配置

## TodoWrite 最佳实践

使用 TodoWrite 工具：
- 追踪多步骤任务的进度
- 验证对指令的理解是否正确
- 支持实时调整方向
- 展示细粒度的实现步骤

待办列表可暴露以下问题：
- 步骤顺序错误
- 遗漏项
- 多余项
- 粒度不当
- 需求理解偏差
