# 設計書：おてつだいきゅうよ（家族向け仕事ボード＆給与計算アプリ）

## 1. 概要

子どもと遊ぶための「お手伝い仕事ボード＋給与計算」アプリ。家族（父・母・子ども）を個人単位で登録し、仕事（掃除など）にタイトル・給与・説明・曜日を設定してボードに掲示する。誰でも仕事の「完了」を押すとその人の給与に即時加算され、累計は子ども自身が「もらった！」ボタンで精算する。

- 対象: 家族内利用（共通パスワード1つで全員が同じ操作権限を持つ）
- ホスティング: Vercel
- リポジトリ: https://github.com/nakadaisuke/homework_salary

## 2. 技術スタック

| 分類 | 技術 |
|---|---|
| フロントエンド | Next.js 16（App Router, TypeScript） |
| バックエンドAPI | Python 3.12 / Flask（単一アプリ、`api/index.py`） |
| DB | Prisma Postgres（Vercel Marketplace経由、直接TCP接続） |
| 認証 | 共通パスワード → JWT（HttpOnly Cookie） |
| Pythonローカル環境 | venv + `requirements.txt` |
| Pythonビルド（Vercel側） | `uv`（`.python-version`でPython 3.12を指定） |

### 2.1 主要な設計判断（実装中に確定した内容）

- **APIはNext.js Route HandlerではなくPython(Flask)に統一**：Python/venvの利用を実質的なものにするため、データ操作は全て`api/index.py`に寄せている。
- **Flaskは単一アプリとして1つのVercel Functionにまとめる**：Vercelの Flask フレームワークプリセットは「`app`という名前のFlaskインスタンスをエントリポイントで1つだけ検出し、1つのVercel Functionとしてデプロイする」仕様のため、`api/auth.py`のようにリソースごとにファイルを分割する案は採用せず、`api/index.py`内に全ルート（`/api/auth`, `/api/people`, `/api/jobs`, `/api/completions`, `/api/settlements`）をまとめている。
- **`middleware.ts`ではなく`proxy.ts`**：Next.js 16でMiddlewareが Proxy に改称されたため、認証ゲートは`proxy.ts`に実装。Node.jsランタイムで動作する。
- **DBはPrisma Postgres（Neonではなく）**：ユーザーがVercelダッシュボードでPrisma Postgresを先に作成したため採用。アプリはPrisma ORMを使わず生のSQL（psycopg）でアクセスしており、`DATABASE_URL`はPrisma Postgresの「直接TCP接続」文字列（`postgres://...@db.prisma.io:5432/postgres?sslmode=require`）を使用している。Vercel Marketplace経由で作成した場合、この手のDB接続系の環境変数は「sensitive」指定となり`vercel env pull`では値を取得できないため、値はVercelダッシュボードのStorageタブから取得し、ローカルの`.env.local`に手動で設定した。
- **ジョブの削除は論理削除（`is_active=false`）**：完了履歴（`completions`）がジョブを参照しているため、物理削除すると履歴が壊れる。
- **完了時にジョブ名・金額をスナップショット保存**：`completions.job_title_snapshot` / `salary_yen_snapshot`に完了時点の値を保存することで、後からジョブを編集・削除しても過去の履歴表示が変わらないようにしている。
- **精算（せいさん）は子どもが行うUI文言**：「もらった！」ボタンとして表現。共通パスワードのため権限的な強制はできないが、UI上の約束事として子ども向けの操作という位置づけにしている。

## 3. ディレクトリ構成

```
.
├── app/
│   ├── layout.tsx                 # ルートレイアウト（最小限）
│   ├── page.tsx                   # /board にリダイレクト
│   ├── login/page.tsx             # パスワードゲート画面
│   └── (main)/                    # 認証後のページ群（ナビ付きレイアウト）
│       ├── layout.tsx
│       ├── board/page.tsx         # 仕事ボード
│       └── people/
│           ├── page.tsx           # メンバー一覧・残高
│           └── [personId]/page.tsx  # 個人の履歴・精算
├── components/                    # Client Components（フォーム・カード等）
├── lib/
│   ├── types.ts                   # 共有TS型定義
│   ├── session.ts                 # proxy.ts用JWT検証（jose）
│   └── api-client.ts              # Server Component用フェッチヘルパー（cookie転送）
├── proxy.ts                       # 認証ゲート（Next.js 16の旧middleware.ts）
├── api/
│   ├── index.py                   # Flaskアプリ本体（全APIルート）
│   └── _lib/
│       ├── db.py                  # psycopg接続ヘルパー
│       ├── auth.py                # JWT発行・検証・require_authデコレータ
│       └── schema.sql             # DDL
├── scripts/init_db.py             # schema.sqlをDBに適用するスクリプト
├── requirements.txt                # Flask, psycopg[binary], pyjwt, python-dotenv
├── .python-version                 # 3.12
├── vercel.json                     # framework: "nextjs" を明示
└── .env.example
```

