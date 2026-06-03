---
name: pdf-lib Arabic font path
description: Why import.meta.url fails for font file resolution after esbuild bundling, and how to fix it.
---

## Rule
Use `path.join(process.cwd(), "src", "assets", "fonts", "FontName.ttf")` to locate font files in the api-server, NOT `new URL("../../assets/fonts/...", import.meta.url).pathname`.

**Why:** esbuild bundles everything into `dist/index.mjs`. At runtime `import.meta.url` points to `dist/index.mjs`, so relative paths like `../../assets/fonts/...` resolve to `artifacts/api-server/assets/fonts/` (non-existent). The font load silently fails and falls back to StandardFonts.Helvetica — which cannot encode Arabic characters (`WinAnsi cannot encode "م"`).

**How to apply:** Server CWD is always `artifacts/api-server/` (set by the workflow). The `src/` directory exists there in development. In production builds, copy font files to a stable path (e.g., `dist/fonts/`) and update FONT_PATH accordingly. For now (dev-only), `process.cwd() + "/src/assets/fonts/"` is reliable.

Also: always pass `{ subset: false }` to `pdfDoc.embedFont()` with fontkit for Arabic to ensure all glyphs are available.
