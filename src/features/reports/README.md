# Recalculated report snapshot

PF-006.2 implements the transient capture model for the
[report contract](../../../docs/report-content-and-privacy-contract.md).

`capturePropertyReport({ inputs, inputLocale }, options)` captures a current workspace, including
unsaved inputs. `captureComparisonReport({ documents, selectedIds, libraryIssue }, options)` parses
saved documents through the existing schema/migration path and recalculates one to three selected
properties in the supplied order. Pass the library's error state when one exists; malformed or
unsupported documents block capture. Neither function reads or writes storage.

The source numeric locale (`de-DE` or `en-GB`) controls parsing independently of the report language
(`de` or `en`). Analysis money fields retain the workspace's canonical decimal format. Syntax guards
prevent the adapters' permissive parsing from turning malformed values into plausible amounts;
financial bounds, units, rounding and calculations remain owned by the existing engine. Required
core fields must be explicit, including valid zero. Known incomplete sections and unavailable
repayment plans retain their discriminants and reasons. Unexpected failures return a blocked result
with no partial snapshot or source values.

Successful captures contain fresh dashboard results, full monthly domain schedules, and all 22
comparison values when applicable. Fixed-period and projected results retain their separate bases;
comparison captures record mixed-basis metrics. An unavailable selected repayment schedule is
explicitly unavailable even when the baseline remains valid.

Snapshots recursively copy and freeze inputs, results and bundled provenance. Money stays in integer
cents; Decimal rates and ratios become exact decimal strings. Non-finite diagnostic numbers become
strings so JSON serialization cannot silently replace them with null. No financial result is
formatted or rounded again. Renderers can reconstruct Decimal values for the existing formatters.
Inactive analysis fields, inactive down payment/broker override values, scenario IDs and saved
timestamps are excluded. Names are omitted by default; opted-in names remain plain text and must be
escaped by the renderer. Source URLs are bundled methodology citations.

Inactive fields are cleared on schema-created copies before recalculation, so a hidden rental target
or unused broker override cannot influence owner results or applied-assumption provenance.

Options freeze output language, name inclusion and monthly-appendix intent. Capture records a UTC
generation instant and a generic suggested filename. Supply `buildIdentity` from the existing
release manifest when available; otherwise its status is explicitly unavailable. `generatedAt` is
optional, allowing deterministic capture in tests. Schema and calculation versions come from their
authoritative modules; supported legacy captures record source and migrated versions separately.

The model has no preview store or print action. Follow-up report UI must discard its reference on
close and recapture after inputs, selection, language or options change. Rendering, annual/chart
models, sensitive-data acknowledgement and browser printing belong to PF-006.3 through PF-006.7.
