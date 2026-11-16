# Free Locket experience implementation plan

Status: Implemented and verified in local development; not pushed or publicly deployed

**Goal:** Turn the existing 53-operation workspace into a polished, free daily Locket web experience, grounded in primary product documentation.
**Architecture:** Reuse React, the existing validated SDK routes, account epoch, draft ownership, media isolation and operation catalog. Add focused frontend components; reuse the form renderer for consumer creation/media utilities and retain protocol operations in the backend. No new dependency, database, billing or provider bypass.
**Spec:** docs/spec.md, free experience appendix; DESIGN.md refresh.

## Accepted product direction during implementation
The operator requires consumer-only UI: remove JSON and protocol forms; replace manual IDs with real friend/moment selection, keep 53 backend operations, and present only actual free tools. The advanced destination becomes video/cover utilities; protocol coverage remains in developer documentation. Fix the reported preset-color failure by preserving SDK preset defaults; validate all 158 presets using the original parser and validator. Review additionally requires profile draft isolation and consistent recipient-name/ID binding in chat. These are refinements of the same free-experience objective.

## Scope and rollback
Base: 9326e76 on main. Work on feat/free-experience. Touch frontend feature modules/styles, browser tests and accompanying documentation; server contracts and existing SDK allowlist stay intact. Git retains the baseline. Do not push, deploy or restart the account server for UI work. Risks: wrong recipient, draft loss, camera resource leaks, misleading entitlement claims and theme/mobile regressions. Reuse session reset and validation; explicitly test these boundaries.

- [x] Creator: use existing OperationForm for post dispatch and validation; add live media/caption preview, visual presets and camera capture with cleanup. Preserve video covers and quality controls with consumer labels. Upload errors preserve the draft and no write is retried automatically. All 158 presets validate without copying incompatible overrides.
- [x] Feed: reuse FeedPanel state/requests, add emoji choices and viewer dialog, readable dated media cards, memory grid/calendar filters, weekly Rollcall reader. Keep verified authors, delete confirmation, cursor reset and existing history flow. Read payloads, missing authors and viewer states have regression checks.
- [x] Product shell: refine home/navigation/layout and daily flow hierarchy, dedicated profile editor and appearance settings; retain all 53 backend operations. Add a free consumer feature guide; keep provider/native-only boundaries and primary-source links in documentation. No invented account stats, identifiers or JSON in UI.
- [x] Validate: build succeeded; 37 native tests passed in each of two rounds; zero-warning lint and docs check clean; independent diff review findings resolved. Complete browser suite: 328 passed across desktop/mobile light/dark and two repetitions. Running-artifact smoke checks and screenshots inspected. Evidence and live limits: docs/verification/free-experience.md.

## Source decisions
Official Gold overview: https://help.locket.com/en/articles/11057185-what-is-locket-gold-and-what-features-are-included
Official friend limit: https://help.locket.com/en/articles/7915024-how-many-friends-can-i-have-on-locket
Official Rollcall: https://help.locket.com/en/articles/11057175-what-is-rollcall
Official music flow: https://help.locket.com/en/articles/7914992-how-do-i-connect-spotify-or-apple-music-to-locket
App Store editorial (long captions and views): https://apps.apple.com/sg/iphone/story/id1775303660

The user reports posting succeeds on the official app; this does not verify web interoperability. Exact free/Gold caption lengths and video durations are not specified by these current official pages; do not invent them. The SDK accepts 2,000-character captions via our validator, 32 MiB input files, and its video storage limit is 6,291,455 bytes. Unlimited friends means no artificial website gate; provider authorization still applies.
