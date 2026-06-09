# Contributing

## Workflow

1. Sync `main`: `git pull --ff-only`.
2. Branch: `git checkout -b <type>/<short-desc>` (e.g. `feat/upload-api`, `fix/jwt-refresh`).
3. Commit using Conventional Commits (below).
4. Push and open a PR. CI must be green and **at least one review** is required before merge.
5. Squash-merge into `main`.

## Branch naming

`feat/…`, `fix/…`, `chore/…`, `docs/…`, `refactor/…`, `test/…`, `ci/…`

## Commit messages (Conventional Commits)

```
<type>(<scope>): <summary>

<body>
```

Examples: `feat(api): add material upload endpoint`, `fix(worker): handle empty pptx`.

## Code ownership (suggested)

| Area              | Scope                                       |
| ----------------- | ------------------------------------------- |
| `apps/web`        | Next.js UI, data fetching                   |
| `apps/api`        | FastAPI routes, models, migrations          |
| `apps/worker`     | Parsing + NLP pipeline                      |
| `packages/shared` | Cross-cutting contract types                |
| `infra` / `docs`  | Compose, MySQL, CI, documentation           |

## Local checks before pushing

- Web: `npm run lint:web && npm run typecheck`
- API: `cd apps/api && ruff check . && pytest`
- Worker: `cd apps/worker && ruff check . && pytest`

## Definition of done

- Tests added/updated and passing.
- No secrets committed; `.env` stays local.
- Public API changes reflected in [`api-contract.md`](api-contract.md) and `packages/shared`.
- DB changes ship with an Alembic migration.
