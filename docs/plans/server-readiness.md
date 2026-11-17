# Server readiness and VPS release

Status: Deployed and verified at https://reelsup.store

Baseline: `a12b248`, development branch `fix/server-readiness`. The operator authorizes repairing the recorded blockers and deploying the verified artifact to the provided VPS/domain. No unrelated host or service is included. Git preserves rollback; the target must retain the previous release and ingress configuration before any replacement.

Design: keep one Node process behind a same-host HTTPS proxy. Trust only loopback proxy peers in production, require an exact HTTPS APP_ORIGIN, keep secure cookies and enable a browser policy compatible with current media. Normalize rejected avatar results through existing error handling, with no write retries. Pin the SDK's image dependency to the patched sharp release and prove parser/SDK/media compatibility instead of weakening upload validation. Add only the packaging needed for a reproducible Linux artifact; configure target-specific ingress after read-only VPS inspection.

Scope: `package.json`/lockfile, existing server composition/security/media adapter, native tests, release packaging and system/spec/readme/changelog. No UI redesign, account data migration, billing, unofficial Gold activation or unrelated refactor. Reuse Express, Helmet, Zod, Node tests, ffmpeg and Postman fixtures.

- [x] Reproduce avatar rejection and proxy IP isolation in regression tests before fixing.
- [x] Normalize avatar errors, enforce the production origin/proxy/browser boundaries, and verify successful existing flows.
- [x] Install the patched image dependency, rerun real SDK/image/video checks and dependency audit.
- [x] Inspect authorized VPS services, DNS, operating system and resources without printing credentials.
- [x] Run native checks twice, two full desktop/mobile light/dark browser rounds, build/lint/docs-check and independent change review.
- [x] Build and verify a Linux artifact, deploy the artifact into an isolated service, configure HTTPS/proxy/DNS without disrupting existing services, and test the public domain.

Release gates: no known unresolved high/critical application dependency findings, no test regressions, bounded uploads/jobs, isolated sessions and credential redaction, correct proxy rate limits, no avatar false success, tested runtime/image/startup policy. These checks do not guarantee absence of vulnerabilities or live provider availability. Real account writes require an explicit test instruction; deployment health/security checks use guest/invalid-fixture requests.

The supplied domain is Cloudflare-proxied. Origin access, existing services, certificate path and forwarding chain must be verified before deployment. Pending DNS/SSH information or inability to authenticate must be reported; never substitute another project's host.

Origin release is installed as an immutable image, healthy and independently verified through its valid TLS certificate. Existing services/configuration were preserved. The operator changed Cloudflare to Full (strict); the public edge, API security boundaries and desktop/mobile light/dark browser checks passed. Ingress no-transform prevents edge script injection while preserving the strict CSP. See [release evidence](../verification/server-release.md).
