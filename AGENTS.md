# AGENTS.md

Guidance for AI coding agents and human developers working in this
repository. Follow these rules to keep code consistent across a large team
with mixed experience levels.

**Doc index:**

- [`DOCS.md`](DOCS.md) at repo root (when present)
- [`apps/compare-next/ARCHITECTURE.md`](apps/compare-next/ARCHITECTURE.md) — compare-next folder layout and data flow

---

## Part 1 — Code guidelines

These principles apply to all code in this monorepo. They are intentionally
opinionated: when in doubt, choose the simpler option that is easier to read,
test, and change.

### 1. Core principles

| Principle | Meaning | In practice |
| --------- | ------- | ----------- |
| **KISS** (Keep It Simple, Stupid) | Prefer the simplest solution that works. | One clear function beats three layers of indirection. Avoid clever tricks. |
| **DRY** (Don't Repeat Yourself) | One source of truth for each piece of knowledge. | Extract shared logic after the second real duplication — not before. |
| **YAGNI** (You Aren't Gonna Need It) | Do not build for hypothetical futures. | Ship what the task needs today; refactor when requirements arrive. |
| **SOLID** | Design for change without breakage. | Small modules, clear interfaces, depend on abstractions not concretions. |
| **Boy Scout Rule** | Leave code better than you found it. | Fix nearby typos, dead code, or unclear names in the same PR when safe. |
| **Fail fast** | Detect errors early and surface them clearly. | Validate inputs at boundaries; do not swallow errors silently. |
| **Least surprise** | Code should behave as a reader expects. | Match existing patterns in the file and package before inventing new ones. |

**DRY vs KISS:** DRY does not mean "never repeat a line." Two similar blocks
that evolve independently are fine. Extract only when duplication causes real
maintenance risk.

### 2. Scope and change discipline

- **Minimize diff size.** Change only what the task requires. Drive-by
  refactors belong in a separate PR unless they unblock the current fix.
- **One concern per PR.** A bug fix, a feature, and a rename should not land
  together unless they are inseparable.
- **No dead code.** Remove unused imports, variables, functions, and files.
  Do not comment out code "for later" — use version control.
- **No commented-out blocks** or `TODO` without a ticket reference when the
  work is non-trivial.

### 3. Naming and readability

- **Names reveal intent.** `fetchCatalogueItems` over `getData`. Avoid
  abbreviations unless they are domain-standard (`id`, `url`, `api`).
- **Booleans read as questions:** `isLoading`, `hasError`, `canEdit`.
- **Functions are verbs; types and classes are nouns.**
- **Constants** use `UPPER_SNAKE_CASE` only for true compile-time constants;
  otherwise use `camelCase` like other bindings.
- **Files** use `kebab-case` or match the primary export (`CataloguePage.tsx`
  exports `CataloguePage`). Stay consistent within each app/package.
- **Keep functions short.** If a function needs a scroll to understand, split
  it. Aim for one level of abstraction per function.

### 4. Types and data

- **TypeScript is strict by default.** No `any` unless documented with a
  one-line reason and a follow-up ticket. Prefer `unknown` + narrowing.
- **Prefer explicit return types** on exported functions and public APIs.
- **Validate at boundaries** (HTTP handlers, env vars, user input). Trust
  types inside the module after validation.
- **Immutability by default.** Do not mutate function arguments. Return new
  objects/arrays when producing derived data.
- **Nullability is explicit.** Use `| null` or optional fields intentionally;
  avoid optional chaining chains that hide missing data.

### 5. Functions, modules, and architecture

- **Single responsibility.** Each module should have one reason to change.
- **Dependency direction:** apps → packages → shared utilities. Packages must
  not import from apps. Shared code lives in `packages/*`.
- **Prefer composition over inheritance.** Use plain functions and small
  components before class hierarchies.
- **Side effects at the edges.** Keep business logic pure where possible;
  I/O (DB, network, filesystem) stays in thin adapter layers.
- **No god objects or god files.** Split when a file exceeds ~300 lines or
  mixes unrelated concerns.
- **Configuration over hardcoding.** URLs, feature flags, and limits belong
  in config or env — not scattered literals.

### 6. Error handling

- **Never swallow errors.** Empty `catch` blocks are forbidden.
- **Use typed errors** or result types for expected failure paths (validation,
  not-found, conflict).
- **Log with context** (request id, user id, operation) at service boundaries;
  avoid logging secrets or full payloads with PII.
- **User-facing messages** must be helpful and safe — no stack traces or
  internal details in production responses.

### 7. Security

- **Never commit secrets.** Use env vars and platform secret stores. Run
  `pnpm security:audit` before release branches.
- **Treat all external input as hostile.** Sanitize and validate on the
  server, even for authenticated users.
- **Auth checks on every protected route and API handler.** Do not rely on
  UI-only gating.
- **Least privilege** for API tokens, DB roles, and Cloudflare bindings.
- **Dependencies:** prefer well-maintained packages; pin versions in this
  monorepo via `pnpm-lock.yaml`. Review new dependencies in PR description.

### 8. Testing

- **Tests prove behavior, not implementation.** Assert outcomes, not internal
  call order unless the order is the contract.
- **Naming:** `describe` the unit; `it` states expected behavior
  (`it('returns 404 when listing is missing')`).
- **Arrange – Act – Assert** structure in every test.
- **No flaky tests.** No arbitrary `setTimeout`, shared mutable state, or
  order-dependent suites.
- **Add tests** for bug fixes (regression) and new public APIs. Skip tests
  that only assert mocks call mocks.
- Run `pnpm test` and `pnpm type-check` locally before opening a PR.

### 9. Style and formatting

Formatting is automated — do not debate it in review.

| Tool | Scope |
| ---- | ----- |
| **Prettier** | `*.{js,jsx,ts,tsx,json,css,md,html}` — see `.prettierrc.json` |
| **ESLint** | Per-app configs (e.g. `eslint-config-next` in compare-next) |
| **lint-staged** | Prettier on commit via Husky |

Commands (from repo root):

```bash
pnpm format        # write formatting
pnpm format:check  # CI-style check
pnpm lint          # ESLint across workspaces
pnpm lint:fix      # auto-fix where possible
pnpm type-check    # TypeScript
```

**Style rules (enforced + conventional):**

- No semicolons (Prettier `semi: false`)
- Single quotes for strings
- 2-space indentation, no tabs
- Trailing commas: none (Prettier `trailingComma: "none"`)
- Use `const` by default; `let` only when reassigned; never `var`
- Prefer `async/await` over raw `.then()` chains
- Prefer early returns over deep nesting
- Imports: external packages first, then workspace packages, then relative
  paths. Remove unused imports.

### 10. Comments and documentation

- **Code should be self-explanatory.** Comments explain *why*, not *what*.
- **Document non-obvious business rules**, security constraints, and
  performance trade-offs.
- **Public APIs** (packages, HTTP routes, shared hooks) need a short doc
  comment or README section when behavior is not obvious from types.
- **Do not add markdown docs** the user did not ask for. Update existing docs
  when behavior changes.

### 11. Git, branches, and pull requests

- **Branch names:** `feature/…`, `fix/…`, `chore/…` — short and descriptive.
- **Commits:** imperative mood, one logical change per commit
  (`fix: handle empty catalogue filter`, `feat: add popular listings route`).
- **PR description** must state what changed, why, and how to test. Use the
  template in `.github/PULL_REQUEST_TEMPLATE.md`.
- **Reviews are mandatory** for `main`. Address or reply to every comment.
- **CI must be green** before merge (lint, type-check, test, build).
- **No force-push to `main`.** Rebase feature branches only when you own them
  and no one else is building on them.

### 12. Performance and reliability

- **Measure before optimizing.** Profile hot paths; do not guess.
- **Avoid N+1 queries** and unbounded loops over large datasets.
- **Paginate** list endpoints and UI tables by default.
- **Cache deliberately** with explicit invalidation — no mystery caches.
- **Workers and serverless:** no reliance on in-memory global state across
  requests; use D1/KV/R2/Durable Objects for shared state.

### 13. Code review checklist

Reviewers and authors should verify:

- [ ] Change matches the ticket / PR scope
- [ ] Naming is clear and consistent with surrounding code
- [ ] No duplicated logic that should be shared
- [ ] Errors handled; no silent failures
- [ ] Types are accurate; no unnecessary `any`
- [ ] Tests added or updated for behavior changes
- [ ] No secrets, debug logs, or commented-out code
- [ ] Docs updated if public behavior changed
- [ ] `pnpm lint`, `pnpm type-check`, and `pnpm test` pass

### 14. When principles conflict

Use this order:

1. **Correctness and security** — never compromise
2. **Clarity** — readable code over clever code
3. **Consistency** — match the existing module unless migrating with a plan
4. **Simplicity (KISS)** — smaller API surface, fewer moving parts
5. **Reuse (DRY)** — extract only when duplication hurts maintenance

If two approaches are equally valid, ask in the PR and document the decision
in a one-line comment or PR thread.

---

## Part 2 — App-specific architecture

Repo-wide rules above apply everywhere. **Per-app folder layout, data flow,
and conventions** live next to each app so this file stays maintainable as the
monorepo grows.

| App | Architecture doc |
| --- | ---------------- |
| **compare-next** | [`apps/compare-next/ARCHITECTURE.md`](apps/compare-next/ARCHITECTURE.md) |

When working inside an app:

1. Read that app's `ARCHITECTURE.md` before adding routes, components, or data
   layers.
2. Follow the established layer boundaries (e.g. thin `app/` pages, logic in
   `data/` and `lib/`).
3. Add a row to the table above when a new app gets its own architecture doc.

If no app-specific doc exists yet, match the nearest sibling app and propose
an `ARCHITECTURE.md` in the PR.

---

## Part 3 — Repository context (monorepo)

This is a **pnpm + Turborepo monorepo** hosting `da-mr.com` and its
subdomain tools. Apps live as siblings under `apps/*` (e.g. `main`, `resume`,
`compare`, `steps`). `apps/main` is a static Vite site (vanilla JS/CSS, no
React). React tools use Vite + TypeScript.

### Quick reference

All commands run from the repo root. Turbo fans them out to the right
workspace(s).

| Task | Command |
| ----------------- | ------------------------------------------------ |
| Install deps | `pnpm install` |
| Dev server (main) | `pnpm --filter @playground/main dev` (port 3000) |
| Dev server (auth) | `pnpm --filter @playground/auth dev` (port 3004) |
| Dev server (steps) | `pnpm --filter @playground/steps dev` (port 3003) |
| Auth Worker (local)| `pnpm --filter @playground/auth-api dev` (8789) |
| Dev (all apps) | `pnpm dev` |
| Stop stuck dev ports | `pnpm stop` (if restart says port in use after Ctrl+C) |
| Lint | `pnpm lint` |
| Format check | `pnpm format:check` |
| Type check | `pnpm type-check` |
| Tests | `pnpm test` |
| Auth E2E | `pnpm test:e2e` (browser; see `e2e/README.md`) |
| Auth API smoke | `./scripts/smoke-auth.sh` |
| Build (all) | `pnpm build` |
| Build (main only) | `pnpm turbo run build --filter=@playground/main` |
| Security audit | `pnpm security:audit` |

See `README.md` for the full layout, how to add a new tool/subdomain, and
the Cloudflare deploy flow.

### Notes

- **Package manager: pnpm 10** (enforced via `packageManager` in
  `package.json` — corepack will pick this up automatically). Do NOT use
  npm or yarn; the lockfile is `pnpm-lock.yaml`.
- **Node.js 22** is required (`.nvmrc` + `engines.node >=22`).
- **Turborepo** caches results under `.turbo/`. Outputs for each task are
  declared in `turbo.json`.
- Pre-commit hook (`.husky/pre-commit`) runs `pnpm exec lint-staged` →
  Prettier on staged files.
- **Deploys** are driven by GitHub Actions (`.github/workflows/deploy.yml`)
  using `cloudflare/wrangler-action@v3` against the `playground` Cloudflare
  Pages project. Git auto-build on the Cloudflare side must stay
  **disabled** for this project so deploys don't double-fire.
- **`apps/compare-next`** is deployed as a **single Cloudflare Worker** via
  OpenNext (`pnpm --filter @playground/compare-next deploy` from repo root).
  Next.js pages and `/api/*` routes run on the same origin — attach
  **`compare.da-mr.com`** to the `compare-next` Worker (Workers & Pages →
  Custom domains). PR previews use Worker `compare-next-dev` on
  **`dev-compare.da-mr.com`**. See
  [`apps/compare-next/ARCHITECTURE.md`](apps/compare-next/ARCHITECTURE.md).
- `apps/main` calls the public TheMealDB API at runtime for random recipes;
  no API keys needed. No env vars or backend services for local dev.
- **`apps/steps`** — guided action catalog (search, per-user step progress,
  notes, contributor editor). Worker + D1 auth via `@playground/auth-core` /
  `@playground/auth-react` (same pattern as compare). Deploy not wired until
  Phase 6 in `apps/steps/PLAN.md`.
- **Central auth:** `auth.da-mr.com` ([`apps/auth`](apps/auth)) hosts login UI and
  `/api/auth/*`. Tools redirect via `VITE_AUTH_ORIGIN` and `buildAuthLoginUrl` from
  `@playground/auth-react`. Shared D1 `playground-auth-db`, cookie domain
  `.da-mr.com`. Migrate: `pnpm --filter @playground/auth-api db:migrate:auth:local`.
  See `packages/auth-core/SSO.md`.
- **Stuck ports after dev:** `wrangler` and `workerd` often survive Ctrl+C when
  using Turbo or background terminals. Run `pnpm stop` from the repo root before
  restarting (`scripts/stop-dev.sh` frees 3000–3004, 8787–8789, and inspector ports).
- **Local dev SSO:** Auth / steps Workers use
  `--persist-to .wrangler/local-dev-persist` so the same local `playground-auth-db`
  backs every port. Compare-next uses Next.js API routes locally (no separate
  compare Worker in dev).
- When adding a new tool app, follow the recipe in `README.md` →
  "Adding a new tool". Each tool = one Cloudflare Pages project + one
  deploy job + one subdomain.

---

## Part 4 — Agent-specific instructions

When an AI agent implements changes in this repo:

1. **Read before writing.** Inspect surrounding files and match conventions.
2. **Minimize scope.** The smallest correct diff wins.
3. **Do not over-engineer.** No premature abstractions or extra error handling
   for impossible cases.
4. **Run checks** relevant to touched workspaces (`lint`, `type-check`, `test`).
5. **Do not commit** unless the user explicitly asks.
6. **Do not create markdown files** unless requested.
7. **Prefer editing existing modules** over duplicating logic.

These agent rules mirror the human guidelines above; they are not a separate
standard.
