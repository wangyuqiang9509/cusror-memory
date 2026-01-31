/**
 * 包管理器检测和选择模块
 * Package Manager Detection and Selection
 *
 * 自动检测首选包管理器或让用户选择
 * Automatically detects the preferred package manager or lets user choose
 *
 * 支持的包管理器: npm, pnpm, yarn, bun
 * Supports: npm, pnpm, yarn, bun
 */

// Node.js 内置模块，用于文件系统操作
// Node.js built-in module for file system operations
const fs = require('fs');
// Node.js 内置模块，用于路径操作
// Node.js built-in module for path operations
const path = require('path');
// 从工具模块导入常用函数
// Import utility functions from utils module
const { commandExists, getClaudeDir, readFile, writeFile, log, runCommand } = require('./utils');

// 包管理器配置定义
// Package manager configuration definitions
// 定义了所有支持的包管理器的配置信息，包括锁文件、各种命令等
// Defines configuration for all supported package managers, including lock files and commands
const PACKAGE_MANAGERS = {
  npm: {
    name: 'npm',                    // 包管理器名称 / Package manager name
    lockFile: 'package-lock.json',  // 锁文件路径 / Lock file path
    installCmd: 'npm install',      // 安装依赖命令 / Install dependencies command
    runCmd: 'npm run',              // 运行脚本命令 / Run script command
    execCmd: 'npx',                 // 执行包二进制文件命令 / Execute package binary command
    testCmd: 'npm test',            // 运行测试命令 / Run test command
    buildCmd: 'npm run build',      // 构建项目命令 / Build project command
    devCmd: 'npm run dev'           // 开发模式命令 / Development mode command
  },
  pnpm: {
    name: 'pnpm',                   // 性能优化的包管理器 / Performance-optimized package manager
    lockFile: 'pnpm-lock.yaml',
    installCmd: 'pnpm install',
    runCmd: 'pnpm',                 // pnpm 直接运行脚本无需 run 前缀 / pnpm runs scripts directly without 'run' prefix
    execCmd: 'pnpm dlx',            // pnpm 的包执行器 / pnpm's package executor
    testCmd: 'pnpm test',
    buildCmd: 'pnpm build',         // pnpm 构建命令 / pnpm build command
    devCmd: 'pnpm dev'
  },
  yarn: {
    name: 'yarn',
    lockFile: 'yarn.lock',
    installCmd: 'yarn',             // yarn 安装默认就是 yarn / yarn install is default 'yarn'
    runCmd: 'yarn',
    execCmd: 'yarn dlx',            // yarn 的包执行器 / yarn's package executor
    testCmd: 'yarn test',
    buildCmd: 'yarn build',
    devCmd: 'yarn dev'
  },
  bun: {
    name: 'bun',                    // 快速的 JavaScript 运行时和包管理器 / Fast JavaScript runtime and package manager
    lockFile: 'bun.lockb',          // bun 使用二进制锁文件 / bun uses binary lock file
    installCmd: 'bun install',
    runCmd: 'bun run',
    execCmd: 'bunx',                // bun 的包执行器 / bun's package executor
    testCmd: 'bun test',
    buildCmd: 'bun run build',
    devCmd: 'bun run dev'
  }
};

// 包管理器检测优先级顺序
// Package manager detection priority order
// pnpm 优先级最高，因为它速度快且节省磁盘空间
// pnpm has highest priority due to speed and disk space efficiency
const DETECTION_PRIORITY = ['pnpm', 'bun', 'yarn', 'npm'];

// 获取全局配置文件路径
// Get global configuration file path
// 返回 ~/.claude/package-manager.json 的路径
// Returns path to ~/.claude/package-manager.json
function getConfigPath() {
  return path.join(getClaudeDir(), 'package-manager.json');
}

/**
 * 加载保存的包管理器配置
 * Load saved package manager configuration
 *
 * 从全局配置文件中读取用户的包管理器偏好设置
 * Reads user's package manager preferences from global config file
 *
 * @returns {object|null} 解析后的配置对象或 null（如果文件不存在或格式错误）
 * @returns {object|null} Parsed config object or null if file doesn't exist or is malformed
 */
function loadConfig() {
  const configPath = getConfigPath();
  const content = readFile(configPath);

  if (content) {
    try {
      return JSON.parse(content);
    } catch {
      // JSON 解析失败，返回 null
      // JSON parsing failed, return null
      return null;
    }
  }
  // 文件不存在或为空，返回 null
  // File doesn't exist or is empty, return null
  return null;
}

