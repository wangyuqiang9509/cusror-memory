# 验证循环技能

用于 Claude Code 会话的综合验证系统。

## 使用场景

在以下情况下调用此技能：
- 完成功能开发或重大代码变更后
- 创建 PR 之前
- 需要确保质量关卡通过时
- 重构完成后

## 验证阶段

### 阶段 1：构建验证
```bash
# 检查项目是否能成功构建
npm run build 2>&1 | tail -20
# 或
pnpm build 2>&1 | tail -20
```

若构建失败，立即停止并修复，不要继续后续步骤。

### 阶段 2：类型检查
```bash
# TypeScript 项目
npx tsc --noEmit 2>&1 | head -30

# Python 项目
pyright . 2>&1 | head -30
```

报告所有类型错误。修复关键错误后再继续。

### 阶段 3：代码规范检查
```bash
# JavaScript/TypeScript
npm run lint 2>&1 | head -30

# Python
ruff check . 2>&1 | head -30
```

### 阶段 4：测试套件
```bash
# 运行测试并生成覆盖率报告
npm run test -- --coverage 2>&1 | tail -50

# 检查覆盖率阈值
# 目标：最低 80%
```

报告内容：
- 测试总数：X
- 通过：X
- 失败：X
- 覆盖率：X%

### 阶段 5：安全扫描
```bash
# 检查是否存在密钥泄露
grep -rn "sk-" --include="*.ts" --include="*.js" . 2>/dev/null | head -10
grep -rn "api_key" --include="*.ts" --include="*.js" . 2>/dev/null | head -10

# 检查是否有 console.log 残留
grep -rn "console.log" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | head -10
```

### 阶段 6：变更审查
```bash
# 显示变更概要
git diff --stat
git diff HEAD~1 --name-only
```

逐一审查每个变更文件，重点关注：
- 意外的代码变更
- 缺失的错误处理
- 潜在的边界情况

## 输出格式

完成所有验证阶段后，生成验证报告：

```
验证报告
==================

构建:     [通过/失败]
类型:     [通过/失败] (X 个错误)
规范:     [通过/失败] (X 个警告)
测试:     [通过/失败] (X/Y 通过, Z% 覆盖率)
安全:     [通过/失败] (X 个问题)
变更:     [X 个文件已修改]

综合评估:   [可提交/不可提交] PR

待修复问题:
1. ...
2. ...
```

## 持续验证模式

在长时间会话中，每 15 分钟或在重大变更后执行验证：

```markdown
设置心理检查点：
- 完成每个函数后
- 完成一个组件后
- 进入下一个任务前

执行: /verify
```

## 与 Hooks 的协同

此技能与 PostToolUse 钩子互为补充。
钩子用于即时捕获问题；此技能提供全面的综合审查。
