# Structure refactor and gateway-error verification

Status: Implementation verified locally; source publication pending.

## Scope and result

Baseline: `af52cac`. No dependencies changed. Existing SDK, operation validators, UI markup, session guards and styles were reused. The browser entry is 11 lines, App is 286 lines, Express composition is 35 lines and the public registry is 22 lines. The 53-operation public catalog was compared before/after with deep equality. CSS rules and cascade order remain unchanged and the emitted CSS hash is identical.

Independent read-only review found no material introduced regression in the final diff. Actual new files and imports were inspected; git diff --check is clean. Existing tests were retained and updated only for module import moves, plus explicit gateway-error regressions.

Build/lint/docs passed. Both core rounds passed 33 tests with zero failures/skips. Browser validation passed 120 checks: 15 scenarios, two rounds, desktop/mobile and light/dark, including 320px overflow and mobile artwork/text separation. The new publishing test exercises a real SDK HTTP 502 fixture, preserves the draft, does not display success and sends exactly one publish request.

The prebuilt local server was restarted after dev validation; port 4317 health returned HTTP 200. Sessions are memory-only, so users must sign in again after this local restart. No production hosting deployment was performed.

## Upstream limitation

On 2026-11-16 around 10:00 UTC, unauthenticated API-root/postMomentV2/getLatestMomentV2 GET probes returned HTTP 502 HTML, via 1.1 google; a POST to the read-only getLatestMomentV2 endpoint without account credentials also returned 502. Direct Python and Node requests agreed, with no proxy environment configured. No account post was replayed. The service is unavailable on the observed network path; the underlying provider cause/global extent is unknown. The code reports unavailable/unknown outcomes instead of claiming success or automatically retrying a write.

No live Locket publishing success, Premium entitlement or official Firebase project ownership is asserted by these checks.

## Command output

### make build

```text
npm run build

> lock-gold-free@0.1.0 build
> vite build && node scripts/check-docs.js && echo 'Build succeeded'

vite v7.3.8 building client environment for production...
transforming...
✓ 1611 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.67 kB │ gzip:  0.45 kB
dist/assets/index-BSOpfzPr.css   25.22 kB │ gzip:  6.27 kB
dist/assets/index-05GIuzhk.js   277.43 kB │ gzip: 86.28 kB
✓ built in 955ms
docs-check: 53 operations documented; version 0.1.0; clean
Build succeeded
```

### make test — round 1

```text
npm test

> lock-gold-free@0.1.0 test
> node --test tests/*.test.js

✔ requires a session before any account operation (62.861917ms)
✔ catalog is public and never includes invocation code or credentials (33.991083ms)
✔ login rotates an opaque HttpOnly cookie and does not expose tokens (30.201ms)
✔ sessions keep different accounts isolated and redact nested tokens (33.382333ms)
✔ rejects unallowlisted methods and unknown parameters (34.212458ms)
✔ validates required values and converts only documented argument shapes (34.94325ms)
✔ rejects cross-origin mutations and missing application header (30.448583ms)
✔ logout invalidates the old session and closes its resources (31.265292ms)
✔ expired sessions cannot access account data (68.74675ms)
✔ upstream errors are visible without leaking a session secret (32.663333ms)
✔ rate limits failed logins without echoing credentials (33.149792ms)
✔ media requires real image bytes, not an attacker path or mislabeled file (47.79625ms)
✔ media passes validated bytes and typed options to the SDK (32.53ms)
✔ bounded concurrent account reads preserve isolation (58.059834ms)
✔ logout during an active request cannot expose its token in response text (69.9375ms)
✔ disconnecting an upload keeps its media slot until the SDK operation ends (36.456ms)
✔ SSE emits redacted messages and closes its upstream controller on disconnect (38.18125ms)
✔ prototype properties and unsupported ownership overrides are rejected (32.115667ms)
✔ an SVG mislabeled as PNG cannot enter the raster upload pipeline (36.508875ms)
✔ a stale page cannot write through a different account cookie (32.401792ms)
✔ unfiltered history does not misidentify friend moments as my own (31.004041ms)
✔ video normalization uses detected bytes instead of the declared MIME (31.013125ms)
✔ a 502 on publishing stays unconfirmed and is never retried automatically (72.439958ms)
✔ every account-facing SDK method has an allowlisted web flow (0.498833ms)
✔ optional pagination remains optional, recipients do not accidentally target nobody (2.10575ms)
✔ rejects empty messages, invalid dates and contradictory privacy before SDK calls (1.38625ms)
✔ frontend preserves pagination cursors while removing account credentials (0.886667ms)
✔ form parser preserves false and parses actual JSON and numeric inputs (0.224208ms)
✔ renders supported nested result lists and refuses executable media URLs (0.13225ms)
✔ late 401 from an old session cannot expire the new login (19.919625ms)
✔ isolated worker extracts and compresses real video, cleaning success and encoder failure (677.735458ms)
✔ worker preserves parent history and cannot overwrite a newer token (3.883625ms)
✔ real SDK authenticates, refreshes, uploads and handles failure over local HTTP (88.67525ms)
ℹ tests 33
ℹ suites 0
ℹ pass 33
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1156.900125
```

