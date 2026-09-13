# Application architecture

Status: normative for the Version 1 source layout  
Architecture version: 1.0.0  
Established by: FND-003

## Purpose

ImmoPilot DE uses a client-side, feature-oriented architecture with a framework-free financial
domain. The structure keeps the formulas defined by PD-007 independent from React, browser
storage, localization and presentation concerns.

## Source layout

```text
src/
├── app/                 Application composition root and shell
├── components/          Reusable, feature-neutral UI components
├── config/              Versioned assumptions and application configuration adapters
├── domain/              Pure financial models, validation and calculations
│   ├── acquisition-costs/
│   ├── financing/
│   ├── refinancing/
│   ├── rent-vs-buy/
│   ├── rental-investment/
│   └── scenarios/
├── features/            User-facing vertical slices and workflow orchestration
├── i18n/                Locale setup, translation resources and formatting adapters
├── storage/             Browser persistence, URL sharing and JSON import/export
├── test/                Cross-cutting test setup, builders and fixtures
├── main.tsx             Browser entry point
├── styles.css           Temporary global foundation styles
└── vite-env.d.ts        Vite environment types
```

The global stylesheet remains at the source root until FND-012 defines design tokens and FND-013
builds the final application shell. Domain folders contain documentation only until their owning
implementation tasks add code.

## Dependency direction

| Source area | May depend on | Must not depend on |
| --- | --- | --- |
| `app` | Every source area | — |
| `features` | `components`, `config`, `domain`, `i18n`, `storage` | `app` |
| `components` | Feature-neutral utilities and localization helpers | `app`, `features`, `storage` |
| `config` | Domain types and versioned data | `app`, `components`, `features` |
| `i18n` | Translation resources and locale utilities | `app`, `components`, `features` |
| `storage` | Domain types, schemas and serialization utilities | `app`, `components`, `features` |
| `domain` | Standard language features and domain-local modules | React, browser APIs, and every other source area |
| `test` | Any source area under test | Production modules must never import from `test` |

ESLint enforces the principal reverse-dependency restrictions. Code review remains responsible
for semantic boundaries that import-pattern rules cannot express completely.

## Domain rules

- Domain functions are deterministic and accept every changing assumption as explicit input.
- Monetary calculations follow PD-007 and use integer cents or the approved decimal library.
- Domain modules do not read the clock, browser globals, local storage, URL state or translations.
- Validation errors use stable codes. User-facing German and English messages belong to `i18n`.
- Each domain owns its input types, validation, calculation functions and unit tests.
- Cross-domain scenario composition belongs to `domain/scenarios`, not an individual calculator.

## Feature rules

- A feature is a user workflow, such as purchase costs, mortgage planning or scenario comparison.
- Features orchestrate domain functions and infrastructure adapters but do not duplicate formulas.
- Feature-specific components stay inside their feature. A component moves to `components` only
  when at least two features need the same feature-neutral behavior.
- The `app` directory wires features into routing and the shared shell. Features never import it.

## Public module APIs

When implementation begins, each domain, feature and infrastructure module exposes its supported
surface through an `index.ts` file. Callers import from that public entry point and do not reach
into another module's internal folders. Relative imports are used within a module. Cross-module
aliases may be introduced later only when both TypeScript and Vite resolve them identically.

## Configuration, localization and storage

- `config` loads and adapts the versioned PD-008 assumption set. It does not silently mutate
  defaults or contain UI state.
- `i18n` owns translation initialization, resources and locale-aware display formatting. It never
  changes numerical calculation inputs.
- `storage` owns local-storage records, shareable URL encoding and JSON import/export. It validates
  external payloads before returning domain data and contains no financial calculations.

## Testing conventions

- Unit and component tests are colocated as `*.test.ts` or `*.test.tsx` beside their subjects.
- Browser tests will live in a root-level `e2e/` directory when FND-007 configures Playwright.
- `src/test` contains only shared setup, builders and helpers. Production code cannot import it.
- Normative PD-007 and PD-010 fixtures remain under `data/fixtures` and are consumed without
  rewriting their expected results.

## Deferred work

FND-003 introduces boundaries, documentation and the relocated application shell only. It does
not implement financial calculations, routing, localization, persistence, tests or design-system
components. Those remain assigned to their dedicated roadmap tasks.
