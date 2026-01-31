# 更新代码地图

分析代码库结构并更新架构文档：

1. 扫描所有源文件，提取导入、导出及依赖关系
2. 生成精简的代码地图，输出格式如下：
   - codemaps/architecture.md - 整体架构
   - codemaps/backend.md - 后端结构
   - codemaps/frontend.md - 前端结构
   - codemaps/data.md - 数据模型与 Schema

3. 计算与上一版本的差异百分比
4. 若变更超过 30%，须先征得用户确认后再更新
5. 为每份代码地图添加时效性时间戳
6. 将报告保存至 .reports/codemap-diff.txt

使用 TypeScript/Node.js 进行分析。聚焦于高层架构，无需涉及实现细节。
