# Reels friend feed verification

Status: Deployed and browser-verified at https://reelsup.store; live account history remains unverified

Baseline: 19711ed. Scope and rollback: [plan](../plans/reels-feed.md). The operator still could not reach older moments after the preceding release; its fixture-only canonical-ID continuation was insufficient evidence of live history access.

## Confirmed changes

The pinned SDK's unfiltered history mapper discards `fields.user` and substitutes the account UID. The transport regression reproduces that behavior with the real installed SDK. The consumer adapter uses the same fixed authenticated Firestore history query, parser and date/document cursor while retaining actual authors and leaving missing authors unknown. Long cursors must reference the current account's history entries and have valid timestamps. Legacy getLatest calls retain their array response and ID validation. A failed or empty first history page can preserve latest-only access with an explicit notice; later errors never substitute latest posts.

The latest view defaults to vertical native scroll snapping, with touch/wheel, keyboard and previous/next controls. History pages append and deduplicate; advancing document cursors remain usable even across a duplicate-only batch. A gesture is consumed before loading so programmatic scrolling does not cause an extra provider read. Failed requests retain visible moments and retry the same cursor. Comments retain actual receiver UIDs and history interactions retain `fromMemory: true`; latest-only fallback uses false. Names, unknown ownership, personal-history filters and delete restrictions remain intact.

Active visible videos play muted with native controls and pause when leaving view, hiding the tab or unmounting. Reloading a different set with the same count remounts the viewer and its observer. Screenshots and browser checks include 1440×1000, 390×844, 320×568 and 320×400; short-phone sizing, wrapping and no horizontal page overflow are checked in both themes. Grid/list and the existing reactions, viewer dialog and comments remain available.

## Evidence

- `make build`: Build succeeded; docs-check clean.
- `make test`: 50 passed, zero failures/skips, two complete native rounds. Includes API/security/session/media regressions and real ffmpeg processing.
- `make lint`: exit 0 with `--max-warnings 0`.
- `node scripts/check-docs.js`: 53 operations, version 0.1.0, clean.
- Final frozen full browser run: 51 scenarios × four desktop/mobile light/dark projects × two repetitions = 408 passed (8.7m), zero failures. Built Linux artifact through local TLS: eight Reels scenarios × four projects × two repetitions = 64 passed (1.7m), zero failures. The full suite preserves authentication/logout/session races, CSRF and redaction, friends/request directions, chat, profile edits, all caption presets, private photo/video upload, thumbnails/compression, camera lifecycle, failed drafts, Rollcall, personal history, themes and utilities.
- Real SDK HTTP fixtures verify the fixed query, headers and refreshed token, two authors plus unknown-author records, continuation and exhausted pages, malformed/error responses, cross-account cursor rejection, first-page-only fallback and preservation of latest errors without retrying writes. Postman simulation request events confirm the existing browser dependency path was exercised. These are controlled data, not a live account test.
- Independent source review identified and resolved same-count video-observer replacement, short mobile viewport sizing, and consumed-gesture paging. Red/green checks reproduced these issues before correction. An exploratory overlapping browser run lost its shared fixture server; the final run uses an independently retained server and separate output directories.

## Immutable Linux artifact

Image tag: `lock-gold-free:20261117-reels30d73b92d0e9`. OCI index: `sha256:30d73b92d0e979e9b1446bc3f7f3e3694b08703dda4e41763549ff603287fc49`. Saved image configuration ID: `sha256:362db136115a4832d7f5ba361eb1d2a36baa99a8d85388f06bdf538a557a8521`.

The Linux build runs all 50 native tests before pruning. The pruned nonroot/read-only runtime passes ESM/CommonJS sharp 0.35.5 conversion, rejected-avatar handling and real ffmpeg-worker checks with networking disabled. Trivy 0.76.2, downloaded from its official release and verified against the published SHA256, reports zero HIGH/CRITICAL findings on this exact image. Production npm audit reports zero findings. No application dependency was added.

The related local prebuilt service was refreshed on loopback port 4317 after artifact checks, avoiding a new-frontend/old-backend mismatch. Its health check returned 200; existing local in-memory sessions were invalidated. At that checkpoint production still used the prior release; the scoped deployment below records its replacement.

Rollback target: `/opt/lock-gold-free/releases/20261117-feeda3a6911164cb`, image configuration `sha256:8110ac1d8eb92481361f4cfe317869850dab15fd5a9883d1060a1fe295bfaa9a`. Deploy only a verified saved image and existing Compose configuration; do not copy application source or build on the VPS. Verify health plus the hashes of all five nginx configurations and IDs of the seven unrelated containers before promoting release pointers. Replacing the Locket container invalidates its in-memory login sessions.

## Scoped deployment

Source commit: `78b423713d19097197b47a0f96472f1733598280`, published to GitHub main. Release: `/opt/lock-gold-free/releases/20261117-reels30d73b92d0e9`. Transfer bundle SHA256: `ae8954cac977ab62c105c63963ee8d1c9c09952ba231b88af129dfd1e4b9daac`.

