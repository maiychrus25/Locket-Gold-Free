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
