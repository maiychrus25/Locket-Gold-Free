# Friend feed repair verification

Status: Deployed and verified at https://reelsup.store, 2026-11-17.

Baseline: 29a4cbc, branch fix/friend-feed. The operator reports a single friend post without an author name. The repair is limited to profile resolution, latest-feed continuation, matching tests and documentation; no dependency, new provider endpoint, migration or unrelated service change.

## Evidence

```text
make test, two rounds: tests 46; pass 46; fail 0; skipped 0 each
playwright test --repeat-each=2: 368 passed (5.8m)
make build: Build succeeded
make lint: eslint . --max-warnings 0; exit 0
docs-check: 53 operations documented; version 0.1.0; clean
Linux/amd64 image build: 46 native tests passed; Build succeeded
```

The new mobile browser tests failed before implementation for missing names, missing load-more, and no profile lookup. Native tests first rejected the new cursor, lacked the feed/author helpers, and reproduced the absent continuation transport. After repair, the real installed SDK sends the expected sync_token through local HTTP while retaining its own analytics/device envelope. The first call and array response remain compatible. Invalid/oversized cursor values are rejected before SDK work.

Independent review found a provider error envelope with data=[] could falsely exhaust pagination; a failing regression test was added and the adapter now rejects status errors before accepting an array. Tests also preserve valid arrays attached to the SDK's not-modified status. Unknown/malformed responses become a sanitized error rather than a false end-of-feed.

The full 46-scenario browser suite ran desktop/mobile light/dark twice. New cases resolve raw author UIDs through actual fixture profiles, retain two pages without duplicates, stop repeated cursors, preserve content/cursor after failure, lock pending page reads, and discard late profiles after logout. Existing history cursor/filter and verified-author permissions, reactions/views/comments, camera/media/drafts, session races, friends/chat/profile and utilities continue to pass. Named inline authors and unavailable-author fallbacks remain honest; profile enrichment never grants deletion ownership. Screenshots of named cards were inspected at 1440, 390 and 320px with no horizontal overflow.

The existing Linux runtime, image scan and production CSP checks are reused. Runtime image index digest: sha256:a3a6911164cb3048f6b232c44999dda19073f1daf2d115426d1dc779edba3ac5; image configuration digest: sha256:8110ac1d8eb92481361f4cfe317869850dab15fd5a9883d1060a1fe295bfaa9a. Full native tests passed inside the image build. The pruned nonroot/read-only runtime passed real ESM/CommonJS sharp conversion, rejected-avatar handling and ffmpeg-worker checks; Trivy reported zero HIGH/CRITICAL image findings and npm audit reported zero production dependency findings. The three new friend-feed scenarios then passed against the actual compiled image through a local TLS proxy in all four desktop/mobile light/dark projects twice: 24 passed (17.5s). No new application dependency was added. The prior verified image/configuration remains the rollback target; artifact hashes and actual deployment results are recorded after release.

Release `20261117-feeda3a6911164cb` was delivered as a prebuilt Linux image/configuration bundle, SHA256 b96a7bdb3afed01568cbb648611cd311647bddc358db16e8e5feb32ef28d5d8b. Archive, components and image configuration digest were verified before launch. Only the Locket container was replaced. It is healthy and all seven unrelated container IDs and three Nginx vhost hashes match the pre-deploy baseline. `/opt/lock-gold-free/current` points to this release and `/opt/lock-gold-free/previous` retains release 20261117-cea769413051 and its image for rollback. There was no source build, migration or Nginx configuration change on the target. Public HTTPS and health return 200; the live catalog contains 53 operations with the new optional cursor. Guest/session and API no-store protections remain.

The same three regression scenarios passed against the actual public bundle in desktop/mobile light/dark: **12 passed (15.7s)**. These public browser checks intercept account/profile/feed responses with controlled data; they prove the deployed bundle's behavior without reading an operator's real account. Real provider continuation transport is separately exercised by the installed SDK over local HTTP. Independent final review's error-envelope finding was fixed and rechecked, and no further blocker was reported. Users must refresh the page and log in again after the RAM-session container replacement.

Logs: /tmp/lock-gold-feed-*.log and /tmp/lock-gold-feed-browser. Regression tests use only controlled accounts and local upstream fixtures; no actual friend feed was fetched through an operator session. Passing simulations does not establish how many moments the live private API returns for this account. Unavailable profiles are not invented. Production replacement discards RAM sessions and requires login again.
