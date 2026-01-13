#!/bin/bash
# Docker 日志配置脚本
# 用于配置 Docker 全局日志限制，防止日志文件过大

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

DAEMON_JSON="/etc/docker/daemon.json"

show_help() {
    echo "Docker 日志配置工具"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --max-size SIZE    设置单个日志文件最大大小 (默认: 10m)"
    echo "  --max-file NUM     设置最大日志文件数量 (默认: 3)"
    echo "  --show             显示当前配置"
    echo "  --apply            应用配置并重启 Docker"
    echo "  -h, --help         显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --show                           # 查看当前配置"
    echo "  $0 --max-size 20m --max-file 5      # 设置日志限制"
    echo "  $0 --max-size 10m --max-file 3 --apply  # 应用配置"
}

show_current_config() {
    print_info "当前 Docker daemon.json 配置:"
    echo "----------------------------------------"
    if [ -f "$DAEMON_JSON" ]; then
        cat "$DAEMON_JSON"
    else
        echo "(文件不存在)"
    fi
    echo "----------------------------------------"
}

create_config() {
    local max_size="$1"
    local max_file="$2"
    
    print_info "创建日志配置: max-size=$max_size, max-file=$max_file"
    
    # 创建或更新配置
    local new_config=$(cat <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "$max_size",
    "max-file": "$max_file"
  }
}
EOF
)
    
    # 如果已有配置，尝试合并
    if [ -f "$DAEMON_JSON" ]; then
        print_warning "已存在配置文件，将备份为 ${DAEMON_JSON}.backup"
        sudo cp "$DAEMON_JSON" "${DAEMON_JSON}.backup"
        
        # 使用 jq 合并（如果可用）
        if command -v jq &> /dev/null; then
            local merged=$(jq -s '.[0] * .[1]' "$DAEMON_JSON" <(echo "$new_config"))
            echo "$merged" | sudo tee "$DAEMON_JSON" > /dev/null
        else
            # 如果没有 jq，直接覆盖
            echo "$new_config" | sudo tee "$DAEMON_JSON" > /dev/null
        fi
    else
        echo "$new_config" | sudo tee "$DAEMON_JSON" > /dev/null
    fi
    
    print_success "配置已写入 $DAEMON_JSON"
    show_current_config
}

apply_config() {
    print_warning "即将重启 Docker 服务..."
    print_warning "注意: 这将暂时停止所有运行中的容器"
    
    read -p "确定要继续吗？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "操作已取消"
        exit 0
    fi
    
    sudo systemctl restart docker
    print_success "Docker 服务已重启"
    
    # 等待 Docker 就绪
    sleep 3
    
    print_info "验证 Docker 状态:"
    docker info --format '{{.LoggingDriver}}'
    
    print_success "配置已应用！新创建的容器将使用新的日志限制"
    print_warning "注意: 已存在的容器需要重新创建才能应用新配置"
}

main() {
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    MAX_SIZE="10m"
    MAX_FILE="3"
    SHOW=false
    APPLY=false
    
    while [ $# -gt 0 ]; do
        case "$1" in
            --max-size) MAX_SIZE="$2"; shift ;;
            --max-file) MAX_FILE="$2"; shift ;;
            --show) SHOW=true ;;
            --apply) APPLY=true ;;
            -h|--help) show_help; exit 0 ;;
            *) print_error "未知选项: $1"; show_help; exit 1 ;;
        esac
        shift
    done
    
    if [ "$SHOW" = true ]; then
        show_current_config
        exit 0
    fi
    
    create_config "$MAX_SIZE" "$MAX_FILE"
    
    if [ "$APPLY" = true ]; then
        apply_config
    else
        print_info "配置已创建。运行以下命令应用配置:"
        echo "  sudo systemctl restart docker"
    fi
}

main "$@"
