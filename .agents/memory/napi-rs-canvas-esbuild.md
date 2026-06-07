---
name: napi-rs/canvas esbuild external config
description: How to configure esbuild to not bundle @napi-rs/canvas native packages.
---

## The Rule
When using `@napi-rs/canvas` in an esbuild-bundled Node.js app, add the following to the `external` array in build.mjs — the `"*.node"` glob alone is insufficient:

```js
external: [
  "*.node",
  "@napi-rs/canvas",
  "@napi-rs/canvas-linux-x64-gnu",
  "@napi-rs/*",
  // ...
]
```

**Why:** esbuild tries to follow the `require('@napi-rs/canvas-linux-x64-gnu')` call inside the canvas js-binding, then hits the `.node` binary file and errors. The `"*.node"` pattern only excludes `.node` file imports by path/extension, not the package that contains them. The package name itself must also be externalized.

**How to apply:** Add all three entries (`@napi-rs/canvas`, `@napi-rs/canvas-linux-x64-gnu`, `@napi-rs/*`) to the external array in `artifacts/api-server/build.mjs`.
