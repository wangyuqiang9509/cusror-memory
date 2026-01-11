
# 顶级  Agent 最强大脑工程师
cursor ide下实现一套可以复用到任何项目下并且可以产生复利的记忆系统的模版
---

## 1️⃣ PRD 优先开发（PRD-First Development）

**在写代码之前，先写文档。**  
PRD 应该成为 **所有 AI 对话和每一个细粒度功能的唯一事实来源（Source of Truth）**。

### 推荐结构
文档路径：项目根目录/.cursor/PRD.md
当在cursor对话框中 @PRD.md 文件的时候就要
- `PRD.md`
最开始是一个模糊需求：先分析当前项目代码,使用 commands 文件夹下的将模糊需求通过多轮确认，最终将PRD.md文档的模糊需求转化成明确需求（明确需求需要保持精简）。将明确需求输出到.cursor/FinalReqs.md这个文档中

现在是 commands 命令也需要开发。

然后使用 @FinalReqs.md 这个md文档将明确的需求转化成代码。


## 2️⃣ 模块化规则架构（Modular Rules Architecture）

**不要把所有规则塞进一个巨大的 rules 文件里。**  
按关注点拆分，只在需要时加载（On-demand Context）。

当在cursor的对话框中输入： BUG: 开头就要将这个总结成一个可以服用以后不要再犯这个问题实现复利。
当前cursor是支持：
将 CLAUDE.md 纳入上下文
系统会把 CLAUDE.md 和 CLAUDE.local.md 两个文件的内容一起放进 Agent 的上下文中。
但是必须保持CLAUDE.md这个文件必须保持精简：
格式可以参考 CLAUDE.md 进行针对当前项目进行完善。

### 目录结构（该目录结构是一个示例就是发现问题将问题归类前端还是后端还是数据库等问题类型再次解决这类问题的时候就查看完整文档进行避免犯这类错误）

```

.agents/
├─ reference/
│  ├─ components.md   
│  ├─ documentation.md
│  ├─ api.md
│  └─ deploy.md

```


### 工作方式
- `CLAUDE.md` 只引用当前需要的上下文
  - 前端 → `components.md`
  - 后端 → `api.md`

### 好处
- 上下文更干净
- Agent 不会被无关规则污染
- 响应更快、命中率更高

---

## 3️⃣ 系统进化思维（System Evolution Mindset）

**每一个 Bug，都是让 AI 系统进化的机会。**

### 闭环模型

```

Bug → 分析 → 新规则

```

### 你可以优化的层级
- 全局规则
- 按需上下文
- 命令 / 工作流

### 实际案例
- ❌ Bug：AI 使用错误的 import 风格  
  ✅ 新规则：始终使用 `@/` 路径别名

- ❌ Bug：AI 忘记跑测试  
  ✅ 更新开发流程，强制包含测试步骤

- ❌ Bug：AI 不理解认证流程  
  ✅ 新增文档：`auth-architecture.md`

### 最终目标
**每开发一个新功能，你的 Agent 都比昨天更聪明。**

---

这是一套通用模版也就是说再切换项目的时候直接将可以复制过去然后ai通过分析项目来完善CLAUDE.md这个文档。最终将这套系统可以复用到任何项目中实现将模糊需求通过多轮确认输出一份明确需求，然后将AI开发过程中遇到的问题都沉淀下来。