# Lock Gold Free — system documentation

Version: 0.1.0
Status: Development; live Locket interoperability unverified

<!-- docs-check: API coverage is verified against shared/operations.js -->

## Run locally

Requirements: Node.js 24+, npm and ffmpeg (available on the development machine).

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4317. Override the local port with `PORT`. The server binds only to loopback. To run a prebuilt local artifact, use `make build`, then `npm start`. Source editing and Vite run only in development. No hosting registration, runtime deployment, migration, or production changes were performed. The operator subsequently authorized source publication to https://github.com/maiychrus25/Locket-Gold-Free, branch main.

## Architecture and dependencies

React renders the website; Vite builds browser assets to `dist/`. Express serves the API and prebuilt assets. `locket.js@0.0.3` handles the private Locket/Firebase protocol; the lockfile fixes the exact installed dependency graph. Zod validates the operation contract; Multer bounds multipart inputs; Helmet supplies response security headers; Lucide supplies icons. Sharp and ws are reused through the SDK. No Python service, database, client state framework, or custom media codec is added.

`shared/operations.js` is the single allowlist and form metadata source. Main screens use dedicated everyday flows; advanced tools cover all other supported operations. The account-facing API inventory and exclusions are in [api-coverage.md](docs/api-coverage.md).

The application layout is documented in [architecture.md](docs/architecture.md). `src/main.jsx` bootstraps `src/app/App.jsx`; feature panels, shared UI, browser helpers and styles have separate directories. `server/app.js` composes middleware, session lifecycle and five route modules. SDK integration and the isolated media worker live in `server/services/locket/`. Capability descriptors live under `shared/operations/`; the registry keeps its existing exports and ordering. The refactor adds no dependencies and preserves the HTTP/UI contracts except the documented transient-error metadata below.

## HTTP contract

| Route | Purpose |
| --- | --- |
| GET /api/health | Local backend and pinned SDK version |
| GET /api/catalog | Operation fields, caption presets, emoji and runtime media support |
| GET /api/auth/session | Authentication state and safe user/device summary |
| POST /api/auth/login | `{email,password}`; returns safe session state and sets opaque cookie |
| POST /api/auth/logout | Invalidates session, closes streams and clears cookie |
| POST /api/operations/:group/:method | Strictly validated direct field object; returns `{data}` |
| POST /api/media/:operation | Multipart `options` JSON plus `image`/`video`; JSON or binary download |
| GET /api/chat/events?otherUserId=UID | SSE `message`, `status` and `error` events from SDK WebSocket |

All mutating requests require `X-Lock-Client: web` and a same-origin Origin when supplied. The web client also binds account operations and logout to the safe session `generation` using `X-Lock-Session`; SSE carries the marker in its query. A mismatched supplied marker returns 409 `SESSION_CHANGED` before running the SDK. Direct non-browser API callers may omit this UI binding. The marker is not an authentication credential. API responses are no-store. Errors return `{error}` with a non-2xx status. There is no arbitrary method/endpoint proxy, filesystem-path input, or arbitrary remote-media fetch. Upload local files; upstream media-download URLs remain in returned account data.

When an SDK error carries upstream status 502, 503 or 504, HTTP remains 502 and the body additionally includes `code: "UPSTREAM_UNAVAILABLE"`, `upstreamStatus` and `outcome: "unknown"`. The redacted error message explains that completion is unconfirmed and history should be checked before retrying. No automatic write retry is added; drafts stay available. Other failures retain their existing response shape. This classification does not assert that a failed gateway response means no post was created.

## Sessions and sensitive data

An unpredictable 256-bit session ID lives in an HttpOnly SameSite=Strict cookie; real access/refresh tokens remain in server memory. Session age is two hours. Passwords are passed to Firebase only for login and are neither stored nor logged. SDK session persistence is disabled. SDK history is isolated in a private OS temporary directory and removed after logout, expiry or graceful shutdown, after active work completes. Redaction retains the secrets needed for in-flight responses even if logout clears the client tokens.

The development runtime is a single Node process with in-memory sessions. Restarts require login again. No multi-process or persistent hosted session store is claimed. Production cookie Secure is enabled by NODE_ENV=production; APP_ORIGIN supplies the exact allowed origin/host. Before a future public deployment, use TLS and decide hosting/session durability as a separate authorized change. SSE is session-bound and upstream sockets close on disconnect/logout/expiry. The SDK can swallow some Firestore errors into empty arrays; the UI cannot distinguish those from genuinely empty results.

