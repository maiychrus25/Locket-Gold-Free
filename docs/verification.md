# Verification record

Status: Verified in local development on 2026-11-16. No public deployment.

## Observed result

- Build: exit 0; Build succeeded. Prebuilt browser assets in `dist/`.
- Node tests: 32 passed, 0 failed, no skipped tests; repeated core suite also passed.
- Lint: exit 0 with `--max-warnings 0`.
- Docs-check: 53 operations documented; version 0.1.0; clean.
- Browser: 14 scenarios × 4 desktop/mobile and light/dark projects × 2 rounds = 112 passed. Chrome, 1440×1000 and 390×844, plus 320px overflow checks.
- Prebuilt local runtime: `/`, `/api/health`, `/api/auth/session`, `/api/catalog` returned HTTP 200 on port 4317; catalog has 53 operations and initial session is signed out.
- Screenshots captured in four variants; desktop light and mobile dark inspected. Scroll width equals viewport width. Muted-text contrast on canvas measured 5.38:1 light and 8.51:1 dark. Mobile privacy text ends at 550.75px; artwork starts at 584.77px, with no overlap.
- Actual new-file diff reviewed; `git diff --check` clean. No existing project files modified, no commit/push, no deployment.

## Behaviors verified

Authentication, account isolation, CSRF, nested token redaction, expiry/logout races, session-generation binding, stale 401 rejection, allowlisting, ownership options, invalid file signatures, video type detection, disconnected upload slots, SSE cleanup, 30 concurrent reads, form parsing and pagination. Real SDK calls use local HTTP fixtures. Real ffmpeg extracts thumbnails, compresses video, converts WebM to MP4, and leaves no owned job directory after encoder failure. Worker results preserve parent history and cannot overwrite newer parent tokens.

Browser checks cover navigation, theme persistence, keyboard dialogs, login/logout/cookies, all 53 tool forms, private photo upload/error retry/draft preservation, video/custom thumbnail/compression priority, failed and successful chat sends, account replacement in another tab, feed/reactions/pagination, incoming/outgoing requests, pending-recipient and lookup targets, verified-author actions, horizontal overflow and mobile hero text overlap.

## Limits

Credentials and data used in tests are fixtures. No live Locket account, free-plan entitlement, Gold unlock, real friend delivery or production hosting was tested. WebSocket bridge lifecycle uses a controlled upstream; live WebSocket interoperability remains unverified. Mobile checks use browser emulation, not physical devices; Safari is unchecked. Private upstream APIs may change. Some SDK Firestore helpers turn errors into empty arrays; see SYSTEM_DOCUMENTATION.md.

## Exact output

### make build

```text
npm run build

> lock-gold-free@0.1.0 build
> vite build && node scripts/check-docs.js && echo 'Build succeeded'

vite v7.3.8 building client environment for production...
transforming...
✓ 1580 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.67 kB │ gzip:  0.45 kB
dist/assets/index-BSOpfzPr.css   25.22 kB │ gzip:  6.27 kB
dist/assets/index-CQ2J3ArQ.js   276.42 kB │ gzip: 85.81 kB
✓ built in 995ms
docs-check: 53 operations documented; version 0.1.0; clean
Build succeeded
```

### make test