/**
 * 保存包管理器配置
 * Save package manager configuration
 *
 * 将配置对象保存到全局配置文件中
 * Saves configuration object to global config file
 *
 * @param {object} config - 要保存的配置对象
 * @param {object} config - Configuration object to save
 */
function saveConfig(config) {
  const configPath = getConfigPath();
  writeFile(configPath, JSON.stringify(config, null, 2));
}

/**
 * 从项目目录中的锁文件检测包管理器
 * Detect package manager from lock file in project directory
 *
 * 通过检查项目目录中是否存在特定的锁文件来确定使用的包管理器
 * Determines package manager by checking for specific lock files in project directory
 *
 * @param {string} projectDir - 项目目录路径，默认为当前工作目录
 * @param {string} projectDir - Project directory path, defaults to current working directory
 * @returns {string|null} 检测到的包管理器名称或 null
 * @returns {string|null} Detected package manager name or null
 */
function detectFromLockFile(projectDir = process.cwd()) {
  // 按照优先级顺序检查锁文件
  // Check lock files in priority order
  for (const pmName of DETECTION_PRIORITY) {
    const pm = PACKAGE_MANAGERS[pmName];
    const lockFilePath = path.join(projectDir, pm.lockFile);

    // 如果锁文件存在，返回对应的包管理器名称
    // If lock file exists, return the corresponding package manager name
    if (fs.existsSync(lockFilePath)) {
      return pmName;
    }
  }
  // 没有找到任何锁文件
  // No lock file found
  return null;
}

/**
 * 从 package.json 的 packageManager 字段检测包管理器
 * Detect package manager from package.json packageManager field
 *
 * 解析 package.json 中的 packageManager 字段来确定包管理器
 * Parses packageManager field in package.json to determine package manager
 *
 * @param {string} projectDir - 项目目录路径，默认为当前工作目录
 * @param {string} projectDir - Project directory path, defaults to current working directory
 * @returns {string|null} 检测到的包管理器名称或 null
 * @returns {string|null} Detected package manager name or null
 */
function detectFromPackageJson(projectDir = process.cwd()) {
  const packageJsonPath = path.join(projectDir, 'package.json');
  const content = readFile(packageJsonPath);

  if (content) {
    try {
      const pkg = JSON.parse(content);
      // 检查 packageManager 字段
      // Check packageManager field
      if (pkg.packageManager) {
        // 格式: "pnpm@8.6.0" 或 "pnpm"
        // Format: "pnpm@8.6.0" or just "pnpm"
        const pmName = pkg.packageManager.split('@')[0];
        // 验证是否为支持的包管理器
        // Verify it's a supported package manager
        if (PACKAGE_MANAGERS[pmName]) {
          return pmName;
        }
      }
    } catch {
      // package.json 格式无效，忽略错误
      // Invalid package.json format, ignore error
    }
  }
  return null;
}

/**
 * 获取系统中可用的包管理器列表
 * Get available package managers (installed on system)
 *
 * 检查系统中安装了哪些包管理器
 * Checks which package managers are installed on the system
 *
 * @returns {string[]} 可用的包管理器名称数组
 * @returns {string[]} Array of available package manager names
 */
function getAvailablePackageManagers() {
  const available = [];

  // 检查每个包管理器是否在系统 PATH 中可用
  // Check if each package manager is available in system PATH
  for (const pmName of Object.keys(PACKAGE_MANAGERS)) {
    if (commandExists(pmName)) {
      available.push(pmName);
    }
  }

  return available;
}

/**
 * 获取当前项目使用的包管理器
 * Get the package manager to use for current project
 *
 * 包管理器检测优先级（从高到低）:
 * Package manager detection priority (high to low):
 * 1. 环境变量 CLAUDE_PACKAGE_MANAGER / Environment variable CLAUDE_PACKAGE_MANAGER
 * 2. 项目特定配置（在 .claude/package-manager.json 中）/ Project-specific config (in .claude/package-manager.json)
 * 3. package.json packageManager 字段 / package.json packageManager field
 * 4. 锁文件检测 / Lock file detection
 * 5. 全局用户偏好（在 ~/.claude/package-manager.json 中）/ Global user preference (in ~/.claude/package-manager.json)
 * 6. 第一个可用的包管理器（按优先级）/ First available package manager (by priority)
 * 7. 默认使用 npm（Node.js 自带）/ Default to npm (comes with Node.js)
 *
 * @param {object} options - 配置选项 / Configuration options
 * @param {string} options.projectDir - 项目目录路径 / Project directory path
 * @param {string[]} options.fallbackOrder - 后备包管理器顺序 / Fallback package manager order
 * @returns {object} 包管理器信息对象 / Package manager info object
 * @returns {string} return.name - 包管理器名称 / Package manager name
 * @returns {object} return.config - 包管理器配置 / Package manager configuration
 * @returns {string} return.source - 检测来源 / Detection source
 */
