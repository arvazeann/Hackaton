# RuangLagi â€” Marketplace Preloved

## Project Overview

MVP marketplace barang preloved berbasis Next.js App Router.

## Tech Stack

Next.js 16.4 + TypeScript, Tailwind CSS, Zod + React Hook Form, PostgreSQL + Prisma, Auth.js Credentials + JWT, bcryptjs, Vitest.

## Current Status

- Current stage: Stage 6 follow-up: Admin Area Phase 2 (implemented; migration applied; automated checks complete; browser checks pending).
- Last completed stage: Stage 6 follow-up: Admin Area Phase 2; B1, B2, and Admin Phases 1–2 extend Stage 6's original scope without renumbering.
- Interim local-disk product image storage is implemented for the single-machine demo. Stage 7 Cloudflare R2 remains proposed and has not started.

## Architecture

- UI and route handlers: `src/app/`, `src/components/`
- Schemas and DTOs: `src/schemas/`, `src/types/`
- Seed fixtures: `src/lib/seed-data.ts` (used by `prisma/seed.ts`, not runtime UI)
- Prisma services: `src/server/services/`
- Domain API routes: `src/app/api/products/`, `src/app/api/orders/`, `src/app/api/favorites/`, `src/app/api/profile/`
- B2 routes: `src/app/store/`, `src/app/notifications/`, `src/app/wishlist/`, `src/app/api/notifications/`
- Authentication: `auth.ts`, `src/lib/auth/`, `src/app/api/auth/`
- Prisma: `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`

## Implemented Features

- Registration validates on the server, normalizes email, handles duplicate-email races, and stores bcrypt hashes.
- Auth.js Credentials verifies credentials against PostgreSQL and uses JWT sessions.
- Session JWT contains the user ID, session version, and standard JWT timing identifiers; session resolution checks the current enabled account and role from PostgreSQL.
- Authenticated pages use server-side session checks and redirect visitors to login with a return path.
- Navigation displays signed-in state and provides Auth.js logout.
- Product listing, detail, seller dashboard, create, update, and archive use Prisma through `src/server/services/products.ts`.
- Product UI maps Prisma category/image relations to the existing DTO shape. Public product DTOs omit seller phone and internal password data.
- Product and order mutations use domain API routes with session-derived identity and Prisma services.
- Product images use authenticated uploads to local disk outside `public/`; UUID filenames are persisted and served through a validated public route. Seed products continue to use existing local SVG assets.
- Order creation, listing, and status actions use Prisma services. Product reservation/sale changes are coupled to order transitions in transactions.
- Favorite listing and mutations use the Prisma `Favorite` relation. Authenticated product DTOs contain database-derived `isFavorited`; visitor favorite buttons are disabled.
- Profile reads and updates use the session user's Prisma record, with explicit editable fields and no `passwordHash` in responses.
- Stage 6 follow-up B1 adds profile bio/avatar, password change, scoped address book and checkout prefill, private seller activation/profile, masked payment account management, buyer/seller aggregate dashboard, and payment snapshot visibility.
- New avatar/logo uploads record the session owner and purpose. Seller payment numbers and complete order payment snapshots are AES-256-GCM encrypted; only masked last-four digits appear in account lists.
- Order confirmation now requires a selected active seller payment account. Existing confirmed/completed orders are not backfilled and show the buyer a neutral contact-seller message.
- Sellers with pending orders and no active payment account see a dashboard banner linking to payment account management. Avatar/logo assignment rejects uploaded keys that do not match the signed-in owner and expected purpose.
- Seeded seller profiles use collision-safe URL slugs and keep province nullable until store profile completion.
- Public stores use a strict allowlist DTO; phone, email, pickup addresses, and payment data are excluded. Store vacation hides listings and blocks new orders while preserving existing order processing.
- In-app order notifications use transactional status updates and owner-scoped access; disabled types are not created. Wishlist reuses the private unique `Favorite` relation and rejects own products.
- Admin Phase 2 adds audited account name and enable/disable actions, active-product edit/archive, pending-order cancellation, and a paginated audit-log view. Disabling revokes sessions with `sessionVersion`; account, product, and order changes share transactions with their audit rows. Cancellation notifications run after commit with bounded retries and respect recipient preferences.
- Warm visual refresh: cream-and-forest color tokens, responsive search/navigation and catalog filters, consistent product cards, and clearer empty/auth/form states across client marketplace pages. Existing service contracts and business rules remain unchanged.
- Desktop-first marketplace refinement: one-row desktop navbar with account disclosure, compact guest actions, seller/account shortcuts, expanded desktop content widths, editorial serif headings, and visible product-condition labels. The seller CTA keeps its existing route and server-side activation requirements.
- Product presentation refinement: shared product cards preserve full product imagery and clarify price, condition, category, location, and seller hierarchy; the catalog uses three or four desktop columns according to viewport width. The homepage highlights the actual newest product from the existing listing query, and detail/store layouts use a tighter editorial composition.
- Product interaction and homepage refinement: product cards and wishlist controls use subtle lift, image and icon transitions, and reduced-motion support. The desktop hero is capped at 1440 px wide, its feature image at 280–340 px high, and category spacing is tighter so product listings appear sooner.

