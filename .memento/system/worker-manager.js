#!/usr/bin/env node

/**
 * Worker Manager - Memento Workerプロセス管理
 * タスクを受け取り、ClaudeCodeで自動実行する
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// 環境変数から設定を取得
const WORKER_ID = process.env.WORKER_ID || 'worker_unknown';
const TASK_ID = process.argv[2] || process.env.TASK_ID;
const PROJECT_ROOT = process.cwd();
const MEMENTO_DIR = path.join(PROJECT_ROOT, '.memento');
const TASKS_DIR = path.join(MEMENTO_DIR, 'tasks');
const LOGS_DIR = path.join(MEMENTO_DIR, 'logs');

// ログレベル定義
const LogLevel = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  FATAL: 'FATAL'
};

class WorkerManager {
  constructor(taskId) {
    this.taskId = taskId;
    this.workerId = WORKER_ID;
    this.claudeProcess = null;
    this.task = null;
    this.startTime = Date.now();
    this.logFile = path.join(LOGS_DIR, `${this.workerId}.log`);
  }

  /**
   * ログ記録
   */
  async log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      workerId: this.workerId,
      taskId: this.taskId,
      level,
      message,
      data
    };

    // コンソール出力（Commanderへ）
    console.log(`[${level}] ${message}`);
    
    // ファイル出力
    const logLine = JSON.stringify(logEntry) + '\n';
    try {
      await fs.appendFile(this.logFile, logLine);
    } catch (error) {
      console.error('ログファイルエラー:', error);
    }
  }

  /**
   * Worker実行開始
   */
  async execute() {
    try {
      await this.log(LogLevel.INFO, 'Worker実行開始');
      
      // タスクファイルの読み込み
      await this.loadTask();
      
      // タスクを処理中に移動
      await this.moveTaskToProcessing();
      
      // 指示書の生成
      const instruction = await this.generateInstruction();
      
      // ClaudeCodeで実行
      const result = await this.executeWithClaude(instruction);
      
      // 結果の保存
      await this.saveResult(result);
      
      // タスクを完了に移動
      await this.moveTaskToCompleted();
      
      await this.log(LogLevel.INFO, 'Worker実行完了');
      
    } catch (error) {
      await this.handleError(error);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * タスクファイルの読み込み
   */
  async loadTask() {
    const taskPath = path.join(TASKS_DIR, 'pending', `${this.taskId}.json`);
    
    try {
      const taskData = await fs.readFile(taskPath, 'utf-8');
      this.task = JSON.parse(taskData);
      await this.log(LogLevel.INFO, 'タスクを読み込みました', { taskId: this.task.id });
    } catch (error) {
      throw new Error(`タスク読み込みエラー: ${error.message}`);
    }
  }

  /**
   * タスクを処理中ディレクトリに移動
   */
  async moveTaskToProcessing() {
    const sourcePath = path.join(TASKS_DIR, 'pending', `${this.taskId}.json`);
    const destPath = path.join(TASKS_DIR, 'processing', `${this.taskId}.json`);
    
    try {
      await fs.rename(sourcePath, destPath);
      this.task.status = 'processing';
      this.task.workerId = this.workerId;
      this.task.processingStartTime = new Date().toISOString();
      await fs.writeFile(destPath, JSON.stringify(this.task, null, 2));
    } catch (error) {
      throw new Error(`タスク移動エラー: ${error.message}`);
    }
  }

  /**
   * 指示書の生成
   */
  async generateInstruction() {
    const instruction = {
      taskId: this.task.id,
      description: this.task.description,
      context: this.task.memoryContext,
      timestamp: new Date().toISOString()
    };

    // 指示書テンプレートの構築
    let instructionText = `
=== タスク実行指示書 ===
タスクID: ${instruction.taskId}
実行時刻: ${instruction.timestamp}

【タスク内容】
${instruction.description}

【プロジェクトコンテキスト】
`;

    // Memory Contextを追加
    if (instruction.context) {
      for (const [filename, content] of Object.entries(instruction.context)) {
        instructionText += `\n--- ${filename} ---\n${content}\n`;
      }
    }

    instructionText += `
【実行要件】
1. 上記タスクを確実に実行してください
2. エラーが発生した場合は、詳細なエラー情報を記録してください
3. 実行結果は構造化された形式で報告してください
4. Memory Bankに保存すべき新しい知見があれば提案してください

【出力形式】
実行完了後、以下の形式で結果を報告してください：
RESULT_START
{
  "status": "success" または "failed",
  "summary": "実行結果の要約",
  "details": "詳細な実行内容",
  "errors": "エラーがあった場合の詳細",
  "memoryUpdates": {
    "core": { "更新するファイル名": "更新内容" },
    "context": { "更新するファイル名": "更新内容" }
  }
}
RESULT_END
`;

    await this.log(LogLevel.INFO, '指示書を生成しました');
    return instructionText;
  }

  /**
   * ClaudeCodeでの実行
   */
  async executeWithClaude(instruction) {
    return new Promise((resolve, reject) => {
      let output = '';
      let result = null;
      let captureResult = false;
      
      // ClaudeCodeプロセスを起動
      this.claudeProcess = spawn('claude', ['--dangerously-skip-permissions'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: PROJECT_ROOT
      });

      // タイムアウト設定（5分）
      const timeout = setTimeout(() => {
        this.log(LogLevel.ERROR, 'ClaudeCode実行タイムアウト');
        this.claudeProcess.kill('SIGTERM');
        reject(new Error('実行タイムアウト'));
      }, 300000);

      // エラーハンドリング
      this.claudeProcess.on('error', (error) => {
        clearTimeout(timeout);
        this.log(LogLevel.ERROR, `ClaudeCodeプロセスエラー: ${error.message}`);
        reject(error);
      });

      // 標準出力の処理
      this.claudeProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        
        // 結果の抽出
        if (chunk.includes('RESULT_START')) {
          captureResult = true;
        }
        
        if (captureResult) {
          const resultMatch = output.match(/RESULT_START\s*([\s\S]*?)\s*RESULT_END/);
          if (resultMatch) {
            try {
              result = JSON.parse(resultMatch[1]);
              this.log(LogLevel.INFO, '実行結果を取得しました');
            } catch (error) {
              this.log(LogLevel.ERROR, `結果パースエラー: ${error.message}`);
            }
          }
        }
      });

      // 標準エラー出力
      this.claudeProcess.stderr.on('data', (data) => {
        this.log(LogLevel.ERROR, `ClaudeCode stderr: ${data.toString()}`);
      });

      // プロセス終了
      this.claudeProcess.on('exit', (code) => {
        clearTimeout(timeout);
        
        if (code === 0 && result) {
          this.log(LogLevel.INFO, `ClaudeCode正常終了: ${code}`);
          resolve(result);
        } else {
          this.log(LogLevel.ERROR, `ClaudeCode異常終了: ${code}`);
          reject(new Error(`ClaudeCodeが異常終了しました: ${code}`));
        }
      });

      // 指示書を送信
      this.claudeProcess.stdin.write(instruction);
      this.claudeProcess.stdin.write('\n');
      
      // 少し待ってから入力を閉じる
      setTimeout(() => {
        this.claudeProcess.stdin.end();
      }, 1000);
    });
  }

  /**
   * 結果の保存
   */
  async saveResult(result) {
    this.task.result = result;
    this.task.completedAt = new Date().toISOString();
    this.task.executionTime = Date.now() - this.startTime;
    
    const resultPath = path.join(TASKS_DIR, 'processing', `${this.taskId}.json`);
    await fs.writeFile(resultPath, JSON.stringify(this.task, null, 2));
    
    await this.log(LogLevel.INFO, '実行結果を保存しました', {
      status: result.status,
      executionTime: this.task.executionTime
    });
  }

  /**
   * タスクを完了ディレクトリに移動
   */
  async moveTaskToCompleted() {
    const sourcePath = path.join(TASKS_DIR, 'processing', `${this.taskId}.json`);
    const destPath = path.join(TASKS_DIR, 'completed', `${this.taskId}.json`);
    
    try {
      await fs.rename(sourcePath, destPath);
      await this.log(LogLevel.INFO, 'タスクを完了ディレクトリに移動しました');
    } catch (error) {
      await this.log(LogLevel.ERROR, `タスク移動エラー: ${error.message}`);
    }
  }

  /**
   * エラーハンドリング
   */
  async handleError(error) {
    await this.log(LogLevel.ERROR, `Worker実行エラー: ${error.message}`, {
      stack: error.stack
    });
    
    // エラー時もタスクを完了に移動（失敗として記録）
    if (this.task) {
      this.task.result = {
        status: 'failed',
        error: error.message,
        stack: error.stack
      };
      this.task.failedAt = new Date().toISOString();
      
      // 処理中または保留中のタスクを完了に移動
      const locations = ['processing', 'pending'];
      for (const location of locations) {
        const sourcePath = path.join(TASKS_DIR, location, `${this.taskId}.json`);
        try {
          await fs.access(sourcePath);
          const destPath = path.join(TASKS_DIR, 'completed', `${this.taskId}.json`);
          await fs.writeFile(destPath, JSON.stringify(this.task, null, 2));
          await fs.unlink(sourcePath);
          break;
        } catch {
          // ファイルが存在しない場合は続行
        }
      }
    }
  }

  /**
   * クリーンアップ
   */
  async cleanup() {
    // ClaudeCodeプロセスの終了
    if (this.claudeProcess && !this.claudeProcess.killed) {
      this.claudeProcess.kill('SIGTERM');
    }
    
    await this.log(LogLevel.INFO, 'Workerクリーンアップ完了', {
      executionTime: Date.now() - this.startTime
    });
  }
}

// メイン実行
async function main() {
  if (!TASK_ID) {
    console.error('エラー: タスクIDが指定されていません');
    process.exit(1);
  }
  
  const worker = new WorkerManager(TASK_ID);
  
  try {
    await worker.execute();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// シグナルハンドリング
process.on('SIGTERM', async () => {
  console.log('SIGTERMを受信しました');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINTを受信しました');
  process.exit(0);
});

// 直接実行の場合
if (require.main === module) {
  main();
}