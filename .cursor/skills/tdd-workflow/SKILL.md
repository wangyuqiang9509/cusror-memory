---
name: tdd-workflow
description: 在开发新功能、修复 Bug 或重构代码时使用此技能。强制执行测试驱动开发，确保单元测试、集成测试和端到端测试覆盖率达到 80% 以上。
---

# 测试驱动开发工作流

本技能确保所有代码开发遵循 TDD 原则，实现全面的测试覆盖。

## 激活时机

- 开发新功能或特性
- 修复 Bug 或问题
- 重构现有代码
- 添加 API 端点
- 创建新组件

## 核心原则

### 1. 测试先行
**始终**先编写测试，再实现代码使测试通过。

### 2. 覆盖率要求
- 最低 80% 覆盖率（单元测试 + 集成测试 + 端到端测试）
- 覆盖所有边界情况
- 测试错误场景
- 验证边界条件

### 3. 测试类型

#### 单元测试
- 独立函数和工具方法
- 组件逻辑
- 纯函数
- 辅助函数和工具类

#### 集成测试
- API 端点
- 数据库操作
- 服务间交互
- 外部 API 调用

#### 端到端测试（Playwright）
- 关键用户流程
- 完整业务流程
- 浏览器自动化
- UI 交互

## TDD 工作流步骤

### 步骤 1：编写用户旅程
```
作为 [角色]，我希望 [执行某操作]，以便 [获得某收益]

示例：
作为用户，我希望对市场进行语义搜索，
以便在没有精确关键词的情况下也能找到相关市场。
```

### 步骤 2：生成测试用例
为每个用户旅程创建完整的测试用例：

```typescript
describe('语义搜索', () => {
  it('根据查询返回相关市场', async () => {
    // 测试实现
  })

  it('优雅处理空查询', async () => {
    // 测试边界情况
  })

  it('Redis 不可用时降级为子串搜索', async () => {
    // 测试降级行为
  })

  it('按相似度分数排序结果', async () => {
    // 测试排序逻辑
  })
})
```

### 步骤 3：运行测试（应当失败）
```bash
npm test
# 测试应失败 —— 因为尚未实现功能
```

### 步骤 4：实现代码
编写最少量代码使测试通过：

```typescript
// 由测试驱动的实现
export async function searchMarkets(query: string) {
  // 实现代码
}
```

### 步骤 5：再次运行测试
```bash
npm test
# 测试现在应当通过
```

### 步骤 6：重构
在保持测试通过的前提下优化代码质量：
- 消除重复代码
- 改进命名
- 优化性能
- 提升可读性

### 步骤 7：验证覆盖率
```bash
npm run test:coverage
# 验证是否达到 80%+ 覆盖率
```

## 测试模式

