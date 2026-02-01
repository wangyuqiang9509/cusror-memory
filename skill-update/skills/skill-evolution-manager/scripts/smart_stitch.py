#!/usr/bin/env python3
"""
文档生成工具 - 将 evolution.json 内容缝合到 SKILL.md 末尾

生成的章节：## User-Learned Best Practices & Constraints
该章节由本脚本维护，包含：
- User Preferences: 用户偏好
- Known Fixes & Workarounds: 已知修复和解决方案
- Custom Instruction Injection: 自定义指令
"""

import os
import sys
import json
import re


def stitch_skill(skill_dir):
    """
    读取 evolution.json 并将其内容缝合到 SKILL.md 的专用章节中
    如果章节已存在则更新，否则追加
    """
    skill_md_path = os.path.join(skill_dir, "SKILL.md")
    evolution_json_path = os.path.join(skill_dir, "evolution.json")

    if not os.path.exists(skill_md_path):
        print(f"Error: SKILL.md not found in {skill_dir}", file=sys.stderr)
        return False
        
    if not os.path.exists(evolution_json_path):
        print(f"Info: No evolution.json found in {skill_dir}. Nothing to stitch.", file=sys.stderr)
        return True

    # 读取 evolution.json
    try:
        with open(evolution_json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error parsing evolution.json: {e}", file=sys.stderr)
        return False

    # 构建 Markdown 内容块
    evolution_section = []
    evolution_section.append("\n\n## User-Learned Best Practices & Constraints")
    evolution_section.append("\n> **Auto-Generated Section**: This section is maintained by `skill-evolution-manager`. Do not edit manually.")
    
    if data.get("preferences"):
        evolution_section.append("\n### User Preferences")
        for item in data["preferences"]:
            evolution_section.append(f"- {item}")
            
    if data.get("fixes"):
        evolution_section.append("\n### Known Fixes & Workarounds")
        for item in data["fixes"]:
            evolution_section.append(f"- {item}")

    if data.get("contexts"):
        evolution_section.append("\n### Usage Contexts")
        for item in data["contexts"]:
            evolution_section.append(f"- {item}")
            
    if data.get("custom_prompts"):
        evolution_section.append("\n### Custom Instruction Injection")
        evolution_section.append(f"\n{data['custom_prompts']}")
        
    evolution_block = "\n".join(evolution_section)

    # 读取原始 SKILL.md
    with open(skill_md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 使用正则查找并替换或追加
    # 匹配 "## User-Learned Best Practices..." 直到文件末尾
    pattern = r"(\n+## User-Learned Best Practices & Constraints.*$)"
    
    match = re.search(pattern, content, re.DOTALL)
    
    if match:
        # 替换已存在的章节
        print("Updating existing evolution section...", file=sys.stderr)
        new_content = content[:match.start()] + evolution_block
    else:
        # 追加到末尾
        print("Appending new evolution section...", file=sys.stderr)
        new_content = content.rstrip() + evolution_block

    # 写回文件
    with open(skill_md_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print(f"Successfully stitched evolution data into {skill_md_path}")
    return True


def main():
    """主入口函数"""
    if len(sys.argv) < 2:
        print("Usage: python smart_stitch.py <skill_dir>")
        print()
        print("Example:")
        print("  python smart_stitch.py ~/.cursor/skills/my-skill")
        sys.exit(1)
        
    target_dir = sys.argv[1]
    
    if not os.path.isdir(target_dir):
        print(f"Error: {target_dir} is not a valid directory", file=sys.stderr)
        sys.exit(1)
    
    success = stitch_skill(target_dir)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
