# Mongoose 5 → 7 Migration

## Summary

This document records the upgrade of the homy-commerce server from Mongoose `^5.13.2` to `^7.0.0`.

- **Source version:** `^5.13.2`
- **Target version:** `^7.0.0`
- **Installed version:** `mongoose@7.8.9`

---

## Modified Files

### `package.json`

**Change:** Bumped the `mongoose` dependency version.

| Field | Before | After |
|-------|--------|-------|
| `dependencies.mongoose` | `"^5.13.2"` | `"^7.0.0"` |

No other dependencies were changed.

---

### `server/lib/db.js`

**Change:** Updated the options object passed to `mongoose.connect`.

**Before:**
```js
await mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  strictQuery: false,
});
```

**After:**
```js
await mongoose.connect(process.env.DB_URI, {
  strictQuery: false,
});
```

**Removed options and their Mongoose 5 behaviour:**

| Option | Mongoose 5 behaviour | Mongoose 7 status |
|--------|----------------------|-------------------|
| `useNewUrlParser` | Opted in to the new MongoDB driver URL parser. Without it, Mongoose 5 used a legacy parser that emitted a deprecation warning. | **Unsupported / no-op.** The new URL parser is the only parser in Mongoose 7; the option is not recognised and must not be passed. |
| `useUnifiedTopology` | Opted in to the new Server Discovery and Monitoring engine. Without it, Mongoose 5 used a deprecated connection management layer. | **Unsupported / no-op.** The unified topology is the only topology in Mongoose 7; the option is not recognised and must not be passed. |
| `useFindAndModify` | When `false`, directed `findOneAndUpdate`, `findOneAndDelete`, etc. to use the native `findOneAndUpdate` MongoDB driver command instead of the legacy `findAndModify` command. | **Unsupported / no-op.** Mongoose 7 always uses the native driver commands; the option is removed entirely. |

**Retained option:**

| Option | Value | Purpose |
|--------|-------|---------|
| `strictQuery` | `false` | Preserves Mongoose 5's default behaviour of passing through query fields that are not declared in the schema. In Mongoose 7 this defaults to `true` (fields absent from the schema are silently stripped from query conditions), so setting it explicitly to `false` ensures existing queries continue to work without modification. |

---

### `server/controller/admin.js`

**Change:** Removed the `useFindAndModify` option from the `Product.findOneAndUpdate` call in `admin.updateProduct`.

**Before:**
```js
const product = await Product.findOneAndUpdate(
  { _id: productId },
  updateData,
  { new: true, useFindAndModify: false }
);
```

**After:**
```js
const product = await Product.findOneAndUpdate(
  { _id: productId },
  updateData,
  { new: true }
);
```

**Removed option:**

| Option | Mongoose 5 behaviour | Mongoose 7 status |
|--------|----------------------|-------------------|
| `useFindAndModify` (per-query) | When `false`, instructed Mongoose to use the native `findOneAndUpdate` driver command for this specific call instead of the legacy `findAndModify` command. | **Unsupported / no-op.** Mongoose 7 always uses the native driver command; this per-query option is removed and must not be passed. |

No changes were required for `admin.makeAdmin` — its options object `{ upsert: true, new: true }` contained no deprecated options.

---

## Verification Steps

After applying these changes, follow the steps below to confirm the upgrade is working correctly.

### (a) Dependency resolution

Run `pnpm install` from the project root and confirm the resolved Mongoose version is in the `^7` range:

```sh
pnpm install
```

Check the lock-file entry — it should read:

```
resolved: mongoose@7.8.9
```

You can also verify the installed version directly:

```sh
node -e "console.log(require('mongoose/package.json').version)"
# Expected output: 7.8.9
```

### (b) Server startup — no deprecation warnings

Start the server:

```sh
pnpm run server
# or: nodemon index.js
```

Confirm that:
- The log line `db connection established` appears.
- **No** deprecation warnings mentioning `useNewUrlParser`, `useUnifiedTopology`, or `useFindAndModify` appear in the output.
- The process does not exit with a non-zero code.

### (c) Read and write endpoint smoke tests

**Read endpoint — list products:**

```sh
curl http://localhost:5000/api/products
```

Expected: HTTP `200` with a JSON array of product documents.

**Write endpoint — update a product (admin auth required):**

```sh
curl -X PUT http://localhost:5000/api/admin/product/<productId> \
  -H "Authorization: Bearer <admin-token>" \
  -F "name=Updated Name" \
  -F "price=99.99"
```

Expected: HTTP `201` with a JSON body containing `{ "success": true, "product": { ... } }` where the product fields reflect the update.

Both calls confirming correct responses indicate that the Mongoose 7 upgrade has not broken any query or response logic.
