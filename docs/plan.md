# Lock Gold Free Implementation Plan

> For agentic workers: apply Superpowers execution and verification; user authorized implementation and sensible defaults. Keep work local.

**Goal:** Deliver a complete local web client for account-facing locket.js features.
**Architecture:** React client + same-origin Node/Express SDK adapter, typed operation registry, HttpOnly sessions, multipart media and SSE chat.
**Tech Stack:** Node 24, React, Vite, Express 5, Zod, Multer, locket.js 0.0.3; native node:test and Playwright.
**Spec:** docs/spec.md

## Global constraints
English identifiers, Vietnamese UI. No real credentials, push, deployment or production changes. Reuse SDK; do not implement Premium unlock. All changes stay in this new project.

## Task 1 — Safe SDK API
- [x] Write HTTP integration tests first for unauthenticated operations, input rejection, login response redaction, isolated sessions, cross-origin writes and logout invalidation.
- [x] Run tests and observe the missing createApp contract fail.
- [x] Implement `shared/operations.js` metadata/schema registry and `server/app.js` createApp({ createClient, clock }) with `/api/auth/login`, `/api/auth/session`, `/api/auth/logout`, `/api/catalog`, `/api/operations/:group/:method`, `/api/media/:operation`, `/api/chat/events`.
- [x] Implement `server/client.js`: real SDK factory, no token persistence, per-session scratch directory, clean close, single-flight token refresh.
- [x] Verify tests pass and API coverage includes every account-facing SDK method.

## Task 2 — Web interface
- [x] Implement React shell, signed-out empty states, login, theme and responsive navigation from DESIGN.md.
- [x] Add feed, composer, friends, conversations, profile and complete advanced tool forms against the catalog contract.
- [x] Handle pending, empty and failed requests; confirmations for destructive actions; no fabricated live data.
- [x] Build and verify API/UI contracts, keyboard dialog interaction and multipart previews.

## Task 3 — Review and evidence
- [x] Add API coverage and system/run documentation plus docs-check.
- [x] Run local upstream simulation for SDK authentication/post/error paths.
- [x] Run two browser stress rounds, each desktop/mobile/light/dark, plus concurrent API requests.
- [x] Review actual new files/diff; address findings; run make build, make test, make lint and docs-check with evidence.
- [x] Hand off local URL, start command and verification limits. No deploy without approval.
