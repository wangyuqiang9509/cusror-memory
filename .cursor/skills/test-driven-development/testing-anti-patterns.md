# 测试反模式

**在以下情况加载此参考文档：** 编写或修改测试、添加mock、或者想在生产代码中添加仅测试用的方法时。

## 概述

测试必须验证真实行为，而非mock行为。Mock是隔离的手段，不是被测试的对象。

**核心原则：** 测试代码做什么，而非mock做什么。

**遵循严格的TDD可以防止这些反模式。**

## 铁律

```
1. 永远不要测试mock行为
2. 永远不要在生产类中添加仅测试用的方法
3. 永远不要在不理解依赖的情况下mock
```

## 反模式 1：测试Mock行为

**违规示例：**
```typescript
// ❌ 错误：测试mock是否存在
test('渲染侧边栏', () => {
  render(<Page />);
  expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
});
```

**为什么这是错误的：**
- 你在验证mock是否工作，而非组件是否工作
- mock存在时测试通过，不存在时失败
- 对真实行为没有任何说明

**你的人类伙伴的纠正：** "我们是在测试mock的行为吗？"

**修复方法：**
```typescript
// ✅ 正确：测试真实组件或不要mock它
test('渲染侧边栏', () => {
  render(<Page />);  // 不要mock侧边栏
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});

// 或者如果侧边栏必须被mock以实现隔离：
// 不要断言mock - 测试Page在侧边栏存在时的行为
```

### 门控函数

```
在断言任何mock元素之前：
  问："我是在测试真实组件行为还是仅仅测试mock存在？"

  如果是测试mock存在：
    停止 - 删除断言或取消mock该组件

  改为测试真实行为
```

## 反模式 2：生产代码中的仅测试方法

**违规示例：**
```typescript
// ❌ 错误：destroy()仅在测试中使用
class Session {
  async destroy() {  // 看起来像生产API！
    await this._workspaceManager?.destroyWorkspace(this.id);
    // ... 清理
  }
}

// 在测试中
afterEach(() => session.destroy());
```

**为什么这是错误的：**
- 生产类被仅测试用的代码污染
- 如果在生产中意外调用会很危险
- 违反YAGNI和关注点分离原则
- 混淆了对象生命周期和实体生命周期

**修复方法：**
```typescript
// ✅ 正确：测试工具处理测试清理
// Session没有destroy() - 在生产中它是无状态的

// 在 test-utils/ 中
export async function cleanupSession(session: Session) {
  const workspace = session.getWorkspaceInfo();
  if (workspace) {
    await workspaceManager.destroyWorkspace(workspace.id);
  }
}

// 在测试中
afterEach(() => cleanupSession(session));
```

### 门控函数

```
在向生产类添加任何方法之前：
  问："这是否仅被测试使用？"

  如果是：
    停止 - 不要添加它
    将它放在测试工具中

  问："这个类是否拥有此资源的生命周期？"

  如果否：
    停止 - 这个方法放错了类
```

## 反模式 3：不理解依赖就Mock

**违规示例：**
```typescript
// ❌ 错误：Mock破坏了测试逻辑
test('检测重复服务器', () => {
  // Mock阻止了测试所依赖的配置写入！
  vi.mock('ToolCatalog', () => ({
    discoverAndCacheTools: vi.fn().mockResolvedValue(undefined)
  }));

  await addServer(config);
  await addServer(config);  // 应该抛出异常 - 但不会！
});
```

**为什么这是错误的：**
- 被mock的方法有测试所依赖的副作用（写入配置）
- 为了"安全"而过度mock破坏了实际行为
- 测试因错误的原因通过或神秘地失败

**修复方法：**
```typescript
// ✅ 正确：在正确的层级mock
test('检测重复服务器', () => {
  // Mock慢的部分，保留测试需要的行为
  vi.mock('MCPServerManager'); // 只mock慢的服务器启动

  await addServer(config);  // 配置被写入
  await addServer(config);  // 检测到重复 ✓
});
```

### 门控函数

