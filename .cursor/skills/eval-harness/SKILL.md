---
name: eval-harness
description: Claude Code 会话的正式评估框架，实现评估驱动开发（EDD）原则
tools: Read, Write, Edit, Bash, Grep, Glob
---

# 评估框架技能

Claude Code 会话的正式评估框架，实现评估驱动开发（EDD）原则。

## 核心理念

评估驱动开发（Eval-Driven Development）将评估视为"AI 开发的单元测试"：
- 在实现之前定义预期行为
- 在开发过程中持续运行评估
- 追踪每次变更的回归问题
- 使用 pass@k 指标衡量可靠性

## 评估类型

### 能力评估
测试 Claude 能否完成之前无法完成的任务：
```markdown
[CAPABILITY EVAL: feature-name]
任务: 描述 Claude 应完成的目标
成功标准:
  - [ ] 标准 1
  - [ ] 标准 2
  - [ ] 标准 3
预期输出: 描述预期结果
```

### 回归评估
确保变更不会破坏现有功能：
```markdown
[REGRESSION EVAL: feature-name]
基线: SHA 或检查点名称
测试项:
  - existing-test-1: PASS/FAIL
  - existing-test-2: PASS/FAIL
  - existing-test-3: PASS/FAIL
结果: X/Y 通过（此前 Y/Y）
```

## 评分器类型

### 1. 代码评分器
使用代码进行确定性检查：
```bash
# 检查文件是否包含预期模式
grep -q "export function handleAuth" src/auth.ts && echo "PASS" || echo "FAIL"

# 检查测试是否通过
npm test -- --testPathPattern="auth" && echo "PASS" || echo "FAIL"

# 检查构建是否成功
npm run build && echo "PASS" || echo "FAIL"
```

### 2. 模型评分器
使用 Claude 评估开放式输出：
```markdown
[MODEL GRADER PROMPT]
评估以下代码变更：
1. 是否解决了所述问题？
2. 结构是否合理？
3. 边界情况是否已处理？
4. 错误处理是否恰当？

评分: 1-5（1=差，5=优秀）
理由: [说明]
```

### 3. 人工评分器
标记需人工审核的项目：
```markdown
[HUMAN REVIEW REQUIRED]
变更: 描述变更内容
原因: 为何需要人工审核
风险等级: LOW/MEDIUM/HIGH
```

## 评估指标

### pass@k
"k 次尝试中至少成功一次"
- pass@1: 首次尝试成功率
- pass@3: 3 次尝试内成功
- 典型目标: pass@3 > 90%

### pass^k
"k 次尝试全部成功"
- 对可靠性要求更高
- pass^3: 连续 3 次成功
- 用于关键路径

## 评估工作流

### 1. 定义（编码前）
```markdown
## EVAL DEFINITION: feature-xyz

### 能力评估
1. 能够创建新用户账户
2. 能够验证邮箱格式
3. 能够安全地哈希密码

### 回归评估
1. 现有登录功能正常
2. 会话管理未受影响
3. 登出流程完整

### 成功指标
- 能力评估 pass@3 > 90%
- 回归评估 pass^3 = 100%
```

### 2. 实现
编写代码以通过定义的评估。

### 3. 执行评估
```bash
# 运行能力评估
[运行每个能力评估，记录 PASS/FAIL]

# 运行回归评估
npm test -- --testPathPattern="existing"

# 生成报告
```

### 4. 报告
```markdown
EVAL REPORT: feature-xyz
========================

能力评估:
  create-user:     PASS (pass@1)
  validate-email:  PASS (pass@2)
  hash-password:   PASS (pass@1)
  总计:            3/3 通过

回归评估:
  login-flow:      PASS
  session-mgmt:    PASS
  logout-flow:     PASS
  总计:            3/3 通过

指标:
  pass@1: 67% (2/3)
  pass@3: 100% (3/3)

状态: 准备审核
```

## 集成模式

### 实现前
```
/eval define feature-name
```
在 `.claude/evals/feature-name.md` 创建评估定义文件

### 实现中
```
/eval check feature-name
```
运行当前评估并报告状态

### 实现后
```
/eval report feature-name
```
生成完整评估报告

## 评估存储

在项目中存储评估：
```
.claude/
  evals/
    feature-xyz.md      # 评估定义
    feature-xyz.log     # 评估运行历史
    baseline.json       # 回归基线
```

## 最佳实践

1. **编码前定义评估** - 强制明确成功标准
2. **频繁运行评估** - 尽早发现回归问题
3. **追踪 pass@k 趋势** - 监控可靠性变化
4. **优先使用代码评分器** - 确定性优于概率性
5. **安全检查需人工审核** - 切勿完全自动化安全检查
6. **保持评估快速** - 慢速评估往往被忽略
7. **评估与代码一同版本控制** - 评估是一等公民

## 示例：添加认证功能

```markdown
## EVAL: add-authentication

### 阶段 1: 定义（10 分钟）
能力评估:
- [ ] 用户可使用邮箱/密码注册
- [ ] 用户可使用有效凭据登录
- [ ] 无效凭据被拒绝并返回正确错误
- [ ] 会话在页面刷新后保持
- [ ] 登出清除会话

回归评估:
- [ ] 公开路由仍可访问
- [ ] API 响应未变更
- [ ] 数据库架构兼容

### 阶段 2: 实现（时间不定）
[编写代码]

### 阶段 3: 评估
运行: /eval check add-authentication

### 阶段 4: 报告
EVAL REPORT: add-authentication
==============================
能力评估: 5/5 通过 (pass@3: 100%)
回归评估: 3/3 通过 (pass^3: 100%)
状态: 可以发布
```
