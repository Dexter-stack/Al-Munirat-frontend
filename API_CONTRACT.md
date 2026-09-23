# API_CONTRACT.md

**Shared contract for the Madrasah LMS. This file is authoritative for both the Laravel backend and the React frontend.**

Both Claude Code sessions must read and follow this file. Neither session may change anything in it unilaterally. If a change is needed:

1. Update this file first.
2. Note the change and the reason.
3. Update the backend implementation and the frontend consumer together.

Where a session's own prompt conflicts with this file on *contract* matters (auth mode, response shape, endpoints, error format), **this file wins**. Visual design still follows the Stitch design; internal architecture still follows each session's prompt.

---

## 1. Base URL & Versioning

- All application endpoints are under `/api/v1/`.
- Frontend reads the base URL from `VITE_API_BASE_URL` (e.g. `https://api.example.com/api/v1`). Never hard-coded.
- Backend and frontend are deployed on **separate origins**. CORS and auth are designed for cross-origin use.

---

## 2. Authentication — Token-based Sanctum

Auth uses **Laravel Sanctum personal access tokens (Bearer tokens)**, NOT cookie/SPA session mode. This is chosen because the two apps live on different origins.

- On successful login/register, the backend returns a plain-text token in the response body.
- The frontend sends it on every authenticated request as:
  `Authorization: Bearer <token>`
- The frontend stores the token in memory + a single persistence location (e.g. `localStorage` under one key). No other secrets are stored client-side.
- Logout revokes the current token server-side (`$request->user()->currentAccessToken()->delete()`).
- There is **no** `/sanctum/csrf-cookie` step and no CSRF cookie flow, because we are not using cookie auth. Backend must NOT require the `EnsureFrontendRequestsAreStateful` middleware for these routes.

### Auth endpoints

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/auth/register` | none | see §Registration | `{ user, token }` |
| POST | `/auth/login` | none | `email, password` | `{ user, token }` |
| POST | `/auth/logout` | Bearer | — | success envelope |
| GET | `/auth/me` | Bearer | — | `{ user }` (includes `account_status`, `role`) |
| POST | `/auth/forgot-password` | none | `email` | success envelope |
| POST | `/auth/reset-password` | none | `token, email, password, password_confirmation` | success envelope |

`GET /auth/me` is the single source of truth for `role` and `account_status`. The frontend calls it after login and on app load, and gates all student routes on `account_status`.

---

## 3. CORS

Backend must allow, for the frontend origin(s):

- Methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
- Headers: `Authorization, Content-Type, Accept, X-Requested-With`
- Origins: configured via env (e.g. `FRONTEND_URL`), not `*` once credentials/real deploy — but since we use Bearer tokens (not cookies), `supports_credentials` is `false` and the allowed-origin list is explicit.

---

## 4. Standard Response Envelope

**Every** JSON response uses this shape.

Success:
```json
{ "success": true, "message": "OK", "data": { } }
```

Success with a list uses `data` as an array and adds `meta` (see §5).

Error (generic):
```json
{ "success": false, "message": "Human readable message" }
```

Validation error (HTTP 422):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "email": ["The email has already been taken."] }
}
```

`errors` is always a map of `field -> string[]`, matching Laravel's validator output. The frontend maps these directly onto React Hook Form fields.

### HTTP status codes the frontend handles explicitly

| Status | Meaning | Frontend behavior |
|---|---|---|
| 200/201 | success | render `data` |
| 401 | unauthenticated / token invalid | clear token, redirect to `/login` |
| 403 | authenticated but not allowed | show PermissionDenied |
| 404 | not found | show NotFound |
| 422 | validation | show field errors |
| 429 | rate limited | show retry message |
| 500 | server error | show ErrorState (never show stack traces — backend must not leak them) |

---

## 5. Pagination

All admin/list endpoints that can grow are paginated. The envelope is:

```json
{
  "success": true,
  "message": "OK",
  "data": [ /* array of resources */ ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 120,
    "last_page": 8
  }
}
```

- Query params: `?page=1&per_page=15&search=<term>&sort=<field>&direction=asc|desc` plus endpoint-specific filters.
- `per_page` default 15, max 100.
- The frontend's TanStack Query keys include these params so caching/invalidation is correct.

---

## 6. Account State Machine (critical)

`account_status` is returned by `/auth/me` and on the student profile. Allowed values:

`pending_payment` · `receipt_submitted` · `under_review` · `payment_rejected` · `active` · `suspended`

- Only `active` may access student learning resources (courses, materials, assignments, exams, results, progress).
- Any other state → backend returns **403** on protected student endpoints, and the frontend shows the matching status page instead of the dashboard.
- `payment_rejected` responses include the rejection reason so the frontend can display it and offer re-upload.
- The frontend must NEVER decide activation locally — it only reflects `account_status`.

---

## 7. Registration payload

```
first_name, last_name, email, phone, password, password_confirmation,
date_of_birth (YYYY-MM-DD), gender, address, class_id
```

Registration returns `{ user, token }` but the user comes back with `account_status: "pending_payment"`. Frontend redirects to the payment flow, not the dashboard.

---

## 8. Payment flow (contract-frozen endpoints)