```text
npm test

> lock-gold-free@0.1.0 test
> node --test tests/*.test.js

✔ requires a session before any account operation (66.766416ms)
✔ catalog is public and never includes invocation code or credentials (56.933792ms)
✔ login rotates an opaque HttpOnly cookie and does not expose tokens (36.818666ms)
✔ sessions keep different accounts isolated and redact nested tokens (55.984375ms)
✔ rejects unallowlisted methods and unknown parameters (32.826708ms)
✔ validates required values and converts only documented argument shapes (34.120833ms)
✔ rejects cross-origin mutations and missing application header (30.501375ms)
✔ logout invalidates the old session and closes its resources (32.508125ms)
✔ expired sessions cannot access account data (29.953833ms)
✔ upstream errors are visible without leaking a session secret (30.258333ms)
✔ rate limits failed logins without echoing credentials (31.85575ms)
✔ media requires real image bytes, not an attacker path or mislabeled file (47.41175ms)
✔ media passes validated bytes and typed options to the SDK (38.467125ms)
✔ bounded concurrent account reads preserve isolation (50.477209ms)
✔ logout during an active request cannot expose its token in response text (66.023458ms)
✔ disconnecting an upload keeps its media slot until the SDK operation ends (36.848ms)
✔ SSE emits redacted messages and closes its upstream controller on disconnect (38.113125ms)
✔ prototype properties and unsupported ownership overrides are rejected (30.193625ms)
✔ an SVG mislabeled as PNG cannot enter the raster upload pipeline (35.897083ms)
✔ a stale page cannot write through a different account cookie (30.291875ms)
✔ unfiltered history does not misidentify friend moments as my own (29.721834ms)
✔ video normalization uses detected bytes instead of the declared MIME (28.911791ms)
✔ every account-facing SDK method has an allowlisted web flow (0.523ms)
✔ optional pagination remains optional, recipients do not accidentally target nobody (3.427459ms)
✔ rejects empty messages, invalid dates and contradictory privacy before SDK calls (1.589834ms)
✔ frontend preserves pagination cursors while removing account credentials (1.244417ms)
✔ form parser preserves false and parses actual JSON and numeric inputs (0.250459ms)
✔ renders supported nested result lists and refuses executable media URLs (0.137917ms)
✔ late 401 from an old session cannot expire the new login (21.592417ms)
✔ isolated worker extracts and compresses real video, cleaning success and encoder failure (723.422291ms)
✔ worker preserves parent history and cannot overwrite a newer token (1.247208ms)
✔ real SDK authenticates, refreshes, uploads and handles failure over local HTTP (112.160792ms)
ℹ tests 32
ℹ suites 0
ℹ pass 32
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1069.61
```

### make lint

```text
npm run lint

> lock-gold-free@0.1.0 lint
> eslint . --max-warnings 0
```

### npm run test:browser -- --repeat-each=2

