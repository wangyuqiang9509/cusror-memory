---
name: instinct-export
description: 导出本能记录，便于团队共享或跨项目迁移
command: /instinct-export
---

# 本能导出命令

将本能记录导出为可分享的格式，适用于：
- 与团队成员共享经验
- 迁移至新设备
- 沉淀为项目编码规范

## 使用方式

```
/instinct-export                           # 导出全部个人本能
/instinct-export --domain testing          # 仅导出测试领域的本能
/instinct-export --min-confidence 0.7      # 仅导出高置信度本能
/instinct-export --output team-instincts.yaml
```

## 执行步骤

1. 读取 `~/.cursor/homunculus/instincts/personal/` 目录下的本能文件
2. 根据命令行参数进行过滤
3. 剥离敏感信息：
   - 移除会话 ID
   - 移除具体文件路径（仅保留模式特征）
   - 移除一周前的时间戳
4. 生成导出文件

## 输出格式

生成 YAML 格式文件：

```yaml
# 本能导出文件
# 生成时间: 2025-01-22
# 来源: personal
# 数量: 12 条本能

version: "2.0"
exported_by: "continuous-learning-v2"
export_date: "2025-01-22T10:30:00Z"

instincts:
  - id: prefer-functional-style
    trigger: "编写新函数时"
    action: "优先使用函数式模式，而非类"
    confidence: 0.8
    domain: code-style
    observations: 8

  - id: test-first-workflow
    trigger: "添加新功能时"
    action: "先写测试，再写实现"
    confidence: 0.9
    domain: testing
    observations: 12

  - id: grep-before-edit
    trigger: "修改代码前"
    action: "先用 Grep 搜索，再用 Read 确认，最后 Edit"
    confidence: 0.7
    domain: workflow
    observations: 6
```

## 隐私保护

导出内容包含：
- ✅ 触发模式
- ✅ 执行动作
- ✅ 置信度评分
- ✅ 领域分类
- ✅ 观察次数

导出内容不包含：
- ❌ 实际代码片段
- ❌ 具体文件路径
- ❌ 会话记录
- ❌ 个人标识信息

## 命令参数

- `--domain <name>`: 仅导出指定领域
- `--min-confidence <n>`: 最低置信度阈值（默认: 0.3）
- `--output <file>`: 输出文件路径（默认: instincts-export-YYYYMMDD.yaml）
- `--format <yaml|json|md>`: 输出格式（默认: yaml）
- `--include-evidence`: 包含证据文本（默认: 不包含）
