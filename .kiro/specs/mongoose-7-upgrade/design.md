# Design Document: Mongoose 7 Upgrade

## Overview

This document describes the technical design for migrating the homy-commerce server from Mongoose 5 (`^5.13.2`) to Mongoose 7 (`^7.0.0`). The migration is narrow in scope: the codebase audit confirms that all queries already use `async/await`, `countDocuments()` is used in place of the removed `count()`, and no deprecated schema options are present. The work resolves to four discrete changes across three source files plus a new migration tracking document.

**Mongoose 7 key changes that affect this codebase:**

- `useNewUrlParser`, `useUnifiedTopology`, and `useFindAndModify` connect options are removed — passing them throws or is silently ignored.
- `strictQuery` defaults to `true` in Mongoose 7 (vs. `false` in Mongoose 5). Setting it explicitly to `false` preserves the existing query behaviour where fields absent from the schema are not filtered out of query conditions.
- `findOneAndUpdate` and related methods no longer accept `useFindAndModify` as a per-call option.

No breaking changes apply to the rest of the codebase. Controllers, models, and middleware need no further modification.

---

## Architecture

The server is a standard Express + Mongoose MERN stack application. The relevant topology for this migration is:

```
index.js
  └── server/lib/db.js          ← connects to MongoDB via mongoose.connect()
        └── mongoose (^5 → ^7)

server/controller/admin.js      ← issues findOneAndUpdate queries via Mongoose models
  └── server/models/Product.js
  └── server/models/User.js
  └── server/models/Order.js

package.json                    ← root dependency manifest
MIGRATION.md                    ← new: migration record (project root)
```

There is no connection pooling abstraction, no ODM wrapper, and no Mongoose plugin layer that could be affected. The connection is established once at startup and reused for the lifetime of the process.

---

## Components and Interfaces

### DB_Connector (`server/lib/db.js`)

**Current state:**

```js
await mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});
```

**Target state:**

```js
await mongoose.connect(process.env.DB_URI, {
  strictQuery: false,
});
```

The function signature, export, error-handling branches, and logging calls remain unchanged. The only diff is the options object passed to `mongoose.connect`.

**Interface contract preserved:**
- Accepts an `app` argument and returns it on success (used by the caller in `index.js`).
- Logs `"db connection established"` via the Winston logger on success.
- On error without `VERCEL` env var: logs via logger, calls `process.exit(1)`.
- On error with `VERCEL` env var: logs to `console.error`, re-throws.

### Admin_Controller (`server/controller/admin.js`)

**Current state** — `admin.updateProduct`:

```js
const product = await Product.findOneAndUpdate(
  { _id: productId },
  updateData,
  { new: true, useFindAndModify: false }   // ← dead option in Mongoose 7
);
```

**Target state:**

```js
const product = await Product.findOneAndUpdate(
  { _id: productId },
  updateData,
  { new: true }
);
```

`admin.makeAdmin` already passes `{ upsert: true, new: true }` with no deprecated options — no change required there.

### Dependency Manifest (`package.json`)

| Field | Before | After |
|-------|--------|-------|
| `dependencies.mongoose` | `"^5.13.2"` | `"^7.0.0"` |

No other dependencies change. After editing `package.json`, `pnpm install` must be run to update `pnpm-lock.yaml` and the installed `node_modules`.

### Migration Document (`MIGRATION.md`)

A new file created at the project root. Content requirements are defined in Requirements §4 and detailed in the Testing Strategy section below. The document serves as a durable change record for repository reviewers.

---

## Data Models

No schema or model changes are required. The Mongoose 7 `strictQuery: false` global option is set at connection time, which preserves Mongoose 5's behaviour of passing through query fields that are not declared in the schema — ensuring existing queries continue to work without any model edits.

All three models (`User`, `Product`, `Order`) are unaffected by the upgrade.

---

## Error Handling

The error-handling behaviour in `db.js` is preserved exactly:

| Condition | Behaviour |
|-----------|-----------|
| Successful connect | `logger.info("db connection established")` |
| Connect error, `process.env.VERCEL` not set | `logger.error(err)` → `process.exit(1)` |
| Connect error, `process.env.VERCEL` is set | `console.error(err)` → `throw err` |

The dual-path design exists because Vercel's serverless environment does not support `process.exit()`. This logic is unaffected by the Mongoose version change.

No new error conditions are introduced by the upgrade. Mongoose 7 does not change the shape of connection errors.

---

## Testing Strategy

This migration is a configuration and dead-code-removal change. It does not introduce pure functions, data transformation logic, parsers, or business logic. **Property-based testing is not applicable** — there is no input space to vary, and running the same configuration check 100 times yields no additional coverage over running it once.

The appropriate testing strategy is a combination of smoke tests and integration tests executed manually against a running server instance.

### Smoke Tests (manual, run once post-upgrade)

1. **Dependency resolution** — Run `pnpm install` and confirm the resolved Mongoose version in `pnpm-lock.yaml` is `>=7.0.0 <8.0.0`.
2. **Server startup** — Start the server (`bun run server` or `nodemon index.js`) and confirm the log line `"db connection established"` appears without any deprecation warnings mentioning `useNewUrlParser`, `useUnifiedTopology`, or `useFindAndModify`.
3. **No startup errors** — Confirm the process does not exit with a non-zero code on startup.

### Integration Tests (manual, run once post-upgrade)

4. **Read endpoint** — Call at least one read endpoint (e.g., `GET /api/products`) and confirm a `200` response with correct data.
5. **Write endpoint** — Call at least one write endpoint (e.g., `PUT /api/admin/product/:id`) and confirm the document is updated and the response contains `{ success: true }` with the updated document.
6. **Admin role update** — Call the make-admin endpoint and confirm the user's `roles` array is set to `['admin']`.

### Regression Scope

Because the only code changes are:
- Removing three option keys from one object literal in `db.js`
- Removing one option key from one object literal in `admin.js`
- Bumping a version string in `package.json`

…the risk surface is low. No query logic, response shapes, middleware, or auth flows change. The integration tests above provide sufficient confidence for this change size.
