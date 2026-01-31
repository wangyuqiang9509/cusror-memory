---
name: coding-standards
description: 适用于 TypeScript、JavaScript、React 和 Node.js 开发的通用编码规范、最佳实践与模式。
---

# 编码规范与最佳实践

适用于所有项目的通用编码规范。

## 代码质量原则

### 1. 可读性优先
- 代码被阅读的次数远多于被编写的次数
- 使用清晰的变量名和函数名
- 优先选择自文档化代码而非注释
- 保持格式一致

### 2. KISS 原则（保持简单，避免复杂）
- 采用最简单的可行方案
- 避免过度设计
- 拒绝过早优化
- 易于理解 > 技巧炫耀

### 3. DRY 原则（不要重复自己）
- 将通用逻辑抽取为函数
- 创建可复用组件
- 跨模块共享工具函数
- 避免复制粘贴式编程

### 4. YAGNI 原则（你不会需要它）
- 不要在需求出现之前构建功能
- 避免投机性泛化
- 仅在必要时增加复杂度
- 从简单开始，按需重构

## TypeScript/JavaScript 规范

### 变量命名

```typescript
// ✅ 正确：描述性命名
const marketSearchQuery = 'election'
const isUserAuthenticated = true
const totalRevenue = 1000

// ❌ 错误：含义不清的命名
const q = 'election'
const flag = true
const x = 1000
```

### 函数命名

```typescript
// ✅ 正确：动词-名词模式
async function fetchMarketData(marketId: string) { }
function calculateSimilarity(a: number[], b: number[]) { }
function isValidEmail(email: string): boolean { }

// ❌ 错误：含义不清或仅有名词
async function market(id: string) { }
function similarity(a, b) { }
function email(e) { }
```

### 不可变性模式（关键）

```typescript
// ✅ 始终使用展开运算符
const updatedUser = {
  ...user,
  name: 'New Name'
}

const updatedArray = [...items, newItem]

// ❌ 禁止直接修改
user.name = 'New Name'  // 错误
items.push(newItem)     // 错误
```

### 错误处理

```typescript
// ✅ 正确：完善的错误处理
async function fetchData(url: string) {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Fetch failed:', error)
    throw new Error('Failed to fetch data')
  }
}

// ❌ 错误：没有错误处理
async function fetchData(url) {
  const response = await fetch(url)
  return response.json()
}
```

### Async/Await 最佳实践

```typescript
// ✅ 正确：尽可能并行执行
const [users, markets, stats] = await Promise.all([
  fetchUsers(),
  fetchMarkets(),
  fetchStats()
])

// ❌ 错误：不必要的串行执行
const users = await fetchUsers()
const markets = await fetchMarkets()
const stats = await fetchStats()
```

### 类型安全

```typescript
// ✅ 正确：使用合适的类型
interface Market {
  id: string
  name: string
  status: 'active' | 'resolved' | 'closed'
  created_at: Date
}

function getMarket(id: string): Promise<Market> {
  // 实现
}

// ❌ 错误：使用 'any'
function getMarket(id: any): Promise<any> {
  // 实现
}
```

## React 最佳实践

### 组件结构

```typescript
// ✅ 正确：带类型的函数式组件
interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}

export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary'
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  )
}

// ❌ 错误：无类型，结构不清晰
export function Button(props) {
  return <button onClick={props.onClick}>{props.children}</button>
}
```

### 自定义 Hooks

```typescript
// ✅ 正确：可复用的自定义 Hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// 使用方式
const debouncedQuery = useDebounce(searchQuery, 500)
```

### 状态管理

```typescript
// ✅ 正确：规范的状态更新
const [count, setCount] = useState(0)

// 使用函数式更新处理依赖前值的状态
setCount(prev => prev + 1)

// ❌ 错误：直接引用状态
setCount(count + 1)  // 在异步场景中可能获取到过期值
```

### 条件渲染

```typescript
// ✅ 正确：清晰的条件渲染
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}
{data && <DataDisplay data={data} />}

// ❌ 错误：三元运算符嵌套地狱
{isLoading ? <Spinner /> : error ? <ErrorMessage error={error} /> : data ? <DataDisplay data={data} /> : null}
```

## API 设计规范

### REST API 约定

```
GET    /api/markets              # 获取所有市场列表
GET    /api/markets/:id          # 获取指定市场
POST   /api/markets              # 创建新市场
PUT    /api/markets/:id          # 更新市场（全量）
PATCH  /api/markets/:id          # 更新市场（部分）
DELETE /api/markets/:id          # 删除市场

# 查询参数用于筛选
GET /api/markets?status=active&limit=10&offset=0
```

### 响应格式

```typescript
// ✅ 正确：统一的响应结构
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}

// 成功响应
return NextResponse.json({
  success: true,
  data: markets,
  meta: { total: 100, page: 1, limit: 10 }
})

// 错误响应
return NextResponse.json({
  success: false,
  error: 'Invalid request'
}, { status: 400 })
```

### 输入验证

