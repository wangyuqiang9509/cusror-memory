# 项目初始化命令

将通用的 CLAUDE.md 模板智能填充为项目定制版本，并生成配套的规则文档。

> **提示**：如果此命令的检测规则不够精确，请先运行 `/customize-cursor` 命令来定制化本文件。

## 执行流程

### 阶段 1：项目扫描

**并行执行以下扫描任务：**

1. **目录结构扫描**
   - 列出项目根目录下的所有文件和文件夹
   - 识别关键目录模式（源代码、测试、配置、文档等）

2. **配置文件检测**
   - 检测存在的配置文件并记录
   - 使用下方的「通用配置文件检测表」进行匹配

3. **现有配置检测**
   - 检查 `.cursor/` 目录是否存在
   - 检查 `CLAUDE.md` 是否已有内容（非模板）
   - 记录需要更新还是新建

#### 通用配置文件检测表

<!-- EXTENSION_POINT: CONFIG_DETECTION_START -->
| 配置文件模式 | 技术栈指示 |
|-------------|-----------|
| `package.json` | Node.js / JavaScript / TypeScript 项目 |
| `tsconfig.json` / `jsconfig.json` | TypeScript / JavaScript 配置 |
| `pyproject.toml` / `setup.py` / `requirements.txt` / `Pipfile` | Python 项目 |
| `go.mod` / `go.sum` | Go 项目 |
| `Cargo.toml` | Rust 项目 |
| `pom.xml` / `build.gradle` / `build.gradle.kts` | Java / Kotlin 项目 |
| `Gemfile` / `*.gemspec` | Ruby 项目 |
| `composer.json` | PHP 项目 |
| `*.csproj` / `*.sln` | .NET / C# 项目 |
| `pubspec.yaml` | Dart / Flutter 项目 |
| `mix.exs` | Elixir 项目 |
| `Makefile` / `CMakeLists.txt` | C / C++ 项目 |
| `docker-compose.yml` / `Dockerfile` | Docker 部署 |
| `kubernetes/` / `k8s/` / `*.yaml` (含 apiVersion) | Kubernetes 部署 |
| `.env` / `.env.example` | 环境配置 |
| `terraform/` / `*.tf` | Terraform 基础设施 |

<!-- 此表可由 /customize-cursor 命令根据项目特点扩展 -->
<!-- EXTENSION_POINT: CONFIG_DETECTION_END -->

### 阶段 2：智能分析

基于扫描结果，分析并生成项目画像：

```markdown
## 项目分析报告

### 项目类型
[Web 应用 / CLI 工具 / 库/SDK / 微服务 / 单体应用 / Monorepo / 移动应用 / 桌面应用 / 其他]

### 技术栈识别

| 层级 | 技术 | 版本 | 来源 |
|------|------|------|------|
| 语言 | [语言] | [版本] | [配置文件] |
| 前端 | [框架] | [版本] | [配置文件] |
| 后端 | [框架] | [版本] | [配置文件] |
| 数据库 | [类型] | - | [推断依据] |
| 部署 | [方式] | - | [推断依据] |

### 项目结构概览
[基于扫描生成的目录树]

### 识别的关键模式
- [列出检测到的设计模式、架构模式]
```

#### 技术栈识别引擎

<!-- EXTENSION_POINT: TECH_DETECTION_START -->
**通用识别策略：**

1. **读取配置文件内容**
   - 解析依赖声明（dependencies、devDependencies、requires 等）
   - 提取版本信息

2. **框架特征文件识别**
   - 检测框架特有的配置文件（如 next.config.js、nuxt.config.ts、vite.config.ts 等）
   - 检测特征目录结构（如 pages/、app/、components/ 等）

3. **源代码分析**（可选）
   - 采样导入语句
   - 识别常用模式

**识别优先级：**
- 显式配置 > 依赖声明 > 目录结构 > 代码模式

<!-- 此区域可由 /customize-cursor 命令添加项目特定的识别规则 -->
<!-- EXTENSION_POINT: TECH_DETECTION_END -->

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

<!-- EXTENSION_POINT: BUG_PREDICTION_START -->
**通用 Bug 预测维度：**