function getPackageManager(options = {}) {
  // 解构选项参数，默认值：项目目录为当前工作目录，后备顺序为默认优先级
  // Destructure options with defaults: projectDir as cwd, fallbackOrder as default priority
  const { projectDir = process.cwd(), fallbackOrder = DETECTION_PRIORITY } = options;

  // 1. 检查环境变量（最高优先级）
  // 1. Check environment variable (highest priority)
  const envPm = process.env.CLAUDE_PACKAGE_MANAGER;
  if (envPm && PACKAGE_MANAGERS[envPm]) {
    return {
      name: envPm,
      config: PACKAGE_MANAGERS[envPm],
      source: 'environment'  // 来源：环境变量 / Source: environment variable
    };
  }

  // 2. 检查项目特定配置
  // 2. Check project-specific config
  const projectConfigPath = path.join(projectDir, '.claude', 'package-manager.json');
  const projectConfig = readFile(projectConfigPath);
  if (projectConfig) {
    try {
      const config = JSON.parse(projectConfig);
      if (config.packageManager && PACKAGE_MANAGERS[config.packageManager]) {
        return {
          name: config.packageManager,
          config: PACKAGE_MANAGERS[config.packageManager],
          source: 'project-config'  // 来源：项目配置 / Source: project config
        };
      }
    } catch {
      // 配置无效，忽略错误继续检测
      // Invalid config, ignore and continue detection
    }
  }

  // 3. 检查 package.json 中的 packageManager 字段
  // 3. Check packageManager field in package.json
  const fromPackageJson = detectFromPackageJson(projectDir);
  if (fromPackageJson) {
    return {
      name: fromPackageJson,
      config: PACKAGE_MANAGERS[fromPackageJson],
      source: 'package.json'  // 来源：package.json / Source: package.json
    };
  }

  // 4. 检查锁文件
  // 4. Check lock file
  const fromLockFile = detectFromLockFile(projectDir);
  if (fromLockFile) {
    return {
      name: fromLockFile,
      config: PACKAGE_MANAGERS[fromLockFile],
      source: 'lock-file'  // 来源：锁文件 / Source: lock file
    };
  }

  // 5. 检查全局用户偏好设置
  // 5. Check global user preference
  const globalConfig = loadConfig();
  if (globalConfig && globalConfig.packageManager && PACKAGE_MANAGERS[globalConfig.packageManager]) {
    return {
      name: globalConfig.packageManager,
      config: PACKAGE_MANAGERS[globalConfig.packageManager],
      source: 'global-config'  // 来源：全局配置 / Source: global config
    };
  }

  // 6. 使用第一个可用的包管理器（按优先级顺序）
  // 6. Use first available package manager (by priority order)
  const available = getAvailablePackageManagers();
  for (const pmName of fallbackOrder) {
    if (available.includes(pmName)) {
      return {
        name: pmName,
        config: PACKAGE_MANAGERS[pmName],
        source: 'fallback'  // 来源：后备选择 / Source: fallback
      };
    }
  }

  // 7. 默认使用 npm（Node.js 自带）
  // 7. Default to npm (always available with Node.js)
  return {
    name: 'npm',
    config: PACKAGE_MANAGERS.npm,
    source: 'default'  // 来源：默认 / Source: default
  };
}

/**
 * 设置用户首选的包管理器（全局设置）
 * Set user's preferred package manager (global setting)
 *
 * 将用户的包管理器偏好保存到全局配置文件中
 * Saves user's package manager preference to global config file
 *
 * @param {string} pmName - 包管理器名称（如 'pnpm', 'yarn' 等）
 * @param {string} pmName - Package manager name (e.g., 'pnpm', 'yarn')
 * @returns {object} 保存的配置对象
 * @returns {object} Saved configuration object
 * @throws {Error} 如果包管理器名称未知
 * @throws {Error} If package manager name is unknown
 */
