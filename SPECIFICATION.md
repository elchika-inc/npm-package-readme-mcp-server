# npm-readme-mcp サーバー仕様書

## 概要

npm公式サイトからパッケージのREADMEと使用方法を取得し、開発者に分かりやすい形で提供するMCP（Model Context Protocol）サーバーです。

## 目的

- npmパッケージの使用方法を迅速に取得
- READMEから重要な使用例を抽出・整理
- パッケージの基本情報と依存関係の提供
- 開発効率の向上

## システム設計

### アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MCP Client    │───▶│  npm-readme-mcp │───▶│   npm Registry  │
│   (Claude等)    │    │     Server      │    │      API        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   GitHub API    │
                       │  (Fallback)     │
                       └─────────────────┘
```

### 技術スタック

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **MCP SDK**: @modelcontextprotocol/sdk-typescript
- **HTTP Client**: fetch API (Node.js native)
- **Package Manager**: npm

## 機能仕様

### 提供ツール

#### 1. get_package_readme

npmパッケージのREADMEと使用方法を取得します。

**パラメータ:**
```typescript
interface GetPackageReadmeParams {
  package_name: string;    // パッケージ名（必須）
  version?: string;        // バージョン指定（オプション、デフォルト: "latest"）
  include_examples?: boolean; // 使用例を含めるか（オプション、デフォルト: true）
}
```

**レスポンス:**
```typescript
interface PackageReadmeResponse {
  package_name: string;
  version: string;
  description: string;
  readme_content: string;
  usage_examples: UsageExample[];
  installation: InstallationInfo;
  basic_info: PackageBasicInfo;
  repository?: RepositoryInfo;
}
```

#### 2. get_package_info

パッケージの基本情報と依存関係を取得します。

**パラメータ:**
```typescript
interface GetPackageInfoParams {
  package_name: string;
  include_dependencies?: boolean; // 依存関係を含めるか（デフォルト: true）
  include_dev_dependencies?: boolean; // 開発依存関係を含めるか（デフォルト: false）
}
```

**レスポンス:**
```typescript
interface PackageInfoResponse {
  package_name: string;
  latest_version: string;
  description: string;
  author: string;
  license: string;
  keywords: string[];
  dependencies?: Record<string, string>;
  dev_dependencies?: Record<string, string>;
  download_stats: DownloadStats;
  repository?: RepositoryInfo;
}
```

#### 3. search_packages

npmパッケージを検索します。

**パラメータ:**
```typescript
interface SearchPackagesParams {
  query: string;          // 検索クエリ
  limit?: number;         // 結果の上限数（デフォルト: 20）
  quality?: number;       // 品質スコアの最小値（0-1）
  popularity?: number;    // 人気度スコアの最小値（0-1）
}
```

**レスポンス:**
```typescript
interface SearchPackagesResponse {
  query: string;
  total: number;
  packages: PackageSearchResult[];
}
```

### データ型定義

```typescript
interface UsageExample {
  title: string;
  description?: string;
  code: string;
  language: string; // 'javascript', 'typescript', 'bash', etc.
}

interface InstallationInfo {
  npm: string;      // "npm install package-name"
  yarn?: string;    // "yarn add package-name"
  pnpm?: string;    // "pnpm add package-name"
}

interface PackageBasicInfo {
  name: string;
  version: string;
  description: string;
  main?: string;
  types?: string;
  homepage?: string;
  bugs?: string;
  license: string;
  author: string | AuthorInfo;
  contributors?: AuthorInfo[];
  keywords: string[];
}

interface AuthorInfo {
  name: string;
  email?: string;
  url?: string;
}

interface RepositoryInfo {
  type: string;
  url: string;
  directory?: string;
}

interface DownloadStats {
  last_day: number;
  last_week: number;
  last_month: number;
}

interface PackageSearchResult {
  name: string;
  version: string;
  description: string;
  keywords: string[];
  author: string;
  publisher: string;
  maintainers: string[];
  score: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
  searchScore: number;
}
```

## API仕様

### 使用するエンドポイント

#### npm Registry API

1. **パッケージ情報取得**
   - URL: `https://registry.npmjs.org/{package-name}`
   - Method: GET
   - レスポンス: パッケージの全バージョン情報

2. **特定バージョン情報取得**
   - URL: `https://registry.npmjs.org/{package-name}/{version}`
   - Method: GET
   - レスポンス: 指定バージョンの詳細情報

3. **パッケージ検索**
   - URL: `https://registry.npmjs.org/-/v1/search`
   - Method: GET
   - Query Parameters:
     - `text`: 検索クエリ
     - `size`: 結果数
     - `quality`: 品質フィルター
     - `popularity`: 人気度フィルター

#### GitHub API（フォールバック用）

1. **README取得**
   - URL: `https://api.github.com/repos/{owner}/{repo}/readme`
   - Method: GET
   - Headers: `Accept: application/vnd.github.v3.raw`

### ダウンロード統計API

- URL: `https://api.npmjs.org/downloads/point/last-day/{package-name}`
- URL: `https://api.npmjs.org/downloads/point/last-week/{package-name}`
- URL: `https://api.npmjs.org/downloads/point/last-month/{package-name}`

## 実装詳細

### プロジェクト構造

