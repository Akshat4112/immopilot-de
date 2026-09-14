# Responsive application shell

Status: normative for the Version 1 interface  
Shell version: 1.0.0  
Established by: FND-013

## Purpose

The application shell provides a consistent, accessible frame around every ImmoPilot DE workflow.
It owns the global header, navigation, language control, content region, footer and route-level page
layout. Financial feature pages provide their content inside this frame and do not duplicate it.

## Routes

| Hash route | German label | English label | Purpose |
| --- | --- | --- | --- |
| `#/` | Überblick | Overview | Project overview and starting point |
| `#/purchase-costs` | Kaufkosten | Purchase costs | Acquisition-cost workflow |
| `#/financing` | Finanzierung | Financing | Mortgage and amortization workflow |
| `#/comparison` | Vergleich | Comparison | Scenario-comparison workflow |

An unknown route redirects to the overview. Hash routing keeps every client route behind the
published `/immopilot-de/` document URL, so refreshing a feature page does not require a GitHub
Pages server rewrite. Vite's production base path continues to control JavaScript and CSS asset
URLs independently.

## Component ownership

- `AppShell` composes the header, route outlet, main content target and footer.
- `AppHeader` owns compact-navigation state and places the language switcher.
- `AppNavigation` defines the primary route set and active-link state.
- `AppFooter` renders the approved disclaimer resource for the active locale.
- `PageLayout` gives calculator routes a consistent heading, summary and content container.
- Feature pages own workflow content and are rendered through the shell route outlet.

Navigation configuration is module-level static data. Feature pages must not create another global
header, footer or primary navigation.

## Responsive behavior

- Above `64rem`, brand, navigation and header actions share one horizontal row.
- At and below `64rem`, the menu button exposes a full-width navigation panel for tablet and mobile
  layouts. Choosing a route closes the panel.
- Below `38.75rem`, the compact gutter is used, the brand mark replaces the full wordmark and footer
  content stacks vertically.
- Home content has its own content-driven breakpoint at `53.75rem` for the hero and foundation
  grids.
- Every supported viewport remains at least 320 CSS pixels wide without horizontal overflow.

## Accessibility contract

- The first focusable control is a skip link that moves keyboard focus to `#main-content` without
  replacing the hash route.
- The menu button exposes `aria-controls`, `aria-expanded` and a translated accessible name.
- The primary navigation has a translated label and active links expose `aria-current="page"`.
- Shared focus indicators remain visible for links, buttons and language controls.
- Each route has one level-one heading. Placeholder routes use `PageLayout`; the overview owns its
  hero heading.
- Navigation and disclaimer text switch together between German and English.

## Verification

Vitest covers shell rendering, localization, active routes, compact-menu state and unknown-route
fallback. Playwright checks desktop, tablet and mobile viewports against the production preview,
including route refreshes, Pages asset URLs, visible keyboard focus and horizontal overflow.
