# Design tokens and global styling foundations

Status: normative for the Version 1 interface  
Token version: 1.0.0  
Established by: FND-012

## Purpose

ImmoPilot DE uses project-owned CSS custom properties to keep its visual language consistent,
accessible and independent of a component framework. Tokens express reusable decisions; feature
styles consume semantic tokens and must not duplicate palette values or invent parallel scales.

## Stylesheet order

The browser entry point imports the styling layers in this order:

1. `src/styles/tokens.css` — primitive values and semantic aliases.
2. `src/styles/global.css` — document defaults, reset, focus treatment and reduced motion.
3. `src/styles/app.css` — temporary foundation-page composition and component styles.

Later feature styles may follow these layers. They may consume tokens but must not redefine the
root token contract. FND-013 may reorganize `app.css` when it creates the application shell.

## Token contract

| Family | Examples | Intended use |
| --- | --- | --- |
| Primitive palette | `--palette-ink-950`, `--palette-lime-300` | Token maintenance only; do not use directly in components |
| Semantic color | `--color-text-primary`, `--color-brand`, `--color-border` | Text, backgrounds, borders, focus and brand treatments |
| Typography | `--font-family-body`, `--font-size-md`, `--line-height-body` | Type families, scale, weight, leading and tracking |
| Spacing and size | `--space-1` through `--space-15`, `--layout-max-width` | Layout rhythm, gutters, controls and bounded content |
| Shape and depth | `--radius-md`, `--radius-pill`, `--shadow-preview` | Corners, borders and elevation |
| Motion | `--duration-fast`, `--ease-standard`, `--duration-reduced` | Interaction transitions and reduced-motion overrides |

Primitive palette values exist so a future brand adjustment can be made once. Application and
feature rules must use semantic color aliases, because a primitive color does not communicate why
the color is being used.

## Typography

The body stack uses locally available system fonts and does not request a third-party font at
runtime. Display text prefers Avenir Next where installed and falls back to Segoe UI. Fluid display
sizes use `clamp()` within the documented type scale; body copy uses fixed rem-based tokens so it
respects browser zoom and user font settings.

## Layout and responsive behavior

- The maximum content width is `73.75rem` with a `1.5rem` default gutter.
- The compact gutter is `1rem` below `38.75rem`.
- Foundation layouts collapse from two columns below `53.75rem`.
- Responsive rules use content-driven rem breakpoints. CSS custom properties are not used inside
  media-query conditions because native CSS does not support that reliably.
- New features should prefer grid, flexbox, intrinsic sizing and fluid spacing before adding a
  breakpoint.

## Accessibility rules

- All keyboard-operable links, buttons and form controls receive the shared visible focus ring.
- Focus is indicated by more than color and must not be removed by component styles.
- Text and interactive foreground/background combinations must meet WCAG 2.2 AA contrast.
- The root minimum viewport width is 320 CSS pixels and layouts must remain usable at that width.
- `prefers-reduced-motion: reduce` disables smooth scrolling and shortens transitions globally.
- Text uses rem units and layout containers do not prevent browser zoom.
- Color may reinforce status but must never be the only carrier of financial meaning.

## Usage rules

```css
.result-card {
  padding: var(--space-6);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  background: var(--color-surface);
}
```

When a design need is not represented:

1. Reuse an existing semantic token if its meaning matches.
2. Add a semantic alias when the value exists but the meaning is different.
3. Add a primitive only when the scale genuinely needs a new value.
4. Document material contract changes here and update browser regression checks.

Do not name tokens after a single page or temporary appearance, and do not use a semantic token for
an unrelated purpose merely because its current value looks correct.
