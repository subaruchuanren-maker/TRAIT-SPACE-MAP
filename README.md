# Trait Map MVP (React + FastAPI)

## 0. Prerequisites
- Python virtual environment at `.venv` (already present in this workspace)
- Node.js 20+ with `npm` available in PATH (required for React dev server)

## 1. Backend (FastAPI)

```bash
cd backend
"../.venv/Scripts/python.exe" -m pip install -r requirements.txt
"../.venv/Scripts/python.exe" -m uvicorn app.main:app --reload --port 8000
```

Open API docs:
- http://localhost:8000/docs

## 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Open app:
- http://localhost:5173

## 3. Included MVP features
- 10-axis data loading from `data/axes.json`
- 12 traits loading from `data/traits.csv`
- 3 profile loading from `data/profiles.json`
- Scatter (X/Y axis selectable)
- Trait compare (A/B)
- Profile recommendation (top 3)