### 单元测试模式（Jest/Vitest）
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button 组件', () => {
  it('渲染正确的文本', () => {
    render(<Button>点击我</Button>)
    expect(screen.getByText('点击我')).toBeInTheDocument()
  })

  it('点击时调用 onClick', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>点击</Button>)

    fireEvent.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disabled 为 true 时按钮禁用', () => {
    render(<Button disabled>点击</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### API 集成测试模式
```typescript
import { NextRequest } from 'next/server'
import { GET } from './route'

describe('GET /api/markets', () => {
  it('成功返回市场数据', async () => {
    const request = new NextRequest('http://localhost/api/markets')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('验证查询参数', async () => {
    const request = new NextRequest('http://localhost/api/markets?limit=invalid')
    const response = await GET(request)

    expect(response.status).toBe(400)
  })

  it('优雅处理数据库错误', async () => {
    // 模拟数据库故障
    const request = new NextRequest('http://localhost/api/markets')
    // 测试错误处理
  })
})
```

### 端到端测试模式（Playwright）
```typescript
import { test, expect } from '@playwright/test'

test('用户可以搜索和筛选市场', async ({ page }) => {
  // 导航到市场页面
  await page.goto('/')
  await page.click('a[href="/markets"]')

  // 验证页面已加载
  await expect(page.locator('h1')).toContainText('Markets')

  // 搜索市场
  await page.fill('input[placeholder="Search markets"]', 'election')

  // 等待防抖和结果
  await page.waitForTimeout(600)

  // 验证搜索结果已显示
  const results = page.locator('[data-testid="market-card"]')
  await expect(results).toHaveCount(5, { timeout: 5000 })

  // 验证结果包含搜索词
  const firstResult = results.first()
  await expect(firstResult).toContainText('election', { ignoreCase: true })

  // 按状态筛选
  await page.click('button:has-text("Active")')

  // 验证筛选结果
  await expect(results).toHaveCount(3)
})

test('用户可以创建新市场', async ({ page }) => {
  // 先登录
  await page.goto('/creator-dashboard')

  // 填写市场创建表单
  await page.fill('input[name="name"]', 'Test Market')
  await page.fill('textarea[name="description"]', 'Test description')
  await page.fill('input[name="endDate"]', '2025-12-31')

  // 提交表单
  await page.click('button[type="submit"]')

  // 验证成功消息
  await expect(page.locator('text=Market created successfully')).toBeVisible()

  // 验证跳转到市场页面
  await expect(page).toHaveURL(/\/markets\/test-market/)
})
```

## 测试文件组织结构

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx          # 单元测试
│   │   └── Button.stories.tsx       # Storybook
│   └── MarketCard/
│       ├── MarketCard.tsx
│       └── MarketCard.test.tsx
├── app/
│   └── api/
│       └── markets/
│           ├── route.ts
│           └── route.test.ts         # 集成测试
└── e2e/
    ├── markets.spec.ts               # 端到端测试
    ├── trading.spec.ts
    └── auth.spec.ts
```

## 模拟外部服务

### Supabase Mock
```typescript
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: [{ id: 1, name: 'Test Market' }],
          error: null
        }))
      }))
    }))
  }
}))
```

### Redis Mock
```typescript
jest.mock('@/lib/redis', () => ({
  searchMarketsByVector: jest.fn(() => Promise.resolve([
    { slug: 'test-market', similarity_score: 0.95 }
  ])),
  checkRedisHealth: jest.fn(() => Promise.resolve({ connected: true }))
}))
```

### OpenAI Mock
```typescript
jest.mock('@/lib/openai', () => ({
  generateEmbedding: jest.fn(() => Promise.resolve(
    new Array(1536).fill(0.1) // 模拟 1536 维向量
  ))
}))
```

## 测试覆盖率验证

### 运行覆盖率报告
```bash
npm run test:coverage
```

### 覆盖率阈值配置
```json
{
  "jest": {
    "coverageThresholds": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## 常见测试误区

### ❌ 错误：测试实现细节
```typescript
// 不要测试内部状态
expect(component.state.count).toBe(5)
```

### ✅ 正确：测试用户可见行为
```typescript
// 测试用户所见
expect(screen.getByText('Count: 5')).toBeInTheDocument()
```

### ❌ 错误：脆弱选择器
```typescript
// 容易失效
await page.click('.css-class-xyz')
```

### ✅ 正确：语义化选择器
```typescript
// 对变更具有弹性
await page.click('button:has-text("Submit")')
await page.click('[data-testid="submit-button"]')
```

### ❌ 错误：缺乏测试隔离
```typescript
// 测试之间相互依赖
test('创建用户', () => { /* ... */ })
test('更新同一用户', () => { /* 依赖于上一个测试 */ })
```

### ✅ 正确：独立测试
```typescript
// 每个测试独立准备数据
test('创建用户', () => {
  const user = createTestUser()
  // 测试逻辑
})

test('更新用户', () => {
  const user = createTestUser()
  // 更新逻辑
})
```

## 持续测试

### 开发时监听模式
```bash
npm test -- --watch
# 文件变更时自动运行测试
```

### Pre-Commit 钩子
```bash
# 每次提交前运行
npm test && npm run lint
```

### CI/CD 集成
```yaml
# GitHub Actions
- name: Run Tests
  run: npm test -- --coverage
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## 最佳实践

1. **测试先行** — 始终遵循 TDD
2. **单一断言** — 每个测试聚焦单一行为
3. **描述性命名** — 清晰说明测试内容
4. **Arrange-Act-Assert** — 保持清晰的测试结构
5. **模拟外部依赖** — 隔离单元测试
6. **测试边界情况** — null、undefined、空值、大数据
7. **测试错误路径** — 不只测试正常流程
8. **保持测试快速** — 单元测试每个 < 50ms
9. **测试后清理** — 无副作用
10. **审查覆盖率报告** — 识别测试盲区

## 成功指标

- 代码覆盖率达到 80%+
- 所有测试通过（绿色）
- 无跳过或禁用的测试
- 测试执行快速（单元测试 < 30 秒）
- 端到端测试覆盖关键用户流程
- 测试能在生产前捕获 Bug

---

**切记**：测试不是可选项。它是支撑自信重构、快速开发和生产稳定性的安全网。
