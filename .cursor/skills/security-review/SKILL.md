---
name: security-review
description: 当涉及身份认证、处理用户输入、管理密钥凭证、创建 API 端点，或实现支付等敏感功能时，请使用此技能。提供全面的安全检查清单和最佳实践模式。
---

# 安全审查技能

此技能确保所有代码遵循安全最佳实践，并识别潜在的安全漏洞。

## 激活条件

- 实现身份认证或授权功能
- 处理用户输入或文件上传
- 创建新的 API 端点
- 管理密钥或凭证
- 实现支付功能
- 存储或传输敏感数据
- 集成第三方 API

## 安全检查清单

### 1. 密钥管理

#### ❌ 绝对禁止

```typescript
const apiKey = "sk-proj-xxxxx"  // 硬编码密钥
const dbPassword = "password123" // 源码中明文密码
```

#### ✅ 正确做法

```typescript
const apiKey = process.env.OPENAI_API_KEY
const dbUrl = process.env.DATABASE_URL

// 验证密钥是否存在
if (!apiKey) {
  throw new Error('OPENAI_API_KEY 未配置')
}
```

#### 检查要点

- [ ] 无硬编码的 API 密钥、令牌或密码
- [ ] 所有密钥存储在环境变量中
- [ ] `.env.local` 已添加到 .gitignore
- [ ] Git 历史记录中无密钥泄露
- [ ] 生产环境密钥托管在部署平台（Vercel、Railway）

### 2. 输入验证

#### 必须验证所有用户输入

```typescript
import { z } from 'zod'

// 定义验证模式
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150)
})

// 处理前先验证
export async function createUser(input: unknown) {
  try {
    const validated = CreateUserSchema.parse(input)
    return await db.users.create(validated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors }
    }
    throw error
  }
}
```

#### 文件上传验证

```typescript
function validateFileUpload(file: File) {
  // 文件大小检查（最大 5MB）
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('文件过大（最大 5MB）')
  }

  // 文件类型检查
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('文件类型不支持')
  }

  // 扩展名检查
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif']
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (!extension || !allowedExtensions.includes(extension)) {
    throw new Error('文件扩展名无效')
  }

  return true
}
```

#### 检查要点

- [ ] 所有用户输入使用 Schema 验证
- [ ] 文件上传限制（大小、类型、扩展名）
- [ ] 不直接在查询中使用用户输入
- [ ] 使用白名单验证（而非黑名单）
- [ ] 错误信息不泄露敏感信息

### 3. SQL 注入防护

#### ❌ 绝对禁止拼接 SQL

```typescript
// 危险 - SQL 注入漏洞
const query = `SELECT * FROM users WHERE email = '${userEmail}'`
await db.query(query)
```

#### ✅ 必须使用参数化查询

```typescript
// 安全 - 参数化查询
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', userEmail)

// 或使用原生 SQL
await db.query(
  'SELECT * FROM users WHERE email = $1',
  [userEmail]
)
```

#### 检查要点

- [ ] 所有数据库查询使用参数化查询
- [ ] SQL 语句中无字符串拼接
- [ ] ORM/查询构建器使用正确
- [ ] Supabase 查询正确过滤

### 4. 身份认证与授权

#### JWT 令牌处理

```typescript
// ❌ 错误：存储在 localStorage（易受 XSS 攻击）
localStorage.setItem('token', token)

// ✅ 正确：使用 httpOnly Cookie
res.setHeader('Set-Cookie',
  `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`)
```

#### 授权检查

```typescript
export async function deleteUser(userId: string, requesterId: string) {
  // 必须先验证授权
  const requester = await db.users.findUnique({
    where: { id: requesterId }
  })

  if (requester.role !== 'admin') {
    return NextResponse.json(
      { error: '权限不足' },
      { status: 403 }
    )
  }

  // 执行删除操作
  await db.users.delete({ where: { id: userId } })
}
```

#### 行级安全策略（Supabase）

```sql
-- 对所有表启用行级安全
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的数据
CREATE POLICY "Users view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- 用户只能更新自己的数据
CREATE POLICY "Users update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

#### 检查要点

- [ ] 令牌存储在 httpOnly Cookie 中（而非 localStorage）
- [ ] 敏感操作前进行授权检查
- [ ] Supabase 启用行级安全策略
- [ ] 实现基于角色的访问控制
- [ ] 会话管理安全

### 5. XSS 防护

#### HTML 净化

```typescript
import DOMPurify from 'isomorphic-dompurify'

// 必须净化用户提供的 HTML
function renderUserContent(html: string) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
    ALLOWED_ATTR: []
  })
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
```

#### 内容安全策略（CSP）

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' https://api.example.com;
    `.replace(/\s{2,}/g, ' ').trim()
  }
]
```

#### 检查要点

- [ ] 用户提供的 HTML 已净化
- [ ] 配置 CSP 响应头
- [ ] 无未验证的动态内容渲染
- [ ] 使用 React 内置 XSS 防护

### 6. CSRF 防护

#### CSRF 令牌

```typescript
import { csrf } from '@/lib/csrf'

export async function POST(request: Request) {
  const token = request.headers.get('X-CSRF-Token')

  if (!csrf.verify(token)) {
    return NextResponse.json(
      { error: 'CSRF 令牌无效' },
      { status: 403 }
    )
  }

  // 处理请求
}
```

#### SameSite Cookie

```typescript
res.setHeader('Set-Cookie',
  `session=${sessionId}; HttpOnly; Secure; SameSite=Strict`)
