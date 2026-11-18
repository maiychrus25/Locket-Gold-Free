# Reels friend feed

Status: Reels shipped; grid presentation revision verified in development and immutable artifact; production update pending

Baseline: 19711ed; branch fix/reels-feed. Goal: load older shared moments and let the operator browse them vertically, one moment per panel, with clear authors and existing interactions.

Scope: FeedPanel and a small Reels presentation component; feed styling; the existing SDK integration and allowlisted read contract if investigation confirms a pagination defect; corresponding tests, fixtures and documentation. Reuse current account lifecycle, media rendering, profile resolution, reactions, views, comments and history controls. Add no dependencies. Preserve the 53 existing capabilities and their default contracts.

Design: a bounded vertical scroll area with native scroll snapping, visible previous/next controls and a position indicator. Photos fit without cropping; only the active visible video may play, muted initially, with native sound controls. The feed keeps the website's semantic light/dark surfaces and honey accent. Grid/list remain available; personal history retains its filters and ownership restrictions. Pending and failed continuation keep existing posts and offer retry; empty and exhausted feeds have readable states.

The prior repair inferred pagination from canonical_uid and only tested invented continuation responses. Investigate the installed SDK's Firestore history query and actual author fields before choosing the consumer read path. Never infer that sync_token returns older posts, invent author identities, or treat fixture success as live account evidence.

- [x] Reproduce missing Reels navigation with a failing browser check; inspect the SDK read/parse boundary and add a failing transport check for confirmed data loss.
- [x] Implement the shared-history continuation with the smallest compatible adapter, strict cursor validation and explicit upstream errors; implement native swipe/snap, keyboard/buttons, video lifecycle and retained grid/list/actions.
- [x] Run make test, make build, make lint and docs-check; run two browser rounds across desktop/mobile and light/dark, including 320px/short viewport, failure/retry, stale sessions, history, media, friends/chat/profile, caption presets and drafts. Review the actual diff independently.
- [x] Build and scan the immutable Linux image, verify the built UI, preserve the previous release, publish source and deploy only the authorized Locket service. Verify public health/UI and unchanged unrelated services; record live-account limitations.

Risks: wrong author/receiver, discarded or repeated pages, stale account responses, video playing offscreen, narrow-screen overflow and unrelated VPS disruption. Roll back by restoring the prior immutable image/configuration; no user-data deletion or production source editing.

## Grid revision · 2026-11-18

Objective: show friends only in the existing responsive grid. Scope: FeedPanel, removal of ReelsFeed and its styles, the existing friend-feed browser tests and accompanying documentation. The backend, SDK adapter, 53 operations, shared-history continuation, interactions, history grid/list and all account features retain their contracts. Reuse the existing grid and native video controls; add no dependency or abstraction. Rollback uses release 20261117-reels30d73b92d0e9.

- [x] Reproduce the missing grid-only behavior with a failing browser check, then remove Reels-specific presentation and adapt checks to the requested grid/media behavior.
- [x] Run build, full native tests twice, lint, docs-check and two complete desktop/mobile light/dark browser rounds; inspect screenshots and actual diff with an independent reviewer.
- [ ] Build/scan the Linux artifact, verify the compiled grid, publish source and replace only the authorized Locket release. Verify the domain and retain rollback plus unrelated-service snapshots.