function setPreferredPackageManager(pmName) {
  // 验证包管理器名称是否有效
  // Validate package manager name
  if (!PACKAGE_MANAGERS[pmName]) {
    throw new Error(`Unknown package manager: ${pmName}`);
  }

  // 加载现有配置或创建新配置
  // Load existing config or create new one
  const config = loadConfig() || {};
  config.packageManager = pmName;
  config.setAt = new Date().toISOString();  // 记录设置时间
  saveConfig(config);

  return config;
}

/**
 * 设置项目的首选包管理器
 * Set project's preferred package manager
 *
 * 将包管理器偏好保存到项目的本地配置文件中
 * Saves package manager preference to project's local config file
 *
 * @param {string} pmName - 包管理器名称（如 'pnpm', 'yarn' 等）
 * @param {string} pmName - Package manager name (e.g., 'pnpm', 'yarn')
 * @param {string} projectDir - 项目目录路径，默认为当前工作目录
 * @param {string} projectDir - Project directory path, defaults to current working directory
 * @returns {object} 保存的配置对象
 * @returns {object} Saved configuration object
 * @throws {Error} 如果包管理器名称未知
 * @throws {Error} If package manager name is unknown
 */
function setProjectPackageManager(pmName, projectDir = process.cwd()) {
  // 验证包管理器名称是否有效
  // Validate package manager name
  if (!PACKAGE_MANAGERS[pmName]) {
    throw new Error(`Unknown package manager: ${pmName}`);
  }

  // 构建项目配置目录和文件路径
  // Build project config directory and file path
  const configDir = path.join(projectDir, '.claude');
  const configPath = path.join(configDir, 'package-manager.json');

  // 创建配置对象
  // Create configuration object
  const config = {
    packageManager: pmName,
    setAt: new Date().toISOString()  // 记录设置时间
  };

  // 保存到项目配置文件
  // Save to project config file
  writeFile(configPath, JSON.stringify(config, null, 2));
  return config;
}

/**
 * 获取运行脚本的命令
 * Get the command to run a script
 *
 * 根据当前项目使用的包管理器生成对应的脚本运行命令
 * Generates the appropriate script running command based on current project's package manager
 *
 * @param {string} script - 脚本名称（如 "dev", "build", "test", "install"）
 * @param {string} script - Script name (e.g., "dev", "build", "test", "install")
 * @param {object} options - 配置选项（传递给 getPackageManager）
 * @param {object} options - Options passed to getPackageManager
 * @returns {string} 完整的命令字符串
 * @returns {string} Complete command string
 */
function getRunCommand(script, options = {}) {
  // 获取当前项目使用的包管理器
  // Get package manager for current project
  const pm = getPackageManager(options);

  // 根据脚本类型返回对应的命令
  // Return appropriate command based on script type
  switch (script) {
    case 'install':
      return pm.config.installCmd;  // 安装依赖命令 / Install dependencies command
    case 'test':
      return pm.config.testCmd;     // 运行测试命令 / Run test command
    case 'build':
      return pm.config.buildCmd;    // 构建命令 / Build command
    case 'dev':
      return pm.config.devCmd;      // 开发模式命令 / Development mode command
    default:
      // 自定义脚本，使用通用的 run 命令
      // Custom script, use generic run command
      return `${pm.config.runCmd} ${script}`;
  }
}

/**
 * 获取执行包二进制文件的命令
 * Get the command to execute a package binary
 *
 * 生成用于执行安装在 node_modules/.bin 中的可执行文件的命令
 * Generates command to execute binaries installed in node_modules/.bin
 *
 * @param {string} binary - 二进制文件名（如 "prettier", "eslint"）
 * @param {string} binary - Binary name (e.g., "prettier", "eslint")
 * @param {string} args - 要传递的参数字符串
 * @param {string} args - Arguments string to pass
 * @param {object} options - 配置选项（传递给 getPackageManager）
 * @param {object} options - Options passed to getPackageManager
 * @returns {string} 完整的命令字符串
 * @returns {string} Complete command string
 */
function getExecCommand(binary, args = '', options = {}) {
  // 获取当前项目使用的包管理器
  // Get package manager for current project
  const pm = getPackageManager(options);
  // 构建执行命令，格式为: execCmd binary [args]
  // Build exec command in format: execCmd binary [args]
  return `${pm.config.execCmd} ${binary}${args ? ' ' + args : ''}`;
}

