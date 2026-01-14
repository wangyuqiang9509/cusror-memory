# ignore-gitinore

## 执行这个指令取消对.gitignore文件的追踪

```bash
git update-index --assume-unchanged .gitignore
```

## 恢复对.gitignore的追踪

```bash
git update-index --no-assume-unchanged .gitignore
```