```

#### 检查要点

- [ ] 状态变更操作使用 CSRF 令牌
- [ ] 所有 Cookie 设置 SameSite=Strict
- [ ] 实现双重提交 Cookie 模式

### 7. 速率限制

#### API 速率限制

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每窗口最多 100 次请求
  message: '请求过于频繁'
})

// 应用到路由
app.use('/api/', limiter)
```

#### 高消耗操作

```typescript
// 对搜索接口使用更严格的限制
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 10, // 每分钟最多 10 次请求
  message: '搜索请求过于频繁'
})

app.use('/api/search', searchLimiter)
```

#### 检查要点

- [ ] 所有 API 端点启用速率限制
- [ ] 高消耗操作使用更严格的限制
- [ ] 基于 IP 的速率限制
- [ ] 基于用户的速率限制（已认证用户）

### 8. 敏感数据泄露防护

#### 日志安全

```typescript
// ❌ 错误：记录敏感数据
console.log('用户登录:', { email, password })
console.log('支付:', { cardNumber, cvv })

// ✅ 正确：脱敏处理
console.log('用户登录:', { email, userId })
console.log('支付:', { last4: card.last4, userId })
```

#### 错误信息

```typescript
// ❌ 错误：暴露内部细节
catch (error) {
  return NextResponse.json(
    { error: error.message, stack: error.stack },
    { status: 500 }
  )
}

// ✅ 正确：返回通用错误信息
catch (error) {
  console.error('内部错误:', error)
  return NextResponse.json(
    { error: '操作失败，请重试。' },
    { status: 500 }
  )
}
```

#### 检查要点

- [ ] 日志中无密码、令牌或密钥
- [ ] 用户看到的错误信息是通用的
- [ ] 详细错误仅在服务端日志
- [ ] 不向用户暴露堆栈跟踪

### 9. 区块链安全（Solana）

#### 钱包验证

```typescript
import { verify } from '@solana/web3.js'

async function verifyWalletOwnership(
  publicKey: string,
  signature: string,
  message: string
) {
  try {
    const isValid = verify(
      Buffer.from(message),
      Buffer.from(signature, 'base64'),
      Buffer.from(publicKey, 'base64')
    )
    return isValid
  } catch (error) {
    return false
  }
}
```

#### 交易验证

```typescript
async function verifyTransaction(transaction: Transaction) {
  // 验证接收方
  if (transaction.to !== expectedRecipient) {
    throw new Error('接收地址无效')
  }

  // 验证金额
  if (transaction.amount > maxAmount) {
    throw new Error('金额超出限制')
  }

  // 验证用户余额是否充足
  const balance = await getBalance(transaction.from)
  if (balance < transaction.amount) {
    throw new Error('余额不足')
  }

  return true
}
```

#### 检查要点

- [ ] 钱包签名已验证
- [ ] 交易详情已验证
- [ ] 交易前进行余额检查
- [ ] 禁止盲签交易

### 10. 依赖安全

#### 定期更新

```bash
# 检查漏洞
npm audit

# 自动修复可修复的问题
npm audit fix

# 更新依赖
npm update

# 检查过时的包
npm outdated
```

#### 锁定文件

```bash
# 必须提交锁定文件
git add package-lock.json

# 在 CI/CD 中使用以确保构建可重现
npm ci  # 替代 npm install
```

#### 检查要点

- [ ] 依赖保持最新
- [ ] 无已知漏洞（npm audit 通过）
- [ ] 锁定文件已提交
- [ ] GitHub 启用 Dependabot
- [ ] 定期进行安全更新

## 安全测试

### 自动化安全测试

```typescript
// 测试身份认证
test('需要身份认证', async () => {
  const response = await fetch('/api/protected')
  expect(response.status).toBe(401)
})

// 测试授权
test('需要管理员权限', async () => {
  const response = await fetch('/api/admin', {
    headers: { Authorization: `Bearer ${userToken}` }
  })
  expect(response.status).toBe(403)
})

// 测试输入验证
test('拒绝无效输入', async () => {
  const response = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify({ email: 'not-an-email' })
  })
  expect(response.status).toBe(400)
})

// 测试速率限制
test('强制执行速率限制', async () => {
  const requests = Array(101).fill(null).map(() =>
    fetch('/api/endpoint')
  )

  const responses = await Promise.all(requests)
  const tooManyRequests = responses.filter(r => r.status === 429)

  expect(tooManyRequests.length).toBeGreaterThan(0)
})
```

## 部署前安全检查清单

在任何生产环境部署前：

- [ ] **密钥管理**：无硬编码密钥，全部使用环境变量
- [ ] **输入验证**：所有用户输入已验证
- [ ] **SQL 注入**：所有查询已参数化
- [ ] **XSS 防护**：用户内容已净化
- [ ] **CSRF 防护**：已启用保护机制
- [ ] **身份认证**：正确处理令牌
- [ ] **授权检查**：角色检查已就位
- [ ] **速率限制**：所有端点已启用
- [ ] **HTTPS**：生产环境强制使用
- [ ] **安全响应头**：CSP、X-Frame-Options 已配置
- [ ] **错误处理**：错误信息不包含敏感数据
- [ ] **日志安全**：日志不记录敏感数据
- [ ] **依赖安全**：依赖最新且无漏洞
- [ ] **行级安全**：Supabase 已启用
- [ ] **CORS 配置**：正确配置
- [ ] **文件上传**：已验证（大小、类型）
- [ ] **钱包签名**：已验证（如涉及区块链）

## 参考资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js 安全指南](https://nextjs.org/docs/security)
- [Supabase 安全指南](https://supabase.com/docs/guides/auth)
- [Web 安全学院](https://portswigger.net/web-security)

---

**切记**：安全不是可选项。一个漏洞可能导致整个平台沦陷。如有疑虑，宁可谨慎过度。
