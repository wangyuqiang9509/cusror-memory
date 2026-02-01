#!/usr/bin/env python3
"""
全量对齐工具 - 遍历所有 Skill 文件夹，将 evolution.json 经验重新缝合回 SKILL.md

适配 Cursor IDE 的多级 Skills 目录结构：
- 项目级: .cursor/skills/, .claude/skills/
- 用户级: ~/.cursor/skills/, ~/.claude/skills/
"""

import os
import sys
import subprocess
from pathlib import Path


def get_default_skills_directories():
    """
    获取 Cursor IDE 的默认 Skills 目录列表
    支持项目级和用户级目录
    """
    home = Path.home()
    
    # 用户级目录（全局）
    user_dirs = [
        home / ".cursor" / "skills",
        home / ".claude" / "skills",  # 兼容 Claude Code
    ]
    
    # 返回存在的目录
    return [str(d) for d in user_dirs if d.exists()]


def align_all(skills_root):
    """
    遍历指定目录下的所有 Skill，将 evolution.json 缝合回 SKILL.md
    """
    if not os.path.exists(skills_root):
        print(f"Error: {skills_root} not found")
        return 0

    stitch_script = os.path.join(os.path.dirname(__file__), "smart_stitch.py")
    
    if not os.path.exists(stitch_script):
        print(f"Error: smart_stitch.py not found at {stitch_script}")
        return 0
    
    count = 0
    for item in os.listdir(skills_root):
        skill_dir = os.path.join(skills_root, item)
        if not os.path.isdir(skill_dir):
            continue
            
        evolution_json = os.path.join(skill_dir, "evolution.json")
        if os.path.exists(evolution_json):
            print(f"Aligning {item}...")
            # 运行 smart_stitch 脚本
            result = subprocess.run(
                [sys.executable, stitch_script, skill_dir],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                count += 1
            else:
                print(f"  Warning: Failed to align {item}: {result.stderr}")
                
    return count


def main():
    """主入口函数"""
    if len(sys.argv) > 1:
        # 指定了目录，仅处理该目录
        skills_paths = [sys.argv[1]]
    else:
        # 自动检测所有 Cursor Skills 目录
        skills_paths = get_default_skills_directories()
        
        if not skills_paths:
            print("No skills directories found.")
            print("Default locations checked:")
            print("  - ~/.cursor/skills/")
            print("  - ~/.claude/skills/")
            print("\nUsage: python align_all.py [skills_root]")
            sys.exit(1)
    
    total_count = 0
    for path in skills_paths:
        print(f"\n=== Processing: {path} ===")
        count = align_all(path)
        total_count += count
        print(f"Aligned {count} skills in {path}")
    
    print(f"\n=== Finished. Total aligned: {total_count} skills ===")


if __name__ == "__main__":
    main()
