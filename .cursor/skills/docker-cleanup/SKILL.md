---
name: docker-cleanup
description: 安全清理 Docker 容器中的日志、未使用的镜像、容器、卷和网络等资源。用于释放磁盘空间、防止日志膨胀、维护 Docker 环境健康。当用户提到清理 Docker、释放磁盘空间、删除无用镜像、清空容器日志、配置日志限制、Docker 占用空间过大等场景时使用此技能。
---

# Docker 安全清理技能

提供 Docker 资源清理和日志管理的完整解决方案。

## 快速清理命令

### 1. 清空所有容器日志
```bash
sudo sh -c 'truncate -s 0 /var/lib/docker/containers/*/*-json.log'
```

### 2. 删除未使用资源
```bash
# 删除已停止的容器
docker container prune -f

# 删除未使用的镜像
docker image prune -a -f

# 删除未使用的卷（谨慎！）
docker volume prune -f

# 一键清理所有未使用资源
docker system prune -a -f

# 包括卷的完整清理（谨慎！）
docker system prune -a --volumes -f
```

### 3. 查看磁盘使用情况
```bash
docker system df -v
```

## 脚本工具

### docker_cleanup.sh - 综合清理脚本

路径: `scripts/docker_cleanup.sh`

```bash
# 查看帮助
bash scripts/docker_cleanup.sh --help

# 预览清理操作（不实际执行）
bash scripts/docker_cleanup.sh --all --dry-run

# 执行所有清理
bash scripts/docker_cleanup.sh --all --force

# 只清理日志和镜像
bash scripts/docker_cleanup.sh --logs --images --force
```

选项:
- `--logs` - 清空容器日志
- `--containers` - 删除已停止的容器
- `--images` - 删除未使用的镜像
- `--volumes` - 删除未使用的卷
- `--networks` - 删除未使用的网络
- `--build-cache` - 删除构建缓存
- `--all` - 执行所有清理
- `--dry-run` - 预览模式
- `--force` - 跳过确认

### docker_log_config.sh - 日志配置脚本

路径: `scripts/docker_log_config.sh`

```bash
# 查看当前配置
bash scripts/docker_log_config.sh --show

# 设置日志限制（10MB，保留3个文件）
bash scripts/docker_log_config.sh --max-size 10m --max-file 3 --apply
```

## Docker Compose 日志配置

在 `docker-compose.yml` 中为服务添加日志限制:

```yaml
services:
  app:
    image: your-image
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 全局日志配置

编辑 `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

然后重启 Docker:
```bash
sudo systemctl restart docker
```

> ⚠️ 全局配置只对新创建的容器生效，已存在的容器需要重新创建。

## 定时清理

使用 cron 设置定时清理任务:

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 3 点清理日志
0 3 * * * sudo sh -c 'truncate -s 0 /var/lib/docker/containers/*/*-json.log'

# 每周日凌晨 4 点清理未使用资源
0 4 * * 0 docker system prune -a -f
```

## 安全注意事项

1. **运行中的容器不受影响** - 清理操作只删除未使用的资源
2. **数据卷需谨慎** - `docker volume prune` 会删除未挂载的卷，可能包含重要数据
3. **镜像可重新拉取** - 删除的镜像可以通过 `docker pull` 重新获取
4. **建议先预览** - 使用 `--dry-run` 查看将要删除的内容
