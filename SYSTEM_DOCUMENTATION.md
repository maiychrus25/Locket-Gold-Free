# Lock Gold Free — system documentation

Version: 0.1.0
Status: Development; live web Locket interoperability unverified

<!-- docs-check: API coverage is verified against shared/operations.js -->

## Compact moment actions · 2026-11-18

Status: Development and immutable-artifact checks passed; production update pending; live account history remains unverified.

<!-- docs-check: Compact controls preserve the existing moment actions and permissions. -->

Moment cards keep the responsive grid and place a real author image/initial, wrapping name, local date without seconds and more-action button above the media. Below the caption, the main row offers heart, direct emoji selection and viewers. The message field and send button share one row at 320px. Six emoji choices and secondary actions reuse the existing native Modal/Feedback components; there is no new dependency, endpoint or provider call shape. Mark-as-viewed remains explicit. Delete appears only for verified owned personal-history posts and still requires the existing confirmation.

Dialogs retain pending/disabled states, one visible recovery message, Escape/backdrop dismissal and focus restoration. Failed emoji or mark-as-viewed requests keep the dialog open for retry; success closes it. Session generation changes unmount the card dialogs, and late responses cannot restore old account content. Native video controls, manual playback, paging/deduplication, latest-only fallback and all other account flows remain unchanged. Author initials do not invent a profile identity, and no reaction counts are fabricated.

## Grid friends feed · 2026-11-18

Status: Deployed at https://reelsup.store; development, artifact and public grid checks passed; live account history remains unverified.

<!-- docs-check: Friends use the existing grid; shared-history pagination and API contracts remain unchanged. -->

At the operator's request, the friends feed now has only the existing responsive grid: two desktop columns and one phone column below 600px. Remove the Reels component, its styles, layout switch and viewer-only state. Retain the same shared-history reads, actual author mapping, explicit cursor, duplicate handling, latest-only fallback, load-more retry and account boundaries. A visible load-more button appends posts. Photos retain square card styling; videos use native controls and explicit playback rather than automatic looping/muting. Personal history keeps its separate grid/list choices, filters and ownership restrictions. No API, session, security, dependency or media-upload behavior changes.

## Reels friend feed · 2026-11-17

Status: Deployed at https://reelsup.store; Reels presentation superseded by the grid revision above; shared-history implementation retained. Live account history remains unverified.

<!-- docs-check: Reels uses explicit shared-history continuation; legacy getLatest remains compatible. -->

The consumer feed calls `moments.getLatest` with optional `includeHistory: true`. This returns `{moments, nextPageToken}` from the same authenticated Firestore history/entries query used by the pinned SDK, without a user filter, 20 entries per page ordered by date and document name. The adapter reuses the SDK parser/cursor but preserves the actual `fields.user` author rather than substituting the current account. Unknown authors stay unknown. Cursors are bounded, validated timestamps/document references scoped to the signed-in account; provider failures remain errors, not empty pages. No arbitrary URL, account selector, token storage or new dependency is introduced.

Calls omitting `includeHistory` retain the existing array result and validated canonical-ID continuation. The consumer uses the explicit history cursor instead of inferring older-page availability from a moment ID. Pages append with deduplication and stop on exhausted/repeated cursors or empty pages; a duplicate-only history page can continue when its document cursor advances. Failed continuation retains previous posts and the cursor. If the initial history read fails or has no entries, an explicit latest-only fallback preserves the previously available feed and tells the user to retry loading older moments. Failed later pages never silently substitute latest posts. Historical reactions/comments use `fromMemory: true`; a latest-only fallback uses false. Personal-history filters, replacement pagination and delete ownership are unchanged.

The latest view defaults to a native vertical scroll-snap Reels viewer with previous/next and keyboard controls, a position indicator, touch/wheel continuation, and retained grid/list choices. Only the visible active video may play, muted initially, with native sound controls; leaving the viewer/tab pauses playback. No automatic reaction or mark-as-viewed write is sent. Details can scroll independently for long captions and narrow/short viewports. Empty, pending, exhausted and failure states use consumer copy without raw responses or identifiers.

