# Free experience verification

Status: Verified in local development on 2026-11-16. No public deployment or Git push.

Baseline: `9326e76`; branch `feat/free-experience`. The user requested researched Locket/Gold features with no fees, then explicitly required consumer-only UI without raw JSON, IDs or protocol controls. The implementation keeps all 53 validated backend operations while replacing the developer-facing control panel with named daily flows and media utilities. See [research](../locket-features.md) and [plan](../plans/free-experience.md).

## Final evidence

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
328 passed (5.1m)

git diff --check
exit 0
```

The complete browser run has 41 scenarios × four projects × two repetitions. Projects are desktop 1440×1000 and mobile 390×844, each in light/dark mode; relevant scenarios also check 320px. Final source was stable and browser runs were serialized against the local Postman fixture. An earlier exploratory run hit the existing concurrent-login 429 guard while agent checks overlapped, and exposed an unnamed-recipient regression; these were investigated rather than skipped. The final complete run has zero failures and no skipped scenarios.

Logs are in the development machine's scratch area: `/tmp/lock-gold-final-{build,test-round1,test-round2,lint,stress}.log`. Final browser artifacts: `/tmp/lock-gold-final-stress`. Prebuilt files: `dist/assets/index-X7mcciv_.js` and `dist/assets/index-BjhKbXfD.css`. No dependency, server route, shared validator or lockfile change was needed.

## Behaviors checked

- Authentication, cookie secrecy, account isolation, CSRF, logout/expiry, account replacement and stale response rejection; all 53 operations remain in the backend inventory.
- Navigation, keyboard dialogs, theme/accent persistence, free feature guide, no raw JSON/protocol labels/internal IDs in consumer screens, no horizontal overflow and no mobile hero text overlap.
- Local image/video selection, preview, private posting, selected friend names, thumbnail, compression, input limits, preserved drafts and exactly one request after gateway failures. Both useful media utilities produce downloadable files through the real local SDK/ffmpeg path.
- Every one of the 158 catalog presets produces a valid post body with the real parser and original server validator. Before the fix, 79 alpha text colors were invalid overrides. Chip/dropdown selection now retains SDK defaults and clears custom overrides; the preview accepts preset alpha colors. A native test also reproduces the user's exact custom-color rejection and verifies plain-language feedback.
- Camera permission is explicit. Actual browser capture/recording behavior uses a controlled canvas stream; close/unmount/late permission/pending upload cannot leak tracks or overwrite a newer draft. Invalid and oversized replacements retain the prior file.
- Feed media, dates, emoji reactions, viewer loading/empty/error/count/unknown shapes, list/grid, page-local date/month filtering, pagination, known-author comment/delete restrictions and ISO week-year Rollcall queries.
- Friend request direction, safe lookup targets, named friend selection and selection retention. Chat joins the SDK's actual peer-only conversation shape to friend profiles; Alice-to-Bob changes preserve the correct name/target even after a list reload. Unknown recipients cannot send; failed text is retained. Live events render message content and human connection states only.
- Profile updates send only edited fields, retain drafts after errors/navigation, and cannot lose a newer edit when an older save completes. Avatar uses the existing media flow; appearance preferences contain no account data.

The final diff was reviewed independently. Findings about stale profile fields/drafts, incompatible preset colors and chat recipient/name binding were reproduced and corrected. The final review reported no remaining findings within those scopes.

## Running-artifact smoke check

The existing prebuilt local runtime on port 4317 served the page and current asset URLs with HTTP 200. Anonymous browser contexts checked all six navigation destinations plus the free guide in desktop/mobile and light/dark: 28 page visits, zero browser errors, no `pre`/`code` response output, and 320px width checks passed. No account login, post, friend acceptance or message was sent to the live service for these checks. Desktop light guide and mobile dark home screenshots were visually inspected. This local artifact update did not restart the account server or discard its in-memory sessions.

## Limits

The operator reports posting works in the official app. Authenticated web interoperability, delivery to real friends, actual free-account Gold-equivalent permissions, real viewer schemas and physical camera/microphone behavior remain unverified. Camera video capture is explicitly silent; existing video uploads retain audio options. Tests use Chrome/emulated mobile, not Safari or physical phones. Native widgets/icons, official badge activation, streak restoration, music-provider linking and Rollcall publishing are not provided by the pinned SDK. The website adds no payment, advertisement or local 20-friend gate, but cannot confer provider-side entitlements. Research and these limits remain in documentation rather than technical UI.
