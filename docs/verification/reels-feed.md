# Reels friend feed verification

Status: Development and built-artifact checks passed; not yet deployed

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

The related local prebuilt service was refreshed on loopback port 4317 after artifact checks, avoiding a new-frontend/old-backend mismatch. Its health check returned 200; existing local in-memory sessions were invalidated. The production service still uses the prior release until the scoped deployment below.

Rollback target: `/opt/lock-gold-free/releases/20261117-feeda3a6911164cb`, image configuration `sha256:8110ac1d8eb92481361f4cfe317869850dab15fd5a9883d1060a1fe295bfaa9a`. Deploy only a verified saved image and existing Compose configuration; do not copy application source or build on the VPS. Verify health plus the hashes of all five nginx configurations and IDs of the seven unrelated containers before promoting release pointers. Replacing the Locket container invalidates its in-memory login sessions.

## Limits

No real Locket credentials, cookies or server token memory were accessed. Browser checks use controlled account/media responses, including against the compiled artifact. Actual availability/count of an account's older shared moments, official native-app sound behavior and physical phones remain unverified. The upstream can restrict or omit history; the website does not invent posts or promise a paid entitlement.
