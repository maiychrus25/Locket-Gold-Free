import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { operations } from "../shared/operations.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [system, coverage, spec, packageText] = await Promise.all([
  read("SYSTEM_DOCUMENTATION.md"),
  read("docs/api-coverage.md"),
  read("docs/spec.md"),
  read("package.json"),
]);
assert.ok(
  system.includes(`Version: ${JSON.parse(packageText).version}`),
  "System documentation version is stale",
);
assert.ok(system.includes("<!-- docs-check:"), "Missing docs-check marker");
assert.match(spec, /Status: /, "Spec must record delivery state");
for (const operation of operations)
  assert.ok(
    coverage.includes(`\`${operation.group}.${operation.method}\``),
    `Undocumented operation: ${operation.group}.${operation.method}`,
  );
assert.match(
  system,
  /live.*unverified/i,
  "Live verification limit must be explicit",
);
await Promise.all(
  [
    "docs/architecture.md",
    "src/app/App.jsx",
    "src/features/feed/FeedPanel.jsx",
    "server/routes/media.js",
    "server/session/lifecycle.js",
    "server/services/locket/media-worker.js",
    "shared/operations/validation.js",
  ].map((path) => access(new URL(`../${path}`, import.meta.url))),
);
assert.match(
  system,
  /UPSTREAM_UNAVAILABLE/,
  "Upstream-error contract must be documented",
);
console.log(
  `docs-check: ${operations.length} operations documented; version ${JSON.parse(packageText).version}; clean`,
);
