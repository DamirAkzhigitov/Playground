# Phase 2 MR Description - Frontend Shell & Data Layer

## Title

Phase 2: Add frontend shell, typed API client, TanStack Query hooks, routing, and base UI states

## Why this MR exists

- Establish a production-ready frontend foundation that can talk to the Worker API.
- Centralize data fetching/mutations with typed hooks instead of ad-hoc `fetch` calls.
- Create a complete route skeleton for all planned Phase 2 pages.
- Add reusable loading/error handling so each route can render reliable states.

## Scope

- Typed API wrapper and domain types.
- QueryClient setup and feature hooks.
- React Router configuration and layout shell (including bottom tab bar).
- Page stubs for all required routes.
- App bootstrap wiring for Query + Router providers.
- Local dev proxy fix for Wrangler (`8787`).

## File-by-file explanation

### Added files

| File                                    | Why added                                                          | How it works                                                                                                                               | Where it is used                                                                |
| --------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `src/lib/api.ts`                        | Provide one typed HTTP layer for all frontend API calls.           | Exposes `apiRequest<T>()`, builds URL from `VITE_API_BASE_URL`, parses JSON/text, and throws `ApiError` with status/details on non-2xx.    | Used by all hooks in `src/hooks/*`.                                             |
| `src/lib/queryClient.ts`                | Standardize TanStack Query behavior app-wide.                      | Creates `QueryClient` with defaults: stale time, retry policy, no refetch-on-focus.                                                        | Injected in `src/main.tsx` via `QueryClientProvider`.                           |
| `src/types/api.ts`                      | Define frontend domain and mutation payload types.                 | Contains API entity types (`Category`, `Question`, `Apartment`, etc.) and input payloads for create/update/upsert operations.              | Imported by hooks and pages.                                                    |
| `src/types/index.ts`                    | Keep imports clean and centralized.                                | Re-exports from `src/types/api.ts`.                                                                                                        | Used by hooks (`import type { ... } from '../types'`).                          |
| `src/hooks/queryKeys.ts`                | Avoid duplicated query key strings.                                | Defines stable query key factories (`categories`, `questions`, `apartments`, `apartment(id)`).                                             | Used in every query/mutation hook for caching/invalidation.                     |
| `src/hooks/useCategories.ts`            | Encapsulate category data access.                                  | Implements list/create/update/delete hooks with cache invalidation on success.                                                             | Consumed by current/future category UI.                                         |
| `src/hooks/useQuestions.ts`             | Encapsulate question data access.                                  | Implements list/create/update/reorder hooks and invalidates questions cache after writes.                                                  | Used by `src/pages/QuestionsPage.tsx` and future forms.                         |
| `src/hooks/useApartments.ts`            | Encapsulate apartment list/detail + CRUD access.                   | Implements list/detail/create/update/delete and invalidates both list and detail caches where needed.                                      | Used by `src/pages/ApartmentsPage.tsx` and `src/pages/ApartmentDetailPage.tsx`. |
| `src/hooks/useAnswers.ts`               | Provide answer upsert mutation API.                                | Implements `useUpsertAnswer` posting single or bulk payload to `/api/answers`.                                                             | Ready for inspection flow in Phase 3.                                           |
| `src/hooks/usePhotos.ts`                | Provide photo upload/delete mutation API.                          | Upload builds `FormData` and posts to `/api/photos/upload`; delete hits `/api/photos/:id`; both invalidate apartment cache.                | Ready for photo UI in Phase 4.                                                  |
| `src/hooks/index.ts`                    | Simplify hook imports from a single entrypoint.                    | Barrel export for all hooks.                                                                                                               | Used by pages like `ApartmentsPage`, `QuestionsPage`, `ApartmentDetailPage`.    |
| `src/components/LoadingState.tsx`       | Reusable loading UI to keep route pages consistent.                | Renders a simple styled loading container with optional label.                                                                             | Used in data-driven pages (`/apartments`, `/apartments/:id`, `/questions`).     |
| `src/components/ErrorState.tsx`         | Reusable inline error UI component.                                | Renders a styled error panel with optional message.                                                                                        | Used in data-driven pages and route error boundary.                             |
| `src/components/RouteErrorBoundary.tsx` | Handle router-level runtime/load errors safely.                    | Uses `useRouteError()` and `isRouteErrorResponse()` to map errors to user-friendly `ErrorState`.                                           | Registered as `errorElement` in `src/router.tsx`.                               |
| `src/components/layout/AppLayout.tsx`   | Create app shell and mobile-first bottom navigation.               | Renders `<Outlet />` for child routes and fixed bottom tab bar (Apartments, Questions, Compare, Export).                                   | Parent route element for all app pages in `src/router.tsx`.                     |
| `src/pages/ApartmentsPage.tsx`          | Implement `/apartments` Phase 2 route stub with live data flow.    | Calls `useApartments()`, shows loading/error states, renders list cards and empty state.                                                   | Route `'/apartments'`.                                                          |
| `src/pages/NewApartmentPage.tsx`        | Implement `/apartments/new` placeholder route.                     | Static stub section for upcoming form work in Phase 3.                                                                                     | Route `'/apartments/new'`.                                                      |
| `src/pages/ApartmentDetailPage.tsx`     | Implement `/apartments/:id` route stub with live detail data flow. | Reads `id` from params, queries `useApartment(id)`, shows loading/error/data state and inspect entry link.                                 | Route `'/apartments/:id'`.                                                      |
| `src/pages/InspectionPage.tsx`          | Implement `/apartments/:id/inspect` placeholder route.             | Reads `id` and displays Phase 3 placeholder content for guided inspection flow.                                                            | Route `'/apartments/:id/inspect'`.                                              |
| `src/pages/QuestionsPage.tsx`           | Implement `/questions` route stub with live data flow.             | Calls `useQuestions()`, renders loading/error and count of fetched questions.                                                              | Route `'/questions'`.                                                           |
| `src/pages/ComparePage.tsx`             | Implement `/compare` placeholder route.                            | Static stub for future comparison matrix work (Phase 5).                                                                                   | Route `'/compare'`.                                                             |
| `src/pages/ExportPage.tsx`              | Implement `/export` placeholder route.                             | Static stub for export actions (Phase 5).                                                                                                  | Route `'/export'`.                                                              |
| `src/router.tsx`                        | Define complete route map for Phase 2.                             | Uses `createBrowserRouter`; redirects `/` to `/apartments`; mounts all required child routes under `AppLayout`; adds route error boundary. | Used by `src/App.tsx` via `RouterProvider`.                                     |
| `src/vite-env.d.ts`                     | Add TypeScript support for Vite env var used by API layer.         | Extends `ImportMetaEnv` with optional `VITE_API_BASE_URL`.                                                                                 | Used implicitly by TS when compiling `src/lib/api.ts`.                          |

