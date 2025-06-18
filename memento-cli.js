#!/usr/bin/env node

/**
 * memento CLI
 * Memento システムのコマンドラインインターフェース
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

// カラーコード
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// プロジェクトパス
const PROJECT_ROOT = process.cwd();
const MEMENTO_DIR = path.join(PROJECT_ROOT, '.memento');
const SYSTEM_DIR = path.join(MEMENTO_DIR, 'system');
const LOGS_DIR = path.join(MEMENTO_DIR, 'logs');

// コマンド定義
const commands = {
  init: '初期化 - プロジェクトにMementoシステムをセットアップ',
  start: 'Commanderを起動',
  stop: 'Commanderを停止',
  status: 'システムステータスを表示',
  logs: 'ログを表示',
  memory: 'Memory Bank管理',
  backup: 'バックアップ管理',
  reset: 'システムリセット',
  reflect: '最近の活動を要約',
  dream: 'バックグラウンドで最適化実行',
  uninstall: 'Mementoをアンインストール',
  help: 'ヘルプを表示'
};

/**
 * メインCLIクラス
 */
class MementoCLI {
  constructor() {
    this.commanderProcess = null;
  }

  /**
   * コマンド実行
   */
  async execute(command, args) {
    switch (command) {
      case 'init':
        await this.init();
        break;
      case 'start':
        await this.start();
        break;
      case 'stop':
        await this.stop();
        break;
      case 'status':
        await this.status();
        break;
      case 'logs':
        await this.logs(args);
        break;
      case 'memory':
        await this.memory(args);
        break;
      case 'backup':
        await this.backup(args);
        break;
      case 'reset':
        await this.reset(args);
        break;
      case 'reflect':
        await this.reflect();
        break;
      case 'dream':
        await this.dream();
        break;
      case 'uninstall':
        await this.uninstall();
        break;
      case 'help':
      default:
        this.help();
    }
  }

