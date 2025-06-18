#!/usr/bin/env node

/**
 * Memento Commander - メインプロセス
 * 堅牢性を最優先に設計されたCommander実装
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');
const { EventEmitter } = require('events');

// 設定とパス
const PROJECT_ROOT = process.cwd();
const MEMENTO_DIR = path.join(PROJECT_ROOT, '.memento');
const MEMORY_DIR = path.join(MEMENTO_DIR, 'memory');
const TASKS_DIR = path.join(MEMENTO_DIR, 'tasks');
const LOGS_DIR = path.join(MEMENTO_DIR, 'logs');
const SYSTEM_DIR = path.join(MEMENTO_DIR, 'system');

// エラーレベル定義
const LogLevel = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  FATAL: 'FATAL'
};

class Commander extends EventEmitter {
  constructor() {
    super();
    this.config = null;
    this.claudeProcess = null;
    this.workers = new Map();
    this.isRunning = false;
    this.memoryBank = null;
  }

  /**
   * システム初期化
   */
  async initialize() {
    try {
      await this.log(LogLevel.INFO, 'Commander初期化開始');
      
      // ディレクトリ構造の作成
      await this.ensureDirectoryStructure();
      
      // 設定ファイルの読み込み
      await this.loadConfig();
      
      // Memory Bankの初期化
      await this.initializeMemoryBank();
      
      // ステータスファイルの初期化
      await this.initializeStatus();
      
      await this.log(LogLevel.INFO, 'Commander初期化完了');
      return true;
    } catch (error) {
      await this.log(LogLevel.FATAL, `初期化エラー: ${error.message}`);
      throw error;
    }
  }

  /**
   * ディレクトリ構造の確認と作成
   */
  async ensureDirectoryStructure() {
    const directories = [
      MEMENTO_DIR,
      MEMORY_DIR,
      path.join(MEMORY_DIR, 'core'),
      path.join(MEMORY_DIR, 'context'),
      path.join(MEMORY_DIR, 'commands'),
      TASKS_DIR,
      path.join(TASKS_DIR, 'pending'),
      path.join(TASKS_DIR, 'processing'),
      path.join(TASKS_DIR, 'completed'),
      LOGS_DIR,
      SYSTEM_DIR
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * 設定ファイルの読み込み
   */
  async loadConfig() {
    const configPath = path.join(SYSTEM_DIR, 'config.json');
    
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      this.config = JSON.parse(configData);
    } catch (error) {
      // デフォルト設定
      this.config = {
        maxWorkers: 3,
        workerTimeout: 300000, // 5分
        retryAttempts: 3,
        logLevel: 'INFO',
        autoBackup: true,
        backupInterval: 'daily'
      };
      
      // 設定ファイルの作成
      await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
      await this.log(LogLevel.INFO, 'デフォルト設定ファイルを作成しました');
    }
  }

  /**
   * Memory Bank初期化
   */
  async initializeMemoryBank() {
    // 基本的なMemory Bankファイルの作成
    const coreFiles = {
      'current.md': '# 現在のタスク\n\n*まだタスクはありません*',
      'next.md': '# 次のステップ\n\n*次のステップは未定義です*',
      'overview.md': '# プロジェクト概要\n\n*プロジェクトの概要を記入してください*'
    };

    const contextFiles = {
      'tech.md': '# 技術的決定事項\n\n*技術的な決定事項を記録します*',
      'history.md': '# 開発履歴\n\n*重要な決定や変更を記録します*'
    };

    // ファイルが存在しない場合のみ作成
    for (const [filename, content] of Object.entries(coreFiles)) {
      const filepath = path.join(MEMORY_DIR, 'core', filename);
      try {
        await fs.access(filepath);
      } catch {
        await fs.writeFile(filepath, content);
      }
    }

    for (const [filename, content] of Object.entries(contextFiles)) {
      const filepath = path.join(MEMORY_DIR, 'context', filename);
      try {
        await fs.access(filepath);
      } catch {
        await fs.writeFile(filepath, content);
      }
    }
  }

  /**
   * ステータスファイルの初期化
   */
  async initializeStatus() {
    const statusPath = path.join(SYSTEM_DIR, 'status.json');
    const status = {
      commander: {
        pid: process.pid,
        startTime: new Date().toISOString(),
        status: 'initializing'
      },
      workers: {},
      lastUpdate: new Date().toISOString()
    };
    
    await fs.writeFile(statusPath, JSON.stringify(status, null, 2));
  }

  /**
   * ログ記録
   */
  async log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    // コンソール出力
    const colorCode = {
      INFO: '\x1b[36m',   // シアン
      WARN: '\x1b[33m',   // 黄色
      ERROR: '\x1b[31m',  // 赤
      FATAL: '\x1b[35m'   // マゼンタ
    };
    
    console.log(`${colorCode[level]}[${timestamp}] ${level}: ${message}\x1b[0m`);
    
    // ファイル出力
    const logFile = path.join(LOGS_DIR, 'commander.log');
    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      await fs.appendFile(logFile, logLine);
    } catch (error) {
      console.error('ログファイルへの書き込みエラー:', error);
    }
  }

  /**
   * Commanderメインプロセスの起動
   */
  async start() {
    try {
      await this.log(LogLevel.INFO, 'Commanderを起動しています...');
      this.isRunning = true;
      
      // ClaudeCode CLIを起動
      await this.startClaudeCLI();
      
      // Worker監視を開始
      this.startWorkerMonitoring();
      
      // タスク監視を開始
      this.startTaskMonitoring();
      
      await this.updateStatus('running');
      await this.log(LogLevel.INFO, 'Commander起動完了');
      
    } catch (error) {
      await this.log(LogLevel.FATAL, `起動エラー: ${error.message}`);
      throw error;
    }
  }

  /**
   * ClaudeCode CLIの起動
   */
  async startClaudeCLI() {
    return new Promise((resolve, reject) => {
      this.claudeProcess = spawn('claude', [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, MEMENTO_MODE: 'true' }
      });

      this.claudeProcess.on('error', (error) => {
        this.log(LogLevel.ERROR, `Claude CLIエラー: ${error.message}`);
        reject(error);
      });

      this.claudeProcess.on('exit', (code) => {
        this.log(LogLevel.WARN, `Claude CLIが終了しました: ${code}`);
        if (this.isRunning) {
          // 自動再起動
          setTimeout(() => this.startClaudeCLI(), 5000);
        }
      });

      // 出力の処理
      this.claudeProcess.stdout.on('data', (data) => {
        this.handleClaudeOutput(data.toString());
      });

      this.claudeProcess.stderr.on('data', (data) => {
        this.log(LogLevel.ERROR, `Claude CLI stderr: ${data.toString()}`);
      });

      // 初期化完了を待つ
      setTimeout(() => resolve(), 3000);
    });
  }

  /**
   * Claude出力の処理
   */
  async handleClaudeOutput(output) {
    // Memory Bank更新の検出
    if (output.includes('/memory update')) {
      await this.updateMemoryBank();
    }
    
    // タスク作成の検出
    if (output.includes('TASK:')) {
      const taskMatch = output.match(/TASK:\s*(.+)/);
      if (taskMatch) {
        await this.createTask(taskMatch[1]);
      }
    }
  }

  /**
   * タスクの作成
   */
  async createTask(taskDescription) {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const taskFile = path.join(TASKS_DIR, 'pending', `${taskId}.json`);
    
    const task = {
      id: taskId,
      description: taskDescription,
      createdAt: new Date().toISOString(),
      status: 'pending',
      memoryContext: await this.getMemoryContext()
    };
    
    await fs.writeFile(taskFile, JSON.stringify(task, null, 2));
    await this.log(LogLevel.INFO, `新しいタスクを作成: ${taskId}`);
    
    // Workerを起動
    await this.startWorker(taskId);
  }

  /**
   * Memory Contextの取得
   */
  async getMemoryContext() {
    const context = {};
    
    // Core memoryの読み込み
    const coreFiles = ['current.md', 'next.md', 'overview.md'];
    for (const file of coreFiles) {
      const filepath = path.join(MEMORY_DIR, 'core', file);
      try {
        context[file] = await fs.readFile(filepath, 'utf-8');
      } catch (error) {
        await this.log(LogLevel.WARN, `Memory読み込みエラー: ${file}`);
      }
    }
    
    return context;
  }

  /**
   * Workerの起動
   */
  async startWorker(taskId) {
    if (this.workers.size >= this.config.maxWorkers) {
      await this.log(LogLevel.WARN, 'Worker数が上限に達しています');
      return;
    }
    
    const workerId = `worker_${Date.now()}`;
    const workerLog = path.join(LOGS_DIR, `${workerId}.log`);
    
    const worker = spawn('node', [path.join(SYSTEM_DIR, 'worker-manager.js'), taskId], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        WORKER_ID: workerId,
        TASK_ID: taskId,
        WORKER_LOG: workerLog
      }
    });
    
    worker.stdout.on('data', (data) => {
      this.log(LogLevel.INFO, `[${workerId}] ${data.toString().trim()}`);
    });
    
    worker.stderr.on('data', (data) => {
      this.log(LogLevel.ERROR, `[${workerId}] ${data.toString().trim()}`);
    });
    
    worker.on('exit', (code) => {
      this.log(LogLevel.INFO, `Worker ${workerId} 終了: ${code}`);
      this.workers.delete(workerId);
    });
    
    this.workers.set(workerId, { process: worker, taskId, startTime: Date.now() });
    await this.log(LogLevel.INFO, `Worker ${workerId} を起動しました`);
  }

  /**
   * Worker監視
   */
  startWorkerMonitoring() {
    setInterval(async () => {
      for (const [workerId, workerInfo] of this.workers.entries()) {
        const runtime = Date.now() - workerInfo.startTime;
        if (runtime > this.config.workerTimeout) {
          await this.log(LogLevel.WARN, `Worker ${workerId} がタイムアウトしました`);
          workerInfo.process.kill('SIGTERM');
          this.workers.delete(workerId);
        }
      }
    }, 10000); // 10秒ごと
  }

  /**
   * タスク監視
   */
  startTaskMonitoring() {
    setInterval(async () => {
      // 完了タスクの処理
      const completedDir = path.join(TASKS_DIR, 'completed');
      const completedFiles = await fs.readdir(completedDir);
      
      for (const file of completedFiles) {
        if (file.endsWith('.json')) {
          const filepath = path.join(completedDir, file);
          const task = JSON.parse(await fs.readFile(filepath, 'utf-8'));
          
          if (!task.processed) {
            await this.processCompletedTask(task);
            task.processed = true;
            await fs.writeFile(filepath, JSON.stringify(task, null, 2));
          }
        }
      }
    }, 5000); // 5秒ごと
  }

  /**
   * 完了タスクの処理
   */
  async processCompletedTask(task) {
    await this.log(LogLevel.INFO, `タスク ${task.id} の結果を処理中`);
    
    // Memory Bankの更新
    if (task.result && task.result.memoryUpdates) {
      await this.applyMemoryUpdates(task.result.memoryUpdates);
    }
    
    // Commanderへのフィードバック
    if (this.claudeProcess && this.claudeProcess.stdin) {
      const feedback = `タスク完了: ${task.description}\n結果: ${task.result.summary || '成功'}\n`;
      this.claudeProcess.stdin.write(feedback);
    }
  }

  /**
   * Memory更新の適用
   */
  async applyMemoryUpdates(updates) {
    for (const [category, files] of Object.entries(updates)) {
      for (const [filename, content] of Object.entries(files)) {
        const filepath = path.join(MEMORY_DIR, category, filename);
        await fs.writeFile(filepath, content);
        await this.log(LogLevel.INFO, `Memory更新: ${category}/${filename}`);
      }
    }
  }

  /**
   * ステータス更新
   */
  async updateStatus(status) {
    const statusPath = path.join(SYSTEM_DIR, 'status.json');
    const currentStatus = JSON.parse(await fs.readFile(statusPath, 'utf-8'));
    
    currentStatus.commander.status = status;
    currentStatus.lastUpdate = new Date().toISOString();
    currentStatus.workers = {};
    
    for (const [workerId, workerInfo] of this.workers.entries()) {
      currentStatus.workers[workerId] = {
        taskId: workerInfo.taskId,
        startTime: new Date(workerInfo.startTime).toISOString()
      };
    }
    
    await fs.writeFile(statusPath, JSON.stringify(currentStatus, null, 2));
  }

  /**
   * 安全な停止
   */
  async stop() {
    await this.log(LogLevel.INFO, 'Commanderを停止しています...');
    this.isRunning = false;
    
    // Workerの停止
    for (const [workerId, workerInfo] of this.workers.entries()) {
      await this.log(LogLevel.INFO, `Worker ${workerId} を停止中`);
      workerInfo.process.kill('SIGTERM');
    }
    
    // ClaudeCode CLIの停止
    if (this.claudeProcess) {
      this.claudeProcess.kill('SIGTERM');
    }
    
    await this.updateStatus('stopped');
    await this.log(LogLevel.INFO, 'Commander停止完了');
  }
}

// メイン実行
async function main() {
  const commander = new Commander();
  
  try {
    await commander.initialize();
    await commander.start();
    
    // シグナルハンドリング
    process.on('SIGINT', async () => {
      await commander.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await commander.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// エクスポート（テスト用）
module.exports = Commander;

// 直接実行の場合
if (require.main === module) {
  main();
}