## 4. データベース設計

```sql
people        (id, name, role[father|mother|child], created_at)
jobs          (id, title, salary_yen, description, days_of_week[smallint[]], is_active, created_at, updated_at)
settlements   (id, person_id, total_yen, settled_at)
completions   (id, person_id, job_id, job_title_snapshot, salary_yen_snapshot,
               completed_on, settlement_id[null=未精算], created_at)
```

- 未精算残高 = `SUM(salary_yen_snapshot) WHERE person_id=? AND settlement_id IS NULL`
- 精算処理はトランザクションで `settlements` に1行INSERT →該当する未精算 `completions` の `settlement_id` を一括UPDATE
- `days_of_week`: 0=日〜6=土のsmallint配列

## 5. API仕様（`api/index.py`, Flask）

| メソッド | パス | 認証 | 説明 |
|---|---|---|---|
| POST | `/api/auth` | 不要 | パスワード検証→JWT Cookie発行 |
| DELETE | `/api/auth` | 不要 | ログアウト（Cookie削除） |
| GET | `/api/people` | 要 | 一覧（未精算残高付き） |
| POST | `/api/people` | 要 | 作成（name, role） |
| PATCH | `/api/people/<id>` | 要 | 編集 |
| DELETE | `/api/people/<id>` | 要 | 削除 |
| GET | `/api/jobs` | 要 | 一覧（`is_active=true`のみ） |
| POST | `/api/jobs` | 要 | 作成 |
| PATCH | `/api/jobs/<id>` | 要 | 編集 |
| DELETE | `/api/jobs/<id>` | 要 | 論理削除（`is_active=false`） |
| GET | `/api/completions?person_id=` | 要 | 完了履歴取得 |
| POST | `/api/completions` | 要 | 完了登録（給与即時加算） |
| GET | `/api/settlements?person_id=` | 要 | 精算履歴取得 |
| POST | `/api/settlements` | 要 | 精算（未精算分を一括精算） |

認証は`api/_lib/auth.py`の`require_auth`デコレータで、CookieのJWTを検証（`pyjwt`, HS256）。

## 6. 認証フロー

1. `/login`でパスワード入力 → `POST /api/auth`
2. Flaskがパスワードを検証し、JWT（`{ok: true, iat, exp}`, 有効期限30日）を発行してHttpOnly Cookie（`session`）にセット
3. `proxy.ts`が全ページアクセス時にCookieのJWTを`jose`で検証し、無効なら`/login`にリダイレクト
4. 各APIリクエストもFlask側で同じJWTを`pyjwt`で再検証（`JWT_SECRET`はNext.js側・Python側で共有）

## 7. 環境変数

| 変数名 | 用途 | 備考 |
|---|---|---|
| `DATABASE_URL` | Postgres接続文字列 | Prisma Postgresの直接TCP接続文字列 |
| `APP_PASSWORD` | 家族共通ログインパスワード | |
| `JWT_SECRET` | セッションJWT署名鍵 | `proxy.ts`（jose）と`api/_lib/auth.py`（pyjwt）で共有 |

`vercel env add`でProduction/Preview/Development全てに設定済み。`DATABASE_URL`系はMarketplace連携により「sensitive」指定でCLIから値を取得できないため、ローカル開発用の値はVercelダッシュボードのStorageタブから手動取得して`.env.local`に設定している。

## 8. ローカル開発・デプロイ運用上の注意（実装中に判明した事項）

- **`vercel dev`は現行バージョン（Vercel CLI 56.3.2 / Next.js 16.2.10）でクラッシュするバグがある**（`deserializeOutput`関連、Next.js標準スキャフォールドのみでも再現、Python/アプリコード非依存）。ローカル検証は`vercel dev`ではなく`vercel build`（本番相当のビルドのみ実行）で行う。
- Python関数のビルドには`uv`が必要（`brew install uv`）。ローカルの`requirements.txt`から`uv`が自動的に`pyproject.toml`/`uv.lock`を生成するが、これらはビルド成果物なので`.gitignore`対象にしている。
- Vercel Marketplace経由でDBを追加すると、対象の環境変数はデフォルトで Production / Preview のみに設定され、Developmentには設定されない。ローカルで直接DBスクリプトを実行する場合は、ダッシュボードから接続文字列を取得して`.env.local`に手動追加する必要がある。

## 9. 未対応・今後の確認事項

- プレビューデプロイに Vercel の Deployment Protection（Vercel Authentication/SSO）がデフォルトで有効になっており、アプリ自身のパスワードゲートとは別に Vercel アカウントでの認証が求められる状態を確認済み。家族がアクセスできるようにするには、本番デプロイ時にこの保護を無効化するか、Protection Bypass の設定が必要（要対応）。