Source evidence: `locket.js@0.0.3` `lib/modules/moments.js`, especially `getLatest`, `getSharedMomentsByUser`, `getMoments` and its history author mapping; upstream [pinned source](https://github.com/hmkk69/locket.js/blob/54bb186063674a361a23af81ba15a107aead8114/lib/modules/moments.js#L970-L1071). A canonical-ID sync loop is not evidence that a real account can retrieve older moments. Tests prove adapter and UI behavior against controlled HTTP data; the number and availability of a real account's shared history remain subject to provider access and require account testing.

## Run locally

Requirements: Node.js 24+, npm and ffmpeg (available on the development machine).

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4317. Override the local port with `PORT`. The server binds only to loopback. To run a prebuilt local artifact, use `make build`, then `npm start`. Source editing and Vite run only in development. No hosting registration, runtime deployment, migration, or production changes were performed. The operator subsequently authorized source publication to https://github.com/maiychrus25/Locket-Gold-Free, branch main.

## Architecture and dependencies

React renders the website; Vite builds browser assets to `dist/`. Express serves the API and prebuilt assets. `locket.js@0.0.3` handles the private Locket/Firebase protocol; the lockfile fixes the exact installed dependency graph. Zod validates the operation contract; Multer bounds multipart inputs; Helmet supplies response security headers; Lucide supplies icons. Sharp and ws are reused through the SDK. No Python service, database, client state framework, or custom media codec is added.

`shared/operations.js` is the single allowlist and form metadata source. Main screens use dedicated everyday flows; utilities expose video compression and thumbnail extraction. The backend retains all supported operations; technical protocol controls are not part of the consumer UI. The account-facing API inventory and exclusions are in [api-coverage.md](docs/api-coverage.md).

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

## Server readiness assessment · 2026-11-17

Status: Local behavior verified; **not ready for unrestricted public deployment**. The operator authorized publishing the latest UI/API source to GitHub and requested an assessment before choosing a server. Runtime code and the dependency lockfile are unchanged by this review; the findings below are recorded for remediation before public deployment. No deployment or live account write was performed.

<!-- docs-check: Server readiness is assessed separately from local API coverage and Git publication. -->

The dependency audit (`npm audit --omit=dev`) reports zero critical and two high package entries: `locket.js@0.0.3` through `sharp@0.33.5`, and sharp itself. The reviewed advisories are [libvips issues](https://github.com/advisories/GHSA-f88m-g3jw-g9cj), [libheif issues](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) and [librsvg issue](https://github.com/advisories/GHSA-wq5f-xc86-pv6w). Their patched sharp releases are 0.35.0, 0.35.4 and 0.35.5 respectively; the current SDK dependency is older. npm reports no automatic compatible fix for this installed chain. Do not force a dependency override and assume SDK/media compatibility. The route invokes sharp metadata parsing on user-uploaded images in the API process before worker dispatch, so a worker boundary alone is not an argument that every decoder risk is isolated. The audit identifies affected packages, not a demonstrated exploit against this app; no malicious decoder payload was executed.

The reverse-proxy login issue was reproduced using `createApp`, fake credentials and a local fake client only. With `allowedOrigin=https://lock-gold.example`, secure cookie settings and distinct `X-Forwarded-For` addresses, five failed logins from one forwarded address returned 401; the first login from another returned 429. `app.get('trust proxy')` is false, so both are keyed by the backend peer IP. Before public use, configure a narrowly trusted proxy boundary and sanitize forwarding headers, then verify that client limits stay independent and untrusted clients cannot spoof them. No blanket trust of all proxies is applied here.

Independent review also reproduced an avatar-update false success using a fake route client and an intercepted SDK fetch: the provider rejects the update, but the SDK returns `{status: 400, error: ...}` without throwing. `executeMedia` currently forwards that result and the route sends HTTP 200; the consumer result component can therefore say the operation completed. Inspection of the installed SDK's `lib/modules/user.js` and the adapter confirms this path. It requires targeted result-to-error normalization and regression coverage; the existing passing suite does not cover this rejection envelope. No real account or provider write was used, and this assessment does not claim the defect is repaired.

The existing runtime deliberately binds to loopback and requires a reverse proxy or equivalent local ingress. Hosting must configure HTTPS, exact `APP_ORIGIN`, `NODE_ENV=production`, ffmpeg, writable bounded temporary storage and SSE forwarding without response buffering. Proxy request-size/time limits must accommodate the existing 32 MiB per-file contract and 180-second media-worker deadline. Sessions live in one process, expire after two hours, and disappear at restart; 100 sessions and two media slots are current bounds. Multiple replicas or restart-persistent sessions need a separate design rather than copying the local setup unchanged. These are architectural limits, not proof of an API validation failure.

All 53 operations remain allowlisted with the existing security and validation checks. Local regression results, Git publication and live interoperability are distinct: local fixtures cannot confirm every private provider endpoint, production TLS/proxy behavior, Linux media compatibility or real-account success on a target host. No deployment readiness claim follows solely from passing tests or pushing source.

Fresh publication checks: `make test` twice, 37 passed/0 failed/0 skipped each; `playwright test --repeat-each=2`, 344 passed (5.3m) in desktop/mobile light/dark; `make build`, Build succeeded; `make lint`, zero warnings; docs-check, 53 operations/version 0.1.0/clean. The existing Postman simulation and SDK/ffmpeg tests were reused with no added dependency. The runtime source is the previously reviewed `895471b` tree; this assessment changes documentation only. Logs are `/tmp/lock-gold-publish-{build,test-round1,test-round2,lint,docs,browser,proxy-check}.log`, with audit JSON at `/tmp/lock-gold-publish-audit.json`. The pre-existing runtime remains local; no production deployment was performed. Repository workflow inventory contained zero GitHub Actions workflows before publication.

## Hardened VPS release · 2026-11-17

Status: Deployed and verified at https://reelsup.store through Cloudflare Full (strict), confirmed by the operator.

This follow-up supersedes the three unresolved application findings in the earlier assessment. The SDK stays at 0.0.3, while an npm override pins its shared sharp dependency to 0.35.5. Real ESM/CommonJS decoding, SDK avatar conversion and ffmpeg workers are checked on the pruned Linux runtime. Rejected avatar result envelopes now become sanitized exceptions with the provider status retained internally; the route returns its existing error response instead of a successful result. Successful avatar results retain their shape and writes are never retried automatically.

<!-- docs-check: Production origin, HOST/TRUST_PROXY_IP, CSP and avatar rejection changes are documented with regression coverage. -->

Production requires `APP_ORIGIN` to be an exact HTTPS origin without credentials/path, and refuses `--dev`. Development still binds only to loopback by default and retains Vite behavior. `HOST` can override the bind address; the container uses 0.0.0.0 internally while Compose publishes only 127.0.0.1:4317 on the host. Production trusts loopback and, optionally, one literal `TRUST_PROXY_IP`; hostnames, CIDRs and blanket trust values are rejected. The deployed private bridge uses 172.30.231.0/29 with gateway/proxy IP 172.30.231.1. Nginx accepts Cloudflare client-IP headers only from the vendor's verified IP ranges and replaces all forwarded host/protocol/IP headers. External direct requests cannot supply a trusted client IP through arbitrary forwarding headers.

Helmet enables a production CSP: scripts/connections stay same-origin; inline script attributes, plugins and framing are blocked. HTTPS/data/blob image sources and HTTPS/blob media sources preserve the existing previews; style attributes permit the creator's colors. Production checks use the built app through TLS, including image/video, caption colors, synthetic camera and the unauthenticated SSE boundary, in all four desktop/mobile light/dark variants.

The immutable artifact is `lock-gold-free:20261117-cea769413051`, linux/amd64. Its OCI index digest is `sha256:cea7694130516a0af30f0aee6ab3324c02cd2cd2abbf3541f9830d29c723e688`; the platform-specific image configuration digest used by the VPS is `sha256:50c6e581388b86e9fa9d6ca9a8b8854e823dfb61ac53ed2ff94e9e6cff7e1aa6`. Both are recorded to account for different Docker image-store representations. Dockerfile pins the Node 24 Alpine base digest, installs ffmpeg, runs native tests/build, prunes dev dependencies, and ships only runtime dependencies/server/shared/dist. The runtime removes npm/yarn tools, runs as UID 1000, has a read-only root, dropped capabilities, no-new-privileges, a 512 MiB temporary filesystem, 1536 MiB RAM/2 CPU/128 PID limits and 200-second shutdown grace. Application session and upload/job limits remain unchanged. The initial Debian image was rejected after the full image scan; it was not shipped to the VPS.

Only the prebuilt image and its deployment configuration bundle are transferred to production. `deploy/compose.yaml`, `deploy/nginx.conf` and the domain-scoped certificate renewal hook are the release inputs. The target has existing services and limited disk space; they are inventoried and kept separate. No production source checkout, on-host application build, database migration, global Docker prune or unrelated service restart is part of this release. Source publication and deployment are explicitly authorized by the operator. The release evidence and remaining limits are in [server-release verification](docs/verification/server-release.md).

Origin deployment: `/opt/lock-gold-free/current` points to release `20261117-cea769413051`; Docker reports healthy, UID node, read-only root and only a host-loopback port. Both existing vhost hashes and all seven previous container IDs remained unchanged. The origin's valid public certificate expires 2027-02-15 and its scoped renewal hook reloads Nginx after renewal; the existing snap.certbot.renew.timer is active and the target-domain renewal dry run succeeded. Existing logrotate includes the new vhost logs. Direct origin HTTPS/browser/API checks pass. After the operator changed Cloudflare to Full (strict), public HTTPS returned 200 and the API/security/browser checks passed. The origin's HTTP listener serves ACME challenges and HTTPS redirects only, so credentials are never accepted over that HTTP listener.

The ingress appends `Cache-Control: no-transform` while preserving upstream API `no-store` and asset caching. This stops Cloudflare's automatic analytics script injection, which otherwise conflicts with the intentional same-origin script policy. The public browser checks confirm that only the application's script is present and no CSP relaxation is needed. This behavior follows [Cloudflare's automatic-injection guidance](https://developers.cloudflare.com/web-analytics/get-started/).

## References and post-release notes

### Friend feed repair · 2026-11-17

Status: Deployed and verified at https://reelsup.store. See [friend-feed evidence](docs/verification/friend-feed.md).

The existing `moments.getLatest` operation now accepts optional `pageToken` (the existing identifier schema, at most 150 characters). An empty request retains the pinned SDK's original first-call behavior and the response remains an array under `data`, preserving other callers such as chat sharing. Continuation uses the fixed getLatestMomentV2 `sync_token` pattern already present in the SDK's shared-moment reader; this does not expose an arbitrary endpoint or raw HTTP proxy. Only valid array results or the known not-modified response end a continuation; malformed/provider failure envelopes become a safe error rather than a false empty feed. All 53 allowlisted operations and session/rate/redaction checks remain.

Latest feed pages append distinct moment IDs instead of replacing previous cards. Empty or nonadvancing/repeated pages stop the load-more control; a failed page leaves existing content and its cursor available for a manual retry. Page reads are locked while pending, and revision guards discard stale results. History pagination remains page-based with its current user filter and cursor invalidation.

Feed author UIDs are resolved against real friend/self profiles only when an unresolved displayed author needs them. Profile data lives only in the session-owned component; cancelled/unmounted/account-replaced loads cannot enter the next account. Inline named authors are preserved. Unknown authors use an honest unavailable label, not a raw UID or guessed current user. The existing verified-history rule still gates comments/deletion; name hydration does not grant ownership. Existing cards, reactions, media, dates, view dialogs and consumer-only presentation remain.

<!-- docs-check: getLatest continuation and feed author resolution are documented without changing the legacy array response. -->

### Free experience refresh · 2026-11-16

The operator confirmed successful publishing in the official mobile app. This supersedes treating the earlier gateway observation as a continuing global outage; authenticated web interoperability remains unverified. Read [product research](docs/locket-features.md) for primary sources and the feature-by-feature boundary.

The web app charges nothing: no billing flow, advertisement, subscription check or artificial 20-friend cap. It reuses all 53 allowlisted SDK operations. Provider-enforced account restrictions still apply; native icons/widgets, official Gold badges, streak restoration, music-provider linking and Rollcall publishing are not implemented by this SDK and are not presented as unlocked.

The creator now includes media/caption preview, visual caption presets and explicit camera capture. Camera permissions are requested only after an action; closing, navigating away or changing account stops media tracks. Late permission/capture results cannot overwrite a newer draft. Captions are sent as metadata, not burned into uploaded image bytes. Local browser capture records video without audio; uploading an existing video preserves the existing audio/compression options. Input files remain limited to 32 MiB. Selected recipients, private mode, video covers and all advanced controls remain available.

Feed cards offer emoji reactions, a viewer dialog and list/grid layouts. History date/month filters apply only to the current returned page and are labeled accordingly. Existing cursor and verified-author rules remain. Rollcall reads use the ISO week-year of the selected date; the web app does not publish Rollcall collections.

The profile page has a structured editor, avatar upload through the existing operation, and browser appearance settings. Theme and accent names are the only additional localStorage preferences (`lock-accent`: sunshine/rose/ocean); no account data, drafts or credentials are persisted there. Profile drafts reuse the session-owned draft store, send only edited nonempty fields, and cannot be cleared by an older completed save. No server route, validation contract, session lifetime or SDK version changes are introduced by the UI refresh.

The operator subsequently required a consumer-only presentation. Raw JSON renderers and protocol/device disclosures are removed. User-visible selectors use friend names and moment captions rather than identifiers; API identifiers remain internal. The old advanced-forms destination is replaced by useful media utilities, and all 53 backend operations remain allowlisted. Viewer counts/names are displayed only when recognized; unknown response shapes show a plain unavailable state. Technical research and unsupported official features belong in documentation, not in the consumer feature guide. Upstream 5xx responses become recovery guidance without protocol names, status codes or validation expressions; network and malformed responses also have plain-language messages. The HTTP response contract itself is unchanged.

Preset selection no longer copies SDK styling into request override fields. Of 158 current presets, 79 have eight-digit RGBA text colors, which are valid defaults in the SDK but incompatible with the unchanged six-digit custom-color validator. Selecting a chip or dropdown value clears custom overrides and sends the preset identifier; preview accepts preset alpha colors. Custom colors use a native color picker. Every catalog preset is tested with the real parser and server validator; invalid legacy overrides remain subject to validation rather than weakening the boundary.

### Mobile visual refresh · 2026-11-17

The visual identity now uses a cream/lilac canvas, honey actions, peach/mint accents and plum dark surfaces. Existing light/dark and three accent preferences retain their keys and behavior. The desktop sidebar remains at six destinations; phones show their short labels in a floating dock with full accessible names, targets at least 44px and bottom safe-area spacing. A sticky compact header retains account, free-guide and theme actions. The home hero is compact on phones; decorative code-rendered artwork is hidden at narrow widths and never represents account content.

The existing creator form has three visual steps, not a new multistep state machine: media, caption/style, then privacy/recipients. The first eight caption presets appear directly and a native disclosure exposes the complete remaining library. Both chips and the existing dropdown retain the same parser, validation and draft ownership. Form controls use at least 16px text, native color swatches remain usable, and dialogs scroll within the viewport. No dependency, endpoint, upload limit, SDK behavior or account permission changes were introduced. Checks and physical-device/live-provider limits are recorded in [mobile-design.md](docs/verification/mobile-design.md).

### Earlier source-publication observations

- Primary dependency: https://github.com/hmkk69/locket.js (MIT), npm version 0.0.3.
- Additional reference requested by the operator: https://github.com/leanhminh2104/locketlam (MIT). The Python repository was read without installing/executing it; its examples were used to cross-check media priorities, custom thumbnail, caption styling, private recipients and chat read-receipt behavior. No Python code was copied or service added.
- Design tokens follow the DESIGN.md text/YAML format: https://github.com/google-labs-code/design.md.
- No release has been deployed. Live-account verification is outstanding; no universal Gold unlock or anti-detection guarantee is made.
- On 2026-11-16 at approximately 10:00 UTC, unauthenticated GET probes to the API root, postMomentV2 and getLatestMomentV2 all returned HTTP 502 HTML with `via: 1.1 google`; an unauthenticated POST to the read-only getLatestMomentV2 endpoint returned the same result. Node and direct Python requests agreed, with no proxy environment configured. This confirms gateway failure on the observed network path; it does not establish a global outage or identify the provider's underlying cause. No real account post was replayed. Live publishing remains blocked while that gateway error persists.
- Firebase project/key identifiers come from the third-party SDK. Ownership has not been independently verified against the official Locket application; a Google-hosted authentication endpoint alone is not proof of project ownership.
