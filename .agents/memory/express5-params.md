---
name: Express 5 params typing
description: req.params properties are string | string[] in Express 5 types, not plain string
---

In Express 5, `req.params` is typed so that accessing a property (e.g. `req.params.id`) returns `string | string[]`, not just `string`. This breaks `parseInt()` and any function expecting a plain string.

**Why:** Express 5 changed its generic `ParamsDictionary` type to allow array values, which makes the type stricter than Express 4.

**How to apply:** Always cast when parsing route params in route handlers:
```ts
const id = parseInt(req.params.id as string, 10);
```
Or use `String(req.params.id)` for other cases.
