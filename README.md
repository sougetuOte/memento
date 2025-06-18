# Memento - AI記憶支援開発システム

## 🎭 概要

Mementoは、ClaudeCodeをベースにした個人開発者向けのAI支援開発環境です。階層化Memory Bankによる文脈保持と、効率的なタスク実行を両立させるCommander-Workerシステムを実現します。

## ✨ 特徴

- 🧠 **Memory Bank**: プロジェクト固有の知識を永続的に保持
- 🤖 **Commander-Worker構成**: 効率的なタスク分割と並列実行
- 🔄 **自動リカバリー**: エラー時も必ず復旧可能な堅牢設計
- 🖥️ **VSCode統合**: 最小2ターミナルで完結する効率的な開発フロー

## 🚀 クイックスタート

### 前提条件
- Node.js v22.0.0以上（`.nvmrc`ファイルでバージョン管理）
- ClaudeCode CLI (`claude`)
- Ubuntu/macOS（WSL2でも動作）

開発者の場合：
```bash
# nvmでバージョン管理
nvm use  # .nvmrcから自動的にv22.0.0を使用
```

### インストール

#### オプション1: ワンライナーインストール（推奨）
```bash
curl -sSL https://raw.githubusercontent.com/sougetuOte/memento/main/install.sh | bash
```

#### オプション2: 手動インストール
```bash
# 作業ディレクトリを作成
mkdir ~/memento-system
cd ~/memento-system

# 配布ファイルをダウンロード・解凍
# 必要なファイル:
# - memento-cli.js
# - commander.js
# - worker-manager.js
# - memento (実行ファイル)
# - package.json

# 実行権限を付与
chmod +x memento

# グローバルインストール
sudo ln -s $(pwd)/memento /usr/local/bin/memento
```

### 初期設定

```bash
# プロジェクトディレクトリで実行
cd /path/to/your/project
memento init
```

### 基本的な使い方

```bash
# Commanderを起動
memento start

# 別ターミナルでClaudeCodeを起動
claude

# ClaudeCode内で対話
> こんにちは！新機能を追加したいです
> TASK: ユーザー認証機能の実装

# 即座にMemory Bankに記録
memento memory "JWT認証の実装を決定"

# 最近の活動を振り返る
memento reflect

# ステータス確認
memento status
```

## 📁 ディレクトリ構造

```
.memento/
├── memory/             # Memory Bank（知識の永続化）
│   ├── core/          # 現在の状態、次のステップ、概要
│   ├── context/       # 技術的決定、開発履歴
│   └── commands/      # コマンドテンプレート
├── system/            # システムファイル
├── tasks/             # タスク管理
│   ├── pending/       # 待機中
│   ├── processing/    # 実行中
│   └── completed/     # 完了
└── logs/              # ログファイル
```

## 🎮 コマンドリファレンス

### 基本コマンド
| コマンド | 説明 |
|---------|------|
| `memento init` | システムを初期化 |
| `memento start` | Commanderを起動 |
| `memento stop` | Commanderを停止 |
| `memento status` | ステータス確認 |
| `memento logs` | ログ表示 |
| `memento backup` | バックアップ管理 |

### 特別なコマンド
| コマンド | 説明 |
|---------|------|
| `memento memory "内容"` | 即座にMemory Bankに記録 |
| `memento reflect` | 最近の活動を要約 |
| `memento dream` | バックグラウンドで最適化実行 |

### ログオプション
```bash
memento logs --tail 20    # 最新20件
memento logs --follow     # リアルタイム表示
memento logs -f          # --followの短縮形
```

## 🖥️ VSCode統合（推奨構成）

### 2ターミナル構成
1. **外部ターミナル1**: `memento start`（起動後は触らない）
2. **外部ターミナル2**: `memento logs -f`（常時監視）
3. **VSCode内**: Claude Extension + 統合ターミナル

### 推奨エイリアス
```bash
# ~/.bashrcに追加
alias mm='memento'
alias mms='memento status'
alias mml='memento logs --tail 20'
alias mmm='memento memory'
```

## 🔧 トラブルシューティング

### Commanderが起動しない
```bash
memento logs --tail 50
# プロセスを確認
ps aux | grep memento
```

### タスクが処理されない
```bash
# タスク状態を確認
ls -la .memento/tasks/processing/
# 手動で完了に移動
mv .memento/tasks/processing/*.json .memento/tasks/completed/
```

### 完全リセット
```bash
memento reset --force
memento init
```

## 🎯 使用例

### 朝のルーティン
```bash
# 1. システム起動
memento start

# 2. 振り返り
memento reflect

# 3. ClaudeCodeで作業開始
claude
> おはようございます。前回の続きから始めます。
```

### 重要な決定の記録
```bash
memento memory "APIレスポンス形式をJSONAPIに統一することを決定"
```

### 1日の終わり
```bash
# 活動の振り返り
memento reflect

# バックアップ作成
memento backup create

# システム停止（任意）
memento stop
```

## 🗑️ アンインストール

### コマンドでアンインストール（推奨）
```bash
memento uninstall
```

このコマンドは以下を実行します：
- 実行中のCommanderを停止
- グローバルコマンド（/usr/local/bin/memento）を削除
- インストールディレクトリ（~/.memento）を削除

### 手動でアンインストール
```bash
# 1. 実行中のCommanderを停止
memento stop

# 2. グローバルコマンドを削除（要sudo）
sudo rm -f /usr/local/bin/memento

# 3. インストールディレクトリを削除
rm -rf ~/.memento

# 4. 各プロジェクトのデータを削除（必要に応じて）
rm -rf .memento
rm -rf .memento_backups

# 5. .bashrcからエイリアスを削除（追加した場合）
# 以下の行を.bashrcから削除：
# alias mm='memento'
# alias mms='memento status'
# alias mml='memento logs --tail 20'
# alias mmm='memento memory'
# alias mmr='memento reflect'
```

### プロジェクト単位でのクリーンアップ
特定のプロジェクトからMementoデータを削除する場合：
```bash
# プロジェクトディレクトリで実行
memento reset --force
```

## 📝 ライセンス

MIT License

## 🤝 貢献

プルリクエスト歓迎です！詳細は [CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。

開発環境の設定：
- `.editorconfig` でコードスタイルを統一
- `.nvmrc` でNode.jsバージョンを固定

## 📞 サポート

Issues: https://github.com/sougetuOte/memento/issues

## 📚 詳細ドキュメント

- [テストシナリオ集](TEST_SCENARIOS.md) - 実際の使用例とベストプラクティス
- [貢献ガイドライン](CONTRIBUTING.md) - 開発に参加する方法

## 🚀 クイックインストール

```bash
# GitHubユーザー名を設定してインストール
GITHUB_USER=sougetuOte curl -sSL https://raw.githubusercontent.com/sougetuOte/memento/main/install.sh | bash

# または手動でclone
git clone https://github.com/sougetuOte/memento.git
cd memento
chmod +x memento
sudo ln -s $(pwd)/memento /usr/local/bin/memento
```

## 📚 詳細ドキュメント

- [TEST_SCENARIOS.md](TEST_SCENARIOS.md) - 実践的なテストシナリオ
- [CONTRIBUTING.md](CONTRIBUTING.md) - 貢献ガイドライン