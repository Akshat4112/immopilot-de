# Product screenshots and visual evidence

Use real screenshots from the actual planner with fictional data. They show the product, not a financial recommendation. Do not use private household details, mock-ups presented as screenshots or unsupported figures.

## Verified source evidence

The [successful main-branch CI run 44408916704](https://github.com/Akshat4112/immopilot-de/actions/runs/44408916704) generated the `explorer-visual-evidence-44408916704-1` artifact for commit [`2f90fa6`](https://github.com/Akshat4112/immopilot-de/commit/2f90fa65599ff9c6210e039676312e65882b45b1). It includes the actual Chromium screenshots listed below. GitHub Actions artifacts expire, so regenerate using the procedure when needed.

| Screenshot in artifact | Feature | Size |
| --- | --- | --- |
| explorer-ux022-desktop.png | Financial overview | 1280 × 720 |
| explorer-ux022-mobile.png | Mobile overview | 375 × 812 |
| explorer-ux023-mobile.png | Contextual inputs | 375 × 812 |
| explorer-ux024-mobile.png | Scenario workspace | 375 × 812 |
| explorer-ux025-mobile.png | Money-flow visualization | 375 × 812 |
| explorer-ux026-mobile.png | Lifetime wealth timeline | 375 × 812 |
| explorer-ux027-mobile.png | Life-event controls | 375 × 812 |
| explorer-ux028-mobile.png | Decision comparison | 375 × 812 |
| explorer-ux029-mobile.png | Mortgage explorer | 375 × 812 |

Screenshots were inspected for product identity and fictional data. Stable repository PNGs have not yet been added. This is an evidence index, not a permanent embedded gallery.

## Reproduce and curate

From a clean checkout with the pinned Node and npm versions:

```bash
npm ci
npx playwright install chromium
npm run test:e2e -- --project=chromium --grep 'UX-02[2-9]|UX-030|UX-031'
find test-results -type f -name '*.png'
```

Browser tests produce genuine images in their per-test output directories. Alternatively download the visual evidence ZIP from a successful CI run. Review images before publishing; confirm the selected test data is fictional. Preserve source commit, viewport and capture date. Copy only curated screenshots into this directory with descriptive filenames and accessible alternative text in the README. Prefer one readable desktop hero and at most a few selected visuals rather than a long gallery. Additional rental and ETF desktop views should be captured at a future verification pass, not simulated.

Refresh screenshots when major UI changes land. Screenshots are descriptive evidence; they do not substitute for manual accessibility checks.
