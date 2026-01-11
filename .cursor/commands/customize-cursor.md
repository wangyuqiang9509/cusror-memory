# Cursor 配置定制命令

智能分析项目代码，自动定制 Cursor 配置文件，使 `/init-project` 命令和 Bug 模式库更精准地适配当前项目。

## 概述

此命令是整个 Cursor 配置系统的"元命令"，负责：

1. 深度扫描项目代码和配置
2. 智能识别技术栈和架构模式
3. 生成项目特定的检测规则和 Bug 模式
4. 更新 `.cursor/commands/init-project.md` 的扩展点区域
5. 更新 `.cursor/agents/reference/tech-patterns.md` 的模式区域

**运行时机**：
- 首次使用本配置模板时
- 项目技术栈发生重大变化时
- 需要更精确的 Bug 预测时

## 执行流程

### 阶段 1：深度项目扫描

**目标**：收集项目的全部技术特征信息

#### 1.1 配置文件扫描

**并行扫描以下文件（如存在）：**

```
优先级 1（必读）：
├── package.json          # Node.js 依赖和脚本
├── tsconfig.json         # TypeScript 配置
├── pyproject.toml        # Python 项目配置
├── requirements.txt      # Python 依赖
├── go.mod                # Go 模块定义
├── Cargo.toml            # Rust 配置
├── pom.xml               # Java Maven 配置
├── build.gradle(.kts)    # Java/Kotlin Gradle 配置
├── Gemfile               # Ruby 依赖
├── composer.json         # PHP 依赖
├── pubspec.yaml          # Dart/Flutter 配置
└── mix.exs               # Elixir 配置

优先级 2（框架特征）：
├── next.config.js/mjs    # Next.js
├── nuxt.config.ts        # Nuxt.js
├── vite.config.ts        # Vite
├── webpack.config.js     # Webpack
├── angular.json          # Angular
├── svelte.config.js      # SvelteKit
├── astro.config.mjs      # Astro
├── remix.config.js       # Remix
├── tauri.conf.json       # Tauri
└── electron-builder.yml  # Electron

优先级 3（部署和基础设施）：
├── Dockerfile            # Docker 配置
├── docker-compose.yml    # Docker Compose
├── kubernetes/           # K8s 配置目录
├── .github/workflows/    # GitHub Actions
├── .gitlab-ci.yml        # GitLab CI
├── Jenkinsfile           # Jenkins
├── terraform/            # Terraform
├── serverless.yml        # Serverless Framework
└── vercel.json           # Vercel 配置
```

#### 1.2 目录结构分析

扫描项目目录结构，识别关键模式：

```
识别项：
├── 源代码目录    → src/, lib/, app/, packages/
├── 测试目录      → tests/, test/, __tests__/, spec/
├── 文档目录      → docs/, documentation/
├── 配置目录      → config/, .config/
├── 静态资源      → public/, static/, assets/
├── 构建输出      → dist/, build/, out/, target/
└── Monorepo 标志 → packages/, apps/, libs/, workspaces
```

#### 1.3 源代码采样分析

**采样策略**（避免扫描全部代码）：

1. **入口文件优先**
   - `main.*`, `index.*`, `app.*`, `server.*`
   
2. **目录入口**
   - 每个主要目录的 `index.*` 或第一个文件
   
3. **配置相关**
   - 包含 `config`, `setup`, `bootstrap` 的文件

**分析内容**：
- 导入语句模式（识别常用库）
- 装饰器/注解使用（识别框架特征）
- 类型定义模式（识别类型系统使用方式）

### 阶段 2：智能技术栈分析

**目标**：基于扫描结果构建完整的技术栈画像

#### 2.1 技术栈识别

**生成技术栈画像表：**

```markdown
## 技术栈画像

### 核心语言
| 语言 | 版本 | 来源 | 置信度 |
|------|------|------|--------|
| [语言] | [版本] | [配置文件] | 高/中/低 |

### 框架和库
| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端框架 | | | |
| 后端框架 | | | |
| UI 组件库 | | | |
| 状态管理 | | | |
| 路由 | | | |
| HTTP 客户端 | | | |
| ORM/数据库 | | | |
| 测试框架 | | | |
| 构建工具 | | | |
| 代码检查 | | | |

### 部署和基础设施
| 类别 | 技术 | 说明 |
|------|------|------|
| 容器化 | | |
| CI/CD | | |
| 云服务 | | |
| 监控 | | |
```