## Important Decisions

- PostgreSQL is the database; Prisma is used for ORM and migrations.
- Auth.js Credentials uses JWT sessions; bcryptjs with cost 12 hashes passwords.
- `passwordHash` is never sent to the client or included in session data.
- Buyers can always view their own shipping data; sellers see phone/address only for `confirmed` or `completed` orders.
- Order cancellation requires a 5â€“500 character reason; cancelled orders require `cancel_reason`.
- `/api/mock` and its client helper were removed after all product, order, favorite, and profile mutations moved to domain routes.
- Product, order, favorite, and profile operations use authenticated database UUIDs directly; no UUID-to-mock-ID mapping is used.
- A new order remains `pending` while its product stays `active`; confirming reserves the product, completing marks it sold, and cancelling a confirmed order restores it to active.
- At most one `pending` or `confirmed` order may exist per product. The service handles unique conflicts without exposing database details.
- Auth.js secret is stored in ignored `.env.local`; never commit or expose it.
- Local disk is an approved interim image store for a single-machine demo; `UPLOAD_DIR` is server-only, defaults to `./storage/uploads`, and is excluded from Git. Cloudflare R2 remains the planned production storage.
- Payment encryption uses server-only `PAYMENT_ENCRYPTION_KEY` (base64, 32 bytes) and must be generated locally using the command in `.env.example`; never commit its value.
- Seller payment accounts are soft-deactivated, limited to three active entries, and do not modify payment snapshots on existing orders. Address/order shipping snapshots are likewise immutable.
- Replaced avatar/logo uploads remain on disk pending orphan cleanup. Uploaded product image ownership is recorded; enforcing PRODUCT-purpose ownership when attaching images remains TODO.
- Notification preferences default to enabled without creating preference rows; disabled types skip notification creation while order status remains visible on the order page.
- Admin changes never modify platform roles, password credentials, product images/ownership, or order snapshots. Audit metadata contains allowlisted field names and state transitions only.

## Verification

### Homepage hero sizing follow-up — 2026-10-13

| Check          | Status  | Command / notes                                                                                                      |
| -------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| Typecheck      | PASS    | `npm run typecheck`                                                                                                  |
| Lint           | PASS    | `npm run lint`                                                                                                       |
| Format check   | PASS    | `npm run format:check`                                                                                               |
| Tests          | PASS    | `npm test` — 161 passed across 32 files; existing Vite CJS deprecation warning                                       |
| Build          | PASS    | `npm run build -- --webpack` in an isolated temporary worktree to avoid sharing `.next` with the active dev process. |
| Browser checks | NOT RUN | No browser runner is available; actual desktop heights and first-product visibility remain pending manual review.    |

No API, service, authentication, schema, migration, or database changes were made. Prisma Client generation and build ran only in the isolated temporary worktree; no database operation was performed.

### Product motion and homepage hero refinement — 2026-10-13

| Check          | Status  | Command / notes                                                                                                      |
| -------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| Typecheck      | PASS    | `npm run typecheck`                                                                                                  |
| Lint           | PASS    | `npm run lint`                                                                                                       |
| Format check   | PASS    | `npm run format:check`                                                                                               |
| Tests          | PASS    | `npm test` — 161 passed across 32 files; existing Vite CJS deprecation warning                                       |
| Build          | PASS    | `npm run build -- --webpack` in an isolated temporary worktree to avoid sharing `.next` with the active dev process. |
| Browser checks | NOT RUN | No browser runner is available; actual desktop render and reduced-motion behavior remain pending manual review.      |

No service, API, database, or business logic changes were made. Prisma Client generation and build ran only in the isolated temporary worktree; no database operation was performed.

### Product presentation refinement — 2026-10-13