```
在mock任何方法之前：
  停止 - 先不要mock

  1. 问："真实方法有什么副作用？"
  2. 问："这个测试是否依赖这些副作用中的任何一个？"
  3. 问："我是否完全理解这个测试需要什么？"

  如果依赖副作用：
    在更低层级mock（实际的慢/外部操作）
    或者使用保留必要行为的测试替身
    不是mock测试所依赖的高级方法

  如果不确定测试依赖什么：
    首先用真实实现运行测试
    观察实际需要发生什么
    然后在正确的层级添加最小的mock

  红旗：
    - "我会mock这个以防万一"
    - "这可能很慢，最好mock它"
    - 在不理解依赖链的情况下mock
```

## 反模式 4：不完整的Mock

**违规示例：**
```typescript
// ❌ 错误：部分mock - 只有你认为需要的字段
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' }
  // 缺少：下游代码使用的metadata
};

// 之后：当代码访问response.metadata.requestId时出错
```

**为什么这是错误的：**
- **部分mock隐藏了结构假设** - 你只mock了你知道的字段
- **下游代码可能依赖你没有包含的字段** - 静默失败
- **测试通过但集成失败** - Mock不完整，真实API完整
- **虚假的信心** - 测试对真实行为什么都没证明

**铁律：** Mock完整的数据结构就像它在现实中存在的那样，不仅仅是你当前测试使用的字段。

**修复方法：**
```typescript
// ✅ 正确：镜像真实API的完整性
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' },
  metadata: { requestId: 'req-789', timestamp: 1234567890 }
  // 真实API返回的所有字段
};
```

### 门控函数

```
在创建mock响应之前：
  检查："真实API响应包含哪些字段？"

  操作：
    1. 从文档/示例中检查实际API响应
    2. 包含系统可能在下游消费的所有字段
    3. 验证mock完全匹配真实响应架构

  关键：
    如果你在创建mock，你必须理解整个结构
    当代码依赖被省略的字段时，部分mock会静默失败

  如果不确定：包含所有文档记录的字段
```

## 反模式 5：集成测试作为事后考虑

**违规示例：**
```
✅ 实现完成
❌ 没有编写测试
"准备测试"
```

**为什么这是错误的：**
- 测试是实现的一部分，不是可选的后续工作
- TDD本可以捕获这个问题
- 没有测试不能声称完成

**修复方法：**
```
TDD循环：
1. 编写失败的测试
2. 实现使其通过
3. 重构
4. 然后才能声称完成
```

## 当Mock变得过于复杂时

**警告信号：**
- Mock设置比测试逻辑还长
- mock所有东西才能让测试通过
- Mock缺少真实组件拥有的方法
- Mock变化时测试就中断

**你的人类伙伴的问题：** "我们真的需要在这里使用mock吗？"

**考虑：** 使用真实组件的集成测试通常比复杂的mock更简单

## TDD防止这些反模式

**为什么TDD有帮助：**
1. **先写测试** → 迫使你思考你实际在测试什么
2. **看它失败** → 确认测试测试的是真实行为，不是mock
3. **最小实现** → 仅测试用的方法不会混进来
4. **真实依赖** → 你在mock之前就看到测试实际需要什么

**如果你在测试mock行为，你违反了TDD** - 你在没有先看测试对真实代码失败的情况下添加了mock。

## 快速参考

| 反模式 | 修复 |
|--------------|-----|
| 断言mock元素 | 测试真实组件或取消mock |
| 生产代码中的仅测试方法 | 移到测试工具中 |
| 不理解就mock | 先理解依赖，最小化mock |
| 不完整的mock | 完整镜像真实API |
| 测试作为事后考虑 | TDD - 测试先行 |
| 过于复杂的mock | 考虑集成测试 |

## 红旗

- 断言检查`*-mock`测试ID
- 方法只在测试文件中被调用
- Mock设置占测试的>50%
- 移除mock时测试失败
- 无法解释为什么需要mock
- "为了安全"而mock

## 底线

**Mock是隔离的工具，不是被测试的对象。**

如果TDD揭示你在测试mock行为，你已经走错了。

修复：测试真实行为或质疑你为什么要mock。
