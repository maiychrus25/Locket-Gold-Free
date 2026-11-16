# Lock Gold Free

A Vietnamese web workspace for Locket accounts, backed by `locket.js@0.0.3`: photo/video posting, feed/history, profile, friends, chat and advanced SDK tools. The name does not mean a paid Gold subscription is unlocked.

Current limitation: the development machine observed HTTP 502 from the upstream Locket API on 2026-11-16. The website reports unconfirmed operations and preserves drafts; it does not automatically retry posts. Passing local simulations does not establish live provider availability.

## Project structure

```text
src/
  app/                   app state, navigation and layout
  components/            reusable UI primitives
  features/              auth, feed, friends, chat, moments, tools
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

## Checks

```sh
make test
make lint
node scripts/check-docs.js
```

For two desktop/mobile and light/dark browser rounds, start the Postman simulation and run `npm run test:browser -- --repeat-each=2`. Details: [SYSTEM_DOCUMENTATION.md](SYSTEM_DOCUMENTATION.md), [API coverage](docs/api-coverage.md), [verification](docs/verification.md), [DESIGN.md](DESIGN.md).
