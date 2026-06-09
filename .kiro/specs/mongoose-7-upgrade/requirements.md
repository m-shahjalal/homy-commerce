# Requirements Document

## Introduction

This document captures the requirements for migrating the homy-commerce server from Mongoose 5 (`^5.13.2`) to Mongoose 7 (`^7`). The codebase audit shows the migration is relatively clean: all queries already use `async/await`, `countDocuments()` is already in use, and schemas are free of deprecated options. The work is scoped to three source file changes and a dependency bump, with a migration tracking document added at the project root.

## Glossary

- **DB_Connector**: The module at `server/lib/db.js` responsible for establishing the MongoDB connection via Mongoose.
- **Admin_Controller**: The module at `server/controller/admin.js` containing admin-facing Mongoose query operations.
- **Deprecated_Option**: A Mongoose connect or query option that was meaningful in Mongoose 5 but is removed or silently ignored in Mongoose 7.
- **strictQuery**: A Mongoose 7 global option that controls whether fields not in the schema are filtered from query conditions. Setting it to `false` preserves Mongoose 5 behaviour.
- **MIGRATION_DOC**: The `MIGRATION.md` file at the project root that records what changed, why, and how to verify the upgrade.

---

## Requirements

### Requirement 1: Remove deprecated connection options

**User Story:** As a backend developer, I want the Mongoose connection call to use only supported options, so that the server starts without deprecation warnings or runtime errors under Mongoose 7.

#### Acceptance Criteria

1. WHEN the DB_Connector initialises a connection, THE DB_Connector SHALL call `mongoose.connect` with only `{ strictQuery: false }` as the options object.
2. THE DB_Connector SHALL NOT pass `useNewUrlParser`, `useUnifiedTopology`, or `useFindAndModify` to `mongoose.connect`.
3. WHEN the database connection is established successfully, THE DB_Connector SHALL log an informational message confirming the connection.
4. IF `mongoose.connect` throws an error AND the `VERCEL` environment variable is not set, THEN THE DB_Connector SHALL log the error using the logger and exit the process with a non-zero code.
5. IF `mongoose.connect` throws an error AND the `VERCEL` environment variable is set, THEN THE DB_Connector SHALL log the error to `console.error` and re-throw the error without calling `process.exit`.

---

### Requirement 2: Remove deprecated query option from Admin_Controller

**User Story:** As a backend developer, I want to remove dead code from the admin controller, so that the codebase contains no references to Mongoose options that have no effect in Mongoose 7.

#### Acceptance Criteria

1. THE Admin_Controller SHALL NOT pass `useFindAndModify` as an option to any `findOneAndUpdate` call.
2. WHEN `admin.updateProduct` updates a product document, THE Admin_Controller SHALL call `Product.findOneAndUpdate` with the filter `{ _id: productId }`, a raw update data object (without a `$set` wrapper), and options `{ new: true }` only — no other options — and SHALL return the updated document.
3. WHEN `admin.makeAdmin` updates a user document, THE Admin_Controller SHALL call `User.findOneAndUpdate` with the filter `{ email }`, a `$set`-wrapped update object `{ $set: { roles: ['admin'] } }`, and options `{ upsert: true, new: true }` only — no other options.

---

### Requirement 3: Upgrade the Mongoose package dependency

**User Story:** As a backend developer, I want `package.json` to declare Mongoose 7 as the project dependency, so that `npm install` (or equivalent) resolves and installs a Mongoose 7.x release.

#### Acceptance Criteria

1. THE root `package.json` SHALL declare `"mongoose": "^7.0.0"` in the `dependencies` field.
2. WHEN `pnpm install` is run after the version bump, THE installed Mongoose version SHALL be ≥7.0.0 and <8.0.0.
3. THE root `package.json` SHALL NOT retain any `^5.x` or `^6.x` Mongoose version specifier after the upgrade.
4. WHEN `pnpm install` completes, THE lock-file SHALL record a resolved Mongoose version in the `^7` range (≥7.0.0 and <8.0.0).

---

### Requirement 4: Add a migration tracking document

**User Story:** As a team member, I want a migration record at the project root, so that anyone reviewing the repository history can understand what changed, which files were touched, and how to verify the upgrade.

#### Acceptance Criteria

1. THE MIGRATION_DOC SHALL exist at the path `MIGRATION.md` in the project root.
2. THE MIGRATION_DOC SHALL list `server/lib/db.js`, `server/controller/admin.js`, and `package.json` as modified files, and for each SHALL state the specific options removed and the resulting options object or version specifier after the change.
3. THE MIGRATION_DOC SHALL document, for each removed option, which Mongoose 5 behaviour it enabled and explicitly state that it is unsupported or a no-op in Mongoose 7.
4. THE MIGRATION_DOC SHALL include a verification section containing all three of the following steps: (a) run `pnpm install` and confirm the resolved Mongoose version is in the `^7` range; (b) start the server and confirm the `db connection established` log appears without deprecation warnings; (c) exercise at least one read and one write endpoint and confirm correct responses.
5. THE MIGRATION_DOC SHALL record the source version (`^5.13.2`) and the target version (`^7.0.0`) of the Mongoose dependency.
