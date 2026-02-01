#!/usr/bin/env python3
"""
增量合并工具 - 将新的经验数据合并到 evolution.json

支持的数据字段：
- preferences: 用户偏好列表（自动去重）
- fixes: 已知修复/解决方案列表（自动去重）
- contexts: 使用上下文列表（自动去重）
- custom_prompts: 自定义指令（覆盖模式）
"""

import os
import sys
import json
import datetime


def merge_evolution(skill_dir, new_data_json_str):
    """
    将新的经验数据增量合并到 evolution.json
    列表类型字段会自动去重
    """
    evolution_json_path = os.path.join(skill_dir, "evolution.json")
    
    # 加载现有数据或创建新数据
    if os.path.exists(evolution_json_path):
        try:
            with open(evolution_json_path, 'r', encoding='utf-8') as f:
                current_data = json.load(f)
        except Exception:
            current_data = {}
    else:
        current_data = {}

    # 解析新数据
    try:
        new_data = json.loads(new_data_json_str)
    except json.JSONDecodeError as e:
        print(f"Error decoding new data JSON: {e}", file=sys.stderr)
        return False

    # 合并逻辑
    # 1. 更新时间戳
    current_data['last_updated'] = datetime.datetime.now().isoformat()
    
    # 2. 合并列表类型字段（自动去重）
    list_fields = ['preferences', 'fixes', 'contexts']
    for field in list_fields:
        if field in new_data:
            existing_list = current_data.get(field, [])
            new_items = new_data[field]
            if isinstance(new_items, list):
                for item in new_items:
                    if item not in existing_list:
                        existing_list.append(item)
                current_data[field] = existing_list
                
    # 3. 覆盖 custom_prompts（假设 Agent 发送的是最终状态）
    if 'custom_prompts' in new_data:
        current_data['custom_prompts'] = new_data['custom_prompts']

    # 4. 更新 last_evolved_hash（如果提供）
    if 'last_evolved_hash' in new_data:
        current_data['last_evolved_hash'] = new_data['last_evolved_hash']

    # 保存回文件
    with open(evolution_json_path, 'w', encoding='utf-8') as f:
        json.dump(current_data, f, indent=2, ensure_ascii=False)
        
    skill_name = os.path.basename(skill_dir)
    print(f"Successfully merged evolution data for {skill_name}")
    return True


def main():
    """主入口函数"""
    if len(sys.argv) < 3:
        print("Usage: python merge_evolution.py <skill_dir> '<json_string>'")
        print()
        print("Example:")
        print('  python merge_evolution.py ./my-skill \'{"preferences": ["always use dark mode"]}\'')
        sys.exit(1)
        
    skill_dir = sys.argv[1]
    json_str = sys.argv[2]
    
    if not os.path.isdir(skill_dir):
        print(f"Error: {skill_dir} is not a valid directory", file=sys.stderr)
        sys.exit(1)
    
    success = merge_evolution(skill_dir, json_str)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
