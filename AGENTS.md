# Lock Gold Free — project delta

- This is a new local development application. Do not push, publish, deploy, or call a real account without operator authorization.
- Stack: React, Vite, Node.js, Express, and the pinned `locket.js@0.0.3` SDK. Keep SDK and credentials on the server.
- Read `DESIGN.md`, `SYSTEM_DOCUMENTATION.md`, and `docs/spec.md` before changing behavior. English identifiers; Vietnamese UI.
- Verification: `make build`, `make test`, `make lint`, `node scripts/check-docs.js`; two browser rounds at desktop/mobile widths in light/dark mode.
- Use allowlisted operations, strict validation, opaque HttpOnly session cookies, same-origin mutation checks, bounded uploads, and cleanup on logout/expiry. Never return account tokens or log passwords.
- SDK internals (raw HTTP, local history recording, serializers) are not user features. All supported account-facing capabilities are catalogued in `shared/operations.js` and `docs/api-coverage.md`.
- Global template and file-creation checklist were absent at the configured locations during setup; this file records only project-specific rules.
