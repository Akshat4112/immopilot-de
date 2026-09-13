# Test

Shared test setup, builders and helpers. Unit and component tests remain colocated with production
code, and production modules must never import from this directory.

- `setup.ts` loads the DOM matchers used by every Vitest suite.
- `render.tsx` is the common React Testing Library entry point. Add global providers there as the
  application gains routing, localization and shared state.

Use `npm test` for a single run, `npm run test:watch` while developing and
`npm run test:coverage` to enforce and inspect coverage.