| 维度 | 关注点 |
|------|--------|
| 类型安全 | 动态类型语言的类型错误、类型断言问题 |
| 异步处理 | Promise/async 错误处理、并发问题 |
| 状态管理 | 状态同步、副作用处理 |
| 资源管理 | 内存泄漏、连接池、文件句柄 |
| 安全性 | 注入攻击、认证授权、数据验证 |
| 性能 | N+1 查询、不必要的重渲染、阻塞操作 |

<!-- 此区域可由 /customize-cursor 命令添加项目特定的预测规则 -->
<!-- EXTENSION_POINT: BUG_PREDICTION_END -->

### 阶段 4：文档生成

根据分析结果，生成以下文档：

#### 4.1 填充 CLAUDE.md

将扫描和分析结果填充到 CLAUDE.md 模板的对应占位符区域：

- `<!-- AUTO:PROJECT_NAME -->` → 项目名称
- `<!-- AUTO:PROJECT_DESCRIPTION -->` → 项目描述
- `<!-- AUTO:TECH_STACK_START/END -->` → 技术栈表格
- `<!-- AUTO:COMMANDS_START/END -->` → 常用命令
- `<!-- AUTO:STRUCTURE_START/END -->` → 项目结构
- `<!-- AUTO:REFERENCE_START/END -->` → 参考文档列表
- `<!-- AUTO:TECH_RULES_START/END -->` → 技术栈特定规则

#### 4.2 生成 Reference 文档

**根据检测到的技术栈，选择性创建或更新文档：**

<!-- EXTENSION_POINT: REFERENCE_GENERATION_START -->
| 条件 | 创建/更新文档 |
|------|-------------|
| 检测到前端框架 | `.cursor/agents/reference/components.md` |
| 检测到后端框架 | `.cursor/agents/reference/api.md` |
| 检测到 Docker/K8s/云服务 | `.cursor/agents/reference/deploy.md` |
| 所有项目 | `.cursor/agents/reference/documentation.md` |
| 检测到数据库 | `.cursor/agents/reference/database.md` |

<!-- 此表可由 /customize-cursor 命令根据项目特点扩展 -->
<!-- EXTENSION_POINT: REFERENCE_GENERATION_END -->

**每个文档应包含：**
- 针对项目技术栈的具体规范
- 基于预测 Bug 类型的预防规则
- "从 Bug 中学到的规则" 占位区域

#### 4.3 生成项目特定规则（可选）

如果检测到特殊模式，创建额外的规则文件：

```
.cursor/rules/
├── [tech]-patterns.mdc       # 技术栈特定模式
├── testing-standards.mdc     # 测试规范（如有测试框架）
└── [custom].mdc              # 其他项目特定规则
```

### 阶段 5：用户确认

**展示变更摘要，等待用户确认：**

```markdown
## 项目初始化摘要

### 检测结果
- **项目名称**：[名称]
- **项目类型**：[类型]
- **技术栈**：[主要技术列表]

### 将要创建/更新的文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `CLAUDE.md` | 更新 | 填充项目信息 |
| `.cursor/agents/reference/[xxx].md` | 创建/更新 | [说明] |
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
- 无参数：完整流程（包含用户确认）
- `--quick`：跳过确认，直接生成
- `--analyze-only`：仅分析，不生成文件
- `--force`：覆盖现有文件（谨慎使用）

## 输出位置

- `CLAUDE.md` - 项目根目录
- `.cursor/agents/reference/` - 规范文档
- `.cursor/rules/` - 规则文件（如有）

## 注意事项

1. **增量更新**：如果文件已存在，采用合并策略而非覆盖
2. **保留自定义内容**：不覆盖 "从 Bug 中学到的规则" 区域
3. **技术栈变更**：检测到技术栈变更时提醒用户
4. **扩展点保护**：`<!-- EXTENSION_POINT -->` 标记的区域会被保留

## 扩展本命令

如果本命令的默认检测规则不能满足项目需求，可以：

1. **自动扩展**：运行 `/customize-cursor` 命令，系统将分析项目并自动扩展本文件
2. **手动扩展**：在对应的 `<!-- EXTENSION_POINT -->` 区域内添加自定义规则

## 与其他命令的协作

```
/customize-cursor  →  定制本命令（可选，首次使用推荐）
        ↓
/init-project      →  初始化项目（本命令）
        ↓
/clarify-requirements  →  澄清需求
        ↓
BUG: [描述]        →  开发过程中沉淀规则
```
