# Storage

PF-004.2 stores named scenarios locally under the unchanged
`immopilot-de.scenarios.v1` key.

- The persisted `1.1.0` document contains raw user inputs only, including annual and one-time
  additional-repayment drafts. Calculated values are deliberately
  excluded and are recomputed through the domain engine after load.
- Valid `1.0.0` scenario files, libraries, and share links migrate in memory with empty additional
  repayments. Malformed documents and unsupported versions remain rejected.
- JSON imports, local-library data, and URL payloads pass through the same strict Zod schema.
- Unknown versions and malformed data are rejected without replacing the current workspace.
- Share links use a UTF-8 base64url payload in the hash route and need no backend. They omit the
  local scenario name, ID, and timestamps; the UI requires a privacy acknowledgement before it
  creates a link or exports a file.

Browser-local persistence, URL sharing and JSON import/export adapters. External payloads are
validated before use, and this layer contains no financial calculations.
