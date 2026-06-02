---
name: Orval binary upload limitation
description: Orval codegen fails when OpenAPI spec has multipart/form-data with binary file fields
---

When the OpenAPI spec includes a `multipart/form-data` endpoint with a `format: binary` field (file upload), orval generates code referencing `Blob` and `File` types. These don't exist in the lib TypeScript context (Node.js lib without DOM), causing `tsc --build` to fail.

**Why:** The lib packages (`lib/api-zod`, `lib/api-client-react`) compile without DOM types. Browser-only types like `Blob` and `File` are unavailable.

**How to apply:**
- Keep file upload endpoints OUT of the OpenAPI spec entirely.
- In the frontend, call the upload endpoint manually with `fetch` + `FormData` + `credentials: "include"`.
- Only add JSON-returning endpoints (list, get, delete) to the spec for generated hooks.
- Document the upload endpoint in comments or a separate doc if needed.