```
npm-readme-mcp/
├── src/
│   ├── index.ts                 # MCPサーバーエントリーポイント
│   ├── server.ts               # MCPサーバー実装
│   ├── tools/
│   │   ├── get-package-readme.ts
│   │   ├── get-package-info.ts
│   │   └── search-packages.ts
│   ├── services/
│   │   ├── npm-registry.ts     # npm Registry APIクライアント
│   │   ├── github-api.ts       # GitHub APIクライアント
│   │   ├── cache.ts           # キャッシュ管理
│   │   ├── readme-parser.ts   # README解析・使用例抽出
│   │   └── download-stats.ts  # ダウンロード統計取得
│   ├── utils/
│   │   ├── logger.ts          # ログ管理
│   │   ├── error-handler.ts   # エラーハンドリング
│   │   └── validators.ts      # 入力値検証
│   └── types/
│       └── index.ts           # 型定義
├── tests/                     # テストファイル
├── package.json
├── tsconfig.json
├── .gitignore
├── README.md
└── SPECIFICATION.md          # この仕様書
```

### キャッシュ戦略

#### メモリキャッシュ

- **対象**: パッケージ基本情報、README内容
- **TTL**: 1時間
- **最大サイズ**: 100MB
- **LRU**: 最近最小使用アルゴリズムで管理

#### キャッシュキー設計

```typescript
interface CacheKey {
  package_info: `pkg_info:${package_name}:${version}`;
  package_readme: `pkg_readme:${package_name}:${version}`;
  search_results: `search:${query_hash}:${limit}`;
  download_stats: `stats:${package_name}:${date}`;
}
```

### エラーハンドリング

#### エラー分類

1. **パッケージ不存在**: 404エラー
2. **API制限**: 429エラー（レート制限）
3. **ネットワークエラー**: タイムアウト、接続エラー
4. **パース エラー**: JSON解析エラー
5. **認証エラー**: GitHub API認証失敗

#### リトライ戦略

- **指数バックオフ**: 1秒、2秒、4秒、8秒
- **最大リトライ回数**: 3回
- **対象エラー**: 429, 500, 502, 503, 504

### README解析ロジック

#### 使用例抽出アルゴリズム

1. **セクション特定**
   - `## Usage`, `## Examples`, `## Quick Start`などを検索
   - 階層構造を考慮した解析

2. **コードブロック抽出**
   - Fenced code blocks (```) の検出
   - 言語指定の認識
   - インラインコードの除外

3. **使用例分類**
   - 基本使用法: "Basic", "Getting Started"
   - 応用例: "Advanced", "Examples"
   - 設定例: "Configuration", "Options"

#### マークダウン処理

- **見出し正規化**: レベル調整
- **リンク処理**: 相対リンクの絶対パス変換
- **画像処理**: GitHub rawリンクへの変換
- **不要セクション除去**: バッジ、スポンサー情報など

## パフォーマンス要件

### レスポンス時間

- **キャッシュヒット**: < 100ms
- **初回取得**: < 2秒
- **検索**: < 3秒

### スループット

- **同時リクエスト処理**: 50件
- **1日あたりのリクエスト**: 10,000件

### メモリ使用量

- **ベースメモリ**: < 50MB
- **キャッシュ込み**: < 150MB

## セキュリティ

### 入力値検証

- パッケージ名の妥当性チェック
- SQLインジェクション対策
- XSS対策（マークダウン出力時）

### API認証

- GitHub API: Personal Access Token（オプション）
- レート制限の監視と調整

### ログ出力

- 個人情報の除外
- セキュリティイベントの記録

## 運用・監視

### ログ出力レベル

- **ERROR**: API呼び出し失敗、予期しないエラー
- **WARN**: レート制限近接、キャッシュミス多発
- **INFO**: リクエスト処理開始・完了
- **DEBUG**: 詳細な処理フロー

### 監視項目

- API呼び出し成功率
- レスポンス時間
- キャッシュヒット率
- メモリ使用量
- エラー発生率

## テスト戦略

### 単体テスト

- 各ツールの機能テスト
- エラーハンドリングテスト
- バリデーションテスト

### 統合テスト

- npm Registry API連携テスト
- GitHub API連携テスト
- キャッシュ動作テスト

### E2Eテスト

- 人気パッケージでの動作確認
- エラーケースでの動作確認

## 設定・環境変数

```bash
# 必須設定
PORT=3000                    # サーバーポート
NODE_ENV=production          # 実行環境

# オプション設定
GITHUB_TOKEN=ghp_xxx         # GitHub API認証トークン
CACHE_TTL=3600              # キャッシュTTL（秒）
CACHE_MAX_SIZE=104857600    # キャッシュ最大サイズ（バイト）
LOG_LEVEL=info              # ログレベル
REQUEST_TIMEOUT=30000       # リクエストタイムアウト（ミリ秒）
```

## 今後の拡張予定

### フェーズ2機能

- パッケージの脆弱性情報取得
- 類似パッケージの推奨
- バージョン更新通知
- 使用統計レポート

### フェーズ3機能

- パッケージ品質スコア算出
- 依存関係グラフ可視化
- カスタムフィルター機能
- Webhook通知機能

## 開発・デプロイ手順

### 開発環境セットアップ

```bash
# プロジェクトクローン
git clone <repository-url>
cd npm-readme-mcp

# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

### ビルド・デプロイ

```bash
# プロダクションビルド
npm run build

# サーバー起動
npm start
```

### MCPクライアント設定例

```json
{
  "mcpServers": {
    "npm-readme": {
      "command": "node",
      "args": ["/path/to/npm-readme-mcp/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "your-token-here"
      }
    }
  }
}
```

---

## 改訂履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| 1.0.0 | 2025-06-13 | 初回作成 |
