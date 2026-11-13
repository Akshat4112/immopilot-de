# PF-007.5 — Dark-mode contract and verification

## Interaction and preferences

ImmoPilot DE offers a bilingual theme selector in the application header:
**System**, **Light/Hell**, and **Dark/Dunkel**.

- The initial choice is **System**, so the app follows the operating system's
  `prefers-color-scheme` setting.
- While in System mode, changes to the OS setting update the rendered theme.
- Selecting Light or Dark temporarily overrides that OS preference across
  internal routes. Selecting System resumes automatic following.
- The manual choice is intentionally **session-only**. Reloading the site
  returns to System. There is no theme cookie, server request, or persistent
  local-storage key. This matches the project's local-processing/privacy
  promise without adding another durable browser record.

## Palette, contrast and print

Semantic CSS tokens in `src/styles/tokens.css` control both themes. The dark
palette uses near-black green backgrounds, light foregrounds, strong borders,
contrast-preserving chart colors, accessible focus outlines, and warm high-
contrast warning colors. Component styles consume semantic tokens rather
than duplicating hard-coded light-mode values.

The existing print-report host uses an explicit white background and dark ink.
The dark-theme `@media print` rules force the application semantic tokens back
to print-friendly whites and dark text even if Dark is selected.

## Verification and scope

Unit/component tests cover default system behavior, OS preference changes,
manual overrides, locale labels, and the no-storage boundary. Chromium,
Firefox and WebKit tests exercise mobile-width navigation, manual/system
switching, inherited print colors, and viewport overflow.

Theme changes are presentation-only: canonical inputs, calculated amounts, saved scenarios,
sharing links and report content must remain identical in both appearances. Screenshot
regressions should cover empty fields, warning banners and negative-cash-flow charts.

The browser and accessibility release sweep (PF-007.6) remains the separate
manual/automated cross-flow gate for full keyboard, screen-reader, contrast,
reduced-motion, all chart/table states, and all supported browsers. Completing
this task alone is not permission to declare V1 released.