The saved image and existing Compose configuration were transferred, hashed and loaded without copying application source, installing packages or building on the VPS. An exclusive deployment lock, exact preflight snapshots and image-configuration verification preceded replacement of the Locket container alone. Health returned 200, restart count stayed zero, runtime user remained node and the root filesystem remained read-only. All five nginx hashes and all seven unrelated container IDs matched the preflight snapshot. Current/previous pointers were promoted only after checks; the prior image/configuration is retained. Only this release's transfer archives were removed; free disk remained approximately 2.72 GiB. No proxy, certificate, WAF or unrelated service changes were made.

Public browser checks: eight Reels scenarios × four desktop/mobile light/dark projects = 32 passed (51.0s), using controlled account/API/media responses and normal TLS validation. A separate unauthenticated Chrome check confirmed `/` and `/api/health` both return 200, the root loads the exact `/assets/index-CFtmcwUd.js` bundle, no third-party script is injected, no-transform remains present and CSP retains script-src self. A Python urllib probe received a Cloudflare 403; the normal browser checks succeeded, so no security configuration was weakened to accommodate that probe. Public fixture checks do not establish live authenticated provider history access.

The local Postman stand-in recorded 3,314 request events during development verification. Final results supersede exploratory failing runs; the final frozen suite, artifact checks and public checks all completed with zero failures. Source and release metadata remain linked in the production release directory. Users need to sign in again after the in-memory session replacement.

## Limits

No real Locket credentials, cookies or server token memory were accessed. Browser checks use controlled account/media responses, including against the compiled artifact. Actual availability/count of an account's older shared moments, official native-app sound behavior and physical phones remain unverified. The upstream can restrict or omit history; the website does not invent posts or promise a paid entitlement.

## Grid revision

Date: 2026-11-18. Status: Deployed and browser-verified at https://reelsup.store; live account history remains unverified.

The operator requested friends in the grid only. Reuse the existing two-column desktop and one-column phone cards, remove the unused Reels component/styles/switch/state and restore explicit native video playback. Shared-history retrieval, load-more/dedupe/retry/fallback, real authors and all reactions/comments/viewers remain unchanged. Personal history retains its grid/list controls and filters. No backend, API, session, dependency or production-configuration changes are part of this revision.

The new grid-only check first failed against the Reels implementation, then passed after the scoped change. Eight existing friend-feed scenarios now exercise the requested presentation while preserving cursor and duplicate-only continuation, exact comment receivers/fromMemory, explicit native video controls with refresh, latest-only fallback, shorter refreshed lists, names, failed-page retries and stale profile responses. A test selector was narrowed to the photo's accessible name after an SVG-icon ambiguity; no product failure or check was hidden.

Verification: make build finished with Build succeeded; full native tests passed 50/50 twice and a final 50/50 run; make lint returned zero warnings; docs-check reports 53 operations/version 0.1.0 clean. The complete 51-scenario browser suite ran four desktop/mobile light/dark projects twice: 408 passed (5.1m), zero failures. The actual compiled Linux image through a local TLS proxy passed all eight friend-feed cases in four projects twice: 64 passed (36.3s). Additional rendered screenshots at 1440, 390 and 320px were inspected, including light and dark phones; no horizontal page overflow was observed. Independent review of the actual diff found no blocking issue.

Image: lock-gold-free:20261118-grid40fa75dff91a. OCI index: sha256:40fa75dff91a3be3a56ddbd35706ff34103b049b3bf3e6f3ae28e581d2dad6c6. Saved image configuration ID: sha256:8f572769b53235e594bb463f3d26dfaa26dd3893ac3799a854cee4b4f861ce83. All 50 native tests passed during its Linux build. The pruned nonroot/read-only runtime passed sharp ESM/CommonJS, avatar-error and ffmpeg-worker checks without networking. Trivy 0.76.2 reported zero HIGH/CRITICAL findings on this exact image; the lockfile and application dependencies are unchanged.

Rollback target for this revision: /opt/lock-gold-free/releases/20261117-reels30d73b92d0e9, configuration ID sha256:362db136115a4832d7f5ba361eb1d2a36baa99a8d85388f06bdf538a557a8521. A fresh snapshot records five nginx hashes and seven unrelated container IDs before the scoped artifact deployment. Public checks and publication metadata follow after deployment. Existing live-account and physical-device limits above still apply; this UI revision does not claim new provider interoperability.

Grid deployment: source commit dedec72892241ff59daf4b6a27427a9be00b143c published to main; release /opt/lock-gold-free/releases/20261118-grid40fa75dff91a. Bundle SHA256 07bb7b255baf3c5291c08237050ee033fd988f677ba0a998c21e8f17aad599b6 was verified before loading the saved image. After an idle SSH connection dropped, the connection was renewed and the complete preflight still matched before any deployment. Only the Locket artifact was replaced; no application source was copied or built on the VPS. Health is healthy, restart count zero, runtime remains nonroot/read-only, all five nginx hashes and seven unrelated container IDs are unchanged, and rollback pointers retain the prior release. Transfer archives were removed; free disk was approximately 2.76 GiB. In-memory login sessions require reconnection after replacement.

Public normal-TLS checks of all eight friend-feed scenarios in four desktop/mobile light/dark projects passed 32/32 (46.6s), using controlled account/API/media data. A separate unauthenticated Chrome probe confirmed root and health HTTP 200, the exact /assets/index-Dk4ZohcD.js bundle, retained no-transform and script-src self, and no injected third-party script. These public checks verify the deployed grid and account-independent UI behavior, not a real account's history or physical-device playback.