### make test — round 2

```text
npm test

> lock-gold-free@0.1.0 test
> node --test tests/*.test.js

✔ requires a session before any account operation (59.418541ms)
✔ catalog is public and never includes invocation code or credentials (46.426209ms)
✔ login rotates an opaque HttpOnly cookie and does not expose tokens (36.768167ms)
✔ sessions keep different accounts isolated and redact nested tokens (37.799209ms)
✔ rejects unallowlisted methods and unknown parameters (32.655542ms)
✔ validates required values and converts only documented argument shapes (31.636833ms)
✔ rejects cross-origin mutations and missing application header (29.982084ms)
✔ logout invalidates the old session and closes its resources (28.967875ms)
✔ expired sessions cannot access account data (29.466084ms)
✔ upstream errors are visible without leaking a session secret (30.16175ms)
✔ rate limits failed logins without echoing credentials (39.76775ms)
✔ media requires real image bytes, not an attacker path or mislabeled file (33.862334ms)
✔ media passes validated bytes and typed options to the SDK (30.969792ms)
✔ bounded concurrent account reads preserve isolation (45.095666ms)
✔ logout during an active request cannot expose its token in response text (66.415125ms)
✔ disconnecting an upload keeps its media slot until the SDK operation ends (36.323833ms)
✔ SSE emits redacted messages and closes its upstream controller on disconnect (41.419917ms)
✔ prototype properties and unsupported ownership overrides are rejected (30.003791ms)
✔ an SVG mislabeled as PNG cannot enter the raster upload pipeline (30.499584ms)
✔ a stale page cannot write through a different account cookie (29.486167ms)
✔ unfiltered history does not misidentify friend moments as my own (28.276583ms)
✔ video normalization uses detected bytes instead of the declared MIME (28.15375ms)
✔ a 502 on publishing stays unconfirmed and is never retried automatically (69.985584ms)
✔ every account-facing SDK method has an allowlisted web flow (0.505125ms)
✔ optional pagination remains optional, recipients do not accidentally target nobody (1.761375ms)
✔ rejects empty messages, invalid dates and contradictory privacy before SDK calls (1.335292ms)
✔ frontend preserves pagination cursors while removing account credentials (0.904625ms)
✔ form parser preserves false and parses actual JSON and numeric inputs (0.79075ms)
✔ renders supported nested result lists and refuses executable media URLs (0.189792ms)
✔ late 401 from an old session cannot expire the new login (17.652ms)
✔ isolated worker extracts and compresses real video, cleaning success and encoder failure (633.704709ms)
✔ worker preserves parent history and cannot overwrite a newer token (1.730583ms)
✔ real SDK authenticates, refreshes, uploads and handles failure over local HTTP (92.867125ms)
ℹ tests 33
ℹ suites 0
ℹ pass 33
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1096.412375
```

### make lint

```text
npm run lint

> lock-gold-free@0.1.0 lint
> eslint . --max-warnings 0
```

### node scripts/check-docs.js

```text
docs-check: 53 operations documented; version 0.1.0; clean
```

### npm run test:browser -- --repeat-each=2