Student:
| Method | Path | Body |
|---|---|---|
| GET | `/payment/instructions` | — (returns bank name, account name, account number, amount, currency, reference) |
| POST | `/student/payments` | `amount, currency, reference, payment_date, payment_method` → creates Payment, sets `receipt_submitted`/`under_review` per backend rules |
| POST | `/student/payments/{payment}/receipt` | multipart: `receipt` (file), `amount`, `payment_date`, `reference` |
| GET | `/student/payments` | list |
| GET | `/student/payments/{payment}` | one |

Admin:
| Method | Path | Body |
|---|---|---|
| GET | `/admin/payments` | list + filters |
| GET | `/admin/payments/{payment}` | one |
| POST | `/admin/payments/{payment}/approve` | — → activates account, notifies |
| POST | `/admin/payments/{payment}/reject` | `reason` → sets `payment_rejected`, notifies |

Receipt upload: allowed MIME `image/jpeg, image/png, application/pdf`; max size defined by backend (state it in API_DOCUMENTATION.md); backend validates MIME server-side, not just extension.

---

## 9. Exam / CBT flow — attempt-based (this is the big one)

The exam flow is built around a server-created **ExamAttempt**. The frontend must use attempt IDs; it does not invent its own exam-session model. `/student/exams/:id/take` is a **frontend UI route only** — it maps onto these API calls:

| Method | Path | Purpose |
|---|---|---|
| GET | `/student/exams` | list available exams |
| GET | `/student/exams/{exam}` | exam metadata (title, duration, pass mark, language, counts). **No correct answers.** |
| POST | `/student/exams/{exam}/start` | creates an ExamAttempt, returns `attempt.id`, `started_at`, `server_time`, `ends_at`, and questions **without `is_correct`** |
| GET | `/student/exams/{exam}/attempts/{attempt}` | resume: current answers, `server_time`, `ends_at`, status |
| POST | `/student/exams/{exam}/attempts/{attempt}/answers` | save one/many answers (auto-save). Idempotent per question. |
| POST | `/student/exams/{exam}/attempts/{attempt}/submit` | finalize; backend scores |

### Timer authority
- The **server** clock is authoritative. `start` and the resume endpoint both return `server_time` and `ends_at` (absolute timestamps).
- The frontend computes the countdown as `ends_at - server_time`, then ticks locally, and re-syncs on resume. It never trusts the local device clock as the source of truth.
- The backend **rejects or auto-submits** answers/submissions received after `ends_at`, regardless of what the client sends. Late `answers` calls return 422/409 per backend rule.

### Answer secrecy
- Question and option payloads to students **never** include `is_correct` or any correct-answer marker.
- Score is computed only by the backend `ExamScoringService` on `submit`. The frontend never sends or computes a score.

---

## 10. Results visibility

- Students see only `published` results. Unpublished → the student results endpoint omits them (or returns a pending marker); it never returns score data for unpublished results.
- Admin publish/unpublish toggles visibility.

| Method | Path | Auth/Role |
|---|---|---|
| GET | `/student/results` | student, active |
| GET | `/student/results/{result}` | student, active, published only |
| GET | `/admin/results` | admin |
| POST | `/admin/results/{result}/publish` | admin |
| POST | `/admin/results/{result}/unpublish` | admin |

---

## 11. Secure file access

Private files (receipts, materials) are **not** served as public URLs. Download/view goes through an authenticated endpoint, e.g. `GET /student/materials/{material}/download`, which streams the file after checking enrollment + `active` status.

Consequence for the frontend: downloads cannot be plain `<a href>` links to a storage URL. The frontend fetches with the `Authorization` header and turns the response into a blob/object URL (or the backend issues a short-lived signed URL that the download endpoint returns in `data`). Pick one and state it in API_DOCUMENTATION.md — default: **authenticated blob fetch**.

---

## 12. Bilingual / RTL

- Bilingual resources return both language fields (e.g. `title` + `arabic_title`, `description` + `arabic_description`). The API does not pre-select a language; the frontend chooses based on the active i18next locale.
- `language` on courses/exams is one of `english | arabic | both`.
- RTL/LTR is a frontend concern driven by locale; the backend just supplies both fields and the `language` flag.

---

## 13. Notifications

| Method | Path |
|---|---|
| GET | `/notifications` |
| POST | `/notifications/{notification}/read` |
| POST | `/notifications/read-all` |

Standard envelope; list is paginated (§5); each item has at least `id, type, title, body, read_at, created_at`.

---

## 14. Endpoint namespaces (summary)

- `/auth/*` — authentication
- `/public/*` — unauthenticated site content (home, courses, events, hajj-umrah, settings)
- `/student/*` — Bearer + role student + `account_status = active` (except payment/status endpoints, which are reachable while inactive)
- `/admin/*` — Bearer + role admin
- `/notifications/*` — Bearer, any authenticated user
- `/payment/instructions` — Bearer, reachable while inactive

Authorization is enforced by the backend via policies/middleware. Frontend route guards are UX only, never the security boundary.

---

## 15. Things the frontend may assume on day one

So the frontend is not blocked waiting for the backend, it builds against **this contract**. Where the live API isn't ready, it uses a typed mock layer that returns exactly these shapes, behind the same Axios client, and swaps to live calls with no component changes. Mocks are temporary and removed before a feature is called complete (per the frontend prompt's mock-data policy).

---

## 16. Change log

- v1 — initial frozen contract.
