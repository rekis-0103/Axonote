# apps/worker — analysis worker (skeleton)

Minimal poll-loop skeleton. The NLP pipeline is not implemented yet — see
[`../../docs/architecture.md`](../../docs/architecture.md).

## Run

```bash
python -m venv .venv
. .venv/Scripts/activate        # Windows
pip install -r requirements.txt
python -m worker.main
```

## Test / lint

```bash
pytest
ruff check .
```
