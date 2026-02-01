/**
 * Cross-platform utility functions for Claude Code hooks and scripts
 * Works on Windows, macOS, and Linux
 *
 * 跨平台工具函数，用于 Claude Code 钩子和脚本
 * 支持 Windows、macOS 和 Linux 系统
 */

const fs = require('fs');        // 文件系统模块，用于文件操作
const path = require('path');    // 路径模块，用于处理和转换文件路径
const os = require('os');        // 操作系统模块，用于获取系统信息
const { execSync, spawnSync } = require('child_process'); // 子进程模块，用于执行系统命令

// 平台检测常量
// Platform detection constants
const isWindows = process.platform === 'win32';  // 检测是否为 Windows 系统
const isMacOS = process.platform === 'darwin';   // 检测是否为 macOS 系统
const isLinux = process.platform === 'linux';    // 检测是否为 Linux 系统

/**
 * Get the user's home directory (cross-platform)
 * 获取用户主目录（跨平台）
 *
 * @returns {string} 用户主目录的绝对路径
 */
function getHomeDir() {
  return os.homedir();
}

/**
 * Get the Cursor config directory
 * 获取 Cursor 配置目录
 *
 * @returns {string} Cursor 配置目录的路径 (~/.cursor)
 */
function getCursorDir() {
  return path.join(getHomeDir(), '.cursor');
}

/**
 * Get the sessions directory
 * 获取会话目录
 *
 * @returns {string} 会话目录的路径 (~/.cursor/sessions)
 */
function getSessionsDir() {
  return path.join(getCursorDir(), 'sessions');
}

/**
 * Get the learned skills directory
 * 获取学习到的技能目录
 *
 * @returns {string} 学习技能目录的路径 (~/.cursor/skills/learned)
 */
function getLearnedSkillsDir() {
  return path.join(getCursorDir(), 'skills', 'learned');
}

/**
 * Get the temp directory (cross-platform)
 * 获取临时目录（跨平台）
 *
 * @returns {string} 系统临时目录的路径
 */
function getTempDir() {
  return os.tmpdir();
}

/**
 * Ensure a directory exists (create if not)
 * 确保目录存在（如果不存在则创建）
 *
 * @param {string} dirPath - 要检查/创建的目录路径
 * @returns {string} 目录路径（确保存在）
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    // 使用 recursive: true 递归创建父目录
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

/**
 * Get current date in YYYY-MM-DD format
 * 获取当前日期，格式为 YYYY-MM-DD
 *
 * @returns {string} 格式化的日期字符串，如 "2026-01-31"
 */
function getDateString() {
  const now = new Date();
  const year = now.getFullYear();                           // 获取年份
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 获取月份（加1因为从0开始），补齐两位
  const day = String(now.getDate()).padStart(2, '0');       // 获取日期，补齐两位
  return `${year}-${month}-${day}`;
}

/**
 * Get current time in HH:MM format
 * 获取当前时间，格式为 HH:MM
 *
 * @returns {string} 格式化的时间字符串，如 "14:30"
 */
function getTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');     // 获取小时，补齐两位
  const minutes = String(now.getMinutes()).padStart(2, '0');  // 获取分钟，补齐两位
  return `${hours}:${minutes}`;
}

/**
 * Get short session ID from CLAUDE_SESSION_ID environment variable
 * Returns the last 8 characters for uniqueness with brevity
 * 从 CLAUDE_SESSION_ID 环境变量获取简短会话 ID
 * 返回最后8个字符以保证唯一性并保持简洁
 *
 * @param {string} fallback - Fallback value if no session ID (default: 'default')
 *                          - 如果没有会话ID时的默认值（默认为 'default'）
 * @returns {string} 8位字符的会话ID或默认值
 */
function getSessionIdShort(fallback = 'default') {
  const sessionId = process.env.CLAUDE_SESSION_ID; // 从环境变量获取会话ID
  if (!sessionId || sessionId.length === 0) {
    return fallback; // 如果没有会话ID，返回默认值
  }
  return sessionId.slice(-8); // 返回最后8个字符
}

/**
 * Get current datetime in YYYY-MM-DD HH:MM:SS format
 * 获取当前日期时间，格式为 YYYY-MM-DD HH:MM:SS
 *
 * @returns {string} 格式化的日期时间字符串，如 "2026-01-31 14:30:25"
 */
