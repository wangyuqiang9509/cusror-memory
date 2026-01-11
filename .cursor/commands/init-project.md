# 项目初始化命令

将通用的 CLAUDE.md 模板智能填充为项目定制版本，并生成配套的规则文档。

## 执行流程

### 阶段 1：项目扫描

**并行执行以下扫描任务：**

1. **目录结构扫描**
   - 列出项目根目录下的所有文件和文件夹
   - 识别关键目录：`src/`、`app/`、`lib/`、`frontend/`、`backend/`、`tests/`

2. **配置文件检测**
   - 检测存在的配置文件并记录：
   
   | 配置文件 | 技术栈指示 |
   |---------|-----------|
   | `package.json` | Node.js/前端项目 |
   | `tsconfig.json` | TypeScript |
   | `pyproject.toml` / `requirements.txt` | Python |
   | `go.mod` | Go |
   | `Cargo.toml` | Rust |
   | `docker-compose.yml` / `Dockerfile` | Docker 部署 |
   | `.env` / `.env.example` | 环境配置 |

3. **现有配置检测**
   - 检查 `.cursor/` 目录是否存在
   - 检查 `CLAUDE.md` 是否已有内容（非模板）
   - 记录需要更新还是新建

### 阶段 2：智能分析

基于扫描结果，分析并生成项目画像：

```markdown
## 项目分析报告

### 项目类型
[Web 应用 / CLI 工具 / 库/SDK / 微服务 / 单体应用 / Monorepo]

### 技术栈识别

| 层级 | 技术 | 版本 | 来源 |
|------|------|------|------|
| 前端 | [框架] | [版本] | [配置文件] |
| 后端 | [框架] | [版本] | [配置文件] |
| 数据库 | [类型] | - | [推断依据] |
| 部署 | [方式] | - | [推断依据] |

### 项目结构概览
[基于扫描生成的目录树]

### 识别的关键模式
- [列出检测到的设计模式、架构模式]
```

**技术栈识别规则**（读取配置文件内容进行判断）：

```
package.json 依赖分析：
├── react/vue/angular → 前端框架
├── next/nuxt/remix → 全栈框架
├── express/fastify/koa → Node.js 后端
├── prisma/typeorm/drizzle → 数据库 ORM
└── tailwindcss/styled-components → 样式方案

Python 依赖分析：
├── fastapi/flask/django → Web 框架
├── sqlalchemy/tortoise-orm → 数据库 ORM
├── pydantic → 数据验证
└── pytest/unittest → 测试框架
```

### 阶段 3：Bug 类型预测

**读取 `.cursor/agents/reference/tech-patterns.md` 获取技术栈对应的 Bug 模式。**

基于识别的技术栈，预测可能的 Bug 类型：

```markdown
## 潜在 Bug 风险分析

### 高风险区域
| 风险类型 | 可能原因 | 预防规则 |
|---------|---------|---------|
| [类型] | [原因] | [规则建议] |

### 推荐的规则沉淀领域
基于项目特征，建议关注以下领域的规则积累：
1. [领域 1]：[原因]
2. [领域 2]：[原因]
```

### 阶段 4：文档生成

根据分析结果，生成以下文档：

#### 4.1 填充 CLAUDE.md

```markdown
# [从 package.json/pyproject.toml 读取项目名]

> [基于项目结构推断的一句话描述]

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | [检测结果] |
| 后端 | [检测结果] |
| 数据库 | [检测结果] |
| 部署 | [检测结果] |

## 常用命令

```bash
# 开发
[从 package.json scripts 或项目结构推断]

# 测试
[从配置推断]

# 构建
[从配置推断]
```

## 项目结构

```
[实际扫描的目录结构，带注释]
```

## 参考文档

| 文档 | 何时阅读 |
|------|---------|
[根据生成的 reference 文档动态生成此表]

## 代码规范

### 通用规则

[基于技术栈生成的规范]

### 从 Bug 中学到的规则

<!-- 此区域记录重要的通用规则 -->
```

#### 4.2 生成 Reference 文档

**根据检测到的技术栈，选择性创建文档：**

| 条件 | 创建文档 |
|------|---------|
| 检测到前端框架 | `.cursor/agents/reference/components.md` |
| 检测到后端框架 | `.cursor/agents/reference/api.md` |
| 检测到 Docker/K8s | `.cursor/agents/reference/deploy.md` |
| 所有项目 | `.cursor/agents/reference/documentation.md` |

**每个文档应包含：**
- 针对项目技术栈的具体规范
- 基于预测 Bug 类型的预防规则
- "从 Bug 中学到的规则" 占位区域

#### 4.3 生成项目特定规则（可选）

如果检测到特殊模式，创建额外的规则文件：

```
.cursor/rules/
├── [framework]-patterns.mdc    # 框架特定模式
├── testing-standards.mdc       # 测试规范（如有测试框架）
└── state-management.mdc        # 状态管理（如检测到 Redux/Zustand/Pinia）
```

### 阶段 5：用户确认

**展示变更摘要，等待用户确认：**

```markdown
## 📋 项目初始化摘要

### 检测结果
- **项目名称**：[名称]
- **项目类型**：[类型]
- **技术栈**：[前端] + [后端] + [数据库]

### 将要创建/更新的文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `CLAUDE.md` | 更新 | 填充项目信息 |
| `.cursor/agents/reference/components.md` | 创建 | 前端组件规范 |
| `.cursor/agents/reference/api.md` | 创建 | API 开发规范 |
| ... | ... | ... |

### 预防规则预览

将添加以下预防性规则：
1. [规则 1]
2. [规则 2]

---

请确认以上内容是否正确，或告诉我需要调整的地方。

确认后我将开始生成文件。
```

## 使用方式

在 Cursor 对话框中输入 `/init-project`。

**支持的参数：**
- 无参数：完整流程
- `--quick`：跳过确认，直接生成
- `--analyze-only`：仅分析，不生成文件

## 输出位置

- `CLAUDE.md` - 项目根目录
- `.cursor/agents/reference/` - 规范文档
- `.cursor/rules/` - 规则文件（如有）

## 注意事项

1. **增量更新**：如果文件已存在，采用合并策略而非覆盖
2. **保留自定义内容**：不覆盖 "从 Bug 中学到的规则" 区域
3. **技术栈变更**：检测到技术栈变更时提醒用户

## 与其他命令的协作

- 初始化完成后，可使用 `/clarify-requirements` 澄清需求
- 开发过程中使用 `BUG:` 前缀沉淀规则
- 规则会自动更新到对应的 reference 文档