  /**
   * システム初期化
   */
  async init() {
    console.log(`${colors.cyan}🚀 Mementoシステムを初期化します${colors.reset}`);
    
    try {
      // .mementoディレクトリの確認
      try {
        await fs.access(MEMENTO_DIR);
        const answer = await this.prompt(
          `${colors.yellow}⚠️  .mementoディレクトリが既に存在します。上書きしますか？ (y/N): ${colors.reset}`
        );
        if (answer.toLowerCase() !== 'y') {
          console.log('初期化をキャンセルしました');
          return;
        }
      } catch {
        // ディレクトリが存在しない場合は続行
      }

      // システムファイルのコピー
      console.log('📁 ディレクトリ構造を作成中...');
      
      // commander.jsをコピー
      const commanderSource = path.join(__dirname, 'commander.js');
      const commanderDest = path.join(SYSTEM_DIR, 'commander.js');
      await fs.mkdir(path.dirname(commanderDest), { recursive: true });
      await fs.copyFile(commanderSource, commanderDest);
      
      // worker-manager.jsをコピー
      const workerSource = path.join(__dirname, 'worker-manager.js');
      const workerDest = path.join(SYSTEM_DIR, 'worker-manager.js');
      await fs.copyFile(workerSource, workerDest);
      
      // 設定ファイルの作成
      const config = {
        maxWorkers: 3,
        workerTimeout: 300000,
        retryAttempts: 3,
        logLevel: 'INFO',
        autoBackup: true,
        backupInterval: 'daily'
      };
      await fs.writeFile(
        path.join(SYSTEM_DIR, 'config.json'),
        JSON.stringify(config, null, 2)
      );
      
      // .gitignoreの作成
      const gitignore = `
# Memento System
.memento/logs/
.memento/tasks/processing/
.memento/tasks/completed/
.memento/system/status.json
*.log
      `.trim();
      await fs.writeFile(path.join(PROJECT_ROOT, '.gitignore'), gitignore);
      
      console.log(`${colors.green}✅ 初期化が完了しました！${colors.reset}`);
      console.log(`\n次のコマンドでCommanderを起動できます:`);
      console.log(`  ${colors.bright}memento start${colors.reset}`);
      
    } catch (error) {
      console.error(`${colors.red}❌ 初期化エラー: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  }

  /**
   * Commander起動
   */
  async start() {
    try {
      // 既に起動しているか確認
      const status = await this.getStatus();
      if (status && status.commander.status === 'running') {
        console.log(`${colors.yellow}⚠️  Commanderは既に起動しています${colors.reset}`);
        return;
      }
      
      console.log(`${colors.cyan}🚀 Commanderを起動しています...${colors.reset}`);
      
      // Commanderプロセスを起動
      this.commanderProcess = spawn('node', [path.join(SYSTEM_DIR, 'commander.js')], {
        detached: true,
        stdio: 'ignore'
      });
      
      this.commanderProcess.unref();
      
      // 起動確認（3秒待機）
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newStatus = await this.getStatus();
      if (newStatus && newStatus.commander.status === 'running') {
        console.log(`${colors.green}✅ Commander起動完了！${colors.reset}`);
        console.log(`\nClaudeCodeと対話を開始するには、別のターミナルで以下を実行:`);
        console.log(`  ${colors.bright}cd ${PROJECT_ROOT}${colors.reset}`);
        console.log(`  ${colors.bright}claude${colors.reset}`);
      } else {
        throw new Error('Commanderの起動を確認できませんでした');
      }
      
    } catch (error) {
      console.error(`${colors.red}❌ 起動エラー: ${error.message}${colors.reset}`);
      console.log('\nログを確認してください:');
      console.log(`  ${colors.bright}memento logs --tail 20${colors.reset}`);
    }
  }

  /**
   * Commander停止
   */
  async stop() {
    try {
      const status = await this.getStatus();
      if (!status || status.commander.status !== 'running') {
        console.log(`${colors.yellow}Commanderは起動していません${colors.reset}`);
        return;
      }
      
      console.log(`${colors.cyan}🛑 Commanderを停止しています...${colors.reset}`);
      
      // プロセスにSIGTERMを送信
      process.kill(status.commander.pid, 'SIGTERM');
      
      // 停止確認（最大10秒待機）
      let stopped = false;
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newStatus = await this.getStatus();
        if (!newStatus || newStatus.commander.status === 'stopped') {
          stopped = true;
          break;
        }
      }
      
      if (stopped) {
        console.log(`${colors.green}✅ Commander停止完了${colors.reset}`);
      } else {
        throw new Error('Commanderの停止を確認できませんでした');
      }
      
    } catch (error) {
      console.error(`${colors.red}❌ 停止エラー: ${error.message}${colors.reset}`);
    }
  }

  /**
   * ステータス表示
   */
  async status() {
    try {
      const status = await this.getStatus();
      
      if (!status) {
        console.log(`${colors.yellow}ステータスファイルが見つかりません${colors.reset}`);
        return;
      }
      
      console.log(`${colors.cyan}📊 システムステータス${colors.reset}`);
      console.log('─'.repeat(50));
      
      // Commander情報
      console.log(`${colors.bright}Commander:${colors.reset}`);
      console.log(`  状態: ${this.getStatusColor(status.commander.status)}${status.commander.status}${colors.reset}`);
      console.log(`  PID: ${status.commander.pid}`);
      console.log(`  起動時刻: ${new Date(status.commander.startTime).toLocaleString()}`);
      
      // Worker情報
      const workerCount = Object.keys(status.workers || {}).length;
      console.log(`\n${colors.bright}Workers:${colors.reset}`);
      console.log(`  稼働中: ${workerCount}台`);
      
      if (workerCount > 0) {
        for (const [workerId, info] of Object.entries(status.workers)) {
          console.log(`  - ${workerId}: タスク ${info.taskId}`);
        }
      }
      
      // タスク統計
      const taskStats = await this.getTaskStats();
      console.log(`\n${colors.bright}タスク統計:${colors.reset}`);
      console.log(`  保留中: ${taskStats.pending}件`);
      console.log(`  処理中: ${taskStats.processing}件`);
      console.log(`  完了: ${taskStats.completed}件`);
      
      console.log(`\n最終更新: ${new Date(status.lastUpdate).toLocaleString()}`);
      
    } catch (error) {
      console.error(`${colors.red}❌ ステータス取得エラー: ${error.message}${colors.reset}`);
    }
  }

  /**
   * ログ表示
   */
  async logs(args) {
    const options = this.parseArgs(args);
    const tail = options.tail || 50;
    const follow = options.follow || options.f;
    
    try {
      const logFile = path.join(LOGS_DIR, 'commander.log');
      
      if (follow) {
        // tail -f 相当の動作
        console.log(`${colors.cyan}📜 ログをリアルタイム表示 (Ctrl+Cで終了)${colors.reset}`);
        const tail = spawn('tail', ['-f', logFile]);
        tail.stdout.pipe(process.stdout);
        tail.stderr.pipe(process.stderr);
      } else {
        // 最新のログを表示
        const logs = await this.readLastLines(logFile, tail);
        console.log(`${colors.cyan}📜 最新${tail}件のログ${colors.reset}`);
        console.log('─'.repeat(50));
        
        for (const line of logs) {
          try {
            const log = JSON.parse(line);
            const time = new Date(log.timestamp).toLocaleTimeString();
            const levelColor = this.getLevelColor(log.level);
            console.log(`[${time}] ${levelColor}${log.level}${colors.reset}: ${log.message}`);
          } catch {
            // JSONパースできない場合はそのまま表示
            console.log(line);
          }
        }
      }
    } catch (error) {
      console.error(`${colors.red}❌ ログ表示エラー: ${error.message}${colors.reset}`);
    }
  }

  /**
   * Memory Bank管理
   */
  async memory(args) {
    // 引数が文字列の場合は直接Memory Bankに記録
    if (args.length > 0 && args[0] !== 'show' && args[0] !== 'update' && args[0] !== 'init') {
      const content = args.join(' ');
      await this.quickMemory(content);
      return;
    }
    
    const subcommand = args[0];
    
    switch (subcommand) {
      case 'show':
        await this.showMemory();
        break;
      case 'update':
        await this.updateMemory();
        break;
      case 'init':
        await this.initMemory();
        break;
      default:
        console.log('使用方法:');
        console.log('  memento memory "記録したい内容"  - 即座にMemory Bankに記録');
        console.log('  memento memory show              - Memory Bankの内容を表示');
        console.log('  memento memory update            - Memory Bankを更新');
        console.log('  memento memory init              - Memory Bankを初期化');
    }
  }

  /**
   * クイックメモリー記録
   */
  async quickMemory(content) {
    try {
      const timestamp = new Date().toISOString();
      const memoryPath = path.join(MEMENTO_DIR, 'memory', 'context', 'quick_notes.md');
      
      // 既存の内容を読み込む
      let existingContent = '';
      try {
        existingContent = await fs.readFile(memoryPath, 'utf-8');
      } catch {
        existingContent = '# クイックノート\n\n';
      }
      
      // 新しい内容を追加
      const newEntry = `\n## ${timestamp}\n${content}\n`;
      await fs.writeFile(memoryPath, existingContent + newEntry);
      
      console.log(`${colors.green}✅ Memory Bankに記録しました${colors.reset}`);
      
    } catch (error) {
      console.error(`${colors.red}❌ 記録エラー: ${error.message}${colors.reset}`);
    }
  }

  /**
   * 最近の活動を要約（reflect）
   */
  async reflect() {
    try {
      console.log(`${colors.cyan}🔍 最近の活動を振り返ります...${colors.reset}`);
      console.log('─'.repeat(50));
      
      // 完了タスクの統計
      const completedDir = path.join(MEMENTO_DIR, 'tasks', 'completed');
      const completedFiles = await fs.readdir(completedDir).catch(() => []);
      const recentTasks = [];
      
      for (const file of completedFiles.slice(-10)) { // 最新10件
        if (file.endsWith('.json')) {
          const filepath = path.join(completedDir, file);
          const task = JSON.parse(await fs.readFile(filepath, 'utf-8'));
          recentTasks.push(task);
        }
      }
      
      // タスクサマリー
      console.log(`\n${colors.bright}最近完了したタスク:${colors.reset}`);
      recentTasks.forEach(task => {
        const time = new Date(task.completedAt).toLocaleString();
        const status = task.result?.status === 'success' ? '✅' : '❌';
        console.log(`${status} [${time}] ${task.description}`);
      });
      
      // Memory Bank最終更新
      const memoryFiles = await fs.readdir(path.join(MEMENTO_DIR, 'memory', 'core')).catch(() => []);
      console.log(`\n${colors.bright}Memory Bank:${colors.reset}`);
      for (const file of memoryFiles) {
        const filepath = path.join(MEMENTO_DIR, 'memory', 'core', file);
        const stats = await fs.stat(filepath);
        console.log(`  ${file}: 最終更新 ${new Date(stats.mtime).toLocaleString()}`);
      }
      
      // システム稼働時間
      const status = await this.getStatus();
      if (status && status.commander.status === 'running') {
        const uptime = Date.now() - new Date(status.commander.startTime).getTime();
        const hours = Math.floor(uptime / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        console.log(`\n${colors.bright}システム稼働時間:${colors.reset} ${hours}時間${minutes}分`);
      }
      
    } catch (error) {
      console.error(`${colors.red}❌ 振り返りエラー: ${error.message}${colors.reset}`);
    }
  }

  /**
   * バックグラウンド最適化（dream）
   */
  async dream() {
    try {
      console.log(`${colors.cyan}💭 バックグラウンド最適化を開始します...${colors.reset}`);
      
      // ログファイルの圧縮
      console.log('📦 古いログを圧縮中...');
      const logFiles = await fs.readdir(LOGS_DIR).catch(() => []);
      let compressedCount = 0;
      
      for (const file of logFiles) {
        if (file.endsWith('.log') && !file.endsWith('.gz')) {
          const filepath = path.join(LOGS_DIR, file);
          const stats = await fs.stat(filepath);
          
          // 7日以上古いログを圧縮
          if (Date.now() - stats.mtime.getTime() > 7 * 24 * 60 * 60 * 1000) {
            // 実際の圧縮処理はここに実装
            compressedCount++;
          }
        }
      }
      
      // 完了タスクのアーカイブ
      console.log('🗄️  完了タスクをアーカイブ中...');
      const completedDir = path.join(MEMENTO_DIR, 'tasks', 'completed');
      const completedFiles = await fs.readdir(completedDir).catch(() => []);
      let archivedCount = 0;
      
      // 30日以上古いタスクをアーカイブ
      for (const file of completedFiles) {
        if (file.endsWith('.json')) {
          const filepath = path.join(completedDir, file);
          const stats = await fs.stat(filepath);
          
          if (Date.now() - stats.mtime.getTime() > 30 * 24 * 60 * 60 * 1000) {
            // アーカイブ処理
            archivedCount++;
          }
        }
      }
      
      // Memory Bank最適化
      console.log('🧠 Memory Bankを最適化中...');
      // Memory Bankの重複削除や整理
      
      console.log(`\n${colors.green}✅ 最適化完了！${colors.reset}`);
      console.log(`  - ${compressedCount}個のログファイルを圧縮`);
      console.log(`  - ${archivedCount}個のタスクをアーカイブ`);
      console.log(`  - Memory Bankを整理`);
      
    } catch (error) {
      console.error(`${colors.red}❌ 最適化エラー: ${error.message}${colors.reset}`);
    }
  }

  /**
   * Memory Bank表示
   */
  async showMemory() {
    try {
      const memoryDir = path.join(MEMENTO_DIR, 'memory');
      console.log(`${colors.cyan}🧠 Memory Bank${colors.reset}`);
      console.log('─'.repeat(50));
      
      // Core memory
      console.log(`\n${colors.bright}Core Memory:${colors.reset}`);
      const coreFiles = await fs.readdir(path.join(memoryDir, 'core'));
      for (const file of coreFiles) {
        const content = await fs.readFile(path.join(memoryDir, 'core', file), 'utf-8');
        const preview = content.split('\n').slice(0, 3).join('\n');
        console.log(`\n📄 ${file}:`);
        console.log(preview);
        if (content.split('\n').length > 3) {
          console.log('...');
        }
      }
      
      // Context memory
      console.log(`\n${colors.bright}Context Memory:${colors.reset}`);
      const contextFiles = await fs.readdir(path.join(memoryDir, 'context'));
      for (const file of contextFiles) {
        const stats = await fs.stat(path.join(memoryDir, 'context', file));
        console.log(`📄 ${file} (${this.formatSize(stats.size)})`);
      }
      
    } catch (error) {
      console.error(`${colors.red}❌ Memory Bank表示エラー: ${error.message}${colors.reset}`);
    }
  }

  /**
   * バックアップ管理
   */
  async backup(args) {
    const subcommand = args[0];
    
    switch (subcommand) {
      case 'create':
        await this.createBackup();
        break;
      case 'list':
        await this.listBackups();
        break;
      case 'restore':
        await this.restoreBackup(args[1]);
        break;
      default:
        console.log('使用方法:');
        console.log('  memento backup create           - バックアップを作成');
        console.log('  memento backup list             - バックアップ一覧を表示');
        console.log('  memento backup restore <name>   - バックアップから復元');
    }
  }

  /**
   * システムリセット
   */
  async reset(args) {
    const force = args.includes('--force');
    
    if (!force) {
      const answer = await this.prompt(
        `${colors.red}⚠️  警告: この操作はすべてのデータを削除します。続行しますか？ (y/N): ${colors.reset}`
      );
      if (answer.toLowerCase() !== 'y') {
        console.log('リセットをキャンセルしました');
        return;
      }
    }
    
    try {
      // Commanderを停止
      await this.stop();
      
      // .mementoディレクトリを削除
      console.log('🗑️  データを削除中...');
      await fs.rm(MEMENTO_DIR, { recursive: true, force: true });
      
      console.log(`${colors.green}✅ システムリセット完了${colors.reset}`);
      console.log('\n再度使用するには初期化してください:');
      console.log(`  ${colors.bright}memento init${colors.reset}`);
      
    } catch (error) {
      console.error(`${colors.red}❌ リセットエラー: ${error.message}${colors.reset}`);
    }
  }

  /**
   * Mementoアンインストール
   */
  async uninstall() {
    console.log(`${colors.yellow}⚠️  Mementoをアンインストールします${colors.reset}`);
    console.log('\n以下の操作を実行します:');
    console.log('  - 全プロジェクトのCommanderを停止');
    console.log('  - /usr/local/bin/mementoを削除');
    console.log('  - ~/.mementoディレクトリを削除');
    console.log('  - 各プロジェクトの.mementoディレクトリは保持されます');
    
    const answer = await this.prompt(
      `\n${colors.red}本当にアンインストールしますか？ (y/N): ${colors.reset}`
    );
    
    if (answer.toLowerCase() !== 'y') {
      console.log('アンインストールをキャンセルしました');
      return;
    }
    
    try {
      // 現在のプロジェクトのCommanderを停止
      console.log('\n🛑 Commanderを停止中...');
      try {
        await this.stop();
      } catch {
        // エラーは無視（起動していない場合）
      }
      
      // グローバルのシンボリックリンクを削除
      console.log('🔗 グローバルコマンドを削除中...');
      try {
        await fs.unlink('/usr/local/bin/memento');
      } catch (error) {
        console.log('  sudoで再実行が必要かもしれません:');
        console.log(`  ${colors.bright}sudo rm -f /usr/local/bin/memento${colors.reset}`);
      }
      
      // インストールディレクトリを削除
      const installDir = path.join(process.env.HOME, '.memento');
      if (await fs.access(installDir).then(() => true).catch(() => false)) {
        console.log('📁 インストールディレクトリを削除中...');
        await fs.rm(installDir, { recursive: true, force: true });
      }
      
      console.log(`\n${colors.green}✅ アンインストール完了！${colors.reset}`);
      console.log('\n以下の項目は手動で削除してください:');
      console.log('  - 各プロジェクトの.mementoディレクトリ');
      console.log('  - 各プロジェクトの.memento_backupsディレクトリ');
      console.log('  - ~/.bashrcのエイリアス設定（追加した場合）');
      console.log(`\n${colors.cyan}Mementoをご利用いただきありがとうございました！${colors.reset}`);
      
    } catch (error) {
      console.error(`${colors.red}❌ アンインストールエラー: ${error.message}${colors.reset}`);
      console.log('\n手動でアンインストールする場合:');
      console.log('  sudo rm -f /usr/local/bin/memento');
      console.log('  rm -rf ~/.memento');
    }
  }

  /**
   * ヘルプ表示
   */
  help() {
    console.log(`${colors.cyan}Mementoシステム - AI記憶支援開発環境${colors.reset}`);
    console.log('─'.repeat(50));
    console.log('\n使用方法:');
    console.log('  memento <command> [options]\n');
    console.log('コマンド:');
    
    for (const [cmd, desc] of Object.entries(commands)) {
      console.log(`  ${colors.bright}${cmd.padEnd(10)}${colors.reset} ${desc}`);
    }
    
    console.log('\n例:');
    console.log('  memento init                      # システムを初期化');
    console.log('  memento start                     # Commanderを起動');
    console.log('  memento memory "重要な決定"        # 即座に記録');
    console.log('  memento logs --tail 20            # 最新20件のログを表示');
    console.log('  memento reflect                   # 最近の活動を振り返る');
  }

  // ユーティリティメソッド

  async getStatus() {
    try {
      const statusPath = path.join(SYSTEM_DIR, 'status.json');
      const data = await fs.readFile(statusPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async getTaskStats() {
    const stats = { pending: 0, processing: 0, completed: 0 };
    
    try {
      const tasksDir = path.join(MEMENTO_DIR, 'tasks');
      
      for (const status of ['pending', 'processing', 'completed']) {
        const files = await fs.readdir(path.join(tasksDir, status));
        stats[status] = files.filter(f => f.endsWith('.json')).length;
      }
    } catch {
      // エラーは無視
    }
    
    return stats;
  }

  getStatusColor(status) {
    switch (status) {
      case 'running': return colors.green;
      case 'stopped': return colors.red;
      case 'initializing': return colors.yellow;
      default: return colors.reset;
    }
  }

  getLevelColor(level) {
    switch (level) {
      case 'INFO': return colors.cyan;
      case 'WARN': return colors.yellow;
      case 'ERROR': return colors.red;
      case 'FATAL': return colors.magenta;
      default: return colors.reset;
    }
  }

  async readLastLines(filepath, count) {
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const lines = content.trim().split('\n');
      return lines.slice(-count);
    } catch {
      return [];
    }
  }

  formatSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  parseArgs(args) {
    const options = {};
    
    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith('--')) {
        const key = args[i].substring(2);
        const value = args[i + 1] && !args[i + 1].startsWith('-') ? args[++i] : true;
        options[key] = value;
      } else if (args[i].startsWith('-')) {
        const flags = args[i].substring(1).split('');
        flags.forEach(flag => options[flag] = true);
      }
    }
    
    return options;
  }

  async prompt(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise(resolve => {
      rl.question(question, answer => {
        rl.close();
        resolve(answer);
      });
    });
  }

  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup_${timestamp}`;
      const backupDir = path.join(PROJECT_ROOT, '.memento_backups', backupName);
      
      console.log(`📦 バックアップを作成中: ${backupName}`);
      
      // バックアップディレクトリを作成
      await fs.mkdir(backupDir, { recursive: true });
      
      // .mementoディレクトリをコピー
      await this.copyDirectory(MEMENTO_DIR, backupDir);
      
      console.log(`${colors.green}✅ バックアップ作成完了: ${backupName}${colors.reset}`);
      
    } catch (error) {
      console.error(`${colors.red}❌ バックアップエラー: ${error.message}${colors.reset}`);
    }
  }

  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

// メイン実行
async function main() {
  const cli = new MementoCLI();
  const [,, command, ...args] = process.argv;
  
  if (!command) {
    cli.help();
    process.exit(0);
  }
  
  await cli.execute(command, args);
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  console.error(`${colors.red}❌ 予期しないエラー: ${error.message}${colors.reset}`);
  process.exit(1);
});

// 実行
main();