function getDateTimeString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Find files matching a pattern in a directory (cross-platform alternative to find)
 * 在目录中查找匹配模式的文件（跨平台的 find 命令替代方案）
 *
 * @param {string} dir - Directory to search 要搜索的目录
 * @param {string} pattern - File pattern (e.g., "*.tmp", "*.md") 文件模式（如 "*.tmp", "*.md"）
 * @param {object} options - Options { maxAge: days, recursive: boolean } 选项 { maxAge: 天数, recursive: 是否递归 }
 * @returns {Array} 匹配文件的数组，每个元素包含 {path: 文件路径, mtime: 修改时间戳}
 */
function findFiles(dir, pattern, options = {}) {
  const { maxAge = null, recursive = false } = options; // 解构选项参数
  const results = []; // 存储结果的数组

  if (!fs.existsSync(dir)) {
    return results; // 如果目录不存在，返回空数组
  }

  // 将通配符模式转换为正则表达式
  const regexPattern = pattern
    .replace(/\./g, '\\.')    // 转义点号
    .replace(/\*/g, '.*')     // 将 * 转换为 .*
    .replace(/\?/g, '.');     // 将 ? 转换为 .
  const regex = new RegExp(`^${regexPattern}$`); // 创建匹配文件名的正则表达式

  // 递归搜索目录的内部函数
  function searchDir(currentDir) {
    try {
      // 使用 withFileTypes 选项获取目录项类型信息，提高性能
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name); // 构建完整路径

        if (entry.isFile() && regex.test(entry.name)) { // 如果是匹配模式的文件
          if (maxAge !== null) {
            const stats = fs.statSync(fullPath); // 获取文件状态
            const ageInDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24); // 计算文件年龄（天数）
            if (ageInDays <= maxAge) {
              results.push({ path: fullPath, mtime: stats.mtimeMs }); // 在年龄限制内的文件
            }
          } else {
            const stats = fs.statSync(fullPath);
            results.push({ path: fullPath, mtime: stats.mtimeMs }); // 所有匹配的文件
          }
        } else if (entry.isDirectory() && recursive) { // 如果是目录且需要递归搜索
          searchDir(fullPath); // 递归搜索子目录
        }
      }
    } catch (err) {
      // 忽略权限错误，静默跳过无法访问的目录
    }
  }

  searchDir(dir); // 开始搜索

  // 按修改时间排序（最新的排在前面）
  results.sort((a, b) => b.mtime - a.mtime);

  return results;
}

/**
 * Read JSON from stdin (for hook input)
 * 从标准输入读取 JSON（用于钩子输入）
 *
 * @returns {Promise<object>} 解析后的 JSON 对象，如果输入为空则返回空对象
 */
async function readStdinJson() {
  return new Promise((resolve, reject) => {
    let data = ''; // 存储读取的数据

    process.stdin.setEncoding('utf8'); // 设置输入编码为 UTF-8
    process.stdin.on('data', chunk => {
      data += chunk; // 累积数据块
    });

    process.stdin.on('end', () => {
      try {
        if (data.trim()) {
          resolve(JSON.parse(data)); // 解析 JSON 数据
        } else {
          resolve({}); // 输入为空时返回空对象
        }
      } catch (err) {
        reject(err); // JSON 解析错误时拒绝 Promise
      }
    });

    process.stdin.on('error', reject); // 处理输入错误
  });
}

/**
 * Log to stderr (visible to user in Claude Code)
 * 输出到标准错误（在 Claude Code 中对用户可见）
 *
 * @param {string} message - 要记录的消息
 */
function log(message) {
  console.error(message); // 使用 console.error 输出到 stderr
}

/**
 * Output to stdout (returned to Claude)
 * 输出到标准输出（返回给 Claude）
 *
 * @param {any} data - 要输出的数据，可以是对象或字符串
 */
function output(data) {
  if (typeof data === 'object') {
    console.log(JSON.stringify(data)); // 对象转换为 JSON 字符串
  } else {
    console.log(data); // 直接输出其他类型
  }
}

