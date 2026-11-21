# Security policy

ImmoPilot DE is a public development preview. Security reports are welcome for the current main branch and the published application.

## Report a vulnerability

Use GitHub's [private vulnerability reporting](https://github.com/Akshat4112/immopilot-de/security/advisories/new) if enabled for this repository. If the private form is unavailable, open a minimal [issue](https://github.com/Akshat4112/immopilot-de/issues) requesting a private reporting channel without disclosing the vulnerability, exploit details or personal data publicly.

Include the affected commit or deployment version if known, a description of the impact, reproducible steps with fictional inputs, and a suggested remediation if available. Never attach real financial plans, tokens, personal data or credentials. Do not attempt to access other users' information.

Please allow reasonable time for assessment and remediation before public disclosure. No response-time guarantee or bug bounty is offered.

## Scope and safeguards

- Client-side planning logic, browser storage, and local backup import/export.
- Input validation, script injection, spreadsheet export injection and inadvertent disclosure.
- Dependencies, build artifacts and GitHub Pages deployment.

Use the existing dependency audits and regression tests for remediation. Distinguish production exposure from development-only advisories. Financial calculation defects that do not have security impact can be reported as ordinary issues using fictional scenarios.

See [privacy and financial limitations](docs/legal-and-privacy.md), [contributing](CONTRIBUTING.md) and [CI](.github/workflows/ci.yml).
