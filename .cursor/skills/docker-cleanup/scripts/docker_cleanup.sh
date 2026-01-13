#!/bin/bash
# Docker 安全清理脚本
# 用于清理 Docker 容器日志、未使用的镜像、容器、卷和网络

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 显示帮助信息
show_help() {
    echo "Docker 安全清理工具"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --logs           清空所有容器日志"
    echo "  --containers     删除已停止的容器"
    echo "  --images         删除未使用的镜像"
    echo "  --volumes        删除未使用的卷"
    echo "  --networks       删除未使用的网络"
    echo "  --build-cache    删除构建缓存"
    echo "  --all            执行所有清理操作"
    echo "  --dry-run        仅显示将要清理的内容，不实际执行"
    echo "  --force          跳过确认提示"
    echo "  -h, --help       显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --all                    # 执行所有清理"
    echo "  $0 --logs --images          # 只清理日志和镜像"
    echo "  $0 --all --dry-run          # 预览所有清理操作"
    echo "  $0 --all --force            # 强制执行所有清理"
}

# 显示当前 Docker 磁盘使用情况
show_disk_usage() {
    print_info "当前 Docker 磁盘使用情况:"
    echo "----------------------------------------"
    docker system df
    echo "----------------------------------------"
}

# 清空容器日志
clean_logs() {
    print_info "正在清空容器日志..."
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "[DRY-RUN] 将清空以下容器的日志:"
        docker ps -a --format "{{.Names}}" | while read name; do
            echo "  - $name"
        done
        return
    fi
    
    # 获取所有容器的日志文件
    local log_files=$(sudo find /var/lib/docker/containers -name "*-json.log" 2>/dev/null || true)
    
    if [ -z "$log_files" ]; then
        print_warning "未找到日志文件或权限不足"
        return
    fi
    
    local count=0
    for log_file in $log_files; do
        sudo truncate -s 0 "$log_file" 2>/dev/null && ((count++)) || true
    done
    
    print_success "已清空 $count 个容器的日志文件"
}

# 删除已停止的容器
clean_containers() {
    print_info "正在检查已停止的容器..."
    
    local stopped=$(docker ps -a -f status=exited -q | wc -l)
    
    if [ "$stopped" -eq 0 ]; then
        print_info "没有已停止的容器需要清理"
        return
    fi
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "[DRY-RUN] 将删除以下 $stopped 个已停止的容器:"
        docker ps -a -f status=exited --format "  - {{.Names}} ({{.Status}})"
        return
    fi
    
    docker container prune -f
    print_success "已删除 $stopped 个已停止的容器"
}

# 删除未使用的镜像
clean_images() {
    print_info "正在检查未使用的镜像..."
    
    # 统计悬空镜像
    local dangling=$(docker images -f dangling=true -q | wc -l)
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "[DRY-RUN] 将删除以下未使用的镜像:"
        docker images -f dangling=true --format "  - {{.Repository}}:{{.Tag}} ({{.Size}})"
        
        print_warning "[DRY-RUN] 以下镜像也将被清理（未被任何容器使用）:"
        docker images --format "{{.Repository}}:{{.Tag}} {{.Size}}" | head -20
        return
    fi
    
    # 删除悬空镜像
    if [ "$dangling" -gt 0 ]; then
        docker image prune -f
        print_success "已删除 $dangling 个悬空镜像"
    fi
    
    # 删除所有未使用的镜像
    docker image prune -a -f
    print_success "已删除所有未使用的镜像"
}

# 删除未使用的卷
clean_volumes() {
    print_info "正在检查未使用的卷..."
    
    local unused=$(docker volume ls -f dangling=true -q | wc -l)
    
    if [ "$unused" -eq 0 ]; then
        print_info "没有未使用的卷需要清理"
        return
    fi
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "[DRY-RUN] 将删除以下 $unused 个未使用的卷:"
        docker volume ls -f dangling=true --format "  - {{.Name}}"
        return
    fi
    
    docker volume prune -f
    print_success "已删除 $unused 个未使用的卷"
}

# 删除未使用的网络
clean_networks() {
    print_info "正在检查未使用的网络..."
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "[DRY-RUN] 将删除未使用的网络"
        return
    fi
    
    docker network prune -f
    print_success "已删除未使用的网络"
}

# 删除构建缓存
clean_build_cache() {
    print_info "正在检查构建缓存..."
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "[DRY-RUN] 将删除所有构建缓存"
        docker builder du 2>/dev/null || true
        return
    fi
    
    docker builder prune -a -f
    print_success "已删除所有构建缓存"
}

# 执行所有清理
clean_all() {
    clean_logs
    clean_containers
    clean_images
    clean_volumes
    clean_networks
    clean_build_cache
}

# 确认操作
confirm() {
    if [ "$FORCE" = true ]; then
        return 0
    fi
    
    read -p "确定要执行清理操作吗？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "操作已取消"
        exit 0
    fi
}

# 主函数
main() {
    # 检查 Docker 是否运行
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker 未运行或权限不足"
        exit 1
    fi
    
    # 默认值
    CLEAN_LOGS=false
    CLEAN_CONTAINERS=false
    CLEAN_IMAGES=false
    CLEAN_VOLUMES=false
    CLEAN_NETWORKS=false
    CLEAN_BUILD_CACHE=false
    CLEAN_ALL=false
    DRY_RUN=false
    FORCE=false
    
    # 如果没有参数，显示帮助
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    # 解析参数
    while [ $# -gt 0 ]; do
        case "$1" in
            --logs) CLEAN_LOGS=true ;;
            --containers) CLEAN_CONTAINERS=true ;;
            --images) CLEAN_IMAGES=true ;;
            --volumes) CLEAN_VOLUMES=true ;;
            --networks) CLEAN_NETWORKS=true ;;
            --build-cache) CLEAN_BUILD_CACHE=true ;;
            --all) CLEAN_ALL=true ;;
            --dry-run) DRY_RUN=true ;;
            --force) FORCE=true ;;
            -h|--help) show_help; exit 0 ;;
            *) print_error "未知选项: $1"; show_help; exit 1 ;;
        esac
        shift
    done
    
    # 显示当前使用情况
    show_disk_usage
    
    # 确认操作
    if [ "$DRY_RUN" = false ]; then
        confirm
    fi
    
    echo ""
    
    # 执行清理
    if [ "$CLEAN_ALL" = true ]; then
        clean_all
    else
        [ "$CLEAN_LOGS" = true ] && clean_logs
        [ "$CLEAN_CONTAINERS" = true ] && clean_containers
        [ "$CLEAN_IMAGES" = true ] && clean_images
        [ "$CLEAN_VOLUMES" = true ] && clean_volumes
        [ "$CLEAN_NETWORKS" = true ] && clean_networks
        [ "$CLEAN_BUILD_CACHE" = true ] && clean_build_cache
    fi
    
    echo ""
    print_info "清理完成！清理后的磁盘使用情况:"
    show_disk_usage
}

main "$@"