| Check          | Status  | Command / notes                                                                                                                 |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck      | PASS    | `npm run typecheck`                                                                                                             |
| Lint           | PASS    | `npm run lint`                                                                                                                  |
| Format check   | PASS    | `npm run format:check`                                                                                                          |
| Tests          | PASS    | `npm test` — 161 passed across 32 files; existing Vite CJS deprecation warning                                                  |
| Build          | PASS    | `npm run build -- --webpack` in an isolated temporary worktree; the active dev process and project `.next` were left untouched. |
| Browser checks | NOT RUN | No browser runner is available; responsive classes were reviewed in source, but 1280/1440/1920 px render checks remain pending. |

No service, API, authentication, schema, migration, or database changes were made. Prisma Client generation and build ran only in the isolated temporary worktree; no database operation was performed.

### Desktop-first marketplace refinement — 2026-10-13

| Check          | Status  | Command / notes                                                                                                                                            |
| -------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck      | PASS    | `npm run typecheck`                                                                                                                                        |
| Lint           | PASS    | `npm run lint`                                                                                                                                             |
| Format check   | PASS    | `npm run format:check`                                                                                                                                     |
| Tests          | PASS    | `npm test` — 161 passed across 32 files; existing Vite CJS deprecation warning                                                                             |
| Build          | FAIL    | `npm run build` fails with `EPERM unlink` for `.next/build/chunks/node_modules_20v-8wlfss9m1._.js` while the existing Next.js dev process is left running. |
| Browser checks | NOT RUN | Browser automation is unavailable; source breakpoints were reviewed, but desktop widths were not rendered.                                                 |

No API, service, authentication, schema, migration, or database changes were made.

### UI/UX refresh — 2026-10-13

| Check                 | Status  | Command / notes                                                                                                                                                                                       |
| --------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck             | PASS    | `npm run typecheck`                                                                                                                                                                                   |
| Lint                  | PASS    | `npm run lint`                                                                                                                                                                                        |
| Format check          | PASS    | `npm run format:check`                                                                                                                                                                                |
| Tests                 | PASS    | `npm test` — 161 passed across 32 files; existing Vite CJS deprecation warning                                                                                                                        |
| Build                 | FAIL    | `npm run build` three times; all attempts stopped with `EPERM unlink` under `.next/build/chunks`. A Next.js dev process is running and shares the generated `.next` directory. It was left untouched. |
| Prisma validation     | PASS    | `npm run db:validate`                                                                                                                                                                                 |
| Migration status      | PASS    | `npm run db:status` — all 12 migrations current on `preloved_dev`; no migration was created or run.                                                                                                   |
| Manual browser checks | NOT RUN | No browser runner is available in this session. Desktop and mobile visual review remains pending.                                                                                                     |

No database writes, resets, or seeds were performed for this UI refresh.

Date: 2026-10-13 (Asia/Jakarta). Stage 6 follow-up B1 verification is recorded below; earlier stage audit records are retained.

### Stage 6 follow-up: B1 — Profile Hub Core (2026-10-13)

| Check                 | Status  | Command / notes                                                                                                                    |
| --------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck             | PASS    | `npm run typecheck`                                                                                                                |
| Lint                  | PASS    | `npm run lint`                                                                                                                     |
| Format check          | PASS    | `npx prettier --check` on the four requested files and changed TS/TSX files; whole-repository check not rerun                      |
| Tests                 | PASS    | `npm test` — 107 passed across 24 files, including password-change, address-snapshot, uploader ownership, and empty-state coverage |
| Build                 | PASS    | `npm run build` — passed on 2026-10-13 after the user cleared the generated `.next` directory; build ran without a dev server.     |
| Manual browser checks | NOT RUN | Browser runner unavailable; checklist is in Handoff Notes                                                                          |

Migration verification: PASS. `preloved_migration_test` applied all 9 migrations from empty and Prisma 7.10 `migrate diff --from-migrations ... --to-schema ... --exit-code` reported “No difference detected” using an isolated shadow database. `preloved_migration_backfill_test` was built at the 8-migration pre-B1 state with synthetic sellers (including duplicate/reserved names and a seller without products) and pending/confirmed orders; after B1, profile backfill, nullable province, slug suffixes, no-product exclusion, and null legacy payment snapshots matched expectations. Direct SQL confirmed one default address per kind and the three-active-account trigger, including replacing a soft-deactivated account. All three temporary databases were dropped. B1 was then deployed with `prisma migrate deploy` to `preloved_dev`; `npm run db:status` reports all 9 migrations current and `npm run db:validate` passes. No reset, db push, or seed was run on `preloved_dev`.

