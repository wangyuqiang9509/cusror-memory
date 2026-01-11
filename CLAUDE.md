# <!-- AUTO:PROJECT_NAME -->

> <!-- AUTO:PROJECT_DESCRIPTION -->

## 技术栈

<!-- AUTO:TECH_STACK_START -->
| 层级 | 技术 |
|------|------|
| 后端 | <!-- 待检测 --> |
| 数据库 | <!-- 待检测 --> |
| 部署 | <!-- 待检测 --> |
<!-- AUTO:TECH_STACK_END -->

## 常用命令

<!-- AUTO:COMMANDS_START -->
```bash
# 开发
# 待检测：npm run dev / python main.py / go run .

# 测试
# 待检测：npm test / pytest / go test

# 构建
# 待检测：npm run build / docker build
```
<!-- AUTO:COMMANDS_END -->

## 项目结构

<!-- AUTO:STRUCTURE_START -->
```
project/
├── src/               # 源代码
├── tests/             # 测试代码
├── .cursor/           # Cursor 配置
│   ├── PRD.md         # 需求文档
│   ├── FinalReqs.md   # 明确需求
│   ├── commands/      # 自定义命令
│   ├── agents/        # 参考文档
│   └── rules/         # 规则文件
└── CLAUDE.md          # 本文件
```
<!-- AUTO:STRUCTURE_END -->

## 参考文档

在特定领域工作时阅读这些文档：

<!-- AUTO:REFERENCE_START -->
| 文档 | 何时阅读 |
|------|---------|


## 工作流程

### 项目初始化

使用 `/init-project` 命令自动分析项目并填充此文档。

### 需求开发

1. 查看 `.cursor/PRD.md` 了解需求
2. 使用 `/clarify-requirements` 命令澄清模糊需求
3. 根据 `.cursor/FinalReqs.md` 进行开发

### Bug 修复

当遇到 Bug 时，使用 `BUG: [问题描述]` 格式报告，系统会：
1. 分析 Bug 原因
2. 提炼可复用规则
3. 更新参考文档

## 代码规范

### 通用规则

- 使用中文编写注释和文档
- 遵循项目现有的代码风格
- 保持函数/组件单一职责

<!-- AUTO:TECH_RULES_START -->
### 技术栈特定规则

<!-- 此区域由 /init-project 命令根据技术栈自动生成 -->
<!-- AUTO:TECH_RULES_END -->

### 从 Bug 中学到的规则

<!-- BUG_RULES_START -->
<!-- 此区域由 bug-to-rule 命令自动更新，请勿手动修改 -->
<!-- BUG_RULES_END -->

---

## 快速开始（模板使用说明）

**方式一：自动初始化（推荐）**

将此模板复制到新项目后，运行 `/init-project` 命令，系统将自动：
1. 扫描项目结构和配置文件
2. 识别技术栈并填充上方表格
3. 生成常用命令
4. 创建项目特定的规范文档
5. 预测可能的 Bug 类型并添加预防规则

**方式二：手动填写**

1. 替换 `<!-- AUTO:PROJECT_NAME -->` 为项目名称
2. 替换 `<!-- AUTO:PROJECT_DESCRIPTION -->` 为项目描述
3. 填写技术栈表格
4. 更新常用命令
5. 调整项目结构说明
6. 删除此"快速开始"区域

---

**标记说明：**

| 标记 | 用途 |
|------|------|
| `<!-- AUTO:* -->` | 由 `/init-project` 命令自动填充 |
| `<!-- *_START/END -->` | 标记可替换的区域边界 |
| `<!-- BUG_RULES_* -->` | 由 `BUG:` 命令自动更新 |
