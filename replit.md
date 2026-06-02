# بوابة الموافقات — Consent Portal

A focused, Arabic-first, RTL, tablet-optimized SaaS for creating, filling, signing, exporting, and archiving medical consent PDF forms. Simple and clean — not an ERP.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port from $PORT, routes at /api)
- `pnpm --filter @workspace/medconsent-web run dev` — run the frontend (port from $PORT, routes at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — express-session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7, TanStack Query, wouter, shadcn/ui, Tailwind CSS v4, Framer Motion
- API: Express 5 with Pino logging, express-session, helmet, express-rate-limit
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4` in lib/db, `zod` (not v4) in api-server routes)
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/users.ts` — users table (id, name, email, password_hash, created_at)
- `lib/db/src/schema/consent-templates.ts` — consent_templates table (id, name, description, fileName, storagePath, fileSize, mimeType, createdBy, createdAt, updatedAt)
- `lib/db/src/schema/template-fields.ts` — template_fields table (id, templateId FK, fieldKey, label, type, pageNumber, xPercent, yPercent, widthPercent, heightPercent, required, timestamps)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-zod/src/generated/` — Zod schemas generated from OpenAPI spec
- `lib/api-client-react/src/generated/` — React Query hooks generated from OpenAPI spec
- `artifacts/api-server/src/modules/auth/` — Auth module (login, register, logout, me)
- `artifacts/api-server/src/modules/templates/` — Templates module (upload, list, get, delete, serve file)
- `artifacts/api-server/src/modules/fields/` — Fields module (list, create, update, delete per-template fields)
- `artifacts/api-server/uploads/templates/` — Local PDF storage (gitignored)
- `artifacts/api-server/src/lib/seed.ts` — DB seed (2 demo users, runs on startup)
- `artifacts/medconsent-web/src/` — React frontend (Arabic RTL, tablet-optimized)

## Architecture decisions

- **Contract-first API**: OpenAPI spec drives both Zod validation on backend and React Query hooks on frontend. Run codegen after any spec change.
- **Session-based auth**: express-session with PostgreSQL store (not JWT). Session only stores `userId`.
- **No roles/permissions**: Single user type. All authenticated users have full access.
- **Seed on startup**: Seed script runs on every API server startup (idempotent). Safe to leave in dev.
- **Arabic-first UI**: All user-facing text is Arabic. RTL enforced at html element level. Teal medical palette.
- **Simple data model**: Only 4 tables needed — users, consent_templates, template_fields, generated_consents.

## Product phases

- **Phase 1 (done)**: Auth (login/register/logout/me), simple home page, authenticated layout, sidebar navigation.
- **Phase 2 (done)**: Consent templates — PDF upload (10MB max, PDF only), list with cards, PDF preview via iframe, delete with confirmation. Local storage at `uploads/templates/`. File served via authenticated `GET /api/templates/:id/file`.
- **Phase 3 (done)**: Visual field mapper — PDF.js rendering with overlay, drag+resize fields as percentage-coordinates, 8 fixed field keys (patient_name, patient_id, patient_phone, procedure_name, doctor_name, consent_date, notes, signature), 3 types (text/date/signature), multi-page navigation, save/persist to DB. Route: `/consent-templates/:templateId/fields`.
- **Phase 4**: New consent flow — select template → fill form → patient signature → generate PDF → success screen.
- **Phase 5**: Previous consents archive + simple patients page.
- **Phase 6**: WhatsApp share, download, print + experimental handwriting-to-text modal.

## Demo credentials

| Email | Password | Name |
|-------|----------|------|
| demo@consent.com | Demo@1234 | أحمد الزهراني |
| sara@consent.com | Demo@1234 | سارة المطيري |

## User preferences

- Arabic-first, fully RTL interface. All UI text in Arabic.
- Tablet-optimized (HONOR Android), touch/stylus friendly. Minimum 44px tap targets.
- Clean, calm, clinical design. Teal/blue medical palette. No emojis in UI.
- Premium production feel — not a generic admin template.
- Simple and focused — NOT an ERP. No dashboard, no roles, no permissions, no analytics.

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- Seed is idempotent (checks if any users exist) — safe to restart the server.
- Express 5 uses async error propagation by default — no need for `next(err)` in async routes.
- Use `zod` (not `zod/v4`) in api-server route validation. Use `zod/v4` in lib/db schema.
- Google Fonts `@import url(...)` must be the VERY FIRST LINE of `index.css` before `@import "tailwindcss"`.
- Do not run `pnpm dev` at the workspace root — use individual workflow restarts.
- DB migration via inline node script using `lib/db/node_modules/pg` Pool (no interactive TTY needed).
- In Express 5 route handlers, `req.params.id` is typed as `string | string[]` — always cast: `req.params.id as string`.
- File upload endpoint (multipart) not in OpenAPI spec (orval can't generate Blob types in lib context). Use manual `fetch` + `FormData` from the frontend.
- `uploads/templates/` is in `.gitignore` on the api-server — uploaded PDFs are not committed.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
- Phase implementation plan: 6 phases, build in order. Each phase builds on the previous.
