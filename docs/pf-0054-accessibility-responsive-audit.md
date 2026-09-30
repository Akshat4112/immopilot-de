# PF-005.4 accessibility, responsive and language audit

**Audit date:** 30 September 2026  
**Implementation commit:** `67b589827d6c2ee2c667f276e4072042a2b88b09`  
**CI evidence:** [run 179](https://github.com/Akshat4112/immopilot-de/actions/runs/36719818308)  
**Reviewer:** Codex  
**Test data:** fictional €250,000 rental-investment scenario from the Version 1 audit

## Automated evidence

The CI run passed formatting, lint, strict TypeScript, 316 unit/component tests, production build,
full and production dependency audits, and 22 Playwright tests. The browser suite now includes:

- axe scans of every public route and the share-confirmation state, with no serious or critical
  violations;
- skip-link, visible-focus and confirmation-focus checks;
- the purchase, financing, results, save and comparison journey at 375 px, 768 px and 1440 px;
- German-to-English switching without losing the active workflow;
- contained comparison-table overflow without page-level horizontal overflow; and
- the complete viewport journey on Playwright Chromium, Firefox and WebKit projects.

## Accessibility review matrix

| Area | Keyboard and focus | Screen-reader-oriented semantics | Status |
| --- | --- | --- | --- |
| Application shell | Skip link moves focus to `main`; navigation links and language controls retain visible focus | Named primary navigation, current-page state, language state and one page-level heading | Pass |
| Purchase costs | Native inputs, selects and disclosure controls follow document order | Labels, required state, field errors, warnings and result status are programmatically exposed | Pass |
| Financing | Radio choices, inputs, repayment-row controls and schedule disclosure are keyboard operable | Fieldsets, legends, alerts and named scrollable amortization-table regions expose the calculation structure | Pass |
| Results | Assumptions and disclosure controls are reachable without a trap | Section headings, status cards, bases and unavailable states remain textual rather than color-only | Pass |
| Saved scenarios | Save, import, rename, share/export and destructive confirmations are keyboard operable | Share/export confirmation is an `alertdialog` with a name, description, initial focus and explicit cancel action; operation updates use `status` | Pass |
| Comparison | Add, reorder and remove controls are keyboard operable; the contained table region can receive focus | Table headers, row headers, warnings and calculation-basis notes are available as text | Pass |

## Responsive and browser matrix

| Engine project | 375 px | 768 px | 1440 px | Result |
| --- | --- | --- | --- | --- |
| Chromium | Complete bilingual workflow | Complete bilingual workflow | Complete bilingual workflow | Pass |
| Firefox | Complete bilingual workflow | Complete bilingual workflow | Complete bilingual workflow | Pass |
| WebKit | Complete bilingual workflow | Complete bilingual workflow | Complete bilingual workflow | Pass |

The WebKit project is compatibility evidence for Safari's rendering engine, not a claim that a
branded stable Safari build was manually exercised on this implementation commit. PF-005.6 must
repeat the final manual installed-browser smoke against the immutable release candidate, as required
by the release contract.

## German voice review

The terminology standard now requires informal **du** address. The remaining formal validation,
next-step and disclaimer phrases were converted, and a resource regression test prevents formal
`Ihnen`/`Ihr…` forms from returning. Representative route tests continue to cover German and English
rendering and state preservation.

## Finding disposition

- **REL-005:** Closed for remediation; automated and review evidence is reproducible in this PR.
- **REL-006:** Responsive and rendering-engine defects/evidence gap closed. Final installed stable
  Chrome, Firefox and Safari smoke remains an exact-candidate verification activity in PF-005.6.
- **REL-010:** Closed; informal German voice is documented and regression-tested.