#### 2.2 项目类型判定

**判定规则**：

| 项目类型 | 识别特征 |
|---------|---------|
| Web 应用 - SPA | 前端框架 + 无服务端渲染配置 |
| Web 应用 - SSR | Next.js/Nuxt.js/Remix 等 |
| Web 应用 - MPA | 多 HTML 入口 + 构建工具 |
| 后端 API | Express/FastAPI/Gin 等 + 无前端代码 |
| 全栈应用 | 前端 + 后端在同一仓库 |
| CLI 工具 | commander/argparse/cobra + bin 配置 |
| 库/SDK | 主要导出 + 无可执行入口 |
| Monorepo | workspaces/lerna/turborepo 配置 |
| 移动应用 | React Native/Flutter/Capacitor |
| 桌面应用 | Electron/Tauri |
| 微服务 | 多服务目录 + 服务发现配置 |

#### 2.3 架构模式识别

**识别项目中使用的架构和设计模式：**

- **代码组织**：MVC、分层架构、领域驱动、功能模块化
- **状态管理**：集中式、分布式、状态机
- **API 风格**：REST、GraphQL、gRPC、tRPC
- **数据流**：单向数据流、双向绑定、事件驱动

### 阶段 3：Bug 模式生成

**目标**：基于技术栈生成针对性的 Bug 预测和预防规则

#### 3.1 技术栈 Bug 模式映射

**根据识别的技术栈，生成对应的 Bug 模式：**

对于每个识别到的主要技术，生成以下格式的内容：

```markdown
### [技术名称] (v[版本])

**常见 Bug 类型：**

| Bug 类型 | 描述 | 预防规则 |
|---------|------|---------|
| [具体类型] | [具体描述] | [具体规则] |

**推荐规则：**

- ✅ 应该：[正确做法]
- ✅ 应该：[正确做法]
- ❌ 避免：[错误做法]
- ❌ 避免：[错误做法]

**示例：**
```代码示例```
```

#### 3.2 技术组合风险分析

**分析技术栈组合可能产生的特殊问题：**

```markdown
## 技术组合风险

| 组合 | 潜在问题 | 预防措施 |
|------|---------|---------|
| [技术A] + [技术B] | [可能的交互问题] | [预防规则] |
```

示例场景：
- React + TypeScript：类型定义与 props 验证的重复
- Next.js + Prisma：服务端/客户端边界混淆
- FastAPI + SQLAlchemy：异步上下文管理

#### 3.3 项目特定规则推断

**基于代码分析结果，推断项目特定的规则：**

- 识别项目中已有的模式和约定
- 推断命名规范、文件组织规则
- 识别常用的工具函数和抽象模式

### 阶段 4：文件更新

**目标**：将生成的内容更新到目标文件

#### 4.1 更新 init-project.md

**更新以下扩展点区域：**

| 扩展点 | 更新内容 |
|--------|---------|
| `CONFIG_DETECTION` | 项目特定的配置文件检测规则 |
| `TECH_DETECTION` | 技术栈特定的识别规则 |
| `BUG_PREDICTION` | 项目特定的 Bug 预测维度 |
| `REFERENCE_GENERATION` | 需要生成的参考文档列表 |

**更新格式**：

```markdown
<!-- EXTENSION_POINT: [NAME]_START -->
<!-- 原始通用内容 -->

<!-- PROJECT_SPECIFIC_START: [项目名] -->
[项目特定的扩展内容]
<!-- PROJECT_SPECIFIC_END -->

<!-- EXTENSION_POINT: [NAME]_END -->
```

#### 4.2 更新 tech-patterns.md

**更新 `PATTERNS_START/END` 区域：**

```markdown
<!-- PATTERNS_START -->

## 项目技术栈 Bug 模式

> 以下内容由 /customize-cursor 命令于 [日期] 自动生成
> 基于项目：[项目名称]
> 技术栈：[主要技术列表]

### [技术1]
[生成的内容]

### [技术2]
[生成的内容]

### 技术组合风险
[组合分析内容]

<!-- PATTERNS_END -->
```

