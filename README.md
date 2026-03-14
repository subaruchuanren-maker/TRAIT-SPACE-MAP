# Trait Map MVP (React + FastAPI)

ゲームキャラクターの性格を10次元ベクトルで定義し、Trait Space上で可視化・比較・推薦するツールのMVPです。

---

## 0. 事前準備 / Prerequisites

- `.venv` — Pythonの仮想環境（このワークスペースに含まれています）
- Node.js 20以上 + `npm`（Reactの開発サーバーに必要）

## 1. バックエンド起動 / Backend (FastAPI)

PowerShell の場合:

```powershell
cd backend
..\.venv\Scripts\python.exe -m pip install -r requirements.txt
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

> `pip install` は初回のみ。2回目以降は最後の行だけでOK。

APIドキュメント:
- http://localhost:8000/docs

## 2. フロントエンド起動 / Frontend (React)

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

> `npm.cmd install` は初回のみ。2回目以降は最後の行だけでOK。  
> PowerShellで `npm` が弾かれる場合は `npm.cmd` を使う（詳細は [起動手順.md](起動手順.md)）。

アプリ:
- http://localhost:5173

## 3. 現在のMVP機能 / Included MVP features

- 10軸データ読み込み（`data/axes.json`）
- 59種の性格データ読み込み（`data/traits.csv`）
- 3プロファイル読み込み（`data/profiles.json`）
- 散布図表示（X/Y軸選択可）
- 性格比較（A/B軸別差分）
- プロファイル推薦（上位3件）

## 4. ファイル構成 / Structure

```
backend/app/main.py     … FastAPI エンドポイント
frontend/src/App.jsx    … React UI
data/axes.json          … 10次元の軸定義
data/traits.csv         … 性格ベクトルデータ
data/profiles.json      … 推薦用プロファイル重み
src/trait_map_mvp.py    … CLIで同じデータを操作する旧スクリプト
起動手順.md              … 詳細な起動手順・トラブルシューティング
```