```text
> lock-gold-free@0.1.0 test:browser
> playwright test --repeat-each=2


Running 112 tests using 1 worker

  ✓    1 [desktop-light] › tests/browser/races.spec.js:29:1 › pending chat history locks its recipient and conversation until completion (1.1s)
  ✓    2 [desktop-light] › tests/browser/races.spec.js:80:1 › friend lookup actions use the returned UID and disappear when the search changes (541ms)
  ✓    3 [desktop-light] › tests/browser/races.spec.js:131:1 › history defaults to the current user and invalidates cursors on filter edits (512ms)
  ✓    4 [desktop-light] › tests/browser/races.spec.js:163:1 › history hides actions for unknown authors and deletes only the current user's posts (461ms)
  ✓    5 [desktop-light] › tests/browser/workspace.spec.js:85:1 › guest navigation, theme, empty states and minimum width stay usable (1.0s)
  ✓    6 [desktop-light] › tests/browser/workspace.spec.js:120:1 › login dialog supports keyboard, safe cookie and logout (582ms)
  ✓    7 [desktop-light] › tests/browser/workspace.spec.js:178:1 › every SDK operation is reachable through its typed tool form (897ms)
  ✓    8 [desktop-light] › tests/browser/workspace.spec.js:204:1 › photo preview, private post and upstream-error retry preserve the draft (620ms)
  ✓    9 [desktop-light] › tests/browser/workspace.spec.js:256:1 › chat keeps failed text, sends successfully and loads real SDK local history (468ms)
  ✓   10 [desktop-light] › tests/browser/workspace.spec.js:282:1 › session expiry hides account data and prompts reconnection (434ms)
  ✓   11 [desktop-light] › tests/browser/workspace.spec.js:306:1 › video accepts a custom thumbnail and compression priority (469ms)
  ✓   12 [desktop-light] › tests/browser/workspace.spec.js:329:1 › SDK feed shapes render media, reactions and usable history pagination (541ms)
  ✓   13 [desktop-light] › tests/browser/workspace.spec.js:399:1 › incoming and outgoing friend requests keep their direction and action (428ms)
  ✓   14 [desktop-light] › tests/browser/workspace.spec.js:440:1 › another tab replacing the account cannot submit the old media draft (618ms)
  ✓   15 [desktop-light] › tests/browser/races.spec.js:29:1 › pending chat history locks its recipient and conversation until completion (580ms)
  ✓   16 [desktop-light] › tests/browser/races.spec.js:80:1 › friend lookup actions use the returned UID and disappear when the search changes (588ms)
  ✓   17 [desktop-light] › tests/browser/races.spec.js:131:1 › history defaults to the current user and invalidates cursors on filter edits (419ms)
  ✓   18 [desktop-light] › tests/browser/races.spec.js:163:1 › history hides actions for unknown authors and deletes only the current user's posts (381ms)
  ✓   19 [desktop-light] › tests/browser/workspace.spec.js:85:1 › guest navigation, theme, empty states and minimum width stay usable (1.0s)
  ✓   20 [desktop-light] › tests/browser/workspace.spec.js:120:1 › login dialog supports keyboard, safe cookie and logout (572ms)
  ✓   21 [desktop-light] › tests/browser/workspace.spec.js:178:1 › every SDK operation is reachable through its typed tool form (909ms)
  ✓   22 [desktop-light] › tests/browser/workspace.spec.js:204:1 › photo preview, private post and upstream-error retry preserve the draft (586ms)
  ✓   23 [desktop-light] › tests/browser/workspace.spec.js:256:1 › chat keeps failed text, sends successfully and loads real SDK local history (465ms)
  ✓   24 [desktop-light] › tests/browser/workspace.spec.js:282:1 › session expiry hides account data and prompts reconnection (413ms)
  ✓   25 [desktop-light] › tests/browser/workspace.spec.js:306:1 › video accepts a custom thumbnail and compression priority (448ms)
  ✓   26 [desktop-light] › tests/browser/workspace.spec.js:329:1 › SDK feed shapes render media, reactions and usable history pagination (521ms)
  ✓   27 [desktop-light] › tests/browser/workspace.spec.js:399:1 › incoming and outgoing friend requests keep their direction and action (419ms)
  ✓   28 [desktop-light] › tests/browser/workspace.spec.js:440:1 › another tab replacing the account cannot submit the old media draft (580ms)
  ✓   29 [desktop-dark] › tests/browser/races.spec.js:29:1 › pending chat history locks its recipient and conversation until completion (487ms)
  ✓   30 [desktop-dark] › tests/browser/races.spec.js:80:1 › friend lookup actions use the returned UID and disappear when the search changes (485ms)
  ✓   31 [desktop-dark] › tests/browser/races.spec.js:131:1 › history defaults to the current user and invalidates cursors on filter edits (386ms)
  ✓   32 [desktop-dark] › tests/browser/races.spec.js:163:1 › history hides actions for unknown authors and deletes only the current user's posts (390ms)
  ✓   33 [desktop-dark] › tests/browser/workspace.spec.js:85:1 › guest navigation, theme, empty states and minimum width stay usable (1.2s)
  ✓   34 [desktop-dark] › tests/browser/workspace.spec.js:120:1 › login dialog supports keyboard, safe cookie and logout (665ms)
  ✓   35 [desktop-dark] › tests/browser/workspace.spec.js:178:1 › every SDK operation is reachable through its typed tool form (982ms)
  ✓   36 [desktop-dark] › tests/browser/workspace.spec.js:204:1 › photo preview, private post and upstream-error retry preserve the draft (567ms)
  ✓   37 [desktop-dark] › tests/browser/workspace.spec.js:256:1 › chat keeps failed text, sends successfully and loads real SDK local history (488ms)
  ✓   38 [desktop-dark] › tests/browser/workspace.spec.js:282:1 › session expiry hides account data and prompts reconnection (419ms)
  ✓   39 [desktop-dark] › tests/browser/workspace.spec.js:306:1 › video accepts a custom thumbnail and compression priority (582ms)
  ✓   40 [desktop-dark] › tests/browser/workspace.spec.js:329:1 › SDK feed shapes render media, reactions and usable history pagination (578ms)
  ✓   41 [desktop-dark] › tests/browser/workspace.spec.js:399:1 › incoming and outgoing friend requests keep their direction and action (521ms)
  ✓   42 [desktop-dark] › tests/browser/workspace.spec.js:440:1 › another tab replacing the account cannot submit the old media draft (784ms)
  ✓   43 [desktop-dark] › tests/browser/races.spec.js:29:1 › pending chat history locks its recipient and conversation until completion (608ms)
  ✓   44 [desktop-dark] › tests/browser/races.spec.js:80:1 › friend lookup actions use the returned UID and disappear when the search changes (512ms)
  ✓   45 [desktop-dark] › tests/browser/races.spec.js:131:1 › history defaults to the current user and invalidates cursors on filter edits (451ms)
  ✓   46 [desktop-dark] › tests/browser/races.spec.js:163:1 › history hides actions for unknown authors and deletes only the current user's posts (379ms)
  ✓   47 [desktop-dark] › tests/browser/workspace.spec.js:85:1 › guest navigation, theme, empty states and minimum width stay usable (983ms)
  ✓   48 [desktop-dark] › tests/browser/workspace.spec.js:120:1 › login dialog supports keyboard, safe cookie and logout (690ms)
  ✓   49 [desktop-dark] › tests/browser/workspace.spec.js:178:1 › every SDK operation is reachable through its typed tool form (921ms)
  ✓   50 [desktop-dark] › tests/browser/workspace.spec.js:204:1 › photo preview, private post and upstream-error retry preserve the draft (565ms)
  ✓   51 [desktop-dark] › tests/browser/workspace.spec.js:256:1 › chat keeps failed text, sends successfully and loads real SDK local history (480ms)
  ✓   52 [desktop-dark] › tests/browser/workspace.spec.js:282:1 › session expiry hides account data and prompts reconnection (451ms)
  ✓   53 [desktop-dark] › tests/browser/workspace.spec.js:306:1 › video accepts a custom thumbnail and compression priority (587ms)
  ✓   54 [desktop-dark] › tests/browser/workspace.spec.js:329:1 › SDK feed shapes render media, reactions and usable history pagination (541ms)
  ✓   55 [desktop-dark] › tests/browser/workspace.spec.js:399:1 › incoming and outgoing friend requests keep their direction and action (477ms)
  ✓   56 [desktop-dark] › tests/browser/workspace.spec.js:440:1 › another tab replacing the account cannot submit the old media draft (658ms)
  ✓   57 [mobile-light] › tests/browser/races.spec.js:29:1 › pending chat history locks its recipient and conversation until completion (506ms)
  ✓   58 [mobile-light] › tests/browser/races.spec.js:80:1 › friend lookup actions use the returned UID and disappear when the search changes (524ms)
  ✓   59 [mobile-light] › tests/browser/races.spec.js:131:1 › history defaults to the current user and invalidates cursors on filter edits (413ms)
  ✓   60 [mobile-light] › tests/browser/races.spec.js:163:1 › history hides actions for unknown authors and deletes only the current user's posts (384ms)
  ✓   61 [mobile-light] › tests/browser/workspace.spec.js:85:1 › guest navigation, theme, empty states and minimum width stay usable (994ms)
  ✓   62 [mobile-light] › tests/browser/workspace.spec.js:120:1 › login dialog supports keyboard, safe cookie and logout (604ms)
  ✓   63 [mobile-light] › tests/browser/workspace.spec.js:178:1 › every SDK operation is reachable through its typed tool form (880ms)
  ✓   64 [mobile-light] › tests/browser/workspace.spec.js:204:1 › photo preview, private post and upstream-error retry preserve the draft (661ms)
  ✓   65 [mobile-light] › tests/browser/workspace.spec.js:256:1 › chat keeps failed text, sends successfully and loads real SDK local history (495ms)
  ✓   66 [mobile-light] › tests/browser/workspace.spec.js:282:1 › session expiry hides account data and prompts reconnection (418ms)
  ✓   67 [mobile-light] › tests/browser/workspace.spec.js:306:1 › video accepts a custom thumbnail and compression priority (471ms)
  ✓   68 [mobile-light] › tests/browser/workspace.spec.js:329:1 › SDK feed shapes render media, reactions and usable history pagination (630ms)
  ✓   69 [mobile-light] › tests/browser/workspace.spec.js:399:1 › incoming and outgoing friend requests keep their direction and action (474ms)
  ✓   70 [mobile-light] › tests/browser/workspace.spec.js:440:1 › another tab replacing the account cannot submit the old media draft (700ms)
  ✓   71 [mobile-light] › tests/browser/races.spec.js:29:1 › pending chat history locks its recipient and conversation until completion (519ms)
  ✓   72 [mobile-light] › tests/browser/races.spec.js:80:1 › friend lookup actions use the returned UID and disappear when the search changes (501ms)
  ✓   73 [mobile-light] › tests/browser/races.spec.js:131:1 › history defaults to the current user and invalidates cursors on filter edits (428ms)
  ✓   74 [mobile-light] › tests/browser/races.spec.js:163:1 › history hides actions for unknown authors and deletes only the current user's posts (373ms)
  ✓   75 [mobile-light] › tests/browser/workspace.spec.js:85:1 › guest navigation, theme, empty states and minimum width stay usable (1.0s)
  ✓   76 [mobile-light] › tests/browser/workspace.spec.js:120:1 › login dialog supports keyboard, safe cookie and logout (588ms)
  ✓   77 [mobile-light] › tests/browser/workspace.spec.js:178:1 › every SDK operation is reachable through its typed tool form (1.1s)
  ✓   78 [mobile-light] › tests/browser/workspace.spec.js:204:1 › photo preview, private post and upstream-error retry preserve the draft (767ms)
  ✓   79 [mobile-light] › tests/browser/workspace.spec.js:256:1 › chat keeps failed text, sends successfully and loads real SDK local history (497ms)
  ✓   80 [mobile-light] › tests/browser/workspace.spec.js:282:1 › session expiry hides account data and prompts reconnection (426ms)
  ✓   81 [mobile-light] › tests/browser/workspace.spec.js:306:1 › video accepts a custom thumbnail and compression priority (454ms)
  ✓   82 [mobile-light] › tests/browser/workspace.spec.js:329:1 › SDK feed shapes render media, reactions and usable history pagination (561ms)
  ✓   83 [mobile-light] › tests/browser/workspace.spec.js:399:1 › incoming and outgoing friend requests keep their direction and action (502ms)
  ✓   84 [mobile-light] › tests/browser/workspace.spec.js:440:1 › another tab replacing the account cannot submit the old media draft (761ms)
  ✓   85 [mobile-dark] › tests/browser/races.spec.js:29:1 › pending chat history locks its recipient and conversation until completion (519ms)
  ✓   86 [mobile-dark] › tests/browser/races.spec.js:80:1 › friend lookup actions use the returned UID and disappear when the search changes (509ms)
  ✓   87 [mobile-dark] › tests/browser/races.spec.js:131:1 › history defaults to the current user and invalidates cursors on filter edits (424ms)
  ✓   88 [mobile-dark] › tests/browser/races.spec.js:163:1 › history hides actions for unknown authors and deletes only the current user's posts (385ms)
  ✓   89 [mobile-dark] › tests/browser/workspace.spec.js:85:1 › guest navigation, theme, empty states and minimum width stay usable (957ms)
  ✓   90 [mobile-dark] › tests/browser/workspace.spec.js:120:1 › login dialog supports keyboard, safe cookie and logout (657ms)
  ✓   91 [mobile-dark] › tests/browser/workspace.spec.js:178:1 › every SDK operation is reachable through its typed tool form (1.1s)
  ✓   92 [mobile-dark] › tests/browser/workspace.spec.js:204:1 › photo preview, private post and upstream-error retry preserve the draft (662ms)
  ✓   93 [mobile-dark] › tests/browser/workspace.spec.js:256:1 › chat keeps failed text, sends successfully and loads real SDK local history (498ms)
  ✓   94 [mobile-dark] › tests/browser/workspace.spec.js:282:1 › session expiry hides account data and prompts reconnection (422ms)
  ✓   95 [mobile-dark] › tests/browser/workspace.spec.js:306:1 › video accepts a custom thumbnail and compression priority (460ms)
  ✓   96 [mobile-dark] › tests/browser/workspace.spec.js:329:1 › SDK feed shapes render media, reactions and usable history pagination (613ms)
  ✓   97 [mobile-dark] › tests/browser/workspace.spec.js:399:1 › incoming and outgoing friend requests keep their direction and action (441ms)
  ✓   98 [mobile-dark] › tests/browser/workspace.spec.js:440:1 › another tab replacing the account cannot submit the old media draft (614ms)
  ✓   99 [mobile-dark] › tests/browser/races.spec.js:29:1 › pending chat history locks its recipient and conversation until completion (536ms)
  ✓  100 [mobile-dark] › tests/browser/races.spec.js:80:1 › friend lookup actions use the returned UID and disappear when the search changes (525ms)
  ✓  101 [mobile-dark] › tests/browser/races.spec.js:131:1 › history defaults to the current user and invalidates cursors on filter edits (422ms)
  ✓  102 [mobile-dark] › tests/browser/races.spec.js:163:1 › history hides actions for unknown authors and deletes only the current user's posts (386ms)
  ✓  103 [mobile-dark] › tests/browser/workspace.spec.js:85:1 › guest navigation, theme, empty states and minimum width stay usable (1.2s)
  ✓  104 [mobile-dark] › tests/browser/workspace.spec.js:120:1 › login dialog supports keyboard, safe cookie and logout (591ms)
  ✓  105 [mobile-dark] › tests/browser/workspace.spec.js:178:1 › every SDK operation is reachable through its typed tool form (892ms)
  ✓  106 [mobile-dark] › tests/browser/workspace.spec.js:204:1 › photo preview, private post and upstream-error retry preserve the draft (668ms)
  ✓  107 [mobile-dark] › tests/browser/workspace.spec.js:256:1 › chat keeps failed text, sends successfully and loads real SDK local history (495ms)
  ✓  108 [mobile-dark] › tests/browser/workspace.spec.js:282:1 › session expiry hides account data and prompts reconnection (432ms)
  ✓  109 [mobile-dark] › tests/browser/workspace.spec.js:306:1 › video accepts a custom thumbnail and compression priority (467ms)
  ✓  110 [mobile-dark] › tests/browser/workspace.spec.js:329:1 › SDK feed shapes render media, reactions and usable history pagination (635ms)
  ✓  111 [mobile-dark] › tests/browser/workspace.spec.js:399:1 › incoming and outgoing friend requests keep their direction and action (426ms)
  ✓  112 [mobile-dark] › tests/browser/workspace.spec.js:440:1 › another tab replacing the account cannot submit the old media draft (604ms)

  112 passed (1.2m)
```
