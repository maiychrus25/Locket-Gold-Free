# Project architecture

Status: Implemented and verified in development; source publication pending.

## Scope and rollback

Separate the existing frontend screens, shared components, backend routes and SDK integration into cohesive modules. Preserve all 53 operations, cookie/session behavior, token redaction, media isolation and visual design. The verified baseline is commit `af52cac`; Git preserves the original implementation for rollback. No new dependency, database, framework or endpoint is required. The operator's subsequent gateway-error report adds explicit unavailable/unknown error metadata, documented in SYSTEM_DOCUMENTATION.md.

## Target layout

```text
src/
  app/                 application composition, navigation and layout
  components/          shared UI primitives
  features/            auth, feed, friends, chat, moments and tools
  lib/                 browser API client and data helpers
  styles/              tokens, foundation, layout, components and responsive rules
  main.jsx             React bootstrap only
server/
  app.js               Express composition and unchanged createApp test boundary
  routes/              auth, catalog, operations, media and chat handlers
  session/             session lifecycle and account request context
  middleware/          request security and error handling
  services/locket/     SDK client, isolated media process and worker
shared/
  operations.js        public registry, unchanged exports
  operations/          field schemas and account capability descriptors
tests/                 existing HTTP, SDK, media, helper and browser regressions
docs/                  architecture, contracts, plans and verification evidence
```

## Dependency direction

The browser imports only browser helpers and UI components; it never imports the SDK or server. Feature panels reuse shared UI and the API client. Express routes depend on an explicit session context and SDK integration; the composition root registers routes and lifecycle cleanup. Shared operation descriptors contain validation and public form metadata, with no HTTP or browser side effects.

Use named, direct imports and module boundaries. Avoid barrels for every folder, dependency injection containers, repositories, base classes or parallel architecture. Split state and behavior only at responsibilities already present in the code.

## Acceptance

All previous tests must continue to pass after import updates. Build and lint must pass without added dependencies. Two browser rounds each cover desktop/mobile and light/dark. Review the real diff, check docs, and scan the tracked files before committing. Push main to the operator-provided origin without force only after checks pass.

## Gateway-error follow-up

An upstream 502 is reproduced by public unauthenticated probes without replaying an account post. The adapter preserves SDK error status across its worker IPC and returns `UPSTREAM_UNAVAILABLE` with `outcome: unknown`; the UI displays the explanation and retains the draft. This improves handling of the external failure and does not claim to repair the upstream service.
