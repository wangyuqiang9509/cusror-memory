#!/usr/bin/env node
/**
 * 包管理器设置脚本 / Package Manager Setup Script
 *
 * 交互式脚本，用于配置首选的包管理器。
 * 可以直接运行或通过 /setup-pm 命令运行。
 *
 * Interactive script to configure preferred package manager.
 * Can be run directly or via the /setup-pm command.
 *
 * 使用方法 / Usage:
 *   node scripts/setup-package-manager.js [pm-name]          # 设置全局包管理器偏好
 *   node scripts/setup-package-manager.js --detect          # 检测并显示当前包管理器
 *   node scripts/setup-package-manager.js --global pnpm    # 设置全局偏好为 pnpm
 *   node scripts/setup-package-manager.js --project bun     # 设置项目偏好为 bun
 */

// 导入包管理器相关的工具函数 / Import package manager utility functions
const {
  PACKAGE_MANAGERS,              // 支持的包管理器配置对象 / Supported package managers configuration object
  getPackageManager,             // 获取当前使用的包管理器 / Get currently used package manager
  setPreferredPackageManager,    // 设置全局首选包管理器 / Set global preferred package manager
  setProjectPackageManager,      // 设置项目级包管理器 / Set project-level package manager
  getAvailablePackageManagers,   // 获取系统中可用的包管理器 / Get available package managers on system
  detectFromLockFile,           // 从锁定文件检测包管理器 / Detect package manager from lock file
  detectFromPackageJson,        // 从 package.json 检测包管理器 / Detect package manager from package.json
  getSelectionPrompt            // 获取选择提示 / Get selection prompt
} = require('./lib/package-manager');

// 导入日志工具函数 / Import logging utility function
const { log } = require('./lib/utils');

/**
 * 显示帮助信息 / Display help information
 *
 * 输出脚本的使用说明，包括所有可用选项和示例
 * Output script usage instructions including all available options and examples
 */
function showHelp() {
  console.log(`
Claude Code 的包管理器设置工具 / Package Manager Setup for Claude Code

使用方法 / Usage:
  node scripts/setup-package-manager.js [选项] [包管理器名称]

选项 / Options:
  --detect        检测并显示当前使用的包管理器 / Detect and show current package manager
  --global <pm>   设置全局偏好 (保存到 ~/.claude/package-manager.json) / Set global preference (saves to ~/.claude/package-manager.json)
  --project <pm>  设置项目偏好 (保存到 .claude/package-manager.json) / Set project preference (saves to .claude/package-manager.json)
  --list          列出所有可用的包管理器 / List available package managers
  --help          显示此帮助信息 / Show this help message

支持的包管理器 / Package Managers:
  npm             Node 包管理器 (Node.js 默认) / Node Package Manager (default with Node.js)
  pnpm            快速、磁盘空间高效的包管理器 / Fast, disk space efficient package manager
  yarn            经典的 Yarn 包管理器 / Classic Yarn package manager
  bun             全能 JavaScript 运行时和工具包 / All-in-one JavaScript runtime & toolkit

示例 / Examples:
  # 检测当前包管理器 / Detect current package manager
  node scripts/setup-package-manager.js --detect

  # 将 pnpm 设置为全局偏好 / Set pnpm as global preference
  node scripts/setup-package-manager.js --global pnpm

  # 为当前项目设置 bun / Set bun for current project
  node scripts/setup-package-manager.js --project bun

  # 列出可用包管理器 / List available package managers
  node scripts/setup-package-manager.js --list
`);
}

/**
 * 检测并显示包管理器信息 / Detect and display package manager information
 *
 * 综合检测当前项目和系统的包管理器状态，包括：
 * - 当前使用的包管理器及其来源
 * - 从不同来源检测到的包管理器
 * - 系统上可用的包管理器
 * - 当前包管理器的常用命令
 *
 * Comprehensively detect current project and system package manager status, including:
 * - Currently used package manager and its source
 * - Package managers detected from different sources
 * - Available package managers on the system
 * - Common commands for current package manager
 */
