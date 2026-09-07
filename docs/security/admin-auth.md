# Administrative authentication

Admin uses opaque 256-bit random server sessions. Only the SHA-256 token hash is stored; the browser receives an HttpOnly, SameSite=Strict cookie, Secure in production, expiring after eight hours. No session token is kept in browser storage. Disabled accounts and current role permissions are checked on every request; logout revokes the session.

Passwords use scrypt N=131072, r=8, p=1 with independent random salts. Accounts are created through the operator-only `infra/bootstrap-admin.ts` command with DATABASE_URL and SERVER_BOOTSTRAP_EMAIL/PASSWORD/ROLE supplied securely in process environment. There is no default account or public registration. Bootstrap does not change existing credentials. Never commit bootstrap values or paste them into issue reports.

Roles and role permissions live separately. DATA_VIEWER reads; DATA_EDITOR edits/imports; VERIFIER verifies; PUBLISHER publishes; SYSTEM_ADMIN also configures. Users may have multiple roles. Every application mutation must require its own permission, even when the enclosing page is protected.

Cookie-authenticated writes and login require an exact Origin match with SERVER_ORIGIN. JSON bodies have stream-enforced limits. Credentials, cookies and request bodies are absent from structured logs. Authentication failures have generic messages. Five failed logins per account in 15 minutes trigger a 15-minute lock; password derivation is serialized with a database advisory lock to bound concurrent memory use. Add a trusted ingress request limiter for production, without trusting arbitrary client IP headers.

The first administrator must be provisioned with the migration owner connection. Production runtime uses a separate least-privileged database account. Session tables are private. External identity federation/MFA may be added under a separate reviewed authentication change; no mock authentication is used in production.
