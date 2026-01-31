# 项目级 CLAUDE.md 示例

本文件是项目级 CLAUDE.md 的示例模板，请将其放置于项目根目录。

## 项目概述

[在此填写项目简介 - 功能描述、技术栈等]

## 核心规范

### 1. 代码组织

- 倾向多个小文件，避免少量大文件
- 高内聚、低耦合
- 单文件通常 200-400 行，最大不超过 800 行
- 按功能/领域组织，而非按类型分组

### 2. 代码风格

- 代码、注释、文档中禁止使用 emoji
- 始终保持不可变性 - 禁止直接修改对象或数组
- 生产代码中禁止使用 console.log
- 使用 try/catch 进行规范的错误处理
- 使用 Zod 或类似工具进行输入校验

### 3. 测试规范

- 遵循 TDD：先写测试，后写实现
- 测试覆盖率最低 80%
- 工具函数编写单元测试
- API 接口编写集成测试
- 关键业务流程编写端到端测试

### 4. 安全规范

- 禁止硬编码敏感信息
- 敏感数据通过环境变量管理
- 校验所有用户输入
- 仅使用参数化查询
- 启用 CSRF 防护

## 目录结构

```
src/
|-- app/              # Next.js App Router
|-- components/       # 可复用 UI 组件
|-- hooks/            # 自定义 React Hooks
|-- lib/              # 工具库
|-- types/            # TypeScript 类型定义
```

## 核心模式

### API 响应格式

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

### 错误处理

```typescript
try {
  const result = await operation()
  return { success: true, data: result }
} catch (error) {
  console.error('Operation failed:', error)
  return { success: false, error: '用户友好的错误提示' }
}
```

## 环境变量

```bash
# 必填
DATABASE_URL=
API_KEY=

# 可选
DEBUG=false
```

## 可用命令

- `/tdd` - 测试驱动开发工作流
- `/plan` - 创建实施计划
- `/code-review` - 代码质量审查
- `/build-fix` - 修复构建错误

## Git 工作流

- 使用约定式提交：`feat:`、`fix:`、`refactor:`、`docs:`、`test:`
- 禁止直接提交到 main和develop 分支
- PR 必须经过 Code Review
- 合并前必须通过所有测试
