# Shared packages

Reserved for cross-app code (shared UI components, ESLint config, tsconfig
base, design tokens). Currently empty — the first shared package will be
added when the first React tool app is scaffolded.

Conventions:

- `@playground/eslint-config` — shared ESLint flat config.
- `@playground/tsconfig` — shared base `tsconfig.json` extended by apps.
- `@playground/ui` — shared React components (header, theme tokens) used by
  tool apps.