function detectAndShow() {
  // 获取当前使用的包管理器信息 / Get current package manager information
  const pm = getPackageManager();

  // 获取系统中所有可用的包管理器 / Get all available package managers on the system
  const available = getAvailablePackageManagers();

  // 从锁定文件检测包管理器 / Detect package manager from lock file
  const fromLock = detectFromLockFile();

  // 从 package.json 文件检测包管理器 / Detect package manager from package.json file
  const fromPkg = detectFromPackageJson();

  // 输出检测结果标题 / Output detection results title
  console.log('\n=== 包管理器检测结果 / Package Manager Detection ===\n');

  // 显示当前选择 / Display current selection
  console.log('当前选择 / Current selection:');
  console.log(`  包管理器 / Package Manager: ${pm.name}`);
  console.log(`  来源 / Source: ${pm.source}`);
  console.log('');

  // 显示检测结果 / Display detection results
  console.log('检测结果 / Detection results:');
  console.log(`  从 package.json: ${fromPkg || '未指定 / not specified'}`);
  console.log(`  从锁定文件: ${fromLock || '未找到 / not found'}`);
  console.log(`  环境变量: ${process.env.CLAUDE_PACKAGE_MANAGER || '未设置 / not set'}`);
  console.log('');

  // 显示可用包管理器列表 / Display available package managers list
  console.log('可用包管理器 / Available package managers:');
  for (const pmName of Object.keys(PACKAGE_MANAGERS)) {
    // 检查是否已安装 / Check if installed
    const installed = available.includes(pmName);
    // 显示安装状态指示器 / Display installation status indicator
    const indicator = installed ? '✓' : '✗';
    // 标记当前使用的包管理器 / Mark currently used package manager
    const current = pmName === pm.name ? ' (当前 / current)' : '';
    console.log(`  ${indicator} ${pmName}${current}`);
  }

  console.log('');
  console.log('常用命令 / Commands:');
  console.log(`  安装依赖 / Install: ${pm.config.installCmd}`);
  console.log(`  运行脚本 / Run script: ${pm.config.runCmd} [脚本名称 / script-name]`);
  console.log(`  执行二进制 / Execute binary: ${pm.config.execCmd} [二进制名称 / binary-name]`);
  console.log('');
}

/**
 * 列出所有可用的包管理器 / List all available package managers
 *
 * 显示每个包管理器的详细信息，包括：
 * - 是否已安装在系统上
 * - 对应的锁定文件名
 * - 安装和运行命令
 * - 当前使用的标记
 *
 * Display detailed information for each package manager, including:
 * - Whether it's installed on the system
 * - Corresponding lock file name
 * - Install and run commands
 * - Current usage marker
 */
function listAvailable() {
  // 获取可用包管理器列表 / Get available package managers list
  const available = getAvailablePackageManagers();

  // 获取当前使用的包管理器 / Get currently used package manager
  const pm = getPackageManager();

  console.log('\n可用包管理器 / Available Package Managers:\n');

  // 遍历所有支持的包管理器 / Iterate through all supported package managers
  for (const pmName of Object.keys(PACKAGE_MANAGERS)) {
    // 获取包管理器配置 / Get package manager configuration
    const config = PACKAGE_MANAGERS[pmName];

    // 检查是否已安装 / Check if installed
    const installed = available.includes(pmName);

    // 标记当前使用的包管理器 / Mark currently used package manager
    const current = pmName === pm.name ? ' (当前 / current)' : '';

    // 输出包管理器信息 / Output package manager information
    console.log(`${pmName}${current}`);
    console.log(`  已安装 / Installed: ${installed ? '是 / Yes' : '否 / No'}`);
    console.log(`  锁定文件 / Lock file: ${config.lockFile}`);
    console.log(`  安装命令 / Install: ${config.installCmd}`);
    console.log(`  运行命令 / Run: ${config.runCmd}`);
    console.log('');
  }
}

/**
 * 设置全局包管理器偏好 / Set global package manager preference
 *
 * 将指定的包管理器设置为全局默认偏好，保存到用户配置中。
 * Set the specified package manager as the global default preference, saved to user configuration.
 *
 * @param {string} pmName - 包管理器名称 / Package manager name
 */
