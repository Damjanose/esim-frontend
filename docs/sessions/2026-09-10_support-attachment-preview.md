---
date: 2026-09-10
tags: [admin, support]
status: complete
---

# Session: support-attachment-preview

## What existed before

Clicking a support attachment on `/xsupport` opened a full-screen overlay whose image used `max-h-full` inside a grid button. The intrinsic image size won, so the photo looked zoomed/cropped.

## What was done

- Overlay is a flex dialog
- Preview image is capped with `max-h-[90vh]` and `max-w-[90vw]` and `object-contain`

## Outcome

The full photo fits in the viewport. Click the dimmed backdrop or press Escape to close.
