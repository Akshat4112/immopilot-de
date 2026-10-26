# PF-006.7 — Browser/PDF verification and limitations

This milestone verifies the **authorized** PF-006.6 print flow across all supported browser engines. It does not equate a browser print-dialog close with a successful saved file.

## Acceptance matrix

| Scenario | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| Bilingual report preview / switch | Browser E2E | Browser E2E | Browser E2E |
| Owner and rental scenarios; negative cash flow and zero interest | Browser E2E | Browser E2E | Browser E2E |
| Ordered three-property comparison, monthly amortization and sources | Browser E2E | Browser E2E | Browser E2E |
| Keyboard scrolling, focus and screen accessibility audit | Browser E2E | Browser E2E | Browser E2E |
| Consent gates / print root / generic title / cancel or retry | Browser E2E + component tests | Browser E2E + component tests | Browser E2E + component tests |
| A4 print styles, repeated headers and overflowing tables | DOM/CSS check | DOM/CSS check | DOM/CSS check |
| Actual PDF bytes via Playwright `page.pdf` | **Supported**, emits saved test artifact | **Not supported by Playwright**; capability recorded | **Not supported by Playwright**; capability recorded |
| Long amortization: 1,200-month appendices | Print-root DOM + actual PDF | Print-root DOM + explicitly limited capability | Print-root DOM + explicitly limited capability |
| Browser/OS print dialog and user's final PDF save destination | Not assertable in headless automation | Not assertable in headless automation | Not assertable in headless automation |

## Procedure

- A deliberate checkbox and click generate an authorized transient portal in the current document. Tests intercept `window.print` to keep the snapshot mounted for deterministic DOM/layout/PDF inspection; this does **not** claim to test the native OS print dialog.
- Chromium tests call the real Playwright PDF export API over the print styles, verify the PDF signature and nonempty document, and save the resulting artifact for human visual inspection.
- Other browser engines inspect the same printed DOM with emulated print media and save a JSON capability record. They do **not** fabricate a Firefox/WebKit PDF or claim parity where the harness lacks a PDF API.
- Tests assert unselected/sensitive scenario names are absent by default, no report-driven network request, report title restored on `afterprint`, no writes to localStorage, and source preview remains available until explicitly closed.
- PDF artifacts use generic test names; test fixtures use invented property values and names only.
- Existing screenshots and table overflow probes remain authoritative for visual regressions. Browser-generated PDFs can differ in font metrics, print color adjustment, named-page support and external printer settings. A saved PDF does not imply PDF/UA tagging or guaranteed screen-reader accessibility.

## Commands and evidence

`npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run build`, and `npm run test:e2e` on the exact PR merge commit. CI retains report PDF/PNG/JSON artifacts for seven days; examine the generated PDF pages before declaring release-ready. These tests do **not** close the separate Version 1 launch/security/operator approvals.