function setGlobal(pmName) {
  // 验证包管理器名称是否有效 / Validate if package manager name is valid
  if (!PACKAGE_MANAGERS[pmName]) {
    console.error(`错误 / Error: 未知的包管理器 "${pmName}"`);
    console.error(`可用选项 / Available: ${Object.keys(PACKAGE_MANAGERS).join(', ')}`);
    process.exit(1);
  }

  // 检查包管理器是否已安装 / Check if package manager is installed
  const available = getAvailablePackageManagers();
  if (!available.includes(pmName)) {
    console.warn(`警告 / Warning: ${pmName} 未在您的系统上安装`);
  }

  try {
    // 设置全局首选包管理器 / Set global preferred package manager
    setPreferredPackageManager(pmName);
    console.log(`\n✓ 全局偏好已设置为: ${pmName}`);
    console.log('  保存位置: ~/.claude/package-manager.json');
    console.log('');
  } catch (err) {
    console.error(`错误 / Error: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 设置项目级包管理器偏好 / Set project-level package manager preference
 *
 * 为当前项目设置特定的包管理器偏好，保存到项目配置中。
 * Set a specific package manager preference for the current project, saved to project configuration.
 *
 * @param {string} pmName - 包管理器名称 / Package manager name
 */
function setProject(pmName) {
  // 验证包管理器名称是否有效 / Validate if package manager name is valid
  if (!PACKAGE_MANAGERS[pmName]) {
    console.error(`错误 / Error: 未知的包管理器 "${pmName}"`);
    console.error(`可用选项 / Available: ${Object.keys(PACKAGE_MANAGERS).join(', ')}`);
    process.exit(1);
  }

  try {
    // 设置项目级包管理器 / Set project-level package manager
    setProjectPackageManager(pmName);
    console.log(`\n✓ 项目偏好已设置为: ${pmName}`);
    console.log('  保存位置: .claude/package-manager.json');
    console.log('');
  } catch (err) {
    console.error(`错误 / Error: ${err.message}`);
    process.exit(1);
  }
}

// 主程序入口 / Main program entry point
// 获取命令行参数（去掉前两个参数：node 和脚本路径）/ Get command line arguments (remove first two: node and script path)
const args = process.argv.slice(2);

// 如果没有参数或包含帮助选项，显示帮助信息 / If no arguments or help options included, show help information
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// 如果包含检测选项，显示包管理器检测结果 / If detect option included, show package manager detection results
if (args.includes('--detect')) {
  detectAndShow();
  process.exit(0);
}

// 如果包含列表选项，显示所有可用包管理器 / If list option included, show all available package managers
if (args.includes('--list')) {
  listAvailable();
  process.exit(0);
}

// 处理全局设置选项 / Handle global setting option
const globalIdx = args.indexOf('--global');
if (globalIdx !== -1) {
  // 获取全局选项后的包管理器名称 / Get package manager name after global option
  const pmName = args[globalIdx + 1];
  if (!pmName) {
    console.error('错误 / Error: --global 选项需要指定包管理器名称');
    process.exit(1);
  }
  setGlobal(pmName);
  process.exit(0);
}

// 处理项目设置选项 / Handle project setting option
const projectIdx = args.indexOf('--project');
if (projectIdx !== -1) {
  // 获取项目选项后的包管理器名称 / Get package manager name after project option
  const pmName = args[projectIdx + 1];
  if (!pmName) {
    console.error('错误 / Error: --project 选项需要指定包管理器名称');
    process.exit(1);
  }
  setProject(pmName);
  process.exit(0);
}

// 如果只提供了包管理器名称，则设置为全局偏好 / If only package manager name provided, set as global preference
const pmName = args[0];
if (PACKAGE_MANAGERS[pmName]) {
  setGlobal(pmName);
} else {
  // 无效的选项或包管理器名称 / Invalid option or package manager name
  console.error(`错误 / Error: 未知选项或包管理器 "${pmName}"`);
  showHelp();
  process.exit(1);
}
