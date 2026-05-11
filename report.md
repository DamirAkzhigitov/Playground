# Red-team style security review (post-release scenario)

**Role:** Offensive-style assessment of what an attacker could try after a hypothetical public release.  
**Method:** Static analysis of this repository (no live penetration test against production).  
**Date:** 2026-05-11  
**Scope:** Monorepo apps under `/workspace` — primarily **`apps/apartments`** (React SPA + Cloudflare Worker + D1 + R2), plus **`apps/main`**, **`apps/resume`**, and **`packages/global-header`**.

---

## Executive summary

The **Apartments** product has a solid baseline: parameterized SQL, session cookies marked `httpOnly` and `SameSite=Lax`, Zod validation on most JSON bodies, and React’s default escaping for stored text. The highest-impact gaps are **resource and abuse limits** (uploads and large text payloads), **photo retrieval without an ownership check** (horizontal privilege escalation if a key leaks), and **user-controlled bytes + `Content-Type` served from the app origin** (XSS and related browser attacks if someone opens a crafted URL or certain clients mishandle SVG). Secondary issues include **account enumeration on registration**, **unbounded batch writes**, **XLSX formula injection** in exports, and **verbose error surfaces** under failure conditions.

`apps/main` and `apps/resume` are largely static marketing/resume surfaces with minimal attack surface compared to the authenticated API.

---

## Attack surface inventory

| Area | Input channel | Auth |
|------|----------------|------|
| Auth (`/api/auth/*`) | JSON (`register`, `login`, `patch /me`) | Mixed |
| Apartments, categories, questions | JSON | Required (session cookie) |
| Answers | JSON (single or batch) | Required |
| Photos | `multipart/form-data` | Required |
| Photo bytes | `GET /api/photos/:key` | Required (any logged-in user) |
| Export | `GET /api/export/json`, `GET /api/export/xlsx` | Required |
| SPA | React forms, file pickers (`accept="image/*"` is **not** enforced server-side) | Session |

---

## Findings (ordered by practical risk)

### 1. Photo upload: no size or type enforcement (availability & cost)

**What was tried (attacker mindset):** Upload a multi-gigabyte file, or a non-image payload, via direct `POST /api/photos/upload` (bypassing the browser’s `accept="image/*"` hint).

**Evidence:** `apps/apartments/worker/src/routes/photos.ts` reads the full body with `file.arrayBuffer()` and writes to R2 with no declared maximum size, magic-byte sniffing, or extension allowlist. The UI uses `accept="image/*"` in `QuestionPhotosSection.tsx`, which only affects the file picker, not the API.

**Impact:** Worker CPU/time limits, R2 storage and egress charges, and D1 write amplification can be abused for **denial of wallet / denial of service** by any authenticated user.

**Severity:** High (abuse / DoS), not classic remote code execution on the server.

---

### 2. Photo `GET`: missing authorization tied to the object (IDOR-style read)

**What was tried:** As user A, call `GET /api/photos/{r2Key}` for a key belonging to user B’s apartment.

**Evidence:** `photos.get('/:key', ...)` loads `c.env.PHOTOS.get(key)` without joining `photos` / `apartments` to ensure `user_id` matches `c.get('userId')`. Upload and delete paths do check apartment ownership; read does not.

**Impact:** Any **authenticated** principal who learns or guesses a victim’s `r2_key` (export JSON includes `r2_key`, screenshots, shared backups, referrer leaks, etc.) can **read arbitrary objects** stored under keys they know. Keys contain UUIDs and timestamps, which lowers blind guessing risk but does not remove the flaw.

**Severity:** High (broken object-level authorization for reads).

---

### 3. User-controlled file served from API origin with client-supplied `Content-Type`

**What was tried:** Upload HTML or SVG with scripts, forcing `Content-Type` via the `File` API or raw multipart, then open `/api/photos/{key}` in a new tab or embed where the browser executes active content.

**Evidence:** R2 `httpMetadata.contentType` is set from `file.type || 'application/octet-stream'` in `photos.ts`. Browsers and `<img>` handling of SVG vary; **`text/html` or `application/xhtml+xml`** on same-origin URLs is a classic **stored XSS** if a victim visits the URL outside an `<img>` context.

**Impact:** Session theft or actions-as-user if combined with other bugs; at minimum **policy violation** for “images only.”

**Severity:** High to critical depending on browser behavior and how URLs are shared (e.g. pasted into address bar vs. only used in `<img>`).

---

### 4. Answers API: unbounded string length and huge batch payloads

**What was tried:** `POST /api/answers` with `value`/`note` megabytes long, or `answers: [...]` with tens of thousands of rows.

**Evidence:** `answerInputSchema` uses `z.string().nullable()` for `value` with **no `.max()`**. `answersPayloadSchema` allows `z.array(answerInputSchema).min(1)` with **no upper bound** on array length. The handler builds one D1 statement per item and runs `batch`.

