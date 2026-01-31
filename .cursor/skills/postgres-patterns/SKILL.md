---
name: postgres-patterns
description: PostgreSQL 数据库模式：涵盖查询优化、Schema 设计、索引策略与安全实践。基于 Supabase 最佳实践。
---

# PostgreSQL 最佳实践模式

PostgreSQL 最佳实践速查手册。如需完整的数据库审查流程，请使用 `database-reviewer` Agent。

## 激活场景

- 编写 SQL 查询或数据库迁移脚本
- 设计数据库 Schema
- 排查慢查询问题
- 实现行级安全策略（RLS）
- 配置连接池

## 速查手册

### 索引类型选择

| 查询模式 | 索引类型 | 示例 |
|---------|---------|------|
| `WHERE col = value` | B-tree（默认） | `CREATE INDEX idx ON t (col)` |
| `WHERE col > value` | B-tree | `CREATE INDEX idx ON t (col)` |
| `WHERE a = x AND b > y` | 复合索引 | `CREATE INDEX idx ON t (a, b)` |
| `WHERE jsonb @> '{}'` | GIN | `CREATE INDEX idx ON t USING gin (col)` |
| `WHERE tsv @@ query` | GIN | `CREATE INDEX idx ON t USING gin (col)` |
| 时序范围查询 | BRIN | `CREATE INDEX idx ON t USING brin (col)` |

### 数据类型选择

| 场景 | 推荐类型 | 避免使用 |
|-----|---------|---------|
| 主键/ID | `bigint` | `int`、随机 UUID |
| 字符串 | `text` | `varchar(255)` |
| 时间戳 | `timestamptz` | `timestamp` |
| 金额 | `numeric(10,2)` | `float` |
| 布尔标记 | `boolean` | `varchar`、`int` |

### 常用模式

**复合索引列顺序：**
```sql
-- 等值查询列在前，范围查询列在后
CREATE INDEX idx ON orders (status, created_at);
-- 适用于: WHERE status = 'pending' AND created_at > '2024-01-01'
```

**覆盖索引（Index-Only Scan）：**
```sql
CREATE INDEX idx ON users (email) INCLUDE (name, created_at);
-- 查询 SELECT email, name, created_at 时无需回表
```

**部分索引：**
```sql
CREATE INDEX idx ON users (email) WHERE deleted_at IS NULL;
-- 索引更小，仅包含有效用户
```

**RLS 策略（优化写法）：**
```sql
CREATE POLICY policy ON orders
  USING ((SELECT auth.uid()) = user_id);  -- 必须用 SELECT 包裹！
```

**UPSERT（插入或更新）：**
```sql
INSERT INTO settings (user_id, key, value)
VALUES (123, 'theme', 'dark')
ON CONFLICT (user_id, key)
DO UPDATE SET value = EXCLUDED.value;
```

**游标分页：**
```sql
SELECT * FROM products WHERE id > $last_id ORDER BY id LIMIT 20;
-- 时间复杂度 O(1)，OFFSET 分页为 O(n)
```

**队列任务处理：**
```sql
UPDATE jobs SET status = 'processing'
WHERE id = (
  SELECT id FROM jobs WHERE status = 'pending'
  ORDER BY created_at LIMIT 1
  FOR UPDATE SKIP LOCKED
) RETURNING *;
```

### 反模式检测

```sql
-- 查找未建索引的外键
SELECT conrelid::regclass, a.attname
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid AND a.attnum = ANY(i.indkey)
  );

-- 查找慢查询
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;

-- 检查表膨胀
SELECT relname, n_dead_tup, last_vacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

### 配置模板

```sql
-- 连接数限制（根据内存调整）
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET work_mem = '8MB';

-- 超时设置
ALTER SYSTEM SET idle_in_transaction_session_timeout = '30s';
ALTER SYSTEM SET statement_timeout = '30s';

-- 监控扩展
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 安全默认配置
REVOKE ALL ON SCHEMA public FROM public;

SELECT pg_reload_conf();
```

## 相关资源

- Agent: `database-reviewer` - 完整数据库审查流程
- Skill: `clickhouse-io` - ClickHouse 分析型数据库模式
- Skill: `backend-patterns` - API 与后端开发模式

---

*基于 [Supabase Agent Skills](https://github.com/supabase/agent-skills)（MIT 许可证）*
