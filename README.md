# Lock Gold Free

A Vietnamese web workspace for Locket accounts, backed by `locket.js@0.0.3`: photo/video posting, feed/history, profile, friends, chat and advanced SDK tools. The name does not mean a paid Gold subscription is unlocked.

All website tools are free: no payments, paywalls or ads. The visual creator supports camera capture, local photos/videos, caption presets, recipients and video covers. Browse memories, view available viewers, read weekly Rollcall, manage your profile and choose light/dark appearance themes. Consumer screens use friend names and meaningful content, with no JSON output or protocol controls. All 53 SDK operations remain available through the validated backend. See [official-feature research and boundaries](docs/locket-features.md).

Live web interoperability remains unverified. Earlier development probes returned upstream 502; the operator subsequently confirmed posting works in the official app. Failed web posts preserve drafts and are never automatically retried. Passing local simulations does not establish provider availability or unlock official Gold entitlements.

## Project structure

```text
src/
  app/                   app state, navigation and layout
  components/            reusable UI primitives
  features/              auth, feed, friends, chat, moments, profile, guide, tools
  lib/                   browser requests and data helpers
  styles/                tokens, base, layout, components, responsive rules
  main.jsx               React entry point
server/
  routes/                HTTP endpoints by responsibility
  session/               lifecycle, account context and redaction
  middleware/            request security and error handling
  services/locket/       SDK adapter, isolated media process and worker
  app.js                 Express composition root
  index.js               local server entry point
shared/operations/       field schemas and capability descriptors
tests/                   HTTP, SDK, media, data and browser regressions
docs/                    architecture, API coverage, plans and evidence
```

See [architecture](docs/architecture.md) for dependency direction and module responsibilities. The public registry remains `shared/operations.js` so callers share one validated catalog.

## Development

Requires Node.js 24+ and ffmpeg.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4317. Log in with your own Locket email/password. Tokens stay on the Node server; passwords are not persisted. This is an unofficial client; live interoperability has not been verified without a real account.

## Prebuilt local run

```sh
make build
npm start
```

## Server readiness · 2026-11-17

Source publication is authorized; **public deployment readiness has not been established**. Passing local API/browser fixtures does not establish live Locket reliability.

- `npm audit --omit=dev` reports two high-severity package entries: the pinned SDK and its `sharp@0.33.5` dependency. This is one affected dependency chain, not two independently demonstrated exploits. See the [server assessment](SYSTEM_DOCUMENTATION.md#server-readiness-assessment--2026-11-17) for advisory links and limits. A compatible patched image stack must be tested before accepting public uploads.
- Express currently leaves `trust proxy` disabled. Behind a local reverse proxy, users share its peer IP for the login throttle; five failed logins can block a different user. The proxy trust boundary and forwarded-header handling need a verified configuration.
- Avatar updates can incorrectly report success: this SDK returns a failed Firebase update as a result object, and the adapter currently forwards it with HTTP 200. The failure must be normalized before this flow can be considered reliable.
- The current runtime is one loopback Node process with RAM sessions, at most 100 sessions and two media jobs. Restarting requires login again; replicas do not share sessions. Hosting needs HTTPS, the exact `APP_ORIGIN`, `NODE_ENV=production`, ffmpeg, suitable upload/time limits and SSE forwarding, followed by actual-server tests. Production must run a prebuilt artifact.

No server deployment, production configuration change, dependency override or live account write is part of this publication assessment.

## Checks

```sh
make test
make lint
node scripts/check-docs.js
```

For two desktop/mobile and light/dark browser rounds, start the Postman simulation and run `npm run test:browser -- --repeat-each=2`. Details: [SYSTEM_DOCUMENTATION.md](SYSTEM_DOCUMENTATION.md), [API coverage](docs/api-coverage.md), [verification](docs/verification.md), [DESIGN.md](DESIGN.md).
