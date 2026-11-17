# 2026-11-17 admin sidebar nav

Replaced the 14-link top bar with a grouped, collapsible left sidebar (option A from the design options page).

- Groups: Money, People, Product, System. Full names shown (Push notifications, Testimonials, ...).
- Collapses to a 72px icon rail that springs open over the page on hover/keyboard focus (like the mobile dock); pin button keeps it open; choice saved in localStorage `esim-admin-nav`.
- Below 1024px: slide-in drawer behind a top bar.
- State is on <html> attributes; CSS in globals.css ("Admin sidebar" block). No admin page changed.
- Gotcha: `:focus-within` kept the rail open after clicking the fold button. Use `:has(:focus-visible)`.
- Not built: count badges (errors/support/crypto) need extra admin API calls; sliding selection pill (each page remounts its own nav).
- Facts: f353.

## Follow-up
- Sidebar renders nothing while signed out (AdminNav returns null without a token). useAdminSession now broadcasts an `admin-session-change` window event on login/logout, so the sidebar's own hook instance appears right after a page signs in.
- AdminLoginCard rebuilt: brand colours, sentence-case copy, show/hide password, `role="alert"` error, shared `Button` with loading state. Props unchanged.
