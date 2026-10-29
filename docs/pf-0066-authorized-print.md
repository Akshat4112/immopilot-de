# PF-006.6 — Explicitly authorized browser print / Save as PDF

The report remains a read-only, transient, locally recalculated preview until the user deliberately authorizes printing. This task does not download binary PDFs or use a server, cross-origin frame, PDF library, upload, or report URL.

## Lifecycle

1. A preview is generated from a fresh validated snapshot. The report language and optional monthly appendix are captured with the snapshot. Saved scenario names are excluded by default, and can only be included in the comparison after explicitly enabling the unchecked option and creating a new capture.
2. The user reviews the full bilingual document and financial/privacy notices. The export controls repeat the privacy warning and remind the user to disable browser headers/footers, which can otherwise expose a share URL.
3. A separate **unchecked** acknowledgement must be checked. **Print / Save as PDF** is disabled until acknowledgement. It affects only the currently mounted snapshot and is cleared on close or option/input/selection/language changes.
4. Only a deliberate button action mounts the report again under a transient `document.body > .report-print-root` React portal. Print CSS shows that root and hides application navigation and previews. The portal does not contain unselected scenarios or source identifiers. Rendering uses the same report document and inline SVG/data tables as the preview.
5. The browser receives `window.print()`, with a temporary generic document title derived from the UTC snapshot and no property IDs, names, prices, paths, data URLs or share fragments. Title and focus are restored after `afterprint`; cleanup also restores the title if unmounted. The root is removed after the dialog. Cancelled print leaves the same preview available for another attempt. The UI does **not** announce a successful file export based on `afterprint`.
6. When print is unavailable, the user sees localized recovery text, keeps the preview and can use the browser command. No remote fallback exists.

## Security and fidelity boundaries

- Saving, emailing, cloud syncing or printing the resulting PDF is a **user/browser/OS choice**; the application never claims to control its final destination, filename or persistence.
- No report content enters query strings, download endpoints, clipboard, storage or logging; saved source scenarios are not updated by printing.
- The layout is A4 portrait by default and supports named landscape summary pages on engines implementing CSS named pages; WebKit currently falls back to base A4 portrait. Real page-count/PDF evidence in Chromium, Firefox and WebKit belongs to PF-006.7.
- Ordinary browser printing without an authorized portal never includes the hidden report preview. In a specifically authorized print session, app shell siblings are hidden.
- A passive return of window focus after print does not invalidate an unchanged comparison. A changed saved library still invalidates the capture and requires reapproval.

## Tests

`ReportPrintControls.test.tsx` checks unchecked consent, print root existence only after a deliberate action, generic temporary document title, afterprint teardown/retry, thrown print API handling, options resetting consent, and explicit saved-name opt-in. Existing lifecycle tests retain source-change invalidation. PF-006.7 will test actual generated PDFs and page layout, not merely CSS inspection.