`npx prettier --write` was limited to `AGENTS.md`, `docs/BLUEPRINT.md`, `README.md`, `src/instrumentation.ts`, and the changed B1 TS/TSX files. `src/instrumentation.ts` formatting diff: 1 file, 2 insertions and 3 deletions (line-wrap only). Vitest emits the existing Vite CJS Node API deprecation warning.

### Stage 6 follow-up: B2 — Public Stores, Notifications, Wishlist, and Vacation Mode (2026-10-13)

| Check                 | Status  | Command / notes                                                                                                                                                                  |
| --------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck             | PASS    | `npm run typecheck`                                                                                                                                                              |
| Lint                  | PASS    | `npm run lint`                                                                                                                                                                   |
| Format check          | PASS    | `npm run format:check`                                                                                                                                                           |
| Tests                 | PASS    | `npm test` — 122 passed across 26 files                                                                                                                                          |
| Build                 | NOT RUN | Automatic filesystem review rejected clearing the generated `.next` directory; per the existing Windows EPERM condition, build was not run. No Next.js dev process was detected. |
| Manual browser checks | NOT RUN | No browser session used; two-account checklist is in Handoff Notes                                                                                                               |

Migration verification: PASS. `preloved_b2_full_verify_20261013` applied all 10 migrations from an empty database. Prisma 7.10 `migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --exit-code` reported “No difference detected” using `preloved_b2_shadow_verify_20261013`. A separate database at the pre-B2 migration state received a synthetic existing seller; applying B2 left `isOnVacation=false` and created no per-user notification preference rows. All three temporary databases were dropped. The B2 migration was then applied with `npm run db:migrate` to `preloved_dev`; `npm run db:status` reports all 10 migrations current and `npm run db:validate` passes. No reset, db push, or seed was run on `preloved_dev`.

`SHADOW_DATABASE_URL` is an optional Prisma config value used for the Prisma 7.10 migration drift check; it is not required for normal migration commands. Vitest reports the existing Vite CJS Node API deprecation warning.

### Stage 6 follow-up: Admin Area Phase 1 (2026-10-13)

| Check                 | Status  | Command / notes                                                                                                             |
| --------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| Typecheck             | PASS    | `npm run typecheck`                                                                                                         |
| Lint                  | PASS    | `npm run lint`                                                                                                              |
| Format check          | PASS    | `npm run format:check`                                                                                                      |
| Tests                 | PASS    | `npm test` — 144 passed across 30 files, including admin auth, bootstrap, audit, DTO privacy, pagination, and order privacy |
| Build                 | PASS    | `npm run build` — completed alone with no dev server running                                                                |
| Manual browser checks | NOT RUN | Browser runner unavailable; checklist is in Handoff Notes                                                                   |

Migration verification: PASS. The full 11-migration chain applied to `preloved_admin_verify_20261013`; Prisma 7.10 drift check reported “No difference detected” using `preloved_admin_shadow_verify_20261013`. A pre-Admin database with a synthetic existing user applied the Admin migration and retained the expected USER role, null activity timestamps, and no audit rows. The Admin migration was deployed to `preloved_dev` with `prisma migrate deploy`; the latest `npm run db:status` reports 11 migrations and “Database schema is up to date.” No reset, db push, or seed was run against `preloved_dev`.

Cleanup note: automatic command review rejected the requested temporary-database drop operation. `preloved_admin_verify_20261013`, `preloved_admin_shadow_verify_20261013`, and `preloved_admin_preverify_20261013` remain; the first two contain only verification schema state and the last contains one synthetic user. Remove them manually when convenient. Vitest reports the existing Vite CJS Node API deprecation warning.

### Stage 6 follow-up: Admin Area Phase 2 (2026-10-13)

| Check                 | Status  | Command / notes                                                           |
| --------------------- | ------- | ------------------------------------------------------------------------- |
| Typecheck             | PASS    | `npm run typecheck`                                                       |
| Lint                  | PASS    | `npm run lint`                                                            |
| Format check          | PASS    | `npm run format:check`                                                    |
| Tests                 | PASS    | `npm test` — 161 passed across 32 files                                   |
| Build                 | PASS    | `npm run build`                                                           |
| Prisma validation     | PASS    | `npm run db:validate`                                                     |
| Migration status      | PASS    | `npm run db:status` — Phase 2 migration applied; full chain current       |
| Manual browser checks | NOT RUN | No browser runner/session available; see Admin checklist in Handoff Notes |

