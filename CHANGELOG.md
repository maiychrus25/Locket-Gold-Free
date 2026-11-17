# Changelog

## Unreleased — hardened VPS release

- Patched the SDK's shared image dependency to sharp 0.35.5 and normalized rejected avatar updates into safe API errors without retrying writes.
- Added exact HTTPS production-origin validation, scoped proxy trust, production CSP and refusal of the Vite development server in production.
- Added a pinned Linux runtime image and isolated VPS/HTTPS configuration; preserved existing consumer features and backend contracts apart from corrected avatar failure reporting.

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