### Updated files

| File                             | Why updated                                    | How it works now                                                          | Where change matters                                                     |
| -------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/main.tsx`                   | Register TanStack Query at app root.           | Wraps app with `<QueryClientProvider client={queryClient}>`.              | Enables all hooks under the React tree.                                  |
| `src/App.tsx`                    | Move from empty shell to router-driven app.    | Renders `<RouterProvider router={AppRouter} />`.                          | Activates route-based pages/navigation.                                  |
| `apps/apartments/package.json`   | Add browser router package.                    | Added dependency `react-router-dom`.                                      | Required for `RouterProvider`, `createBrowserRouter`, `Link`, `NavLink`. |
| `apps/apartments/vite.config.ts` | Fix local API routing to active Wrangler port. | `/api` proxy target changed to `http://localhost:8787`.                   | Makes frontend API requests reach local Worker.                          |
| `apps/apartments/PLAN.md`        | Keep implementation checklist in sync.         | Phase 2 tasks marked complete.                                            | Project tracking/documentation.                                          |
| `pnpm-lock.yaml`                 | Lockfile update after dependency install.      | Records exact resolution for `react-router-dom` and related tree changes. | Deterministic installs in CI and local.                                  |

## Runtime flow (end-to-end)

1. App starts in `src/main.tsx` and mounts Query + Router providers.
2. `src/router.tsx` resolves route and renders `AppLayout` + page component.
3. Data pages call feature hooks from `src/hooks/*`.
4. Hooks call `apiRequest<T>()` in `src/lib/api.ts`.
5. Request goes to `/api/*`; Vite proxies to Wrangler local server (`8787`).
6. Query cache stores results by keys in `src/hooks/queryKeys.ts`.
7. Mutations invalidate relevant keys so dependent UI refreshes automatically.

## Validation done

- `pnpm --filter @playground/apartments lint`
- `pnpm --filter @playground/apartments type-check`
- `pnpm --filter @playground/apartments build`

## Notes for reviewers

- This MR intentionally delivers route/data scaffolding and shared primitives; full feature UIs are deferred to Phase 3+.
- API types are aligned to planned endpoints and may be refined when backend endpoint payloads are finalized.
