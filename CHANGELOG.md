# Changelog

## Unreleased — compact moment actions

- Make grid cards more compact with an author header, one primary action row and a message field beside its send button.
- Replace the emoji select-and-send pair with six direct choices in the existing dialog; place mark-as-viewed and verified-own-history deletion in a secondary dialog.
- Preserve exact action payloads, failure retry/pending feedback, delete confirmation and account boundaries; reuse existing components and theme tokens without dependencies.

## 2026-11-18 — grid friends feed

- Replace friends' Reels presentation with the existing responsive grid at the operator's request; remove the unused viewer, styles and navigation state.
- Keep shared-history loading, manual load-more, author names, interactions and history grid/list choices. Videos retain native controls with explicit playback; no dependency or backend contract changes.
- Deployed the verified prebuilt image to reelsup.store, retained the preceding release and confirmed unrelated services/configuration unchanged.

## 2026-11-17 — Reels friend feed

- Browse friends' moments vertically with native snapping, touch/keyboard navigation, previous/next controls and active-video playback.
- Read older shared history with an explicit date/document cursor and preserve real authors discarded by the pinned SDK; keep the legacy latest-array API.
- Preserve existing posts on continuation failure and retain latest-only access with a clear retry message if initial history is unavailable. Keep grid/list, comments/reactions/viewers, history filters and account isolation; add no dependency.
- Deployed the prebuilt Linux image to reelsup.store; retained the previous release and verified unchanged unrelated services/configuration.

## 2026-11-17 — friend feed repair

- Resolve feed author UIDs through friend/self profiles while preserving unknown-history ownership restrictions.
- Add backward-compatible latest-feed continuation and append/deduplicate older posts; preserve visible posts/cursors on errors and stop repeated pages.
- Reuse existing SDK/session/UI patterns without adding dependencies or exposing technical identifiers.
- Released to reelsup.store as a verified Linux image; prior release retained for rollback and unrelated services preserved.

## 2026-11-17 — hardened VPS release

- Patched the SDK's shared image dependency to sharp 0.35.5 and normalized rejected avatar updates into safe API errors without retrying writes.
- Added exact HTTPS production-origin validation, scoped proxy trust, production CSP and refusal of the Vite development server in production.
- Added a pinned Linux runtime image and isolated VPS/HTTPS configuration; preserved existing consumer features and backend contracts apart from corrected avatar failure reporting.
- Deployed the current free experience/mobile UI to reelsup.store with valid origin HTTPS, operator-configured Cloudflare Full (strict), scoped certificate renewal and no-transform ingress. Existing unrelated services/configuration were preserved.

## Unreleased — server readiness assessment

- Recorded current production dependency advisories, a reproduced shared login throttle behind a reverse proxy, and an avatar-update false-success response before source publication.
- Documented the public-deployment blockers and single-process runtime limits; no runtime, dependency, endpoint or production configuration change.

## Unreleased — mobile visual refresh

- Reworked colors, spacing and light/dark surfaces around cream, honey, peach, lilac and mint.
- Added compact phone header, six short navigation labels with full accessible names, larger touch targets and safe-area spacing.
- Made the home hero shorter and organized the existing creator into three visual steps; all 158 caption presets remain available through a native disclosure and dropdown.
- Reused existing components, drafts, account operations and dependencies; no server or payment changes.

## Unreleased — free experience refresh

- Researched official Locket/Gold features and documented implemented, provider-controlled and native-only capabilities.
- Added a free capability guide, camera capture, visual media/caption previews and caption presets.
- Added history date/month filters, grid/list browsing, emoji choices, viewer dialogs and weekly Rollcall reads.
- Added a structured profile editor and persistent browser appearance preferences.
- Refined desktop/mobile light/dark layouts while keeping all 53 SDK operations and existing session, validation, media and draft protections.
- No dependencies, payments, paywall, advertisements or local friend-count gate added; no official Gold entitlement activation claimed.
- Consumer UI removes JSON, protocol controls and raw identifiers; named friend/moment selectors replace manual IDs while all 53 backend operations remain available.
- Fixed 79 preset colors incompatible with custom-color validation by preserving preset defaults; custom color input now uses a native picker.

## 0.1.0 — initial source publication

- Vietnamese web workspace covering 53 account-facing SDK operations.
- Frontend organized by feature, shared components, app layout and browser helpers.
- Backend organized by route, session lifecycle, middleware and Locket integration.
- Shared operation descriptors grouped by capability without changing their public order or validation.
- Transient upstream errors preserve status across the media worker, keep publishing outcome unconfirmed and never trigger automatic write retries.
- Live Locket gateway failure observed from the development machine; provider recovery and official Firebase project ownership remain unverified.
