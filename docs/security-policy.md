# Security Policy (Design)

Operational/engineering security design. For vulnerability reporting see [`../SECURITY.md`](../SECURITY.md).

## Authentication

- Passwords hashed with **Argon2** (preferred) or bcrypt. Never stored or logged in plaintext.
- **Access token**: short-lived JWT (default 15 min).
- **Refresh token**: longer-lived, stored hashed, **revocable** (logout + rotation on each refresh).
- **Google Sign-In**: frontend sends a Google ID token; backend verifies signature (JWKS), audience (`GOOGLE_CLIENT_ID`), issuer, expiry, and `email_verified` before issuing an Axonote JWT. Raw tokens and PII are never logged. Failed verification returns a generic `401`. Linking by email is allowed only when Google has verified the email.
- All sensitive endpoints require a valid access token.

## Authorization

- Every `material`, `summary`, `question_set`, `quiz_attempt` is bound to a `user_id`.
- Ownership is checked **server-side on every endpoint**, not merely hidden in the UI.
- Roles: `user` and `admin`. Admin is internal monitoring/moderation only.
- Cross-user access returns `404` to avoid leaking resource existence.

## Upload security

- Extension allow-list: `pdf`, `docx`, `pptx` only.
- Size cap: **20 MB** per upload (MVP).
- Validate **MIME type and magic bytes**, not just the filename.
- Store files under a **random UUID name**, never the user-supplied name.
- Never execute macros or embedded scripts from documents.
- Text extraction runs in an **isolated worker** so a malicious file cannot compromise the API.

## API security

- Validate every request with Pydantic (server) / Zod (client).
- **Rate limit** `login`, `register`, `upload`, and question generation.
- **CORS** allows only the configured frontend origin(s).
- **HTTPS** in production.
- Error responses never expose stack traces, server paths, SQL, or secrets.

## Database security

- SQLAlchemy parameter binding everywhere — no string-built SQL (prevents injection).
- Production DB user is **not root** and has least-privilege grants.
- Credentials come from `.env`; `.env` is **gitignored**.
- Schema changes go through **Alembic** migrations (auditable).

## Frontend security

- Never render raw HTML from user material; summaries and questions are escaped text.
- If cookie-based auth is used, cookies are `HttpOnly`, `Secure`, `SameSite`.
- A baseline **Content-Security-Policy** is set in production.

## DevSecOps

- `.gitignore` rejects `.env`, the uploads folder, caches, and credential files.
- GitHub Actions run lint, test, build, **dependency audit**, and **secret scanning**.
- **Dependabot** is enabled for dependency updates.
- Pull requests require **at least one review** before merging to `main`.
