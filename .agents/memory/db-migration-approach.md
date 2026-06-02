---
name: DB migration approach
description: How to run DB schema migrations in this project (no interactive TTY available).
---

**Rule:** Never use `pnpm --filter @workspace/db run push` — it requires interactive TTY confirmation and hangs in bash.

**How to apply:** Run raw SQL via an inline node script:

```bash
node -e "
const { Pool } = require('./lib/db/node_modules/pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(\`
  -- your SQL here
\`).then(() => { console.log('done'); pool.end(); }).catch(e => { console.error(e.message); pool.end(); process.exit(1); });
"
```

**Why:** The Replit environment doesn't provide an interactive TTY for the drizzle-kit push confirmation prompt.