/**
 * Read a text file safely
 * 安全地读取文本文件
 *
 * @param {string} filePath - 要读取的文件路径
 * @returns {string|null} 文件内容，如果读取失败则返回 null
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8'); // 以 UTF-8 编码同步读取文件
  } catch {
    return null; // 静默处理错误，返回 null
  }
}

/**
 * Write a text file
 * 写入文本文件
 *
 * @param {string} filePath - 要写入的文件路径
 * @param {string} content - 要写入的内容
 */
function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath)); // 确保父目录存在
  fs.writeFileSync(filePath, content, 'utf8'); // 以 UTF-8 编码同步写入文件
}

/**
 * Append to a text file
 * 追加内容到文本文件
 *
 * @param {string} filePath - 要追加内容的文件路径
 * @param {string} content - 要追加的内容
 */
function appendFile(filePath, content) {
  ensureDir(path.dirname(filePath)); // 确保父目录存在
  fs.appendFileSync(filePath, content, 'utf8'); // 以 UTF-8 编码追加到文件末尾
}

/**
 * Check if a command exists in PATH
 * Uses execFileSync to prevent command injection
 * 检查命令是否存在于 PATH 中
 * 使用 execFileSync 防止命令注入攻击
 *
 * @param {string} cmd - 要检查的命令名
 * @returns {boolean} 如果命令存在则返回 true，否则返回 false
 */
function commandExists(cmd) {
  // 验证命令名 - 只允许字母数字、下划线、点和横线
  if (!/^[a-zA-Z0-9_.-]+$/.test(cmd)) {
    return false; // 命令名不合法，直接返回 false
  }

  try {
    if (isWindows) {
      // 在 Windows 上使用 'where' 命令查找可执行文件
      const result = spawnSync('where', [cmd], { stdio: 'pipe' });
      return result.status === 0; // 退出状态为 0 表示命令存在
    } else {
      // 在 Unix-like 系统上使用 'which' 命令查找可执行文件
      const result = spawnSync('which', [cmd], { stdio: 'pipe' });
      return result.status === 0; // 退出状态为 0 表示命令存在
    }
  } catch {
    return false; // 发生异常时返回 false
  }
}

/**
 * Run a command and return output
 * 运行命令并返回输出结果
 *
 * SECURITY NOTE: This function executes shell commands. Only use with
 * trusted, hardcoded commands. Never pass user-controlled input directly.
 * For user input, use spawnSync with argument arrays instead.
 *
 * 安全注意：此函数执行 shell 命令。只应使用受信任的硬编码命令。
 * 切勿直接传递用户控制的输入。对于用户输入，应使用 spawnSync 和参数数组。
 *
 * @param {string} cmd - Command to execute (should be trusted/hardcoded) 要执行的命令（应为受信任的硬编码命令）
 * @param {object} options - execSync options execSync 选项
 * @returns {object} 返回对象 {success: boolean, output: string}
 */
function runCommand(cmd, options = {}) {
  try {
    const result = execSync(cmd, {
      encoding: 'utf8',           // 输出编码为 UTF-8
      stdio: ['pipe', 'pipe', 'pipe'], // 所有标准流都设为管道
      ...options                  // 合并用户提供的选项
    });
    return { success: true, output: result.trim() }; // 执行成功，返回修剪后的输出
  } catch (err) {
    return { success: false, output: err.stderr || err.message }; // 执行失败，返回错误信息
  }
}

/**
 * Check if current directory is a git repository
 * 检查当前目录是否为 Git 仓库
 *
 * @returns {boolean} 如果是 Git 仓库则返回 true，否则返回 false
 */
function isGitRepo() {
  return runCommand('git rev-parse --git-dir').success; // 使用 git 命令检查是否存在 .git 目录
}

/**
 * Get git modified files
 * 获取 Git 中修改的文件
 *
 * @param {Array<string>} patterns - 可选的文件名模式数组，用于过滤结果
 * @returns {Array<string>} 修改的文件路径数组
 */
function getGitModifiedFiles(patterns = []) {
  if (!isGitRepo()) return []; // 如果不是 Git 仓库，返回空数组

  const result = runCommand('git diff --name-only HEAD'); // 获取相对于 HEAD 的修改文件
  if (!result.success) return []; // 如果命令执行失败，返回空数组

  let files = result.output.split('\n').filter(Boolean); // 按行分割并过滤空行

  if (patterns.length > 0) {
    // 如果提供了模式数组，则过滤文件列表
    files = files.filter(file => {
      return patterns.some(pattern => {
        const regex = new RegExp(pattern); // 将模式转换为正则表达式
        return regex.test(file); // 测试文件路径是否匹配模式
      });
    });
  }

  return files; // 返回过滤后的文件列表
}