/**
 * 生成包管理器选择的交互提示信息
 * Interactive prompt for package manager selection
 *
 * 返回一个消息字符串，用于向用户展示可用的包管理器和设置方法
 * Returns a message for Claude to show to user with available package managers and setup methods
 *
 * @returns {string} 格式化的提示消息
 * @returns {string} Formatted prompt message
 */
function getSelectionPrompt() {
  // 获取可用的包管理器列表
  // Get list of available package managers
  const available = getAvailablePackageManagers();
  // 获取当前使用的包管理器
  // Get currently used package manager
  const current = getPackageManager();

  let message = '[PackageManager] Available package managers:\n';

  // 列出所有可用的包管理器，标记当前使用的
  // List all available package managers, mark the current one
  for (const pmName of available) {
    const indicator = pmName === current.name ? ' (current)' : '';
    message += `  - ${pmName}${indicator}\n`;
  }

  // 提供设置包管理器的指导
  // Provide guidance on how to set package manager
  message += '\nTo set your preferred package manager:\n';
  message += '  - Global: Set CLAUDE_PACKAGE_MANAGER environment variable\n';
  message += '  - Or add to ~/.claude/package-manager.json: {"packageManager": "pnpm"}\n';
  message += '  - Or add to package.json: {"packageManager": "pnpm@8"}\n';

  return message;
}

/**
 * 生成匹配所有包管理器命令的正则表达式模式
 * Generate a regex pattern that matches commands for all package managers
 *
 * 用于模式匹配不同包管理器的相同操作命令
 * Used for pattern matching equivalent commands across different package managers
 *
 * @param {string} action - 动作模式（如 "run dev", "install", "test"）
 * @param {string} action - Action pattern (e.g., "run dev", "install", "test")
 * @returns {string} 正则表达式模式字符串
 * @returns {string} Regex pattern string
 */
function getCommandPattern(action) {
  const patterns = [];

  // 根据不同的动作生成对应的命令模式
  // Generate command patterns based on different actions
  if (action === 'dev') {
    // 开发服务器命令模式 / Development server command patterns
    patterns.push(
      'npm run dev',
      'pnpm( run)? dev',    // pnpm 可选 run / pnpm with optional 'run'
      'yarn dev',
      'bun run dev'
    );
  } else if (action === 'install') {
    // 安装依赖命令模式 / Install dependencies command patterns
    patterns.push(
      'npm install',
      'pnpm install',
      'yarn( install)?',    // yarn 可选 install / yarn with optional 'install'
      'bun install'
    );
  } else if (action === 'test') {
    // 测试命令模式 / Test command patterns
    patterns.push(
      'npm test',
      'pnpm test',
      'yarn test',
      'bun test'
    );
  } else if (action === 'build') {
    // 构建命令模式 / Build command patterns
    patterns.push(
      'npm run build',
      'pnpm( run)? build',  // pnpm 可选 run / pnpm with optional 'run'
      'yarn build',
      'bun run build'
    );
  } else {
    // 通用脚本运行命令模式 / Generic run command patterns
    patterns.push(
      `npm run ${action}`,
      `pnpm( run)? ${action}`,  // pnpm 可选 run / pnpm with optional 'run'
      `yarn ${action}`,
      `bun run ${action}`
    );
  }

  // 将所有模式用括号和管道符连接，形成正则表达式
  // Join all patterns with parentheses and pipes to form regex
  return `(${patterns.join('|')})`;
}

// 模块导出
// Module exports
// 导出所有公共函数和常量，供其他模块使用
// Export all public functions and constants for use by other modules
module.exports = {
  PACKAGE_MANAGERS,              // 包管理器配置常量 / Package manager configurations constant
  DETECTION_PRIORITY,            // 检测优先级常量 / Detection priority constant
  getPackageManager,             // 获取包管理器主函数 / Main function to get package manager
  setPreferredPackageManager,    // 设置全局偏好包管理器 / Set global preferred package manager
  setProjectPackageManager,      // 设置项目特定包管理器 / Set project-specific package manager
  getAvailablePackageManagers,   // 获取可用包管理器列表 / Get available package managers list
  detectFromLockFile,            // 从锁文件检测包管理器 / Detect from lock file
  detectFromPackageJson,         // 从 package.json 检测包管理器 / Detect from package.json
  getRunCommand,                 // 获取运行脚本命令 / Get run script command
  getExecCommand,                // 获取执行二进制文件命令 / Get execute binary command
  getSelectionPrompt,            // 获取选择提示信息 / Get selection prompt message
  getCommandPattern              // 获取命令模式正则表达式 / Get command pattern regex
};
