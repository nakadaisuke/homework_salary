# おてつだいきゅうよ

家族向けの「お手伝い仕事ボード + 給与計算」アプリ。Next.js（フロントエンド）+ Vercel Python Serverless Functions（Flask, `/api`）+ Vercel Postgres（Neon）構成。

## ローカル開発

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

npm install

vercel link                   # 初回のみ、Vercelプロジェクトと紐付け
vercel env pull .env.local    # DATABASE_URL / APP_PASSWORD / JWT_SECRET を取得

python scripts/init_db.py     # DBスキーマを作成（初回のみ）

vercel dev                    # Next.js + Python api/ を同時起動
```

`http://localhost:3000` を開く。

## 環境変数

`.env.example` を参照。`vercel env pull` で `.env.local` に取得するのが基本だが、手動で用意する場合は以下を設定する。

- `DATABASE_URL`: Vercel Postgres（Neon）のプールド接続文字列
- `APP_PASSWORD`: 家族共通のログインパスワード
- `JWT_SECRET`: セッションJWTの署名鍵（`openssl rand -base64 32` などで生成）

## 構成

- `app/`: Next.js App Router（ページ・UI）
- `api/index.py`: Flask アプリ（`/api/auth`, `/api/people`, `/api/jobs`, `/api/completions`, `/api/settlements`）。単一の Vercel Function としてデプロイされる。
- `api/_lib/`: DB接続・認証（JWT）・スキーマ定義
- `proxy.ts`: 未ログイン時のページリダイレクト（Next.js 16 で `middleware.ts` から改称）
- `scripts/init_db.py`: `api/_lib/schema.sql` をDBに適用するワンショットスクリプト

## デプロイ

1. GitHub リポジトリにpushし、Vercel でインポート。
2. Vercel ダッシュボード → Storage → Postgres を作成しプロジェクトに接続（`DATABASE_URL` 等が自動設定される）。
3. `APP_PASSWORD` と `JWT_SECRET` を Project Settings → Environment Variables に追加。
4. ローカルから本番の `DATABASE_URL` に対して `python scripts/init_db.py` を一度実行してスキーマを作成。
5. `main` にpushしてデプロイ。