/**
 * Replace text in a file (cross-platform sed alternative)
 * 在文件中替换文本（跨平台的 sed 命令替代方案）
 *
 * @param {string} filePath - 要修改的文件路径
 * @param {string|RegExp} search - 要搜索的文本或正则表达式
 * @param {string} replace - 替换为的文本
 * @returns {boolean} 如果替换成功则返回 true，否则返回 false
 */
function replaceInFile(filePath, search, replace) {
  const content = readFile(filePath); // 读取文件内容
  if (content === null) return false; // 如果读取失败，返回 false

  const newContent = content.replace(search, replace); // 执行替换
  writeFile(filePath, newContent); // 写回文件
  return true; // 返回成功
}

/**
 * Count occurrences of a pattern in a file
 * 统计文件中模式的出现次数
 *
 * @param {string} filePath - 要检查的文件路径
 * @param {string|RegExp} pattern - 要搜索的模式（字符串或正则表达式）
 * @returns {number} 模式在文件中出现的次数
 */
function countInFile(filePath, pattern) {
  const content = readFile(filePath); // 读取文件内容
  if (content === null) return 0; // 如果读取失败，返回 0

  // 如果 pattern 是正则表达式则直接使用，否则创建全局正则表达式
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'g');
  const matches = content.match(regex); // 查找所有匹配
  return matches ? matches.length : 0; // 返回匹配数量
}

/**
 * Search for pattern in file and return matching lines with line numbers
 * 在文件中搜索模式并返回匹配的行（包含行号）
 *
 * @param {string} filePath - 要搜索的文件路径
 * @param {string|RegExp} pattern - 要搜索的模式（字符串或正则表达式）
 * @returns {Array<{lineNumber: number, content: string}>} 匹配结果数组，每个元素包含行号和内容
 */
function grepFile(filePath, pattern) {
  const content = readFile(filePath); // 读取文件内容
  if (content === null) return []; // 如果读取失败，返回空数组

  // 如果 pattern 是正则表达式则直接使用，否则创建正则表达式
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  const lines = content.split('\n'); // 按行分割内容
  const results = []; // 存储匹配结果

  lines.forEach((line, index) => {
    if (regex.test(line)) {
      // 如果行匹配模式，添加到结果中（行号从1开始）
      results.push({ lineNumber: index + 1, content: line });
    }
  });

  return results; // 返回匹配结果
}

// 模块导出
// Module exports
module.exports = {
  // 平台信息 / Platform info
  isWindows,    // 是否为 Windows 系统
  isMacOS,      // 是否为 macOS 系统
  isLinux,      // 是否为 Linux 系统

  // 目录操作 / Directories
  getHomeDir,           // 获取用户主目录
  getCursorDir,         // 获取 Cursor 配置目录
  getSessionsDir,       // 获取会话目录
  getLearnedSkillsDir,  // 获取学习技能目录
  getTempDir,           // 获取临时目录
  ensureDir,            // 确保目录存在

  // 日期时间 / Date/Time
  getDateString,        // 获取日期字符串 (YYYY-MM-DD)
  getTimeString,        // 获取时间字符串 (HH:MM)
  getDateTimeString,    // 获取日期时间字符串 (YYYY-MM-DD HH:MM:SS)
  getSessionIdShort,    // 获取简短会话ID

  // 文件操作 / File operations
  findFiles,    // 查找匹配模式的文件
  readFile,     // 读取文件内容
  writeFile,    // 写入文件
  appendFile,   // 追加内容到文件
  replaceInFile,// 在文件中替换文本
  countInFile,  // 统计文件中模式的出现次数
  grepFile,     // 在文件中搜索模式并返回匹配行

  // 钩子输入输出 / Hook I/O
  readStdinJson,// 从标准输入读取 JSON
  log,          // 输出到标准错误（对用户可见）
  output,       // 输出到标准输出（返回给 Claude）

  // 系统操作 / System
  commandExists,      // 检查命令是否存在
  runCommand,         // 运行系统命令
  isGitRepo,          // 检查是否为 Git 仓库
  getGitModifiedFiles // 获取 Git 修改的文件
};
