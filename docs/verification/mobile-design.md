# Mobile design verification

Status: Verified in local development, 2026-11-17. Local prebuilt artifact updated; no public deployment or Git push.

Baseline: `9dc042c`; branch `feat/mobile-design`. Scope is the existing UI, CSS tokens, viewport metadata, regression checks and documentation. No dependency, backend, shared validation, operation registry or lockfile change. Rollback uses the baseline in Git.

## Evidence

- Before implementation, the new mobile test reproduced a 623px home hero and zero visual creator steps; both expectations failed. After implementation, the two new scenarios passed against the local fixture.
- Two native rounds: 37 tests passed per round, zero failures or skipped tests. Lint uses `eslint . --max-warnings 0`; documentation coverage remains 53 operations at version 0.1.0.
- An additional rendered layout sweep checked all six destinations at 320, 390, 430, 760, 768, 1024, 1440 and 1920px in light/dark mode: 96 combinations, zero horizontal overflow.
- Screenshots inspected for desktop/mobile light/dark and the mobile creator/profile. Native color swatches have at least 48px height; the scrolled primary creator action ends above the phone dock. Form text is at least 16px.
- Thirty semantic text/surface contrast checks across light/dark and all three accent choices had a minimum ratio of 4.52:1. These cover primary/muted text on canvas, surface and soft surface, plus accent text on its soft background; they are not an exhaustive accessibility audit.
- Static independent review identified short labels missing from accessible names. Short labels now occur within the existing full names, preserving screen-reader names and voice matching; the regression test checks every navigation target.

Final complete browser run: 43 scenarios × desktop/mobile × light/dark × two repetitions = **344 passed (4.7m)**, no failures or skipped scenarios. Source stayed stable throughout this run. An exploratory browser run was stopped when final palette, color-swatch and accessible-label corrections were made; only this subsequent full run counts as the final two rounds.

```text
make build
docs-check: 53 operations documented; version 0.1.0; clean
Build succeeded

make test — round 1
tests 37; pass 37; fail 0; skipped 0

make test — round 2
tests 37; pass 37; fail 0; skipped 0

make lint
eslint . --max-warnings 0
exit 0

playwright test --repeat-each=2
344 passed (4.7m)

git diff --check
exit 0
```

Build output: `dist/assets/index-S6PtanG2.js`, `dist/assets/index-Dh9NjrTX.css`. The existing local account server remained PID 98211 throughout; `/`, both assets, `/api/health` and `/api/catalog` returned 200 on port 4317. The catalog retains 53 operations. Logs: `/tmp/lock-gold-mobile-{build,test-round1,test-round2,lint,docs}.log` and `/tmp/lock-gold-mobile-final-stress.log`; browser artifacts: `/tmp/lock-gold-mobile-final-stress`. The running local artifact was built only after development validation.

A subsequent check used the prebuilt app itself at port 4317: all six destinations, the three creator steps, all 158 presets, no horizontal overflow and no JavaScript page errors passed in desktop light/dark and mobile light/dark (including 320px dark). This check used guest navigation only and made no authenticated account writes. Built-app screenshots: `/tmp/lock-gold-built-{desktop-light,desktop-dark,mobile-light,mobile-dark}.png`.

## Regression coverage

The complete suite covers login/logout and cookie safety, session replacement/expiry, stale results, draft preservation, all six destinations, guide and theme/accent preferences, consumer-only text, camera permission and cleanup, image/video previews and upload limits, private/selected recipients, thumbnail/compression, upstream error recovery with a single write, valid payloads for all 158 caption presets, feed/history pagination and ownership, emoji/viewers/Rollcall, friend lookup/request actions, chat history/send/recall/read states, profile editing/avatar and both media downloads. Dependencies use the local Postman simulation; real SDK parsing and local media work still run.

## Limits

No public deployment, Git push, production change or account-server restart. Browser checks use Chrome with controlled fixtures, not a physical phone or real Locket account. Physical iOS/Android behavior, actual camera hardware and live provider acceptance remain unverified. This visual change does not activate an official Gold entitlement. Historical verification notes remain in place.
