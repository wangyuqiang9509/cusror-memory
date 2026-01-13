---
name: test-driven-development
description: 在实现任何功能或修复bug之前，编写实现代码之前使用
---

# 测试驱动开发 (TDD)

## 概述

先写测试，看它失败，然后写最少的代码使其通过。

**核心原则：** 如果你没有看到测试失败，你就不知道它是否测试了正确的东西。

**违反规则的字面意思就是违反规则的精神。**

## 何时使用

**始终使用：**
- 新功能
- Bug修复
- 重构
- 行为变更

**例外（询问你的人类伙伴）：**
- 一次性原型
- 生成的代码
- 配置文件

想着"就这一次跳过TDD"？停下来。那是合理化借口。

## 铁律

```
没有先写失败的测试，就不写生产代码
```

先写代码再写测试？删掉它。重新开始。

**没有例外：**
- 不要保留它作为"参考"
- 不要在写测试时"改编"它
- 不要看它
- 删除就是删除

从测试开始全新实现。句号。

## 红-绿-重构

```dot
digraph tdd_cycle {
    rankdir=LR;
    red [label="红\n编写失败的测试", shape=box, style=filled, fillcolor="#ffcccc"];
    verify_red [label="验证正确\n失败", shape=diamond];
    green [label="绿\n最小代码", shape=box, style=filled, fillcolor="#ccffcc"];
    verify_green [label="验证通过\n全部绿色", shape=diamond];
    refactor [label="重构\n清理代码", shape=box, style=filled, fillcolor="#ccccff"];
    next [label="下一个", shape=ellipse];

    red -> verify_red;
    verify_red -> green [label="是"];
    verify_red -> red [label="错误的\n失败"];
    green -> verify_green;
    verify_green -> refactor [label="是"];
    verify_green -> green [label="否"];
    refactor -> verify_green [label="保持\n绿色"];
    verify_green -> next;
    next -> red;
}
```

### 红 - 编写失败的测试

编写一个最小的测试，展示应该发生什么。

<Good>
```typescript
test('失败的操作重试3次', async () => {
  let attempts = 0;
  const operation = () => {
    attempts++;
    if (attempts < 3) throw new Error('fail');
    return 'success';
  };

  const result = await retryOperation(operation);

  expect(result).toBe('success');
  expect(attempts).toBe(3);
});
```
清晰的名称，测试真实行为，只测一件事
</Good>

<Bad>
```typescript
test('重试有效', async () => {
  const mock = jest.fn()
    .mockRejectedValueOnce(new Error())
    .mockRejectedValueOnce(new Error())
    .mockResolvedValueOnce('success');
  await retryOperation(mock);
  expect(mock).toHaveBeenCalledTimes(3);
});
```
模糊的名称，测试mock而非代码
</Bad>

**要求：**
- 一个行为
- 清晰的名称
- 真实代码（除非不可避免否则不用mock）

### 验证红 - 看它失败

**强制执行。绝不跳过。**

```bash
npm test path/to/test.test.ts
```

确认：
- 测试失败（不是报错）
- 失败信息符合预期
- 因为功能缺失而失败（不是拼写错误）

**测试通过了？** 你在测试已存在的行为。修复测试。

**测试报错了？** 修复错误，重新运行直到正确失败。

### 绿 - 最小代码

编写最简单的代码使测试通过。

<Good>
```typescript
async function retryOperation<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < 3; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === 2) throw e;
    }
  }
  throw new Error('unreachable');
}
```
刚好足够通过测试
</Good>

<Bad>
```typescript
async function retryOperation<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    backoff?: 'linear' | 'exponential';
    onRetry?: (attempt: number) => void;
  }
): Promise<T> {
  // YAGNI（你不需要它）
}
```
过度工程化
</Bad>

不要添加功能，不要重构其他代码，不要"改进"测试之外的内容。

### 验证绿 - 看它通过

**强制执行。**

```bash
npm test path/to/test.test.ts
```

确认：
- 测试通过
- 其他测试仍然通过
- 输出干净（没有错误、警告）

**测试失败了？** 修复代码，不是测试。

**其他测试失败了？** 立即修复。

### 重构 - 清理代码

只在绿色之后：
- 消除重复
- 改进命名
- 提取帮助函数

保持测试绿色。不要添加行为。

### 重复

下一个失败的测试对应下一个功能。

## 好的测试

| 质量 | 好 | 坏 |
|---------|------|-----|
| **最小化** | 一件事。名称中有"和"？拆分它。 | `test('验证邮箱和域名和空格')` |
| **清晰** | 名称描述行为 | `test('test1')` |
| **展示意图** | 演示期望的API | 模糊代码应该做什么 |

## 为什么顺序很重要

**"我之后再写测试来验证它是否工作"**

代码之后写的测试会立即通过。立即通过什么都证明不了：
- 可能测试了错误的东西
- 可能测试了实现而非行为
- 可能遗漏了你忘记的边界情况
- 你从未看到它捕获bug

测试先行迫使你看到测试失败，证明它确实在测试某些东西。

**"我已经手动测试了所有边界情况"**

