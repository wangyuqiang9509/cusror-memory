# 项目规范技能（示例）

这是一个项目专属技能的示例模板，可作为创建自定义项目规范的参考。

基于真实生产应用：[Zenith](https://zenith.chat) —— AI 驱动的客户洞察平台。

---

## 适用场景

在特定项目开发中引用此技能。项目技能通常包含：
- 架构概览
- 目录结构
- 代码模式
- 测试规范
- 部署流程

---

## 架构概览

**技术栈：**
- **前端**：Next.js 15（App Router）、TypeScript、React
- **后端**：FastAPI（Python）、Pydantic 模型
- **数据库**：Supabase（PostgreSQL）
- **AI**：Claude API（工具调用 + 结构化输出）
- **部署**：Google Cloud Run
- **测试**：Playwright（E2E）、pytest（后端）、React Testing Library

**服务架构：**
```
┌─────────────────────────────────────────────────────────────┐
│                          前端                               │
│  Next.js 15 + TypeScript + TailwindCSS                     │
│  部署：Vercel / Cloud Run                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          后端                               │
│  FastAPI + Python 3.11 + Pydantic                          │
│  部署：Cloud Run                                            │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Supabase │   │  Claude  │   │  Redis   │
        │  数据库   │   │   API    │   │   缓存   │
        └──────────┘   └──────────┘   └──────────┘
```

---

## 目录结构

```
project/
├── frontend/
│   └── src/
│       ├── app/              # Next.js App Router 页面
│       │   ├── api/          # API 路由
│       │   ├── (auth)/       # 需认证的路由
│       │   └── workspace/    # 主工作区
│       ├── components/       # React 组件
│       │   ├── ui/           # 基础 UI 组件
│       │   ├── forms/        # 表单组件
│       │   └── layouts/      # 布局组件
│       ├── hooks/            # 自定义 React Hooks
│       ├── lib/              # 工具函数
│       ├── types/            # TypeScript 类型定义
│       └── config/           # 配置文件
│
├── backend/
│   ├── routers/              # FastAPI 路由处理器
│   ├── models.py             # Pydantic 模型
│   ├── main.py               # FastAPI 应用入口
│   ├── auth_system.py        # 认证系统
│   ├── database.py           # 数据库操作
│   ├── services/             # 业务逻辑
│   └── tests/                # pytest 测试
│
├── deploy/                   # 部署配置
├── docs/                     # 文档
└── scripts/                  # 工具脚本
```

---

## 代码模式

### API 响应格式（FastAPI）

```python
from pydantic import BaseModel
from typing import Generic, TypeVar, Optional

T = TypeVar('T')

class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None

    @classmethod
    def ok(cls, data: T) -> "ApiResponse[T]":
        return cls(success=True, data=data)

    @classmethod
    def fail(cls, error: str) -> "ApiResponse[T]":
        return cls(success=False, error=error)
```

### 前端 API 调用（TypeScript）

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }

    return await response.json()
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
```

### Claude AI 集成（结构化输出）

```python
from anthropic import Anthropic
from pydantic import BaseModel

class AnalysisResult(BaseModel):
    summary: str
    key_points: list[str]
    confidence: float

async def analyze_with_claude(content: str) -> AnalysisResult:
    client = Anthropic()

    response = client.messages.create(
        model="claude-sonnet-4-5-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": content}],
        tools=[{
            "name": "provide_analysis",
            "description": "Provide structured analysis",
            "input_schema": AnalysisResult.model_json_schema()
        }],
        tool_choice={"type": "tool", "name": "provide_analysis"}
    )

    # 提取工具调用结果
    tool_use = next(
        block for block in response.content
        if block.type == "tool_use"
    )

    return AnalysisResult(**tool_use.input)
```

### 自定义 Hooks（React）

```typescript
import { useState, useCallback } from 'react'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>(
  fetchFn: () => Promise<ApiResponse<T>>
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    const result = await fetchFn()

    if (result.success) {
      setState({ data: result.data!, loading: false, error: null })
    } else {
      setState({ data: null, loading: false, error: result.error! })
    }
  }, [fetchFn])

  return { ...state, execute }
}
```

---

## 测试规范

### 后端测试（pytest）

```bash
# 运行所有测试
poetry run pytest tests/

# 运行测试并生成覆盖率报告
poetry run pytest tests/ --cov=. --cov-report=html

# 运行指定测试文件
poetry run pytest tests/test_auth.py -v
```

**测试结构：**
```python
import pytest
from httpx import AsyncClient
from main import app

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
```

### 前端测试（React Testing Library）

```bash
# 运行测试
npm run test

# 运行测试并生成覆盖率报告
npm run test -- --coverage

# 运行 E2E 测试
npm run test:e2e
```

**测试结构：**
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkspacePanel } from './WorkspacePanel'

describe('WorkspacePanel', () => {
  it('renders workspace correctly', () => {
    render(<WorkspacePanel />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('handles session creation', async () => {
    render(<WorkspacePanel />)
    fireEvent.click(screen.getByText('New Session'))
    expect(await screen.findByText('Session created')).toBeInTheDocument()
  })
})
```

---

## 部署流程

### 部署前检查清单

- [ ] 本地所有测试通过
- [ ] `npm run build` 构建成功（前端）
- [ ] `poetry run pytest` 测试通过（后端）
- [ ] 无硬编码的敏感信息
- [ ] 环境变量已记录文档
- [ ] 数据库迁移已准备就绪

### 部署命令

```bash
# 构建并部署前端
cd frontend && npm run build
gcloud run deploy frontend --source .

# 构建并部署后端
cd backend
gcloud run deploy backend --source .
```

### 环境变量配置

```bash
# 前端 (.env.local)
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# 后端 (.env)
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
```

---

## 核心规则

1. **禁止使用表情符号** —— 代码、注释、文档中均不使用
2. **保持不可变性** —— 禁止直接修改对象或数组
3. **测试驱动开发（TDD）** —— 先写测试，后写实现
4. **测试覆盖率不低于 80%**
5. **小文件原则** —— 单文件 200-400 行为宜，不超过 800 行
6. **生产代码禁用 console.log**
7. **规范的错误处理** —— 使用 try/catch 捕获异常
8. **输入校验** —— 使用 Pydantic/Zod 进行数据验证

---

## 相关技能

- `coding-standards.md` —— 通用编码规范
- `backend-patterns.md` —— API 与数据库模式
- `frontend-patterns.md` —— React 与 Next.js 模式
- `tdd-workflow/` —— 测试驱动开发方法论
