# Implementation Plan: Mongoose 7 Upgrade

## Overview

Four discrete changes migrate the server from Mongoose 5 to Mongoose 7: clean up the `mongoose.connect` options object, remove a dead per-call option from the admin controller, bump the version in `package.json` and install, then add a migration tracking document at the project root.

## Tasks

- [x] 1. Update `server/lib/db.js` — replace deprecated connect options
  - [x] 1.1 Remove `useNewUrlParser`, `useUnifiedTopology`, and `useFindAndModify` from the options object passed to `mongoose.connect`
    - Replace the three-key options object with `{ strictQuery: false }`
    - Leave the function signature, error-handling branches, logger calls, and module export unchanged
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [ ]* 1.2 Write unit tests for `db.js` connection behaviour
    - Verify the connect call is invoked with exactly `{ strictQuery: false }`
    - Verify the success path logs `"db connection established"`
    - Verify the non-Vercel error path calls `process.exit(1)`
    - Verify the Vercel error path re-throws without calling `process.exit`
    - _Requirements: 1.3, 1.4, 1.5_

- [x] 2. Update `server/controller/admin.js` — remove dead query option
  - [x] 2.1 Remove `useFindAndModify: false` from the `findOneAndUpdate` options in `admin.updateProduct`
    - Change `{ new: true, useFindAndModify: false }` to `{ new: true }`
    - Leave the filter `{ _id: productId }`, the `updateData` argument, and all surrounding logic unchanged
    - _Requirements: 2.1, 2.2_
  - [ ]* 2.2 Write unit tests for `admin.updateProduct`
    - Verify `Product.findOneAndUpdate` is called with `{ _id: productId }`, the update data, and `{ new: true }` only
    - Verify the response is `{ success: true, product: <updated> }`
    - _Requirements: 2.2_

- [x] 3. Checkpoint — verify source changes compile and existing tests pass
  - Ensure all existing tests pass, ask the user if any questions arise.

- [x] 4. Bump Mongoose version in `package.json` and install
  - [x] 4.1 Change `"mongoose": "^5.13.2"` to `"mongoose": "^7.0.0"` in the `dependencies` field of the root `package.json`
    - Edit only the `mongoose` version string; no other dependencies change
    - _Requirements: 3.1, 3.3_
  - [x] 4.2 Run `pnpm install` at the project root to resolve and install Mongoose 7
    - Confirm the resolved version in `pnpm-lock.yaml` is ≥7.0.0 and <8.0.0
    - _Requirements: 3.2, 3.4_

- [x] 5. Create `MIGRATION.md` at the project root
  - [x] 5.1 Write `MIGRATION.md` documenting the upgrade
    - List `server/lib/db.js`, `server/controller/admin.js`, and `package.json` as modified files
    - For each file, state the specific options removed and the resulting options object or version specifier
    - For each removed option, explain the Mongoose 5 behaviour it enabled and state it is unsupported/a no-op in Mongoose 7
    - Record source version `^5.13.2` and target version `^7.0.0`
    - Include a verification section covering: (a) run `pnpm install` and confirm `^7` in lock-file; (b) start the server and confirm `db connection established` with no deprecation warnings; (c) exercise at least one read and one write endpoint and confirm correct responses
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Final checkpoint — confirm end-to-end correctness
  - Ensure all tests pass, ask the user if any questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster rollout
- Each task references specific requirements for traceability
- The design confirms no schema, model, middleware, or auth changes are needed
- `admin.makeAdmin` and `admin.deliveryOrder` already use correct option sets — no changes required there

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "4.1"] },
    { "id": 2, "tasks": ["4.2"] },
    { "id": 3, "tasks": ["5.1"] }
  ]
}
```