**Impact:** **Memory pressure**, **D1 batch limits / failures**, **quota exhaustion**, degraded experience for the same account or neighbors on shared infrastructure.

**Severity:** Medium–High (abuse / DoS).

---

### 5. Question options: `label` / `value` without `.max()`

**What was tried:** Create options with extremely long `value` strings via `POST/PATCH /api/questions`.

**Evidence:** `questionOptionSchema` in `questions.ts` uses `z.string().trim().min(1)` for `label` and `value` without maximum length (unlike `questionSchema.label` which caps at 300).

**Impact:** Storage bloat, large API payloads, slower UI rendering.

**Severity:** Medium.

---

### 6. XLSX export: spreadsheet formula injection

**What was tried:** Store answers or apartment fields starting with `=`, `+`, `-`, `@`, `\t`, etc., then open the downloaded `.xlsx` in Microsoft Excel or similar.

**Evidence:** `exports.ts` maps raw `value` strings into worksheet cells via `xlsx` without neutralizing formula prefixes.

**Impact:** When a victim opens the file in a formula-executing client, **command / exfiltration payloads** are a known class of issues (not RCE on your Worker, but serious for the user).

**Severity:** Medium (user opens untrusted export in Excel).

---

### 7. Registration response leaks whether an email exists

**What was tried:** Register the same email twice or probe known addresses.

**Evidence:** `auth.post('/register', ...)` returns `409` with `{ error: 'Email already registered' }` while login uses a generic invalid-credentials message.

**Impact:** **User enumeration** for targeted phishing or credential stuffing prep.

**Severity:** Low–Medium (privacy / abuse facilitation).

---

### 8. Global error handler may expose internal details

**What was tried:** Trigger non-Zod server errors and observe JSON body.

**Evidence:** `app.onError` in `worker/src/index.ts` returns `err.message` with HTTP 500 for unexpected errors. Depending on runtime and libraries, messages can include **implementation details**.

**Severity:** Low–Medium (information disclosure). Zod paths are already returned in structured `details` for 400 responses (useful for clients; slightly increases reconnaissance value).

---

### 9. Authentication hardening gaps (rate limits, CAPTCHA, monitoring)

**What was tried:** High-volume login attempts against a known email.

**Evidence:** No rate limiting, lockout, or progressive delay appears in `auth.ts` / `middleware.ts`. Passwords use PBKDF2-SHA-256 with constant-time compare in `crypto.ts` (good), but online brute force is still unconstrained at the application layer.

**Severity:** Medium (defense in depth gap).

---

### 10. `apps/main` / `apps/resume` / global header

**`packages/global-header`:** `shadowRoot.innerHTML` interpolates `brand`, `homeLabel`, and `homeHref` from element attributes (`index.js`). In shipped apps these values come from **static HTML**, not end users — **low risk** unless a future feature lets untrusted parties set attributes.

**`apps/main`:** No user-controlled server rendering; minimal JS. **Very low** XSS/data injection surface.

**`apps/resume`:** Static HTML resume. **Very low** direct injection; usual concerns are supply chain and hosting misconfiguration rather than app logic.

---

## What already looks good

- **SQL injection:** Queries use bound parameters, not string-concatenated user SQL.
- **Session cookie flags:** `httpOnly`, `Secure`, `SameSite=Lax` on session issuance (`auth.ts`).
- **Password handling:** Custom PBKDF2 with salt and constant-time comparison (`crypto.ts`).
- **Apartment mutations:** `user_id` checks on apartments, answers, deletes, and photo **delete** path.
- **React UI:** Answer and note fields use controlled components without `dangerouslySetInnerHTML` in reviewed components.
- **Worker + SPA same origin:** `wrangler.toml` `run_worker_first = ["/api/*"]` avoids shipping API on a separate permissive CORS origin by default.

---

## Recommended remediations (concise)

1. **Photos:** Enforce max bytes (stream or reject early), allowlisted MIME or magic-byte check, strip/normalize filenames, set safe `Content-Type` server-side (e.g. force `image/jpeg` after re-encode, or serve downloads with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`).
2. **Photo GET:** Resolve `key` through `photos` + `apartments` where `apartments.user_id = ?`, or use non-guessable signed URLs scoped to the owner.
3. **Answers / options:** Add `.max(...)` on strings and cap batch array length; consider per-user rate limits.
4. **Exports:** Prefix risky cell values in XLSX (e.g. prepend `'` or use “text” mode) per OWASP guidance on CSV/Excel injection.
5. **Register:** Return the same generic success/failure shape as login for existence probes, or throttle by IP + email.
6. **Errors:** Log full errors server-side; return generic `error` strings to clients in production.

---

## Disclaimer

This document is a **design-time / code review** exercise. It does not assert that issues are exploitable in production without verifying Worker limits, R2 settings, WAF rules, and browser versions. Pair findings with your threat model and Cloudflare account controls.
