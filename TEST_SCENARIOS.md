# Mementoシステム テストシナリオ集

## 📋 目次
1. [シナリオ1: シンプルTODOアプリ（Worker1つ）](#シナリオ1-シンプルtodoアプリworker1つ)
2. [シナリオ2: ECサイト商品管理（Worker複数）](#シナリオ2-ecサイト商品管理worker複数)
3. [トラブルシューティング](#トラブルシューティング)

---

## シナリオ1: シンプルTODOアプリ（Worker1つ）

### 🎯 プロジェクト概要
Node.js + Express + SQLiteを使用したシンプルなTODOアプリケーションの開発

### 📁 初期セットアップ

```bash
# 1. プロジェクトディレクトリ作成
mkdir ~/projects/todo-app
cd ~/projects/todo-app

# 2. Mementoシステムを初期化
memento init

# 3. 基本的なプロジェクト構造を作成
npm init -y
```

### 🚀 開発フロー（頭から最後まで）

#### ターミナル1: Commander起動
```bash
cd ~/projects/todo-app
memento start
# このターミナルは開いたままにする
```

#### ターミナル2: ログ監視
```bash
cd ~/projects/todo-app
memento logs -f
# リアルタイムでログを監視
```

#### ターミナル3: ClaudeCode操作
```bash
cd ~/projects/todo-app
claude

# === 対話開始 ===
> こんにちは！TODOアプリを作成します。Node.js + Express + SQLiteを使用してください。

# Memory Bankに初期情報を記録
> /memory update
# エディタが開くので、以下を記入：
"""
## プロジェクト概要
シンプルなTODOアプリケーション
- 技術スタック: Node.js, Express, SQLite
- 機能: TODOの追加、一覧表示、完了、削除

## 技術的決定事項
- データベース: SQLite（開発の簡易性）
- フロントエンド: 静的HTML + vanilla JS
- APIフォーマット: REST
"""

# 最初のタスク作成
> TASK: Express サーバーの基本設定を作成してください。package.jsonにexpressとsqlite3を追加し、server.jsファイルを作成してください。

# [Workerが自動実行]
# ターミナル2でログを確認：
# [INFO] 新しいタスクを作成: task_1234567890_abc
# [INFO] Worker worker_1234567890 を起動しました
# [INFO] タスク task_1234567890_abc の結果を処理中

# 結果確認
> server.jsの内容を見せてください

# 次のタスク
> TASK: TODOのCRUD操作用のAPIエンドポイントを実装してください。
> - GET /api/todos - 一覧取得
> - POST /api/todos - 新規作成
> - PUT /api/todos/:id - 更新
> - DELETE /api/todos/:id - 削除

# Memory Bankに進捗を記録
> /memory update
# 追記：
"""
## 実装済み機能
- Expressサーバー基本設定
- SQLiteデータベース接続
- CRUD APIエンドポイント

## 次のステップ
- フロントエンドの実装
- エラーハンドリングの改善
"""
```

#### 別ターミナル: 即座にメモリー記録
```bash
# 重要な決定事項を記録
memento memory "APIのレスポンス形式をJSON APIスタイルに統一することを決定"

# 振り返り
memento reflect
```

### 🔄 初回コミット

```bash
# ClaudeCode内で
> すべての変更内容を確認して、初回コミットを作成してください。

# [自動的にgit add, git commitが実行される]
# コミットメッセージ例：
# "feat: TODOアプリの基本構造とAPI実装
#  
#  - Expressサーバーのセットアップ
#  - SQLiteデータベース接続
#  - CRUD APIエンドポイント実装
#  
#  🤖 Generated with Claude Code"
```

### 📝 2日目の作業（Memory Bank活用）

```bash
# Commander起動
memento start

# 前日の振り返り
memento reflect

# ClaudeCodeで継続
claude

> おはようございます。昨日の続きから始めます。

# Memory Bankから文脈を読み込み
> 現在の実装状況を教えてください。

# フロントエンド実装
> TASK: シンプルなHTMLフロントエンドを作成してください。public/index.htmlとpublic/app.jsを作成し、APIと連携させてください。

# テストの追加
> TASK: 基本的なテストを追加してください。Jestを使用してAPIエンドポイントのテストを作成してください。
```

### 🎉 2回目のコミット〜完成

```bash
# すべての機能実装後
> プロジェクトの最終確認をして、2回目のコミットを作成してください。

# Memory Bank最終更新
> /memory update
"""
## プロジェクト完成
- バックエンド: Express + SQLite
- フロントエンド: 静的HTML + vanilla JS
- テスト: Jest
- 全機能実装完了

## 学んだこと
- Mementoシステムによる自動タスク実行の効率性
- Memory Bankによる文脈保持の重要性
"""

# バックアップ作成
exit # ClaudeCodeを終了
memento backup create
memento stop
```

---

## シナリオ2: ECサイト商品管理（Worker複数）

### 🎯 プロジェクト概要
複数のWorkerが並列処理する複雑なプロジェクト

### 📁 初期セットアップ

```bash
mkdir ~/projects/ec-admin
cd ~/projects/ec-admin
memento init
npm init -y
```

### 🚀 並列タスク実行デモ

#### ClaudeCode操作（メインターミナル）
```bash
claude

> ECサイトの管理画面を作成します。以下の機能を並列で実装してください：
> 1. 商品管理API
> 2. 在庫管理システム
> 3. 注文処理システム

# 複数タスクを連続作成（並列実行される）
> TASK: 商品管理用のREST APIを実装してください。Express + PostgreSQLを使用し、商品のCRUD操作を可能にしてください。

> TASK: 在庫管理システムを実装してください。商品の入出庫履歴を記録し、現在在庫を自動計算する機能を含めてください。

> TASK: 注文処理システムの基本機能を実装してください。注文の受付、ステータス管理、在庫との連携を含めてください。

# [3つのWorkerが並列起動]
# ログで確認：
# [INFO] Worker worker_001 を起動しました
# [INFO] Worker worker_002 を起動しました  
# [INFO] Worker worker_003 を起動しました
```

#### 並列処理の監視
```bash
# 別ターミナルでステータス確認
memento status

# 出力例：
# 📊 システムステータス
# ──────────────────────────────────────────────────
# Commander:
#   状態: running
#   PID: 12345
#   起動時刻: 2024-01-20 10:00:00
# 
# Workers:
#   稼働中: 3台
#   - worker_001: タスク task_商品管理API
#   - worker_002: タスク task_在庫管理
#   - worker_003: タスク task_注文処理
# 
# タスク統計:
#   保留中: 0件
#   処理中: 3件
#   完了: 0件
```

### 🔄 Worker完了後の統合作業

```bash
# すべてのWorkerが完了後
> 実装された3つのシステムを統合してください。商品、在庫、注文が適切に連携するようにしてください。

# 統合テスト
> TASK: 統合テストを作成してください。商品登録→在庫設定→注文作成の一連のフローをテストしてください。

# デプロイ設定
> TASK: Dockerコンテナ化してください。docker-compose.ymlを作成し、PostgreSQL、Redis、アプリケーションを含む構成にしてください。

# Memory Bank更新
> /memory update
"""
## システム構成
- API: Express + PostgreSQL
- キャッシュ: Redis
- コンテナ: Docker Compose

## 実装済み機能
- 商品管理（CRUD）
- 在庫管理（履歴追跡）
- 注文処理（ステータス管理）
- システム間連携

## デプロイ情報
- docker-compose up -d で起動
- ポート: 3000（API）, 5432（DB）, 6379（Redis）
"""
```

### 📊 パフォーマンス分析

```bash
# 実行時間の振り返り
memento reflect

# 出力例：
# 🔍 最近の活動を振り返ります...
# ──────────────────────────────────────────────────
# 
# 最近完了したタスク:
# ✅ [2024-01-20 10:15:23] 商品管理API実装（実行時間: 3分20秒）
# ✅ [2024-01-20 10:16:45] 在庫管理システム実装（実行時間: 4分15秒）
# ✅ [2024-01-20 10:17:02] 注文処理システム実装（実行時間: 4分32秒）
# ✅ [2024-01-20 10:25:10] 統合テスト作成（実行時間: 2分10秒）
# 
# Memory Bank:
#   current.md: 最終更新 2024-01-20 10:30:00
#   tech.md: 最終更新 2024-01-20 10:25:00
# 
# システム稼働時間: 0時間30分
```

### 🎉 プロジェクト完成

```bash
# 最終コミット
> すべての実装が完了しました。最終コミットを作成してください。

# プロジェクト完了処理
> /memory update
"""
## プロジェクト完了
ECサイト管理システムの実装完了

### 成果
- 3つのサブシステムを並列開発（約5分で完了）
- 従来の逐次開発なら15分かかる作業を1/3に短縮
- Memory Bankにより文脈を失わずに開発継続

### 今後の拡張
- 認証システムの追加
- 管理画面UIの実装
- マイクロサービス化の検討
"""

# バックアップとクリーンアップ
exit
memento backup create
memento dream  # ログ圧縮と最適化
memento stop
```

---

## トラブルシューティング

### Worker が失敗した場合
```bash
# タスク状態確認
ls -la .memento/tasks/completed/

# 失敗タスクの詳細確認
cat .memento/tasks/completed/task_xxx.json | jq .result

# 手動でリトライ
> 先ほど失敗したタスクを修正して再実行してください。
```

### Memory Bank の手動編集
```bash
# 直接編集が必要な場合
vim .memento/memory/core/current.md

# ClaudeCodeから再読み込み
> Memory Bankの内容を確認してください。
```

### システムリカバリー
```bash
# 完全に詰まった場合
memento stop
memento reset --force
memento init

# バックアップから復元
memento backup restore backup_2024-01-20
```

---

## 📈 効果測定

### Worker 1つの場合
- タスク実行時間: 平均3-5分
- 開発者の待機時間: ほぼゼロ（別作業可能）
- コンテキストスイッチ: 最小限

### Worker 複数の場合  
- 並列実行による時間短縮: 最大70%
- リソース使用率: CPU 40-60%（3 Worker時）
- 開発効率: 3倍以上の向上

## 🎓 学習ポイント

1. **Memory Bank活用**
   - こまめな更新で文脈を保持
   - 翌日の作業再開がスムーズ

2. **タスク分割**
   - 独立したタスクは並列実行可能
   - 依存関係があるタスクは順次実行

3. **エラーハンドリング**
   - Workerの失敗は自動的に記録
   - 手動介入で簡単にリカバリー可能

---

以上が、Mementoシステムの実践的な使用例です。実際の開発では、プロジェクトの規模に応じてWorker数を調整し、最適なパフォーマンスを実現してください。