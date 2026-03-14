# Trait Map MVP (React + FastAPI)

ゲームキャラクターの性格をベクトルとして管理し、
可視化・比較・編成提案まで行うツールです。

現在は 20 軸（-1.0 〜 1.0）を扱います。

---

## 0. 事前準備 / Prerequisites

- `.venv` - Python 仮想環境（このワークスペースに同梱）
- Node.js 20 以上 + `npm`

## 1. バックエンド起動 / Backend (FastAPI)

PowerShell:

```powershell
cd backend
..\.venv\Scripts\python.exe -m pip install -r requirements.txt
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

メモ:
- `pip install` は初回のみ
- 2回目以降は `uvicorn` の行だけで起動可能

API Docs:
- http://localhost:8000/docs

## 2. フロントエンド起動 / Frontend (React)

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

メモ:
- `npm.cmd install` は初回のみ
- 2回目以降は `npm.cmd run dev` のみ

アプリ:
- http://localhost:5173

## 3. 主な機能 / Features

- 軸セット選択（最大 10 軸、プリセット + 手動編集）
- Trait Map タブ
	- 編成提案（目標人数 + 方針）
	- 散布図（編成提案候補のみ表示）
- Trait Space タブ
	- 10軸の一覧比較
	- 性格検索
	- 自動言い換え表示（上書き対応）
- 性格比較タブ
	- 2性格をレーダーチャート + 差分表で比較
- 使い方タブ
	- 指標・方針・プリセットの説明を集約

## 4. 主要概念 / Scoring Concepts

- 重複回避スコア
	- 採用候補同士の距離の大きさ（高いほど役割が被りにくい）
- 中心偏差
	- 採用集合の平均が中心(0)からどれだけ離れるか（低いほど偏りが小さい）
- 方針
	- 中庸重視 / 多様性重視 / 対立強め

## 5. データ仕様 / Data

- `data/axes.json`
	- vector_version: `0.3`
	- dimension_count: `20`
- `data/traits.csv`
	- 59 traits
	- 各 trait が 20 軸値を保持
- `data/profiles.json`
	- プロファイル重み（API上は利用可能）

## 6. API エンドポイント / API Endpoints

- `GET /health`
- `GET /axes`
- `GET /traits`
- `GET /profiles`
- `POST /compare`
- `POST /recommend`
- `GET /scatter?x_axis=...&y_axis=...`

## 7. ファイル構成 / Structure

```text
backend/app/main.py   ... FastAPI API
frontend/src/App.jsx  ... React UI 本体
frontend/src/styles.css ... UI スタイル
data/axes.json        ... 20軸定義
data/traits.csv       ... 性格ベクトルデータ
data/profiles.json    ... プロファイル定義
src/trait_map_mvp.py  ... 旧CLIスクリプト
```
