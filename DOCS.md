# Documentation index

Single map of every major doc in this repo. When something moves or is added,
update this file.

**Quick start:** [`README.md`](README.md) (setup, commands, deploy) ·
[`AGENTS.md`](AGENTS.md) (Cursor / local dev cheat sheet)

---

## Product & launch

Strategy, priorities, and operating decisions.

| Document | What it covers |
| -------- | -------------- |
| [`docs/product-family.md`](docs/product-family.md) | Product portfolio, MVP scoring, subscription direction |
| [`docs/execution-roadmap.md`](docs/execution-roadmap.md) | Phased launch plan and priorities |
| [`docs/week-1-tasks.md`](docs/week-1-tasks.md) | Week 1 checklist tied to decisions |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Locked product decisions (D-01 …); Compare public vs account (D-09) |
| [`docs/release-readiness-audit.md`](docs/release-readiness-audit.md) | Gap analysis vs roadmap (as of audit date) |
| [`docs/analytics-and-cookies.md`](docs/analytics-and-cookies.md) | Analytics tooling and cookie consent |

---

## Authentication & authorization

Shared login across `*.da-mr.com`. Start with **AUTHORIZATION** for guest vs
signed-in behavior on each app.

| Document | What it covers |
| -------- | -------------- |
| [`packages/auth-core/AUTHORIZATION.md`](packages/auth-core/AUTHORIZATION.md) | **Main reference:** guests, roles, public vs protected routes, per-app matrix |
| [`packages/auth-core/SSO.md`](packages/auth-core/SSO.md) | Cross-subdomain SSO, D1, cookies, production checklist |
| [`packages/auth-core/OAUTH.md`](packages/auth-core/OAUTH.md) | Google / Facebook OAuth setup |
| [`packages/auth-core/README.md`](packages/auth-core/README.md) | Worker package API (`createPlaygroundAuth`, middleware) |
| [`packages/auth-react/README.md`](packages/auth-react/README.md) | React provider, forms, `ProtectedRoute`, guest-friendly routing |
| [`e2e/README.md`](e2e/README.md) | Browser E2E for Steps/Compare auth integration |
| [`scripts/smoke-auth.sh`](scripts/smoke-auth.sh) | API integration smoke (curl + Workers) |
| [`scripts/smoke-auth.sh`](scripts/smoke-auth.sh) | Integration smoke test (auth + steps + compare sessions) |

Central app: **`apps/auth`** — login UI at `auth.da-mr.com` (no separate README;
see SSO and root README deploy section).

---

## Apps

### Compare — `compare.da-mr.com`

| Document | What it covers |
| -------- | -------------- |
| [`apps/compare/README.md`](apps/compare/README.md) | Product overview, stack, data model, auth (account-only today) |
| [`apps/compare/PLAN.md`](apps/compare/PLAN.md) | Task checklists and API notes |
| [`apps/compare/DESIGN.md`](apps/compare/DESIGN.md) | UX / UI spec |

### Steps — `steps.da-mr.com`

| Document | What it covers |
| -------- | -------------- |
| [`apps/steps/README.md`](apps/steps/README.md) | Product overview, roles, MVP scope, dev commands |
| [`apps/steps/IMPLEMENTATION.md`](apps/steps/IMPLEMENTATION.md) | Phased build status and exit criteria |
| [`apps/steps/PLAN.md`](apps/steps/PLAN.md) | API tables, schema, checklists |
| [`apps/steps/DESIGN.md`](apps/steps/DESIGN.md) | Screens, components, accessibility |
| [`apps/steps/OPEN_QUESTIONS.md`](apps/steps/OPEN_QUESTIONS.md) | Open product/engineering questions |

### Main & resume

No app-level README. Described in [`README.md`](README.md):

- **`apps/main`** — `da-mr.com` tool directory (static Vite)
- **`apps/resume`** — `resume.da-mr.com` (static Vite)

---

## Shared packages

| Document | What it covers |
| -------- | -------------- |
| [`packages/README.md`](packages/README.md) | Package inventory and conventions |
| [`packages/auth-core/`](packages/auth-core/) | See [Authentication](#authentication--authorization) above |
| [`packages/auth-react/`](packages/auth-react/) | See [Authentication](#authentication--authorization) above |
| [`packages/entitlements/`](packages/entitlements/) | Plan / feature gates (code only; see `product-family.md`) |
| [`packages/global-header/`](packages/global-header/) | Shared nav injected in tool HTML (code only) |

---

## Monorepo & tooling

| Document | What it covers |
| -------- | -------------- |
| [`README.md`](README.md) | Stack, setup, commands, CI/CD, adding a new tool |
| [`AGENTS.md`](AGENTS.md) | Cursor Cloud: ports, auth persist, compare Worker deploy, pitfalls |
| [`e2e/README.md`](e2e/README.md) | Browser E2E for Steps/Compare auth integration + pre-merge checklist |
| [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md) | PR template |
| [`.github/ISSUE_TEMPLATE/bug_report.md`](.github/ISSUE_TEMPLATE/bug_report.md) | Bug report template |

Workflows (no separate docs): `.github/workflows/ci.yml`, `deploy.yml`,
`pr-checks.yml`.

---

## Other

| Document | What it covers |
| -------- | -------------- |
| [`report.md`](report.md) | Legacy red-team security review (pre-compare rename; historical) |
| [`.cursor/skills/apartments-developer/SKILL.md`](.cursor/skills/apartments-developer/SKILL.md) | Cursor skill (Apartments-era; may be stale) |

---

## By topic

| I want to… | Read |
| ---------- | ---- |
| Set up the repo locally | [`README.md`](README.md) → Setup |
| Run dev servers and ports | [`AGENTS.md`](AGENTS.md) |
| Verify auth integration (API + browser) | [`e2e/README.md`](e2e/README.md), [`scripts/smoke-auth.sh`](scripts/smoke-auth.sh) |
| Understand guest vs login on Steps / Compare | [`packages/auth-core/AUTHORIZATION.md`](packages/auth-core/AUTHORIZATION.md) |
| Configure SSO or OAuth in production | [`packages/auth-core/SSO.md`](packages/auth-core/SSO.md), [`OAUTH.md`](packages/auth-core/OAUTH.md) |
| Add a new subdomain tool | [`README.md`](README.md) → Adding a new tool |
| See launch priorities | [`docs/execution-roadmap.md`](docs/execution-roadmap.md) |
| Build or review Steps | [`apps/steps/README.md`](apps/steps/README.md) → related docs |
| Build or review Compare | [`apps/compare/README.md`](apps/compare/README.md) → PLAN / DESIGN |