```text
> lock-gold-free@0.1.0 test:browser
> playwright test --repeat-each=2


Running 120 tests using 1 worker

  ✓    1 [desktop-light] › tests/browser/races.spec.js:29:1 › pending chat history locks its recipient and conversation until completion (1.1s)
  ✓    2 [desktop-light] › tests/browser/races.spec.js:80:1 › friend lookup actions use the returned UID and disappear when the search changes (611ms)
  ✓    3 [desktop-light] › tests/browser/races.spec.js:131:1 › history defaults to the current user and invalidates cursors on filter edits (454ms)
  ✓    4 [desktop-light] › tests/browser/races.spec.js:163:1 › history hides actions for unknown authors and deletes only the current user's posts (381ms)
  ✓    5 [desktop-light] › tests/browser/workspace.spec.js:85:1 › guest navigation, theme, empty states and minimum width stay usable (966ms)
  ✓    6 [desktop-light] › tests/browser/workspace.spec.js:120:1 › login dialog supports keyboard, safe cookie and logout (588ms)
  ✓    7 [desktop-light] › tests/browser/workspace.spec.js:178:1 › every SDK operation is reachable through its typed tool form (930ms)
  ✓    8 [desktop-light] › tests/browser/workspace.spec.js:204:1 › photo preview, private post and upstream-error retry preserve the draft (604ms)
  ✓    9 [desktop-light] › tests/browser/workspace.spec.js:256:1 › chat keeps failed text, sends successfully and loads real SDK local history (508ms)
  ✓   10 [desktop-light] › tests/browser/workspace.spec.js:282:1 › session expiry hides account data and prompts reconnection (497ms)
  ✓   11 [desktop-light] › tests/browser/workspace.spec.js:306:1 › video accepts a custom thumbnail and compression priority (533ms)
  ✓   12 [desktop-light] › tests/browser/workspace.spec.js:329:1 › SDK feed shapes render media, reactions and usable history pagination (689ms)
  ✓   13 [desktop-light] › tests/browser/workspace.spec.js:399:1 › incoming and outgoing friend requests keep their direction and action (503ms)
  ✓   14 [desktop-light] › tests/browser/workspace.spec.js:440:1 › another tab replacing the account cannot submit the old media draft (649ms)
  ✓   15 [desktop-light] › tests/browser/workspace.spec.js:474:1 › an upstream publishing gateway error preserves the draft and warns about duplicate posts (666ms)
  ✓   16 [desktop-light] › tests/browser/races.spec.js:29:1 › pending chat history locks its recipient and conversation until completion (544ms)
  ✓   17 [desktop-light] › tests/browser/races.spec.js:80:1 › friend lookup actions use the returned UID and disappear when the search changes (502ms)
  ✓   18 [desktop-light] › tests/browser/races.spec.js:131:1 › history defaults to the current user and invalidates cursors on filter edits (447ms)
  ✓   19 [desktop-light] › tests/browser/races.spec.js:163:1 › history hides actions for unknown authors and deletes only the current user's posts (405ms)
  ✓   20 [desktop-light] › tests/browser/workspace.spec.js:85:1 › guest navigation, theme, empty states and minimum width stay usable (1.1s)
  ✓   21 [desktop-light] › tests/browser/workspace.spec.js:120:1 › login dialog supports keyboard, safe cookie and logout (587ms)
  ✓   22 [desktop-light] › tests/browser/workspace.spec.js:178:1 › every SDK operation is reachable through its typed tool form (1.1s)
  ✓   23 [desktop-light] › tests/browser/workspace.spec.js:204:1 › photo preview, private post and upstream-error retry preserve the draft (626ms)
  ✓   24 [desktop-light] › tests/browser/workspace.spec.js:256:1 › chat keeps failed text, sends successfully and loads real SDK local history (498ms)
  ✓   25 [desktop-light] › tests/browser/workspace.spec.js:282:1 › session expiry hides account data and prompts reconnection (488ms)
  ✓   26 [desktop-light] › tests/browser/workspace.spec.js:306:1 › video accepts a custom thumbnail and compression priority (510ms)
  ✓   27 [desktop-light] › tests/browser/workspace.spec.js:329:1 › SDK feed shapes render media, reactions and usable history pagination (594ms)
  ✓   28 [desktop-light] › tests/browser/workspace.spec.js:399:1 › incoming and outgoing friend requests keep their direction and action (485ms)
  ✓   29 [desktop-light] › tests/browser/workspace.spec.js:440:1 › another tab replacing the account cannot submit the old media draft (713ms)
  ✓   30 [desktop-light] › tests/browser/workspace.spec.js:474:1 › an upstream publishing gateway error preserves the draft and warns about duplicate posts (710ms)
  ✓   31 [desktop-dark] › tests/browser/races.spec.js:29:1 › pending chat history locks its recipient and conversation until completion (542ms)
  ✓   32 [desktop-dark] › tests/browser/races.spec.js:80:1 › friend lookup actions use the returned UID and disappear when the search changes (536ms)
  ✓   33 [desktop-dark] › tests/browser/races.spec.js:131:1 › history defaults to the current user and invalidates cursors on filter edits (458ms)
  ✓   34 [desktop-dark] › tests/browser/races.spec.js:163:1 › history hides actions for unknown authors and deletes only the current user's posts (445ms)
  ✓   35 [desktop-dark] › tests/browser/workspace.spec.js:85:1 › guest navigation, theme, empty states and minimum width stay usable (977ms)
  ✓   36 [desktop-dark] › tests/browser/workspace.spec.js:120:1 › login dialog supports keyboard, safe cookie and logout (614ms)
  ✓   37 [desktop-dark] › tests/browser/workspace.spec.js:178:1 › every SDK operation is reachable through its typed tool form (972ms)
  ✓   38 [desktop-dark] › tests/browser/workspace.spec.js:204:1 › photo preview, private post and upstream-error retry preserve the draft (633ms)
  ✓   39 [desktop-dark] › tests/browser/workspace.spec.js:256:1 › chat keeps failed text, sends successfully and loads real SDK local history (505ms)
  ✓   40 [desktop-dark] › tests/browser/workspace.spec.js:282:1 › session expiry hides account data and prompts reconnection (433ms)
  ✓   41 [desktop-dark] › tests/browser/workspace.spec.js:306:1 › video accepts a custom thumbnail and compression priority (490ms)
  ✓   42 [desktop-dark] › tests/browser/workspace.spec.js:329:1 › SDK feed shapes render media, reactions and usable history pagination (605ms)
  ✓   43 [desktop-dark] › tests/browser/workspace.spec.js:399:1 › incoming and outgoing friend requests keep their direction and action (488ms)
  ✓   44 [desktop-dark] › tests/browser/workspace.spec.js:440:1 › another tab replacing the account cannot submit the old media draft (631ms)
  ✓   45 [desktop-dark] › tests/browser/workspace.spec.js:474:1 › an upstream publishing gateway error preserves the draft and warns about duplicate posts (665ms)
  ✓   46 [desktop-dark] › tests/browser/races.spec.js:29:1 › pending chat history locks its recipient and conversation until completion (600ms)
  ✓   47 [desktop-dark] › tests/browser/races.spec.js:80:1 › friend lookup actions use the returned UID and disappear when the search changes (590ms)
  ✓   48 [desktop-dark] › tests/browser/races.spec.js:131:1 › history defaults to the current user and invalidates cursors on filter edits (452ms)
  ✓   49 [desktop-dark] › tests/browser/races.spec.js:163:1 › history hides actions for unknown authors and deletes only the current user's posts (389ms)
  ✓   50 [desktop-dark] › tests/browser/workspace.spec.js:85:1 › guest navigation, theme, empty states and minimum width stay usable (1.0s)
  ✓   51 [desktop-dark] › tests/browser/workspace.spec.js:120:1 › login dialog supports keyboard, safe cookie and logout (594ms)
  ✓   52 [desktop-dark] › tests/browser/workspace.spec.js:178:1 › every SDK operation is reachable through its typed tool form (943ms)
  ✓   53 [desktop-dark] › tests/browser/workspace.spec.js:204:1 › photo preview, private post and upstream-error retry preserve the draft (579ms)
  ✓   54 [desktop-dark] › tests/browser/workspace.spec.js:256:1 › chat keeps failed text, sends successfully and loads real SDK local history (530ms)
  ✓   55 [desktop-dark] › tests/browser/workspace.spec.js:282:1 › session expiry hides account data and prompts reconnection (452ms)
  ✓   56 [desktop-dark] › tests/browser/workspace.spec.js:306:1 › video accepts a custom thumbnail and compression priority (485ms)
  ✓   57 [desktop-dark] › tests/browser/workspace.spec.js:329:1 › SDK feed shapes render media, reactions and usable history pagination (612ms)
  ✓   58 [desktop-dark] › tests/browser/workspace.spec.js:399:1 › incoming and outgoing friend requests keep their direction and action (462ms)
  ✓   59 [desktop-dark] › tests/browser/workspace.spec.js:440:1 › another tab replacing the account cannot submit the old media draft (645ms)
  ✓   60 [desktop-dark] › tests/browser/workspace.spec.js:474:1 › an upstream publishing gateway error preserves the draft and warns about duplicate posts (697ms)
  ✓   61 [mobile-light] › tests/browser/races.spec.js:29:1 › pending chat history locks its recipient and conversation until completion (636ms)
  ✓   62 [mobile-light] › tests/browser/races.spec.js:80:1 › friend lookup actions use the returned UID and disappear when the search changes (545ms)
  ✓   63 [mobile-light] › tests/browser/races.spec.js:131:1 › history defaults to the current user and invalidates cursors on filter edits (424ms)
  ✓   64 [mobile-light] › tests/browser/races.spec.js:163:1 › history hides actions for unknown authors and deletes only the current user's posts (403ms)
  ✓   65 [mobile-light] › tests/browser/workspace.spec.js:85:1 › guest navigation, theme, empty states and minimum width stay usable (972ms)
  ✓   66 [mobile-light] › tests/browser/workspace.spec.js:120:1 › login dialog supports keyboard, safe cookie and logout (643ms)
  ✓   67 [mobile-light] › tests/browser/workspace.spec.js:178:1 › every SDK operation is reachable through its typed tool form (928ms)
  ✓   68 [mobile-light] › tests/browser/workspace.spec.js:204:1 › photo preview, private post and upstream-error retry preserve the draft (696ms)
  ✓   69 [mobile-light] › tests/browser/workspace.spec.js:256:1 › chat keeps failed text, sends successfully and loads real SDK local history (515ms)
  ✓   70 [mobile-light] › tests/browser/workspace.spec.js:282:1 › session expiry hides account data and prompts reconnection (439ms)
  ✓   71 [mobile-light] › tests/browser/workspace.spec.js:306:1 › video accepts a custom thumbnail and compression priority (475ms)
  ✓   72 [mobile-light] › tests/browser/workspace.spec.js:329:1 › SDK feed shapes render media, reactions and usable history pagination (642ms)
  ✓   73 [mobile-light] › tests/browser/workspace.spec.js:399:1 › incoming and outgoing friend requests keep their direction and action (459ms)
  ✓   74 [mobile-light] › tests/browser/workspace.spec.js:440:1 › another tab replacing the account cannot submit the old media draft (627ms)
  ✓   75 [mobile-light] › tests/browser/workspace.spec.js:474:1 › an upstream publishing gateway error preserves the draft and warns about duplicate posts (689ms)
  ✓   76 [mobile-light] › tests/browser/races.spec.js:29:1 › pending chat history locks its recipient and conversation until completion (530ms)
  ✓   77 [mobile-light] › tests/browser/races.spec.js:80:1 › friend lookup actions use the returned UID and disappear when the search changes (536ms)
  ✓   78 [mobile-light] › tests/browser/races.spec.js:131:1 › history defaults to the current user and invalidates cursors on filter edits (435ms)
  ✓   79 [mobile-light] › tests/browser/races.spec.js:163:1 › history hides actions for unknown authors and deletes only the current user's posts (399ms)
  ✓   80 [mobile-light] › tests/browser/workspace.spec.js:85:1 › guest navigation, theme, empty states and minimum width stay usable (1.0s)
  ✓   81 [mobile-light] › tests/browser/workspace.spec.js:120:1 › login dialog supports keyboard, safe cookie and logout (599ms)
  ✓   82 [mobile-light] › tests/browser/workspace.spec.js:178:1 › every SDK operation is reachable through its typed tool form (874ms)
  ✓   83 [mobile-light] › tests/browser/workspace.spec.js:204:1 › photo preview, private post and upstream-error retry preserve the draft (697ms)
  ✓   84 [mobile-light] › tests/browser/workspace.spec.js:256:1 › chat keeps failed text, sends successfully and loads real SDK local history (821ms)
  ✓   85 [mobile-light] › tests/browser/workspace.spec.js:282:1 › session expiry hides account data and prompts reconnection (521ms)
  ✓   86 [mobile-light] › tests/browser/workspace.spec.js:306:1 › video accepts a custom thumbnail and compression priority (674ms)
  ✓   87 [mobile-light] › tests/browser/workspace.spec.js:329:1 › SDK feed shapes render media, reactions and usable history pagination (703ms)
  ✓   88 [mobile-light] › tests/browser/workspace.spec.js:399:1 › incoming and outgoing friend requests keep their direction and action (536ms)
  ✓   89 [mobile-light] › tests/browser/workspace.spec.js:440:1 › another tab replacing the account cannot submit the old media draft (655ms)
  ✓   90 [mobile-light] › tests/browser/workspace.spec.js:474:1 › an upstream publishing gateway error preserves the draft and warns about duplicate posts (678ms)
  ✓   91 [mobile-dark] › tests/browser/races.spec.js:29:1 › pending chat history locks its recipient and conversation until completion (711ms)
  ✓   92 [mobile-dark] › tests/browser/races.spec.js:80:1 › friend lookup actions use the returned UID and disappear when the search changes (640ms)
  ✓   93 [mobile-dark] › tests/browser/races.spec.js:131:1 › history defaults to the current user and invalidates cursors on filter edits (503ms)
  ✓   94 [mobile-dark] › tests/browser/races.spec.js:163:1 › history hides actions for unknown authors and deletes only the current user's posts (461ms)
  ✓   95 [mobile-dark] › tests/browser/workspace.spec.js:85:1 › guest navigation, theme, empty states and minimum width stay usable (1.2s)
  ✓   96 [mobile-dark] › tests/browser/workspace.spec.js:120:1 › login dialog supports keyboard, safe cookie and logout (689ms)
  ✓   97 [mobile-dark] › tests/browser/workspace.spec.js:178:1 › every SDK operation is reachable through its typed tool form (960ms)
  ✓   98 [mobile-dark] › tests/browser/workspace.spec.js:204:1 › photo preview, private post and upstream-error retry preserve the draft (739ms)
  ✓   99 [mobile-dark] › tests/browser/workspace.spec.js:256:1 › chat keeps failed text, sends successfully and loads real SDK local history (525ms)
  ✓  100 [mobile-dark] › tests/browser/workspace.spec.js:282:1 › session expiry hides account data and prompts reconnection (516ms)
  ✓  101 [mobile-dark] › tests/browser/workspace.spec.js:306:1 › video accepts a custom thumbnail and compression priority (489ms)
  ✓  102 [mobile-dark] › tests/browser/workspace.spec.js:329:1 › SDK feed shapes render media, reactions and usable history pagination (709ms)
  ✓  103 [mobile-dark] › tests/browser/workspace.spec.js:399:1 › incoming and outgoing friend requests keep their direction and action (486ms)
  ✓  104 [mobile-dark] › tests/browser/workspace.spec.js:440:1 › another tab replacing the account cannot submit the old media draft (704ms)
  ✓  105 [mobile-dark] › tests/browser/workspace.spec.js:474:1 › an upstream publishing gateway error preserves the draft and warns about duplicate posts (701ms)
  ✓  106 [mobile-dark] › tests/browser/races.spec.js:29:1 › pending chat history locks its recipient and conversation until completion (631ms)
  ✓  107 [mobile-dark] › tests/browser/races.spec.js:80:1 › friend lookup actions use the returned UID and disappear when the search changes (686ms)
  ✓  108 [mobile-dark] › tests/browser/races.spec.js:131:1 › history defaults to the current user and invalidates cursors on filter edits (589ms)
  ✓  109 [mobile-dark] › tests/browser/races.spec.js:163:1 › history hides actions for unknown authors and deletes only the current user's posts (438ms)
  ✓  110 [mobile-dark] › tests/browser/workspace.spec.js:85:1 › guest navigation, theme, empty states and minimum width stay usable (1.2s)
  ✓  111 [mobile-dark] › tests/browser/workspace.spec.js:120:1 › login dialog supports keyboard, safe cookie and logout (773ms)
  ✓  112 [mobile-dark] › tests/browser/workspace.spec.js:178:1 › every SDK operation is reachable through its typed tool form (1.1s)
  ✓  113 [mobile-dark] › tests/browser/workspace.spec.js:204:1 › photo preview, private post and upstream-error retry preserve the draft (1.1s)
  ✓  114 [mobile-dark] › tests/browser/workspace.spec.js:256:1 › chat keeps failed text, sends successfully and loads real SDK local history (648ms)
  ✓  115 [mobile-dark] › tests/browser/workspace.spec.js:282:1 › session expiry hides account data and prompts reconnection (518ms)
  ✓  116 [mobile-dark] › tests/browser/workspace.spec.js:306:1 › video accepts a custom thumbnail and compression priority (534ms)
  ✓  117 [mobile-dark] › tests/browser/workspace.spec.js:329:1 › SDK feed shapes render media, reactions and usable history pagination (601ms)
  ✓  118 [mobile-dark] › tests/browser/workspace.spec.js:399:1 › incoming and outgoing friend requests keep their direction and action (509ms)
  ✓  119 [mobile-dark] › tests/browser/workspace.spec.js:440:1 › another tab replacing the account cannot submit the old media draft (707ms)
  ✓  120 [mobile-dark] › tests/browser/workspace.spec.js:474:1 › an upstream publishing gateway error preserves the draft and warns about duplicate posts (764ms)

  120 passed (1.4m)
```
