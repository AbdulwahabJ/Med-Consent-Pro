# MedConsent Pro

A premium Arabic-first medical SaaS web app for a dental/medical complex. Manages consent forms, medical reports, PDF templates, doctor-specific templates, patient signatures, document generation, archiving, and secure sharing.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port from $PORT, routes at /api)
- `pnpm --filter @workspace/medconsent-web run dev` — run the frontend (port from $PORT, routes at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — express-session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7, TanStack Query, wouter, shadcn/ui, Tailwind CSS v4, Framer Motion
- API: Express 5 with Pino logging, express-session, helmet, express-rate-limit
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — DB schema (roles, permissions, role_permissions, users, audit_logs, settings)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-zod/src/generated/` — Zod schemas generated from OpenAPI spec
- `lib/api-client-react/src/generated/` — React Query hooks generated from OpenAPI spec
- `artifacts/api-server/src/modules/` — Backend modules (auth, users, roles, dashboard, audit)
- `artifacts/api-server/src/lib/seed.ts` — DB seed script (runs on server startup in dev)
- `artifacts/medconsent-web/src/` — React frontend (Arabic RTL, tablet-optimized)

## Architecture decisions

- **Contract-first API**: OpenAPI spec drives both Zod validation on backend and React Query hooks on frontend. Run codegen after any spec change.
- **Session-based auth**: express-session with PostgreSQL store (not JWT). Session data extended in `types/session.d.ts` to include userId, roleId, roleName, permissions[].
- **Seed on startup**: The seed script runs on every API server startup (idempotent via `ON CONFLICT DO NOTHING`). Safe to leave enabled in dev.
- **Repository/Service/Adapter pattern**: Each module has its own repository (DB queries), service (business logic), and routes (HTTP layer).
- **Arabic-first UI**: All user-facing text is Arabic. RTL enforced at the html element level. Cairo/Tajawal fonts. Medical teal palette.

## Product

- Phase 1 (current): Auth (login/logout/me), user management (CRUD), role/permission system, dashboard summary, audit log display.
- Phases 2–11: Patients, doctors, PDF templates, template field mapping, consent forms, reports, document finalization, archive, secure sharing, settings.

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@medconsent.com | Admin@1234 |
| Admin | admin@medconsent.com | Admin@1234 |
| Doctor | doctor@medconsent.com | Doctor@1234 |
| Reception | reception@medconsent.com | Recept@1234 |
| Nurse | nurse@medconsent.com | Nurse@1234 |

## User preferences

- Arabic-first, fully RTL interface. All UI text in Arabic.
- Tablet-optimized (HONOR Android), touch/stylus friendly. Minimum 44px tap targets.
- Clean, calm, clinical design. Teal/blue medical palette. No emojis in UI.
- Premium production feel — not a generic admin template.
- Phased implementation approach (11 phases total).

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- Seed is idempotent (uses ON CONFLICT DO NOTHING) — safe to restart the server.
- Express 5 uses async error propagation by default — no need for `next(err)` in async routes.
- Google Fonts `@import url(...)` must be the VERY FIRST LINE of `index.css` before `@import "tailwindcss"`.
- Do not run `pnpm dev` at the workspace root — use individual workflow restarts.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Phase implementation checklist approved by user — follow the 11-phase plan
