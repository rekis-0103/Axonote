# Security Policy

## Reporting a vulnerability

Do **not** open a public issue for security problems.

Email the maintainers (see repo owners) or open a **private security advisory** via GitHub:
`Security` tab -> `Report a vulnerability`.

Please include:

- Affected component (`apps/web`, `apps/api`, `apps/worker`, `infra`).
- Steps to reproduce / proof of concept.
- Impact assessment and any suggested fix.

We aim to acknowledge within **72 hours** and provide a remediation timeline after triage.

## Supported versions

The project is pre-1.0 (MVP). Only `main` receives security fixes.

## Scope highlights

- Authentication: Argon2/bcrypt password hashing, short-lived JWT access tokens, revocable refresh tokens.
- Authorization: per-`user_id` ownership checks on every resource, server-side enforced.
- Upload: extension allow-list (`pdf`, `docx`, `pptx`), size cap (20 MB), MIME + magic-byte validation, randomized stored filenames, no macro/script execution.
- Document parsing runs in an isolated worker process.
- API: Pydantic validation, rate limiting on auth/upload/generation, strict CORS, HTTPS in production, no stack traces in error responses.
- Database: parameterized queries (SQLAlchemy), non-root DB user in production, Alembic-audited migrations.

Full details in [`docs/security-policy.md`](docs/security-policy.md).