Migration `20261013150000_admin_area_phase2` was applied to `preloved_dev` using `npm run db:migrate`. No reset, seed, or destructive database operation was run. Vitest reports the existing Vite CJS Node API deprecation warning. Automated tests use Prisma mocks; no isolated PostgreSQL concurrency/rollback integration run was available in this task.

Date: 2026-10-13 (Asia/Jakarta). Stage 6 verification.

| Check                 | Status  | Command / notes                                 |
| --------------------- | ------- | ----------------------------------------------- |
| Typecheck             | PASS    | `npm run typecheck`                             |
| Lint                  | PASS    | `npm run lint`                                  |
| Format check          | PASS    | `npx prettier --check` on Stage 6 changed files |
| Tests                 | PASS    | `npm test` — 57 tests passed                    |
| Build                 | PASS    | `npm run build`                                 |
| Manual browser checks | NOT RUN | Browser flow not exercised                      |

Prisma validation PASS (`npm run db:validate`); read-only migration status PASS (`npm run db:status`, 8 migrations applied). Database integration tests and seed execution are NOT RUN: no isolated test database is configured, and seeding would write to the development database. No database data was changed. Vitest reports the existing Vite CJS Node API deprecation warning.

### Local-disk product image storage — 2026-10-13

| Check                 | Status  | Command / notes                                                                                          |
| --------------------- | ------- | -------------------------------------------------------------------------------------------------------- |
| Typecheck             | PASS    | `npm run typecheck`                                                                                      |
| Lint                  | PASS    | `npm run lint`                                                                                           |
| Format check          | FAIL    | `npm run format:check` flags `AGENTS.md`, `docs/BLUEPRINT.md`, and `README.md`; scoped source check PASS |
| Tests                 | PASS    | `npm test` — 80 tests passed                                                                             |
| Build                 | PASS    | `npm run build`                                                                                          |
| Manual browser checks | NOT RUN | Browser flow and restart persistence not exercised                                                       |

Build completed without warnings after adding a Turbopack ignore annotation for the runtime-configured upload directory. Test coverage includes image magic bytes, MIME-independent validation, 5 MB boundary, filename/path validation, upload authentication, public serving headers, strict image-key schema, missing-file rejection, DTO URL mapping, and edit cleanup. No schema, migration, dependency, or database data changes were made.

### Stage 6 - Full Migration from Mock to Prisma (2026-10-13)

- Favorite and profile read/write operations now use Prisma services and the authenticated session UUID. Profile updates use an explicit field allowlist; public product DTOs still omit seller phone and all profile DTOs omit `passwordHash`.
- Product list/detail DTO favorite state comes from the database for signed-in viewers. Favorite buttons are disabled for visitors.
- Product, order, favorite, and profile mutations use separate domain routes. `/api/mock`, `postMock`, the old mock data accessor, and in-memory mock store were removed.
- Seed fixtures remain in `src/lib/seed-data.ts` and are still imported by `prisma/seed.ts`; seed was not executed.
- Tests cover favorite/profile services and routes, UUID/session scoping, DTO privacy, input validation, product/order route delegation, existing order state machine, and product favorite status.
- Checks run: `npm run typecheck`, `npm run lint`, `npm test` (57 passed), `npm run build`, scoped Prettier check, `npm run db:validate`, and read-only `npm run db:status` (8 migrations applied). Browser checks and isolated database integration tests were not run.

### Local-disk product image storage (2026-10-13)

- Added an authenticated multipart upload endpoint, local storage adapter, and public file-serving route. The server validates JPEG/PNG/WebP signatures and size, uses UUID filenames, and keeps the configured directory outside `public/`.
- Product create/update schemas accept generated filenames (and the existing fixed seed SVG paths); services verify files exist, store filename keys, map them to `/uploads/<filename>` DTO paths, and remove no-longer-referenced local files after a successful edit.
- The uploader previews immediately, tracks upload/error/retry state, blocks submission during active uploads, supports remove/re-add, and revokes object URLs on removal/unmount.
- `UPLOAD_DIR` defaults to `./storage/uploads`; `storage/` is ignored by Git. No Prisma schema/migration change was necessary. R2 remains Stage 7 and is not implemented.
- Checks: typecheck PASS, lint PASS, tests PASS (80), build PASS, browser checks NOT RUN. `npx prettier --check` passes for changed source files. The full repository format check fails on existing broad Markdown formatting in `AGENTS.md`, `docs/BLUEPRINT.md`, and `README.md`; those files were not globally reformatted.

