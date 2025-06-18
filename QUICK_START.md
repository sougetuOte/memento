# 🚀 5分で始めるMemento

## 📋 前提条件の確認（1分）

```bash
# Node.js v22以上の確認
node -v  # v22.x.x 以上であること

# ClaudeCode CLIの確認
claude --version  # インストール済みであること
```

## 🛠️ インストール（2分）

### オプション1: ワンライナーインストール（推奨）
```bash
curl -sSL https://raw.githubusercontent.com/sougetuOte/memento/main/install.sh | bash
```

### オプション2: 手動インストール
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

## 🎯 プロジェクトで使用開始（2分）

```bash
# 1. プロジェクトディレクトリに移動
cd /path/to/your/project

# 2. Mementoを初期化
memento init

# 3. Commanderを起動
memento start

# 4. 別のターミナルでClaudeCodeを起動
claude
```

## ✅ 動作確認

ClaudeCode内で：
```
> こんにちは！プロジェクトの概要を教えてください。

# タスクを作成
> TASK: READMEファイルを作成してください

# 重要なことを記録
> /memory update
```

別ターミナルで：
```bash
# ステータス確認
memento status

# 即座に記録
memento memory "プロジェクトの初期設定完了"

# 振り返り
memento reflect
```

## 🎉 完了！

これでMementoの設定は完了です。

### 便利なエイリアス設定
```bash
# ~/.bashrcに追加
echo "alias mm='memento'" >> ~/.bashrc
echo "alias mms='memento status'" >> ~/.bashrc
echo "alias mml='memento logs --tail 20'" >> ~/.bashrc
echo "alias mmm='memento memory'" >> ~/.bashrc
source ~/.bashrc
```

### 日常の使い方
```bash
# 朝
mm start           # システム起動
mm reflect         # 前日の振り返り

# 作業中
mmm "重要な決定"    # 即座に記録
mms               # ステータス確認
mml               # ログ確認

# 夜
mm backup create   # バックアップ
mm stop           # システム停止（任意）
```

## 🆘 困ったときは

```bash
# ログを確認
memento logs --tail 50

# リセット（最終手段）
memento reset --force
memento init
```

---

**ヒント**: VSCodeを使用している場合は、Claude Extensionと組み合わせることで、より効率的な開発が可能です！