#### 4.3 保护机制

**更新时遵循以下保护规则：**

1. **保留用户自定义内容**
   - `<!-- BUG_RULES_START/END -->` 区域内的内容不被覆盖
   - 用户在扩展点外添加的内容不被删除

2. **增量更新**
   - 如果扩展点已有项目特定内容，询问是否覆盖
   - 提供差异预览

3. **备份机制**
   - 更新前创建 `.backup` 文件（可选）

### 阶段 5：验证与确认

**目标**：展示变更预览，获取用户确认

#### 5.1 生成变更报告

```markdown
## Cursor 配置定制报告

### 项目信息
- **项目名称**：[名称]
- **项目类型**：[类型]
- **主要语言**：[语言]
- **扫描时间**：[时间]

### 识别的技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| ... | ... | ... |

### 将要更新的文件

#### .cursor/commands/init-project.md

**扩展点更新：**
- CONFIG_DETECTION：[新增规则数]
- TECH_DETECTION：[新增规则数]
- BUG_PREDICTION：[新增规则数]

#### .cursor/agents/reference/tech-patterns.md

**新增 Bug 模式：**
1. [技术1]：[规则数] 条规则
2. [技术2]：[规则数] 条规则

**技术组合风险：**
- [组合数] 个组合分析

### 预览（部分）

[展示部分生成的内容预览]

---

请确认以上分析是否正确。确认后将更新文件。

如需调整，请告诉我：
- 需要添加的技术栈
- 需要移除的技术栈
- 需要调整的规则
```

#### 5.2 执行更新

用户确认后：
1. 更新 `init-project.md`
2. 更新 `tech-patterns.md`
3. 显示更新完成信息

```markdown
## 更新完成

已更新以下文件：
- ✅ .cursor/commands/init-project.md
- ✅ .cursor/agents/reference/tech-patterns.md

现在可以运行 `/init-project` 命令来初始化项目配置。

提示：
- 使用 `BUG: [问题描述]` 在开发过程中继续积累规则
- 技术栈变更时可重新运行本命令
```

## 使用方式

在 Cursor 对话框中输入 `/customize-cursor`

**支持的参数：**
- 无参数：完整流程（包含确认）
- `--quick`：跳过确认，直接更新
- `--analyze-only`：仅分析，不更新文件
- `--deep`：深度扫描（包含更多源代码分析）
- `--reset`：重置为通用模板后重新分析

## 输出位置

本命令会更新以下文件：
- `.cursor/commands/init-project.md` - 扩展点区域
- `.cursor/agents/reference/tech-patterns.md` - 模式区域

## 高级用法

### 手动补充技术栈

如果自动识别遗漏了某些技术，可以在运行命令时说明：

```
/customize-cursor 补充：项目还使用了 Redis 作为缓存，RabbitMQ 作为消息队列
```

### 排除特定技术

如果不想为某些技术生成规则：

```
/customize-cursor 排除：不需要为 ESLint 生成规则
```

### 重新定制

如果项目技术栈发生变化：

```
/customize-cursor --reset
```

## 与其他命令的协作

```
/customize-cursor     ← 首先运行：定制配置
        ↓
/init-project         ← 然后运行：初始化项目
        ↓
/clarify-requirements ← 可选：澄清需求
        ↓
BUG: [描述]           ← 持续：积累规则
        ↓
/customize-cursor     ← 定期：更新配置（技术栈变化时）
```

## 注意事项

1. **首次使用**：强烈建议在使用 `/init-project` 之前先运行本命令
2. **扫描范围**：默认只扫描配置文件和采样源代码，不会读取全部代码
3. **隐私保护**：
   - ✅ **可以读取 `.env` 文件**：因为都是开发阶段的测试使用
   - ✅ **开发环境限定**：所有配置数据仅用于本地开发，不会投产
   - ✅ **安全保证**：不会收集或上传任何敏感信息到外部服务
   - ✅ **本地处理**：所有分析都在本地完成，不涉及网络传输
4. **版本控制**：建议将更新后的配置文件提交到版本控制