### Stage 5 - Order Services, State Machine, and Privacy Enforcement (2026-10-13)

- Orders are created from database product facts and the authenticated session UUID. Shipping inputs are normalized; new orders start `pending` and do not reserve the product.
- Seller confirmation reserves an active product; seller completion marks it sold; cancellation of a confirmed order restores it to active. Order and product updates use a Prisma transaction with guarded status writes.
- Order reads return only participant data. Buyers retain their shipping information; sellers receive phone/address only for `confirmed` and `completed` statuses.
- Tests cover creation validation and ownership, all allowed and forbidden transitions, cancel reason bounds and trimming, participant access, all five privacy states, list DTOs, rollback on a lost status race, and unique-conflict handling.
- At the end of Stage 5, `/api/mock` delegated product and order actions to Prisma; favorite and profile still used mock data. Stage 6 below records their migration and removal of the route.
- Checks run: `npm run typecheck`, `npm run lint`, `npm test` (43 passed), `npm run build`, scoped Prettier check, `npm run db:validate`, and read-only `npm run db:status` (8 migrations applied). Build passed with a `pg` concurrent query deprecation warning; Vitest reports the existing Vite CJS deprecation warning. Browser checks and isolated database integration/concurrency checks were not run.

### Stage 4 — Product Backend with Prisma (2026-10-13)

- Product listing/search/filter/sort/pagination, detail, seller dashboard, create, update, and archive now use Prisma.
- The registered session UUID is the product seller identity; ownership is checked in the service for updates and archive.
- Product screens use seeded Prisma categories and map category/image relations to existing UI DTOs. Public DTOs exclude seller phone and `passwordHash`.
- At the end of Stage 4, product writes passed through `/api/mock`; the Stage 5 and Stage 6 sections record subsequent migrations.
- Product image rows currently reference the existing local SVG assets. Selected local file previews are not uploaded or persisted; real image storage is Stage 7.
- Service/API tests cover create validation, listing filters/pagination/active-only query, DTO privacy and mapping, owner checks, unauthenticated mutation rejection, and archive behavior.
- Checks run for this stage: typecheck, lint, full test suite (29 passed), build, scoped Prettier check, `npm run db:validate`, and read-only `npm run db:status` (8 migrations applied). Vitest emits the existing Vite CJS deprecation warning; build emits a `pg` warning about concurrent `client.query()` calls. Browser checks were not run.

## Audit — Stage 3 (2026-10-13)

**Status: PASS WITH ISSUES.** Registration, credential verification, session projection, logout delegation, and protected-route redirects pass unit tests. Auth was not exercised in a browser. Unit-tested auth paths are wired for demonstration, but the marketplace seller flow is not end-to-end usable with registered accounts.

### Findings

