---
name: Consent Portal rebuild
description: Project was fully rebuilt from ERP (MedConsent Pro) to a simple consent portal; records what was removed and the new structure.
---

**Why:** User requested a complete scope simplification — remove roles, permissions, doctors, specialties, branches, dashboard, audit logs. Single user type, no ACL.

**New data model (4 tables total):**
- `users`: id, name, email, password_hash, created_at
- `consent_templates`: (Phase 2)
- `template_fields`: (Phase 3)
- `generated_consents`: (Phase 4)

**Session:** Only `userId` stored in session — no `roleId`, `roleName`, `permissions`.

**Auth endpoints:** login, register, logout, me — all under `/auth/`.

**Removed permanently:** roles, permissions, role_permissions, doctors, patients, branches, specialties, audit_logs, settings tables and all their backend modules and frontend pages.

**Zod note:** Use `zod` (not `zod/v4`) in api-server route validation schemas. Use `zod/v4` in lib/db drizzle-zod schemas.

**How to apply:** When adding new features, follow the 6-phase plan in replit.md. No new roles/permissions/ACL system — all authenticated users have full access.
