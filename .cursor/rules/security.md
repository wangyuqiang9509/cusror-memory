# 安全规范

## 强制安全检查清单

每次提交前必须确认：
- [ ] 禁止硬编码敏感信息（API 密钥、密码、令牌）
- [ ] 所有用户输入已验证
- [ ] SQL 注入防护（使用参数化查询）
- [ ] XSS 防护（HTML 内容已转义）
- [ ] CSRF 防护已启用
- [ ] 身份认证与权限校验已完成
- [ ] 所有接口已配置速率限制
- [ ] 错误信息不泄露敏感数据

## 密钥管理

```typescript
// 禁止：硬编码密钥
const apiKey = "sk-proj-xxxxx"

// 正确：使用环境变量
const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

## 安全事件响应流程

发现安全问题时：
1. 立即停止当前操作
2. 调用 **security-reviewer** 代理进行评估
3. 优先修复严重级别问题后再继续
4. 轮换所有已暴露的密钥
5. 全量排查代码库中的同类问题
