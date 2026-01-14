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

## 必须遵守的规则

### 代码质量

1.注意IO效率：需要查询缓存或者数据库的时候一定要注意IO次数能查一次解决就不可以查俩次。
2.MVC架构模式：必须参照现有的。
3.代码统一规范：
4.函数行数：最佳不可以超过50行，如果需要最好不要超过100行。


## 参考文档

在特定领域工作时阅读这些文档：

<!-- AUTO:REFERENCE_START -->
| 文档 | 何时阅读 |
|------|---------|

