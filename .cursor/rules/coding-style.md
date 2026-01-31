# 编码风格

## 不可变性（关键原则）

始终创建新对象，禁止直接修改：

```javascript
// 错误示例：直接修改对象
function updateUser(user, name) {
  user.name = name  // 修改了原对象！
  return user
}

// 正确示例：保持不可变性
function updateUser(user, name) {
  return {
    ...user,
    name
  }
}
```

## 文件组织

多个小文件优于少数大文件：
- 高内聚、低耦合
- 常规文件 200-400 行，上限 800 行
- 从大型组件中提取工具函数
- 按功能/领域组织，而非按类型

## 错误处理

必须全面处理错误：

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('详细的用户友好错误信息')
}
```

## 输入校验

必须校验用户输入：

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
})

const validated = schema.parse(input)
```

## 代码质量检查清单

完成工作前需确认：
- [ ] 代码可读性良好，命名规范
- [ ] 函数体量精简（<50 行）
- [ ] 文件职责单一（<800 行）
- [ ] 避免深层嵌套（>4 层）
- [ ] 错误处理完善
- [ ] 无残留的 console.log 语句
- [ ] 无硬编码的魔法值
- [ ] 遵循不可变性原则