- **P2 — RESOLVED in Stage 6:** Authenticated UUIDs previously did not match mock marketplace IDs for product, order, favorite, and profile flows. All four domains now use Prisma and session UUIDs; no temporary mapping was added.
- **P3 — RESOLVED in limited follow-up (2026-10-13): whitespace-only names passed registration validation.** Files: `src/schemas/index.ts`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/register/route.test.ts`. The schema now trims the name before checking the minimum length, and the route stores the parsed trimmed name. Tests cover a valid name, surrounding spaces, whitespace-only input, and endpoint rejection.

### Audit Checks

| Check             | Status  | Result                                                                            |
| ----------------- | ------- | --------------------------------------------------------------------------------- |
| Typecheck         | PASS    | `npm run typecheck`                                                               |
| Lint              | PASS    | `npm run lint`                                                                    |
| Tests             | PASS    | `npm test` — 20 tests passed; Vitest emits a Vite CJS deprecation warning         |
| Build             | PASS    | `npm run build`                                                                   |
| Prisma validation | PASS    | `npm run db:validate`                                                             |
| Migration status  | PASS    | `npm run db:status` — 8 migrations applied to `preloved_dev`                      |
| Format check      | FAIL    | `npm run format:check` — existing findings in `AGENTS.md` and `docs/BLUEPRINT.md` |
| Browser testing   | NOT RUN | No browser runner was available in this audit                                     |

### Limited Follow-up

- Fixed the P3 name-validation finding without changing Auth.js, session, database schema, migrations, or dependencies.
- Stage 4 resolved the UUID/mock mismatch for product operations; Stage 5 resolved it for order operations; Stage 6 resolved it for favorite/profile. No temporary mapping was added.
- Follow-up checks: `npm run typecheck` PASS; `npm run lint` PASS; `npm test` PASS (22 tests). Build and browser checks were not run for this limited change.

### Manual Scenarios

- Register a valid account, log out, sign in, and confirm the navbar updates after each transition.
- Open a protected route while signed out; confirm redirect to login and return to that route after sign-in.
- Try duplicate email, invalid email/password, and a whitespace-only name.
- As a registered account, verify product creation and dashboard ownership; then try an order and seller order processing. Product operations now use Prisma, but order operations still use incompatible mock IDs and are expected to fail until their integration stage.
- After logout, revisit a protected route and confirm it redirects again.

### Recommendations

- **Resolved in Stage 6 (P2):** favorite and profile flows now use Prisma UUIDs. Do not reintroduce fixture-ID mappings.
- **Prototype:** email verification, password reset, and login rate limiting remain deferred per current scope.
- **Optional:** add an Auth.js handler integration test for real cookie creation/clearing and JWT callback serialization; current tests cover the credentials helper, projection, redirect helper, registration route, and logout action wrapper, but not a browser session.

### Authentication Bug Fix — 2026-10-13

- The login form now catches Auth.js request failures and distinguishes a generic service failure from invalid credentials. Registration reports separately when account creation succeeded but automatic sign-in did not.
- Credential lookup failures are no longer converted to `null` by `authorize`; Auth.js handles the service error while the UI avoids exposing internal details.
- Follow-up from browser logs: login and registration were submitted as native `GET` requests when client-side handling was unavailable, placing form fields in the URL. Both forms use `method="post"` as a credential-safe fallback. `NEXT_ALLOWED_DEV_ORIGIN` is an optional per-developer setting for LAN development; local `localhost` use needs no extra setting. Restart `npm run dev` after changing it.
- Read-only database diagnosis on `preloved_dev`: `users` exists with 3 accounts; emails are normalized and unique, required identity fields are non-empty, and all 3 password values match bcrypt hash format. The email from the reported form submission is absent. The logged `GET /register?...` never reached the registration `POST` handler, which explains the missing account and subsequent login failure. The LAN origin setting is now present only in this workstation's ignored `.env.local`; no IP is hard-coded in shared source.
- Verification: `npm run typecheck` PASS; `npm run lint` PASS; `npm test` PASS (61 tests); `npm run build` PASS; scoped `npx prettier --check` PASS; `npm run db:validate` PASS; read-only `npm run db:status` PASS (8 migrations current). Browser register → logout → login was NOT RUN, and no account was written to the development database.

## Known Issues and TODO

- B1 migration `20261013090000_profile_hub_b1` is applied to `preloved_dev`. Backfilled sellers with existing products have private seller profiles; province remains null until profile completion.
- App startup now requires a valid `PAYMENT_ENCRYPTION_KEY`. Generate one locally using the `.env.example` command and add it to ignored `.env.local` before `npm run dev` or production startup.
- Files uploaded and then replaced as an avatar/logo remain on disk; orphan cleanup is TODO. Product upload records are written, but validating PRODUCT-purpose ownership when attaching keys is TODO.
- Existing confirmed/completed orders intentionally have no payment snapshot. Buyers see “Contact the seller for payment details”; sellers must provide payment details outside this feature for those in-flight orders.
- B2 implementation is complete; its own browser checks remain pending as recorded above.
- Browser scenarios remain NOT RUN; the manual checklist is below. Migration and SQL constraint checks ran only on isolated temporary databases, which were dropped after verification.
- Historical Stage 3 audit scenarios below describe the behavior at that audit date; the P2 UUID mismatch was resolved by the Stage 4–6 Prisma migrations.
- **Image storage limitation:** local uploads persist only on the machine running the app and are unsuitable for multi-instance/production hosting. Cloudflare R2 remains planned for Stage 7. Files uploaded from abandoned forms can remain unreferenced; a cleanup script is a TODO.
- Manual image browser checks (single/multiple selection, remove/re-add, detail/list/home display, server restart persistence, traversal and invalid-upload cases) remain NOT RUN.
- Email verification and password reset are out of MVP scope per the Stage 3 brief.
- Registration/login rate limiting remains a pre-launch TODO from the Blueprint.
- `npm install` reported 15 dependency vulnerabilities (3 moderate, 10 high, 2 critical); review with a separate dependency-audit task before release.
- Vitest reports the existing Vite CJS Node API deprecation warning.

## Next Approved Step

No further implementation step is approved. Admin Area Phase 1 and Stage 6 follow-ups B1/B2 are implemented; Stage 7 Cloudflare R2 has not started.

## Handoff Notes

- Key files: `src/server/services/` (products, orders, favorites, notifications, profile-hub), `src/server/security/payment-encryption.ts`, `src/components/profile/profile-hub.tsx`, `src/app/store/[slug]/`, `src/app/notifications/`, `src/app/wishlist/`, notification/profile API routes, and the B1/B2 Prisma migrations/schema.
- Keep Auth.js on JWT sessions, preserve bcrypt password hashes, and never add `passwordHash` to DTO/session responses.
- Stage 6 domain routes and Prisma services handle all runtime marketplace reads and writes. `/api/mock`, `postMock`, and mock runtime accessors are removed; seed fixtures are intentionally retained separately.
- Run typecheck, lint, tests, build, and read-only DB validation after relevant changes; browser checks are still pending.
- Set `UPLOAD_DIR` only in the server environment if changing the default; keep it outside `public/`. Do not commit `storage/uploads`. Local disk is interim; R2 work remains a separate approved stage.
- Set `PAYMENT_ENCRYPTION_KEY` to a generated base64-encoded 32-byte value before starting the server. Keep the key backed up and private; losing it makes encrypted payment data unreadable. Ciphertext carries the `v1` prefix for key-versioning.
- Manual browser checklist (NOT RUN): verify `/profile` loads for a seller and a plain buyer; activate a store; add and soft-delete payment accounts and verify the three-active limit; add addresses and verify the default rule; change a password; upload an avatar; verify the seller dashboard banner without an account; confirm an order with and without an account; verify the buyer sees payment instructions only after confirmation; verify old confirmed orders show “Contact the seller for payment details”; sign in as a second user and verify they cannot open the first user's addresses or payment accounts. Also try assigning another user's uploaded key and a wrong-purpose key to avatar/logo; upload matching AVATAR/LOGO keys; replace avatar/logo and confirm prior files remain available.
- B1 and B2 are Stage 6 follow-ups; no stage numbers changed. Keep public store DTOs allowlisted and notification messages free of contact/payment data.
- B1, B2, and Admin migrations are applied to `preloved_dev`; do not reset, db push, or seed that database without separate approval.
- Admin migrations `20261013140000_admin_area` and `20261013150000_admin_area_phase2` are applied to `preloved_dev`; latest status is up to date. Three isolated Admin verification databases remain because automated command review rejected their deletion: `preloved_admin_verify_20261013`, `preloved_admin_shadow_verify_20261013`, and `preloved_admin_preverify_20261013` (the latter has one synthetic user).
- Admin browser checklist (NOT RUN; use an admin and a regular account): verify anonymous and USER access are denied on every admin page/API; ADMIN dashboard, filters and 12/48 pagination; emails masked until explicit audited reveal; address summaries remain masked; order lists disclose no contact/payment data; each service and route rejects non-admin calls; bootstrap promotes only a pre-existing account and reruns safely. Confirm no admin UI mutation controls are present.
- Admin Phase 2 browser checklist (NOT RUN; use an enabled ADMIN, a second ADMIN, and a regular account): verify name edits and role/password fields are rejected; disable blocks a user's next request and login, and the old session remains invalid after re-enable; self-disable and disabling the last enabled ADMIN are rejected; active products edit/archive only without pending/confirmed orders and keep images/ownership/order snapshots; only pending orders cancel with a 5–500 character reason, without changing product/payment/shipping snapshots; both recipients honor notification preferences; retries do not duplicate notifications; audit rows omit personal values and cancellation reason.
- B2 manual browser checklist (NOT RUN; use two accounts): open a public store without login and verify its safe fields/products and unknown-slug 404; turn vacation mode on and confirm the seller disappears from home/listing while its store/direct product remain visible, new orders are blocked, and existing orders can still be processed; exercise notification bell/count, every order notification, disabled/enabled preferences, mark-one/read-all, and verify disabled types create no notification while order status remains visible; save products to the private wishlist and confirm reserved/sold labels and disabled order actions; attempt to favorite one's own product; as the second account, try direct access to the first user's wishlist and notifications.
