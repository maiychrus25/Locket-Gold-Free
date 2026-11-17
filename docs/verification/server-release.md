# Hardened server release verification

Status: Origin deployed and verified; public edge awaits Cloudflare Full (strict), 2026-11-17.

Baseline `a12b248`; development branch `fix/server-readiness`. The operator authorizes remediation, publication and deployment to the supplied VPS/domain. Credentials are used only in SSH authentication and never stored in this repository, artifact or report.

## Local and artifact checks

```text
make test, two rounds: tests 43; pass 43; fail 0; skipped 0 each
playwright test --repeat-each=2: 344 passed (5.8m)
make build: Build succeeded
make lint: eslint . --max-warnings 0; exit 0
docs-check: 53 operations documented; version 0.1.0; clean
Linux/amd64 image build: 43 native tests passed; Build succeeded
npm audit, full and production: 0 vulnerabilities
Trivy v0.76.2 final Alpine 3.24.4 image: 0 HIGH/CRITICAL findings
```

The original avatar, startup-origin and proxy-throttle regression tests failed before fixes and passed afterward. Extra tests reject broad proxy trust and production Vite startup. Cross-architecture test execution exposed an overly short subprocess test deadline; the test now checks the actual exit/error message with a bounded 10-second deadline and an explicit no-timeout assertion. The production entry point rejects dev mode before runtime setup. No test assertion was removed or skipped.

The first Debian image had known image-package findings and was rejected. The final image uses the pinned current Alpine Node base; unused runtime npm/yarn tooling is removed. Trivy was downloaded from the official release and its archive SHA256 verified before use; its vulnerability database was updated. The final count includes OS and detected Node packages and is not an absence-of-vulnerabilities guarantee.

The pruned final image was run nonroot with no network, a read-only root and production resource limits. Actual ESM and SDK CommonJS sharp versions are 0.35.5; the SDK converted PNG to WebP instead of using its silent fallback; the real SDK avatar rejection was converted into a sanitized exception; an isolated ffmpeg worker extracted a real video thumbnail and cleaned up. A development helper initially passed a stdin-only Node flag into forked workers; the check was rerun using the same file entry-point model as production. The final runtime check passed.

Four additional production-artifact browser variants used a local TLS proxy. Six destinations, 320px layout, image/video previews, caption colors and synthetic camera controls passed with zero CSP violations or JavaScript page errors. A guest EventSource reached the real endpoint and received the expected 401; authenticated provider chat was not claimed. Existing full fixtures still cover camera lifecycle, session/draft races, friends/chat/profile, utilities and valid payloads for all 158 presets.

Artifact: `lock-gold-free:20261117-cea769413051`; OCI index digest `sha256:cea7694130516a0af30f0aee6ab3324c02cd2cd2abbf3541f9830d29c723e688`; platform image configuration digest `sha256:50c6e581388b86e9fa9d6ca9a8b8854e823dfb61ac53ed2ff94e9e6cff7e1aa6`. The initial transferred bundle hash was `5954b571a22342fdd9367b701e012340dc3b707dc9a0de9fdea99ba7e7b813c9`. The initial identity check correctly stopped launch because Docker Desktop reports an OCI index while the VPS reports its configuration digest. Corrected metadata records both, has SHA256 `19f985b65efa83f4da6c3ccc70c22e370c0c32d02a571359866aec3d5b58b147`, and was transferred/verified separately before launch. The repacked development bundle hash is `5f1c1527abbd02df473b6dd8bb2831a5e077e8aa20bdb797c9a858b61d59845c`. Every component has a hash in release.json; the target checks component hashes and the correct platform digest before launch. The runtime bytes did not change during this metadata correction. No application source or secret is copied outside the image.

## Deployment checks

The supplied target runs Ubuntu 22.04 x86_64 with existing Docker/Nginx services. Initial free disk was approximately 2.8 GiB. Before application launch, unrelated container IDs and existing vhost hashes were recorded. A unique ACME probe confirmed that Cloudflare reached the supplied VPS after the operator corrected DNS. Let's Encrypt issued the reelsup.store certificate, expiring 2027-02-15. Only a new ACME vhost and the domain's certificate were created at that stage; no HTTP login endpoint was exposed.

The origin container is running/healthy with the expected configuration digest, nonroot user, read-only root, dropped capabilities and a loopback-only published port. The private production API returns 200, 53 operations and ffmpeg available; guest session data is unauthenticated. Both existing vhost hashes and all seven previous container IDs match the baseline. Only owned upload archives were removed after load/verification; the image and release metadata remain, and free root disk is still about 2.8 GiB.

Nginx configuration validation passed before graceful reload. The new domain's valid origin certificate and CSP headers were verified by direct HTTPS with normal certificate validation. Four real-origin browser variants passed all six destinations, no page overflow and no JavaScript errors. The domain-scoped certificate renewal hook is installed; existing Nginx wildcard log rotation covers the new scoped logs. The deployed configuration and image match the verified development artifact. Rollback uses a prior verified image/configuration in later releases; on this first release, withdrawing only this container leaves other services intact.

Public edge remains a release gate: HTTPS requests through Cloudflare currently receive a same-URL 308 redirect because the edge uses origin HTTP. The operator has been asked to select SSL/TLS → Overview → Full (strict). Until that external change is observed, the public domain is not claimed usable and no credential flow is tested through the edge. Origin HTTP serves challenges/redirects only. Public edge/browser verification remains pending.

Independent final review found no remaining actionable packaging or boundary issue. Logs and screenshots are in `/tmp/lock-gold-readiness-*`, `/tmp/lock-gold-production-*` and `/tmp/lock-gold-origin-*` on the development machine. Source inventory still contains all 53 operations, and the unchanged full fixture suite covers the previously working consumer behaviors. Production account actions remain outside these checks.

## Limits

Security scans are point-in-time and do not cover every possible exploit or the host's unrelated applications. The VPS had existing OS maintenance pending; no blanket OS upgrade, database exposure change or unrelated service restart is authorized by this app deployment. RAM sessions remain single-process, two-hour and restart-volatile. Physical phones, actual camera hardware, independent official Firebase-project ownership and successful authenticated operations against every live private Locket endpoint remain unverified. No real account post, friend action or chat write was made for release checks. Current Cloudflare IP ranges must be maintained as the vendor changes them.
