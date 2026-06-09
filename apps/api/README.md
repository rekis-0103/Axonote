# apps/api — FastAPI backend (skeleton)

Minimal runnable FastAPI app. Feature endpoints (auth, materials, jobs, quiz) are intentionally not implemented yet — see [`../../docs/api-contract.md`](../../docs/api-contract.md) for the planned contract.

## Run

```bash
python -m venv .venv
. .venv/Scripts/activate        # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- Health: http://localhost:8000/health
- Docs:   http://localhost:8000/docs

## Test / lint

```bash
pytest
ruff check .
```
