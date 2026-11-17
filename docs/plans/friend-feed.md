# Friend feed repair

Status: Deployed and verified at https://reelsup.store

Baseline: 29a4cbc; development branch fix/friend-feed. Scope: existing FeedPanel, SDK integration/operation descriptor, matching tests and documentation. Preserve consumer copy, all 53 operations, account isolation, history filters/ownership, reactions/comments, and the verified production configuration. No dependency, new provider endpoint, account write or unrelated UI redesign.

Root causes: latest moments carry author UIDs but the card passes that value to a name formatter without resolving friend profiles. The latest operation accepts no continuation token and the UI replaces its payload, so the first returned batch is the entire visible feed.

Design: resolve actual friend/self profiles in the session-owned feed component; never display raw UIDs or guess history authors. Add optional validated pageToken to getLatest, retaining its existing array response and first-call behavior; use the fixed getLatestMomentV2 sync_token pattern already used by the pinned SDK for continuation. Latest-page reads append/deduplicate, stop on empty/repeated pages, and preserve content/cursor on failure. Existing history pagination and filters retain their contract. Bound concurrent page reads and reject stale account/filter responses.

- [x] Write failing author/pagination/error/stale-session browser checks and native SDK adapter validation checks.
- [x] Implement the smallest feed/profile and continuation changes with pending/error/empty states.
- [x] Verify unknown-author permissions, prior history behavior, drafts, friends/chat/profile/media and all 53 operations; run native checks twice, two desktop/mobile light/dark browser rounds, build/lint/docs-check and diff review.
- [x] Build/scan the Linux artifact, keep the prior verified image for rollback, publish source and update only the Locket service on the authorized VPS. Verify the domain and document live-account limits.

Risks: attributing a post to the wrong user, skipped/duplicated pages, stale profile results after account changes, failed paging losing content, or disturbing other VPS services. Tests must cover these explicitly. Rollback uses the previous immutable release configuration/image; never delete user data or unrelated resources.
