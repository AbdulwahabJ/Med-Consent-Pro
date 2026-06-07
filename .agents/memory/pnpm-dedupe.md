---
name: pnpm dedupe after package removal
description: Removing packages can create duplicate versions of shared deps causing TypeScript type incompatibility errors.
---

## The Rule
After removing packages from a workspace package (`pnpm remove <pkg>`), run `pnpm dedupe` at the workspace root if TypeScript errors about duplicate private properties appear (e.g. `Types have separate declarations of a private property 'shouldInlineParams'`).

**Why:** pnpm may resolve a package (e.g. `drizzle-orm`) as two separate instances with different peer-dep suffixes (e.g. `drizzle-orm@0.45.2` and `drizzle-orm@0.45.2_@types+pg@8.20.0_pg@8.20.0`) when the lockfile is recalculated after removal. TypeScript treats the two instances as incompatible types.

**How to apply:** Run `pnpm dedupe` from the workspace root. Verify typecheck passes afterward.
