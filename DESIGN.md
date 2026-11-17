---
name: Lock Gold Free
colors:
  primary: "#ffcc66"
  ink: "#292538"
  muted: "#716b81"
  background: "#f8f7fc"
  surface: "#ffffff"
  border: "#e9e5f0"
  peach: "#fff0e6"
  lilac: "#f0ebff"
  mint: "#e4f5ee"
  focus: "#8562c7"
  darkBackground: "#161420"
  darkSurface: "#211e2e"
  darkText: "#f6f2fc"
  success: "#36724b"
typography:
  heading:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    lineHeight: 1.6
rounded:
  sm: "10px"
  md: "18px"
  lg: "28px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  primaryButton:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px"
---

## Overview
A warm, personal photo workspace: honey-yellow actions, a cream/lilac canvas, peach and mint accents, generous cards and clear Vietnamese copy. Dark mode uses plum surfaces and the same semantic accents. The brand name is not a claim that Gold subscriptions are unlocked.

Friend-feed repair: retain the current cards and visual tokens. Author names wrap within the card at 320px, use verified profile names or a clear unavailable label, and never expose UIDs. A 44px-or-larger load-more action appends older moments without removing visible cards; pending and error states preserve reading context. History remains page-based.

## Colors
Use yellow for primary actions and selected navigation; green for live connection status. Every surface, input, toast, modal and empty state uses the same semantic light/dark variables.

## Typography
System sans-serif avoids external font requests. Large page titles, concise labels, tabular counts; wrap names and messages rather than clipping meaning. Form controls stay at least 16px to avoid phone zoom.

## Layout
Desktop: 224px sidebar, flexible main, optional 260px context panel. Below 1000px collapse the context panel; below 760px switch to a compact sticky header and floating bottom navigation. Minimum supported width 320px. Grids use minmax(0, 1fr); long strings wrap. No viewport-only fixed heights for forms.

## Elevation & Depth
Quiet borders and restrained 0 8px 32px rgba(20,25,10,.04) shadows. Dialog overlay has a blur and independent vertical scrolling.

## Shapes
Rounded panels, small pill badges, circular avatars and a framed heart/photo brand symbol. Avoid excessive decorative gradients.

## Components
Upload dropzone with file preview and caption overlay. Native labeled controls, keyboard navigation, visible focus, pending/disabled buttons, live error/success messages. Destructive actions require explicit confirmation. Empty states invite the relevant next action and never invent account data.

## Do's and Don'ts
Use 150ms opacity/color transitions, respect reduced motion, keep touch targets at least 44px. Preserve drafts after failed requests. Contrast must remain readable in both themes. Never display session tokens or suggest guaranteed Premium access.

## Free experience refresh · 2026-11-16
Keep the warm yellow identity, with a more editorial photo-journal composition: generous readable type, square media, compact navigation, useful context panels and clear section labels. Primary creation tools use a camera/viewfinder and live caption preview; technical operation names belong in advanced tools. Account content must be real; illustrations are decorative and never presented as account memories.

Use semantic tokens for all themes. Web-only camera skins use cream, rose and ocean accents without changing published image bytes. Cards use 20–28px corners, thin borders, restrained shadows and 16/24/32px spacing. Body copy is at least 14px in primary flows, secondary copy at least 12px. Desktop has a stable 232px rail and a content column capped at 1440px; tablet collapses context panels; mobile retains the six main navigation destinations and reaches the feature guide from the top bar. Keep 44px controls, visible focus, wrapping labels and no horizontal page scroll at 320px.

All implemented tools are free, with no payment, subscription check, advertisement or local 20-friend gate. A capability guide distinguishes available web tools, provider-enforced limits and features absent from the SDK. Native widget/icon changes, subscription badges, streak restoration and music-provider linking must never be represented as completed web operations. Use concise contextual limits rather than repeated disclaimers in every form.

Consumer presentation direction: show only the website's available free features and useful actions. Keep protocol limits, unsupported native features and source research in documentation. Never render response JSON, endpoint/method names, raw IDs or device internals. Choose friends by real names and moments by captions/previews. Use native color pickers, familiar quality choices, and human recovery messages; internal data contracts remain unchanged.

## Mobile design refresh · 2026-11-17
The current visual identity supersedes the earlier olive-neutral palette: cool cream canvas, honey yellow actions, peach/coral, lilac and mint supporting surfaces. Ink is a deep plum for clear contrast. Dark mode uses plum/charcoal surfaces, readable pale text and the same warm action color. Rose and ocean preferences remain available and map to the same semantic variables. Use gradients only in the decorative hero illustration; account photos are always real.

Mobile comes first: sticky compact top bar, a floating bottom navigation dock with six equally accessible 44px targets, short visible labels and unchanged full accessible names. Make posting visually prominent. Keep the home hero below 270px on narrow phones so the feed is easy to reach. Desktop uses a quiet 224px sidebar, 32px gutters and a flexible main column. Cards are 22–28px rounded; body text 15px, secondary 12–13px, inputs 16px to avoid mobile zoom. Minimum layout width is 320px; controls wrap instead of causing page overflow. Main content clears the bottom dock and safe-area inset.

Creation has three visual steps without changing submission: media, message/style, recipients. Show the first eight preset choices immediately and put the remaining choices in an accessible disclosure, preserving every preset and draft. Inputs, private mode, covers, compression and success/error behavior remain intact. All modal dialogs scroll within the viewport. Respect reduced motion and visible focus, and verify primary tasks in light/dark desktop/mobile twice before building the running artifact.
