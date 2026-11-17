# Lock Gold Free specification

Status: Implemented and verified in local development; live Locket interoperability unverified

## Objective and scope
Build a Vietnamese website covering all account-facing features of `locket.js@0.0.3`. Reuse the published SDK, do not fork its protocol. Name: Lock Gold Free. No claim to activate a paid subscription. No automatic production deployment.

## Architecture
React/Vite frontend communicates with a same-origin Express backend. The SDK, token refresh, media transformation and WebSocket connection run only in Node. Opaque HttpOnly SameSite=Strict cookies reference isolated server-side sessions. Passwords are used only for login, tokens stay in memory; SDK save is disabled. Per-session temporary directories hold SDK history only and are removed on logout/expiry/shutdown. Sessions expire after two hours and are not restored across restarts. A local single process is the intended dev runtime.

## User flows
- Signed-out dashboard shows real empty states, capabilities and a connect-account dialog.
- Feed/history: pagination, friend feed, filtering, views, reactions, comments, deletion.
- Create: local image/video upload, preview, caption presets/custom colors/icons, recipients/private mode, HEVC compression, upload status.
- Friends: full profiles, incoming/outgoing requests, lookup, send/accept/remove/block/unblock, suggestions and groups state.
- Chat: conversations, history, send/share/react/remove reaction/recall/read receipts, server-sent events backed by the SDK WebSocket.
- Profile/settings: own/other profile, name/birthdate/avatar, client sync and notification token, device profile, manual session refresh, logout.
- Advanced tools expose typed forms for every remaining supported SDK operation, JSON results and download of extracted thumbnails/optimized videos. Internal serialization/history helpers and raw HTTP are not exposed.

## Boundaries
Allowlisted operation registry with input schemas; no arbitrary SDK method invocation, filesystem paths, remote-media download, or raw endpoint proxy. Uploads use memory-bounded multipart parsing plus temporary files for video work, enforce image/video MIME and signature checks, and are cleaned in finally blocks. Origin and custom-header checks protect mutations; login and operation rates bounded; tokens scrubbed from every response. All account sessions isolated. SSE listeners closed on disconnect/logout/expiry. Upstream errors are visible but redacted; never retry writes automatically.

## Verification
Native Node HTTP integration tests exercise authentication, session isolation, CSRF, allowlisting, invalid input, file handling, errors and stream cleanup. Local upstream simulation exercises real SDK calls without real accounts. Two Playwright stress rounds cover desktop/mobile and light/dark, primary interactions, upload previews, navigation, keyboard dialogs, API failure recovery and horizontal overflow. `make build` must end in Build succeeded; `make test`, `make lint`, `node scripts/check-docs.js` must pass. Report that live Locket interoperability remains unverified without credentials.

## Post-implementation notes
Final review added session-generation binding and stale-response protection, verified-author handling around the SDK's history bug, stable recipient/lookup/filter behavior, parent-owned media history, token-merge protection, and MOV/WebM-to-MP4 conversion. These corrections preserve the requested features while preventing operations from targeting the wrong account or person. Public deployment and live-account interoperability remain outside the verified result.

The operator subsequently requested project restructuring and GitHub publication. Current module paths are in `docs/architecture.md`; the original implementation body above is retained as historical design. Upstream 502/503/504 errors now retain their status across media IPC and report unavailable/unknown outcomes without automatic retries. The observed gateway failure prevents claiming live publishing success.

## Free experience refresh · 2026-11-16

Status: Implemented and verified in local development; live web interoperability unverified

The operator confirmed posting in the official app works and requested product research and a complete free web experience. Add a visual creator with camera, media/caption preview and presets; memory browsing, views and weekly Rollcall; a dedicated profile editor; and a sourced capability guide. Refine the visual hierarchy while retaining every existing operation, account isolation, draft safety, media controls and dark/mobile support. No billing, paywall, advertisements or local friend-count restriction. Features controlled by Locket's server remain subject to its response; native-only and missing SDK capabilities must be described accurately. Do not claim official Gold activation or successful web publishing based on the operator's official-app test.

Post-design direction: The operator explicitly removed technical presentation from the product. Replace advanced protocol forms with media utilities and named daily workflows; backend coverage remains 53 operations. Do not show raw response JSON, IDs, device/protocol metadata, SDK/API names or validation expressions. Use real friend names/selected moments, human success/error states and the free features actually offered by this website. Keep provider/native limitations and research provenance in developer documentation. A reported preset-color error is fixed by retaining SDK defaults and testing all catalog presets against the original validator.

Post-implementation notes: verified 37 native tests twice and 328 browser checks, with independent review and prebuilt local artifact checks. UI intentionally offers consumer workflows instead of the original raw protocol forms, following the operator's subsequent direction. Exact evidence and remaining live/physical-device limits are in docs/verification/free-experience.md. No payment, dependency or server-contract changes were introduced.

## Mobile-first visual refresh · 2026-11-17

Status: Implemented and verified in local development; local prebuilt artifact updated

The operator requests a more polished, easier interface with special attention to mobile and colors. Use the updated DESIGN.md palette, short-label mobile navigation with full accessible names, compact home hierarchy, and three visual creation steps. Preserve all six destinations, every existing consumer behavior, light/dark/accent choices, account isolation and draft safety. Keep the full preset library available behind a native disclosure; do not add technical UI, payment or invented account content. Validate rendered desktop/mobile results and two complete browser rounds before the running local artifact is updated.

Post-release notes: 344 browser checks passed across two repetitions, four desktop/mobile light/dark projects; 37 native tests passed per round. Extra checks cover 96 responsive layouts and 30 text contrast pairs. Short mobile labels occur within their existing full accessible names. All 158 presets remain available; no dependency or server contract changed. Evidence and live/physical-phone limits: [mobile-design verification](verification/mobile-design.md).

## Hardened VPS release · 2026-11-17

Status: Deployed and verified at https://reelsup.store; live authenticated Locket interoperability remains unverified

The operator authorizes fixing the recorded blockers and deploying a prebuilt artifact to reelsup.store on the supplied VPS. Preserve every consumer feature and session/media boundary. Normalize failed avatar updates, patch the image dependency, require secure production startup, scope proxy trust to verified peers and preserve CSP compatibility with the existing creator. Package one isolated service with HTTPS, bounded resources, scoped logs/certificate renewal and a rollback path; preserve the target's unrelated services and data. Read [release evidence](verification/server-release.md) for the distinction between source checks, actual deployment checks and live provider interoperability. No guarantee of absolute security or unofficial subscription activation is made.
