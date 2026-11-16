# Project structure implementation plan

Status: Implementation verified; publication pending

**Goal:** Make the verified Locket workspace navigable and maintainable, then push it to the operator's GitHub repository.
**Baseline:** af52cac
**Architecture:** docs/architecture.md

- [x] Inspect local files, remote, authorization and baseline tests; save a rollback commit.
- [x] Extract frontend features/components and readable style modules, preserving JSX and state behavior.
- [x] Extract backend routes, session lifecycle, middleware and SDK services while preserving createApp and HTTP contracts.
- [x] Group shared capability descriptors; update all callers, tests and worker paths.
- [x] Update architecture, README, system documentation, docs-check and regression evidence.
- [x] Review actual diff and run make build, make test, make lint, docs-check, and two desktop/mobile/light/dark browser rounds.
- [ ] Commit the reviewed structure, set origin/main, push without force, and verify the remote commit.