Frontend requests use a session epoch so a late 401 or result from an older login cannot replace a newer session. Drafts, confirmations and account panels reset on a generation change. Recipient/lookup inputs are locked during their requests; friend actions use the returned UID, and changing a history filter discards its old cursor.

The SDK incorrectly labels unfiltered history entries with the current UID. The adapter removes that inferred author and marks `authorVerified: false`; explicit user-filtered queries have a verified author. The personal-history tab defaults to the current UID. Comments require a known author and the delete button appears only on posts whose author matches the account. Advanced tools remain available for explicit SDK operations, with provider authorization still enforced upstream.

## Media limits and cleanup

Each input file is at most 32 MiB, with at most one image and one video per request. Image decoding is bounded to 40 million input pixels. Image MIME is allowlisted and actual bytes are inspected by Sharp; videos require recognized MP4/MOV/WebM signatures. Local filesystem paths and user-controlled media download URLs are not passed to the SDK.

Only two media operations run globally and one per account. A browser disconnect does not release an active SDK processing slot. Each media operation runs in an isolated Node worker/process group, with its own TMPDIR and a 180-second deadline. Both ffmpeg and its Node owner are stopped before cleanup. The entire job directory is removed on success, error and timeout. A hard machine/process crash can still leave OS temporary files; graceful shutdown cleans resources. The worker sends tokens only over local IPC and never prints them. Uploading a file does not activate Locket Gold.

Worker results preserve the posted-moment history in the parent session directory. A worker may update parent tokens only if they have not changed since dispatch; any worker token is retained for response redaction. MOV/WebM inputs are transcoded to an MP4 container before upload rather than labeled as MP4 without conversion.

The internal worker failure IPC now carries an optional integer `statusCode` alongside its existing redacted-at-response message and refreshed session fields. The parent reconstructs the SDK error status for API classification. No raw upstream response body is forwarded as metadata. This is an internal IPC change, not a credential export.

The SDK's video storage limit is 6,291,455 bytes; automatic compression targets 5,650,000 bytes by default. The website offers balanced/video/audio priorities, automatic video thumbnail or a separate image, caption presets and custom emoji/colors, private/self or selected recipients. It cannot guarantee that the live provider accepts every variant or that free accounts have a paid entitlement. Codec choice and actual quality depend on ffmpeg/SDK behavior.

## Verification

```sh
make build
make test
make lint
node scripts/check-docs.js
```

Native tests cover API access, CSRF, validation, account isolation, redaction, logout races, disconnected uploads, operation coverage, SDK HTTP envelopes and real ffmpeg cleanup. SDK transport tests use local HTTP fixtures; no real account is involved. Browser checks run with a local Postman stand-in:

```sh
postman simulation run postman/simulations/locket.sim.yaml --port 4418 --no-history --output ndjson
npm run test:browser -- --repeat-each=2
```

The test-only browser harness (`tests/browser-server.js`) rewrites known dependency hosts to that local simulation and refuses unmodeled external hosts. This rewrite is never imported by the normal server. Browser projects cover desktop/mobile and light/dark; both repetitions must pass. See [verification.md](docs/verification.md) for observed results and limits.

## References and post-release notes

- Primary dependency: https://github.com/hmkk69/locket.js (MIT), npm version 0.0.3.
- Additional reference requested by the operator: https://github.com/leanhminh2104/locketlam (MIT). The Python repository was read without installing/executing it; its examples were used to cross-check media priorities, custom thumbnail, caption styling, private recipients and chat read-receipt behavior. No Python code was copied or service added.
- Design tokens follow the DESIGN.md text/YAML format: https://github.com/google-labs-code/design.md.
- No release has been deployed. Live-account verification is outstanding; no universal Gold unlock or anti-detection guarantee is made.
- On 2026-11-16 at approximately 10:00 UTC, unauthenticated GET probes to the API root, postMomentV2 and getLatestMomentV2 all returned HTTP 502 HTML with `via: 1.1 google`; an unauthenticated POST to the read-only getLatestMomentV2 endpoint returned the same result. Node and direct Python requests agreed, with no proxy environment configured. This confirms gateway failure on the observed network path; it does not establish a global outage or identify the provider's underlying cause. No real account post was replayed. Live publishing remains blocked while that gateway error persists.
- Firebase project/key identifiers come from the third-party SDK. Ownership has not been independently verified against the official Locket application; a Google-hosted authentication endpoint alone is not proof of project ownership.