手动测试是临时的。你以为测试了所有情况但是：
- 没有测试内容的记录
- 代码变更时无法重新运行
- 压力下容易遗忘情况
- "我试的时候可以工作" ≠ 全面测试

自动化测试是系统性的。它们每次都以相同方式运行。

**"删除X小时的工作是浪费"**

沉没成本谬误。时间已经过去了。你现在的选择：
- 删除并用TDD重写（多X小时，高置信度）
- 保留它并之后添加测试（30分钟，低置信度，可能有bug）

"浪费"是保留你无法信任的代码。没有真正测试的工作代码是技术债务。

**"TDD是教条主义的，务实意味着适应"**

TDD就是务实的：
- 在提交前发现bug（比之后调试更快）
- 防止回归（测试立即捕获破坏）
- 记录行为（测试展示如何使用代码）
- 支持重构（自由修改，测试捕获破坏）

"务实"的捷径 = 在生产环境调试 = 更慢。

**"之后的测试实现相同的目标 - 这是精神而非仪式"**

不对。之后的测试回答"这做了什么？"先行的测试回答"这应该做什么？"

之后的测试被你的实现所偏见。你测试的是你构建的，不是需求要求的。你验证的是记住的边界情况，不是发现的边界情况。

先行的测试在实现之前强制发现边界情况。之后的测试验证你记住了所有事情（你没有）。

30分钟的事后测试 ≠ TDD。你得到了覆盖率，但失去了测试有效的证明。

## 常见的合理化借口

| 借口 | 现实 |
|--------|---------|
| "太简单不需要测试" | 简单的代码也会出错。测试只需30秒。 |
| "我之后再测试" | 立即通过的测试什么都证明不了。 |
| "之后的测试实现相同目标" | 之后的测试 = "这做了什么？" 先行的测试 = "这应该做什么？" |
| "已经手动测试了" | 临时 ≠ 系统性。没有记录，无法重新运行。 |
| "删除X小时是浪费" | 沉没成本谬误。保留未验证的代码是技术债务。 |
| "保留作为参考，先写测试" | 你会改编它。那就是事后测试。删除就是删除。 |
| "需要先探索" | 可以。扔掉探索结果，从TDD开始。 |
| "测试难写 = 设计不清晰" | 听测试的话。难测试 = 难使用。 |
| "TDD会拖慢我" | TDD比调试更快。务实 = 测试先行。 |
| "手动测试更快" | 手动测试不能证明边界情况。每次变更你都要重新测试。 |
| "现有代码没有测试" | 你在改进它。为现有代码添加测试。 |

## 红旗 - 停下来重新开始

- 测试前写代码
- 实现后写测试
- 测试立即通过
- 无法解释测试为什么失败
- "之后"添加测试
- 合理化"就这一次"
- "我已经手动测试过了"
- "之后的测试实现相同目的"
- "这是精神而非仪式"
- "保留作为参考"或"改编现有代码"
- "已经花了X小时，删除是浪费"
- "TDD是教条主义的，我是务实的"
- "这个情况不同因为..."

**以上所有都意味着：删除代码。用TDD重新开始。**

## 示例：Bug修复

**Bug：** 接受了空邮箱

**红**
```typescript
test('拒绝空邮箱', async () => {
  const result = await submitForm({ email: '' });
  expect(result.error).toBe('邮箱是必填项');
});
```

**验证红**
```bash
$ npm test
FAIL: expected '邮箱是必填项', got undefined
```

**绿**
```typescript
function submitForm(data: FormData) {
  if (!data.email?.trim()) {
    return { error: '邮箱是必填项' };
  }
  // ...
}
```

**验证绿**
```bash
$ npm test
PASS
```

**重构**
如果需要，为多个字段提取验证逻辑。

## 验证清单

在标记工作完成之前：

- [ ] 每个新函数/方法都有测试
- [ ] 在实现之前看到每个测试失败
- [ ] 每个测试因预期原因失败（功能缺失，不是拼写错误）
- [ ] 为每个测试编写了最小代码
- [ ] 所有测试通过
- [ ] 输出干净（没有错误、警告）
- [ ] 测试使用真实代码（只有不可避免时才用mock）
- [ ] 覆盖了边界情况和错误情况

不能勾选所有项？你跳过了TDD。重新开始。

## 遇到困难时

| 问题 | 解决方案 |
|---------|----------|
| 不知道如何测试 | 写出期望的API。先写断言。问你的人类伙伴。 |
| 测试太复杂 | 设计太复杂。简化接口。 |
| 必须mock所有东西 | 代码耦合度太高。使用依赖注入。 |
| 测试设置太庞大 | 提取帮助函数。还是复杂？简化设计。 |

## 调试集成

发现bug？写一个失败的测试重现它。遵循TDD循环。测试证明修复有效并防止回归。

永远不要在没有测试的情况下修复bug。

## 测试反模式

添加mock或测试工具时，阅读 @testing-anti-patterns.md 以避免常见陷阱：
- 测试mock行为而非真实行为
- 在生产类中添加仅测试用的方法
- 在不理解依赖的情况下mock

## 最终规则

```
生产代码 → 测试存在且先失败
否则 → 不是TDD
```

没有你的人类伙伴的许可，没有例外。
