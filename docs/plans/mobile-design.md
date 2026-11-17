# Mobile-first visual refresh implementation plan

Status: Verified in local development; local prebuilt artifact updated

Goal: Improve the existing free consumer UI, particularly phone readability, navigation and creation, without changing account operations.
Spec: DESIGN.md mobile refresh and docs/spec.md appendix.
Baseline: 9dc042c; branch feat/mobile-design. Git retains the prior design. No production deployment, server restart or push is part of this task.

Scope: src/app/{Sidebar,Topbar,PageHeading,navigation}.jsx/js, src/features/feed/HomePage.jsx, src/features/moments/CaptionPreview.jsx, src/features/tools/OperationForm.jsx, src/styles/{tokens,experience}.css, index.html viewport metadata, documentation and browser checks. Reuse icons, native details, existing API/draft/session boundaries. No new dependency or image service.

- [x] Add browser regression checks: phone navigation targets >=44px, short visible labels/full accessible names, compact hero, visible feed after a short scroll, no dock obstruction, and an expandable complete preset library that preserves caption/private draft. Watch missing behavior fail before implementation.
- [x] Update DESIGN tokens and shell: quiet desktop sidebar; compact sticky header; rounded mobile dock, short labels and emphasized post action; 16px mobile inputs and scrollable dialogs. Keep six destinations and theme controls accessible.
- [x] Recompose home into a concise colorful hero, three useful quick actions, feed-first content and compact supporting cards. Decorative artwork has no account claims. Preserve real feed/history/Rollcall and every account action.
- [x] Organize creator into three visual steps and compact preset library. Preserve preset parser/validator behavior, live preview, camera lifetime, recipients, private mode, cover/compression, failed draft and single-submit behavior.
- [x] Run make build/test/lint and docs-check, two full browser rounds desktop/mobile light/dark, inspect rendered screenshots and actual diff, then update local prebuilt assets without restarting the account server. Record evidence and limitations.

Evidence: [mobile-design verification](../verification/mobile-design.md). Independent review's label/name mismatch was corrected and covered. No implementation scope deviation, production deployment, push or account-server restart.

Risks: hidden controls causing a regression, dock covering content, inconsistent accent/theme contrast, old preset errors resurfacing and lost drafts. Target checks cover these; the unchanged API and native suite cover existing boundaries. Rollback uses Git baseline rather than duplicate source files.
