#!/bin/bash

# Mementoシステム インストールスクリプト
# 使用方法: curl -sSL https://your-domain.com/install.sh | bash

set -e  # エラーで停止

# カラーコード
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ロゴ表示
echo -e "${BLUE}"
echo " __  __                           _        "
echo "|  \/  | ___ _ __ ___   ___ _ __ | |_ ___  "
echo "| |\/| |/ _ \ '_ \` _ \ / _ \ '_ \| __/ _ \ "
echo "| |  | |  __/ | | | | |  __/ | | | || (_) |"
echo "|_|  |_|\___|_| |_| |_|\___|_| |_|\__\___/ "
echo ""
echo "AI記憶支援開発システム"
echo -e "${NC}"
echo ""

# 前提条件チェック
echo -e "${YELLOW}🔍 前提条件をチェックしています...${NC}"

# Node.jsチェック
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.jsがインストールされていません${NC}"
    echo "Node.js v22以上をインストールしてください: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo -e "${RED}❌ Node.js v22以上が必要です（現在: v$NODE_VERSION）${NC}"
    exit 1
fi

# ClaudeCodeチェック
if ! command -v claude &> /dev/null; then
    echo -e "${RED}❌ ClaudeCode CLIがインストールされていません${NC}"
    echo "以下のコマンドでインストールしてください:"
    echo "npm install -g @anthropic-ai/claude-code"
    exit 1
fi

echo -e "${GREEN}✅ 前提条件OK${NC}"
echo ""

# インストール先の選択
INSTALL_DIR="$HOME/.memento"
echo -e "${YELLOW}📁 インストール先: $INSTALL_DIR${NC}"

# 既存インストールのチェック
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}⚠️  既存のインストールが見つかりました${NC}"
    read -p "上書きしますか？ (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "インストールをキャンセルしました"
        exit 0
    fi
    rm -rf "$INSTALL_DIR"
fi

# ディレクトリ作成
echo -e "${BLUE}📦 ファイルをダウンロードしています...${NC}"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# ファイルのダウンロード
BASE_URL="https://raw.githubusercontent.com/${GITHUB_USER:-sougetuOte}/memento/main"

# ファイルをダウンロード
curl -sSL "$BASE_URL/commander.js" -o commander.js
curl -sSL "$BASE_URL/worker-manager.js" -o worker-manager.js
curl -sSL "$BASE_URL/memento-cli.js" -o memento-cli.js
curl -sSL "$BASE_URL/memento" -o memento
curl -sSL "$BASE_URL/package.json" -o package.json
curl -sSL "$BASE_URL/README.md" -o README.md

# 実行権限を付与
chmod +x memento

# シンボリックリンク作成
echo -e "${BLUE}🔗 グローバルコマンドを設定しています...${NC}"
sudo ln -sf "$INSTALL_DIR/memento" /usr/local/bin/memento

# 完了メッセージ
echo ""
echo -e "${GREEN}🎉 インストール完了！${NC}"
echo ""
echo "次のステップ:"
echo "1. プロジェクトディレクトリに移動"
echo "   cd /path/to/your/project"
echo ""
echo "2. システムを初期化"
echo "   memento init"
echo ""
echo "3. Commanderを起動"
echo "   memento start"
echo ""
echo "4. 別のターミナルでClaudeCodeを起動"
echo "   claude"
echo ""
echo -e "${BLUE}📚 詳細なドキュメント: $INSTALL_DIR/README.md${NC}"
echo ""

# .bashrcへの追加を提案
echo -e "${YELLOW}💡 ヒント: 以下を ~/.bashrc に追加すると便利です:${NC}"
echo "alias mm='memento'"
echo "alias mms='memento status'"
echo "alias mml='memento logs --tail 20'"
echo "alias mmm='memento memory'"
echo "alias mmr='memento reflect'"
echo ""