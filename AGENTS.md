# AGENTS.md

## Cursor Cloud specific instructions

This is a static frontend project (Vite + Vitest) with no backend dependencies.

### Quick reference

| Task         | Command                   |
| ------------ | ------------------------- |
| Install deps | `npm install`             |
| Dev server   | `npm run dev` (port 3000) |
| Lint         | `npm run lint`            |
| Format check | `npm run format:check`    |
| Type check   | `npm run type-check`      |
| Tests        | `npm test`                |
| Build        | `npm run build`           |

See `README.md` for full command list and project structure.

### Notes

- Node.js >=22 is required (`package.json` engines field). The `.nvmrc` says 20 but the engines field takes precedence.
- Pre-commit hooks run `lint-staged` (Prettier) via Husky.
- The app calls the public TheMealDB API at runtime for random recipes; no API keys needed.
- No environment variables, databases, or Docker services are required for local development.