```typescript
import { z } from 'zod'

// ✅ 正确：Schema 验证
const CreateMarketSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  endDate: z.string().datetime(),
  categories: z.array(z.string()).min(1)
})

export async function POST(request: Request) {
  const body = await request.json()

  try {
    const validated = CreateMarketSchema.parse(body)
    // 使用已验证的数据继续处理
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }
  }
}
```

## 文件组织

### 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── markets/           # 市场页面
│   └── (auth)/           # 认证页面（路由组）
├── components/            # React 组件
│   ├── ui/               # 通用 UI 组件
│   ├── forms/            # 表单组件
│   └── layouts/          # 布局组件
├── hooks/                # 自定义 React Hooks
├── lib/                  # 工具函数与配置
│   ├── api/             # API 客户端
│   ├── utils/           # 辅助函数
│   └── constants/       # 常量定义
├── types/                # TypeScript 类型定义
└── styles/              # 全局样式
```

### 文件命名

```
components/Button.tsx          # 组件使用 PascalCase
hooks/useAuth.ts              # Hook 使用 camelCase 并带 'use' 前缀
lib/formatDate.ts             # 工具函数使用 camelCase
types/market.types.ts         # 类型文件使用 camelCase 并带 .types 后缀
```

## 注释与文档

### 何时写注释

```typescript
// ✅ 正确：解释"为什么"，而非"是什么"
// 使用指数退避策略，避免在服务故障期间对 API 造成过大压力
const delay = Math.min(1000 * Math.pow(2, retryCount), 30000)

// 此处刻意使用 mutation 以优化大数组的性能
items.push(newItem)

// ❌ 错误：陈述显而易见的事实
// 将计数器加 1
count++

// 将 name 设置为用户的 name
name = user.name
```

### 公共 API 使用 JSDoc

```typescript
/**
 * 使用语义相似度搜索市场。
 *
 * @param query - 自然语言搜索查询
 * @param limit - 最大返回结果数（默认：10）
 * @returns 按相似度得分排序的市场数组
 * @throws {Error} 当 OpenAI API 失败或 Redis 不可用时
 *
 * @example
 * ```typescript
 * const results = await searchMarkets('election', 5)
 * console.log(results[0].name) // "Trump vs Biden"
 * ```
 */
export async function searchMarkets(
  query: string,
  limit: number = 10
): Promise<Market[]> {
  // 实现
}
```

## 性能最佳实践

### 记忆化

```typescript
import { useMemo, useCallback } from 'react'

// ✅ 正确：缓存开销较大的计算
const sortedMarkets = useMemo(() => {
  return markets.sort((a, b) => b.volume - a.volume)
}, [markets])

// ✅ 正确：缓存回调函数
const handleSearch = useCallback((query: string) => {
  setSearchQuery(query)
}, [])
```

### 懒加载

```typescript
import { lazy, Suspense } from 'react'

// ✅ 正确：懒加载重型组件
const HeavyChart = lazy(() => import('./HeavyChart'))

export function Dashboard() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyChart />
    </Suspense>
  )
}
```

### 数据库查询

```typescript
// ✅ 正确：仅查询需要的列
const { data } = await supabase
  .from('markets')
  .select('id, name, status')
  .limit(10)

// ❌ 错误：查询所有列
const { data } = await supabase
  .from('markets')
  .select('*')
```

## 测试规范

### 测试结构（AAA 模式）

```typescript
test('calculates similarity correctly', () => {
  // Arrange（准备）
  const vector1 = [1, 0, 0]
  const vector2 = [0, 1, 0]

  // Act（执行）
  const similarity = calculateCosineSimilarity(vector1, vector2)

  // Assert（断言）
  expect(similarity).toBe(0)
})
```

### 测试命名

```typescript
// ✅ 正确：描述性测试名称
test('returns empty array when no markets match query', () => { })
test('throws error when OpenAI API key is missing', () => { })
test('falls back to substring search when Redis unavailable', () => { })

// ❌ 错误：模糊的测试名称
test('works', () => { })
test('test search', () => { })
```

## 代码异味检测

警惕以下反模式：

### 1. 函数过长
```typescript
// ❌ 错误：函数超过 50 行
function processMarketData() {
  // 100 行代码
}

// ✅ 正确：拆分为更小的函数
function processMarketData() {
  const validated = validateData()
  const transformed = transformData(validated)
  return saveData(transformed)
}
```

### 2. 嵌套过深
```typescript
// ❌ 错误：嵌套超过 5 层
if (user) {
  if (user.isAdmin) {
    if (market) {
      if (market.isActive) {
        if (hasPermission) {
          // 执行操作
        }
      }
    }
  }
}

// ✅ 正确：使用提前返回
if (!user) return
if (!user.isAdmin) return
if (!market) return
if (!market.isActive) return
if (!hasPermission) return

// 执行操作
```

### 3. 魔法数字
```typescript
// ❌ 错误：无解释的数字
if (retryCount > 3) { }
setTimeout(callback, 500)

// ✅ 正确：使用命名常量
const MAX_RETRIES = 3
const DEBOUNCE_DELAY_MS = 500

if (retryCount > MAX_RETRIES) { }
setTimeout(callback, DEBOUNCE_DELAY_MS)
```

**切记**：代码质量不可妥协。清晰、可维护的代码是快速开发和自信重构的基石。
