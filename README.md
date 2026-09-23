# Al-Munirat Academy — Frontend

React + TypeScript frontend for the Al-Munirat Academy Islamic Madrasah LMS. This app is **completely independent** from the Laravel backend — it talks to it only through the documented REST API (see `API_CONTRACT.md` at the repo root). It does not run, embed, or depend on the backend in any way.

## Tech stack

- React 19 + TypeScript (strict)
- Vite 8
- Tailwind CSS v4 + shadcn/ui (Radix primitives)
- React Router v7
- TanStack Query (server state, caching, mutations)
- Axios (centralized API client)
- React Hook Form + Zod (forms & validation)
- i18next / react-i18next (English + Arabic, RTL/LTR)

## Project structure

```
src/
├── api/            Axios client + one module per resource (auth, public, student, admin/*)
├── components/
│   ├── ui/         shadcn primitives (button, input, dialog, table, ...)
│   ├── layout/      Header, footer, dashboard sidebar/topbar, language switcher
│   ├── forms/       Shared form pieces (e.g. ReceiptUploadForm)
│   ├── home/        Landing page sections
│   ├── states/      LoadingState / EmptyState / ErrorState / PermissionDenied / NotFound / QueryState
│   └── common/      MaterialIcon, PageComingSoon
├── layouts/         PublicLayout, AuthLayout, StudentLayout, AdminLayout
├── pages/           public/, auth/, payment/, student/, admin/
├── routes/          ProtectedRoute, RoleRoute, StudentActiveGuard
├── contexts/        AuthContext (Sanctum bearer-token auth, account_status gating)
├── i18n/            i18next setup + en/ar locale files
├── types/           TypeScript types mirroring API_CONTRACT.md
└── lib/             env, authToken storage, queryClient, accountStatus, utils (cn)
```

## Environment variables

The backend base URL is **never hard-coded**. Configure it via `VITE_API_BASE_URL`:

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

- `.env.example` — template, always committed.
- `.env.development` — local dev default (localhost), committed for convenience.
- `.env.production` / `.env.staging` / `.env.*.local` — **gitignored**. Set these in your hosting provider (Vercel/Netlify/Cloudflare Pages env settings) or a local `.env.production.local` file, never commit real API URLs for staging/production.

Copy `.env.example` to `.env.development` (already done) and adjust as needed before running.

## Mock mode

`VITE_USE_MOCKS=true` (set in `.env.development`) runs the entire app against a typed, in-memory mock backend instead of a real API — see API_CONTRACT.md §15. It's implemented as a custom Axios adapter (`src/api/mocks/adapter.ts`) installed on the shared `apiClient` (`src/api/client.ts`) only when the flag is on; every `src/api/**/*.ts` module is unaware of it and calls `apiClient.get/post/...` exactly as it would against the real backend, so flipping the flag to `false` (once `VITE_API_BASE_URL` points at a real server) requires **zero component or API-module changes**.

What it covers: full auth (register/login/me/logout/forgot+reset password), the payment → admin-approval → account-activation loop, public site content, and the student side (courses, materials, assignments, CBT exam attempts with server-authoritative timing and scoring, results, progress, notifications) plus the corresponding admin CRUD screens — all backed by one seeded in-memory "database" (`src/api/mocks/db.ts`) that mutates as you use the app (a page reload resets it). Requests that aren't wired up yet resolve with a `501 "This action isn't wired up in demo mode yet."` instead of silently no-op'ing, so a missing mock is obvious rather than hidden.

**Demo accounts** (any non-empty password is accepted in mock mode — try `Password123!`):

| Email | Role | account_status |
|---|---|---|
| `admin@almunirat.org` | admin | active |
| `student@almunirat.org` | student | active — has courses, an available CBT exam, graded/pending assignments, published results |
| `fatima@almunirat.org` | student | under_review — visible in Admin → Payments for the approve/reject demo |
| `zayd@almunirat.org` | student | payment_rejected — shows the rejection + resubmit flow |
| `yusuf@almunirat.org` | student | receipt_submitted |
| `omar@almunirat.org` | student | pending_payment — register a *new* account to see this state fresh, or sign in as this one |
| `layla@almunirat.org` | student | suspended |

Or register a brand-new account from `/register` to walk the full pending_payment → upload receipt → admin approves → active loop yourself.

**Turning it off**: set `VITE_USE_MOCKS=false` (or delete the line) once `VITE_API_BASE_URL` points at a running backend. Mocks are meant to be temporary scaffolding, not a permanent feature — see `src/api/mocks/` if a piece of it needs to be deleted later.

## Development

```bash
npm install
npm run dev       # starts Vite on http://localhost:5173
```

## Build & preview

```bash
npm run build      # type-checks (tsc -b) then builds to dist/
npm run preview    # serve the production build locally
```

## Authentication model

Laravel Sanctum personal-access tokens (Bearer), **not** cookie/SPA session mode — the two apps are deployed on separate origins. The token is stored in `localStorage` under a single key (`src/lib/authToken.ts`) and attached as `Authorization: Bearer <token>` on every request via the Axios interceptor in `src/api/client.ts`. A 401 anywhere clears the token and redirects to `/login`.

## Account status gating

`account_status` (`pending_payment` → `receipt_submitted`/`under_review` → `active`, or `payment_rejected`, or `suspended`) comes from `GET /auth/me` and is never decided client-side. `StudentActiveGuard` (`src/routes/StudentActiveGuard.tsx`) redirects any non-`active` student away from `/student/*` to `/payment/status`, which renders the matching status screen. This mirrors the backend's state machine — it does not implement approval logic.

## Internationalization / RTL

`src/i18n/index.ts` sets `document.documentElement.dir`/`lang` on language change. Arabic (`ar`) renders RTL end-to-end — shared layout components use logical Tailwind utilities (`ps-`/`pe-`/`ms-`/`me-`/`start-`/`end-`) rather than physical `left`/`right` so the sidebar, forms, and icons mirror correctly, not just the text.

## Mock data policy

No page or component hard-codes fake students/results/payments/exams. The **only** sanctioned source of mock data is the isolated, clearly-labeled mock layer described above (`src/api/mocks/`, gated by `VITE_USE_MOCKS`) — pages and components always go through the real `api/*.ts` modules and never know whether mocks are active. Where a backend endpoint isn't available yet or its exact shape is unconfirmed, that's called out explicitly in the relevant `api/*.ts` module's comments (see `src/api/public.ts`) rather than silently faked.

## Deployment

Static build output (`dist/`) — deployable to Vercel, Netlify, Cloudflare Pages, Nginx, or Apache. No server runtime required. Set `VITE_API_BASE_URL` (and any other `VITE_*` vars) in the hosting provider's environment configuration before building.
