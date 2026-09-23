# Storage

PF-003A stores named scenarios locally under `immopilot-de.scenarios.v1`.

- The persisted `1.0.0` document contains raw user inputs only. Calculated values are deliberately
  excluded and are recomputed through the domain engine after load.
- JSON imports, local-library data, and URL payloads pass through the same strict Zod schema.
- Unknown versions and malformed data are rejected without replacing the current workspace.
- Share links use a UTF-8 base64url payload in the hash route and need no backend. They omit the
  local scenario name, ID, and timestamps; the UI requires a privacy acknowledgement before it
  creates a link or exports a file.

Browser-local persistence, URL sharing and JSON import/export adapters. External payloads are
validated before use, and this layer contains no financial calculations.
