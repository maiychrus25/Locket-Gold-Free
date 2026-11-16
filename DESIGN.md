---
name: Lock Gold Free
colors:
  primary: "#f4c542"
  ink: "#24251e"
  muted: "#65675d"
  background: "#f7f8f2"
  surface: "#ffffff"
  border: "#e4e6db"
  darkBackground: "#141711"
  darkSurface: "#1e221a"
  darkText: "#eff1e8"
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
A warm, personal photo workspace: butter-yellow actions, olive-neutral canvas, generous cards, clear Vietnamese copy. The brand name is not a claim that Gold subscriptions are unlocked.

## Colors
Use yellow for primary actions and selected navigation; green for live connection status. Every surface, input, toast, modal and empty state uses the same semantic light/dark variables.

## Typography
System sans-serif avoids external font requests. Large page titles, concise labels, tabular counts; wrap usernames and API output rather than clipping meaning.

## Layout
Desktop: 232px sidebar, flexible main, optional 300px context panel. Below 1000px collapse the context panel; below 760px switch to compact header and bottom navigation. Minimum supported width 320px. Grids use minmax(0, 1fr); long strings wrap. No viewport-only fixed heights for forms.

## Elevation & Depth
Quiet borders and restrained 0 8px 32px rgba(20,25,10,.04) shadows. Dialog overlay has a blur and independent vertical scrolling.

## Shapes
Rounded panels, small pill badges, circular avatars and a framed heart/photo brand symbol. Avoid excessive decorative gradients.

## Components
Upload dropzone with file preview and caption overlay. Native labeled controls, keyboard navigation, visible focus, pending/disabled buttons, live error/success messages. Destructive actions require explicit confirmation. Empty states invite the relevant next action and never invent account data.

## Do's and Don'ts
Use 150ms opacity/color transitions, respect reduced motion, keep touch targets at least 44px. Preserve drafts after failed requests. Contrast must remain readable in both themes. Never display session tokens or suggest guaranteed Premium access.
