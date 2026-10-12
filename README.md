# RuangLagi â€” Marketplace Preloved

## Project Overview

MVP marketplace barang preloved berbasis Next.js App Router.

## Tech Stack

Next.js 16.4 + TypeScript, Tailwind CSS, Zod + React Hook Form, PostgreSQL + Prisma, Auth.js Credentials + JWT, bcryptjs, Vitest.

## Current Status

- Current stage: Stage 6 follow-up: B1 — Profile Hub Core (implemented; database migration and browser/database verification pending).
- Last completed stage: Stage 6 — Full Migration from Mock to Prisma; B1 extends its original scope without renumbering.
- Interim local-disk product image storage is implemented for the single-machine demo. Stage 7 Cloudflare R2 remains proposed and has not started.

## Architecture

- UI and route handlers: `src/app/`, `src/components/`
- Schemas and DTOs: `src/schemas/`, `src/types/`
- Seed fixtures: `src/lib/seed-data.ts` (used by `prisma/seed.ts`, not runtime UI)
- Prisma services: `src/server/services/`
- Domain API routes: `src/app/api/products/`, `src/app/api/orders/`, `src/app/api/favorites/`, `src/app/api/profile/`
- Authentication: `auth.ts`, `src/lib/auth/`, `src/app/api/auth/`
- Prisma: `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`

## Implemented Features

- Registration validates on the server, normalizes email, handles duplicate-email races, and stores bcrypt hashes.
- Auth.js Credentials verifies credentials against PostgreSQL and uses JWT sessions.
- Session JWT contains the user ID and standard JWT timing identifiers; the session query only selects user ID, name, and email.
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

## Verification

Date: 2026-10-13 (Asia/Jakarta). Stage 6 follow-up B1 verification is recorded below; earlier stage audit records are retained.

### Stage 6 follow-up: B1 — Profile Hub Core (2026-10-13)

| Check | Status | Command / notes |
| --- | --- | --- |
| Typecheck | PASS | `npm run typecheck` |
| Lint | PASS | `npm run lint` |
| Format check | FAIL | `npm run format:check` flags `AGENTS.md`, `docs/BLUEPRINT.md`, `README.md`, and `src/instrumentation.ts`; changed source files pass scoped Prettier check |
| Tests | PASS | `npm test` — 104 passed across 23 files; includes foreign-owner/wrong-purpose avatar and logo assignment checks |
| Build | PASS | `npm run build` |
| Manual browser checks | NOT RUN | No browser runner used; checklist is in Handoff Notes |

`npm run db:validate` PASS and `npm run db:generate` PASS in the earlier B1 verification. The migration has not been applied; database migration status and database integration checks are pending. No seed or database writes were run. Vitest emits the existing Vite CJS Node API deprecation warning.

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

| Check                 | Status  | Command / notes |
| --------------------- | ------- | --------------- |
| Typecheck             | PASS    | `npm run typecheck` |
| Lint                  | PASS    | `npm run lint` |
| Format check          | FAIL    | `npm run format:check` flags `AGENTS.md`, `docs/BLUEPRINT.md`, and `README.md`; scoped source check PASS |
| Tests                 | PASS    | `npm test` — 80 tests passed |
| Build                 | PASS    | `npm run build` |
| Manual browser checks | NOT RUN | Browser flow and restart persistence not exercised |

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

- Stage 6 follow-up B1 migration `20261013090000_profile_hub_b1` is prepared but NOT applied. Backfill will create private seller profiles for users with existing products; province remains null until they complete the store profile. Apply only through the normal migration deployment workflow after review/backup.
- App startup now requires a valid `PAYMENT_ENCRYPTION_KEY`. Generate one locally using the `.env.example` command and add it to ignored `.env.local` before `npm run dev` or production startup.
- Files uploaded and then replaced as an avatar/logo remain on disk; orphan cleanup is TODO. Product upload records are written, but validating PRODUCT-purpose ownership when attaching keys is TODO.
- Existing confirmed/completed orders intentionally have no payment snapshot. Buyers see “Contact the seller for payment details”; sellers must provide payment details outside this feature for those in-flight orders.
- Public store page, notifications, wishlist, and vacation mode are B2 and were not started. Admin work was not started.
- Browser scenarios and database-backed integration tests for profile/address/payment/order snapshots are NOT RUN; no isolated test database is configured.
- Historical Stage 3 audit scenarios below describe the behavior at that audit date; the P2 UUID mismatch was resolved by the Stage 4–6 Prisma migrations.
- **Image storage limitation:** local uploads persist only on the machine running the app and are unsuitable for multi-instance/production hosting. Cloudflare R2 remains planned for Stage 7. Files uploaded from abandoned forms can remain unreferenced; a cleanup script is a TODO.
- Manual image browser checks (single/multiple selection, remove/re-add, detail/list/home display, server restart persistence, traversal and invalid-upload cases) remain NOT RUN.
- Database integration tests, seed execution, and browser scenarios remain NOT RUN. No isolated test database is configured; do not seed the development database as part of this stage record.
- Email verification and password reset are out of MVP scope per the Stage 3 brief.
- Registration/login rate limiting remains a pre-launch TODO from the Blueprint.
- `npm install` reported 15 dependency vulnerabilities (3 moderate, 10 high, 2 critical); review with a separate dependency-audit task before release.
- Vitest reports the existing Vite CJS Node API deprecation warning.

## Next Approved Step

No further implementation step was approved in this task. B2 (public store, notifications, wishlist, vacation mode) and Stage 7 Cloudflare R2 remain separate work and were not started.

## Handoff Notes

- Key files: `src/server/services/` (products, orders, favorites, profile, profile-hub, uploaded-files), `src/server/security/payment-encryption.ts`, `src/server/storage/local-image-storage.ts`, `src/components/profile/profile-hub.tsx`, profile/order forms, routes under `src/app/api/profile/`, upload routes, `src/instrumentation.ts`, and the B1 Prisma migration/schema.
- Keep Auth.js on JWT sessions, preserve bcrypt password hashes, and never add `passwordHash` to DTO/session responses.
- Stage 6 domain routes and Prisma services handle all runtime marketplace reads and writes. `/api/mock`, `postMock`, and mock runtime accessors are removed; seed fixtures are intentionally retained separately.
- Run typecheck, lint, tests, build, and read-only DB validation after relevant changes; browser checks are still pending.
- Set `UPLOAD_DIR` only in the server environment if changing the default; keep it outside `public/`. Do not commit `storage/uploads`. Local disk is interim; R2 work remains a separate approved stage.
- Set `PAYMENT_ENCRYPTION_KEY` to a generated base64-encoded 32-byte value before starting the server. Keep the key backed up and private; losing it makes encrypted payment data unreadable. Ciphertext carries the `v1` prefix for key-versioning.
- Before release, apply/review the B1 migration and test the slug backfill, SQL partial default index, and payment-account trigger on an isolated PostgreSQL database. Then manually test buyer address prefill, profile/avatar, store activation, payment account CRUD, confirmation visibility, and legacy-order messaging as different users.
- Manual browser checklist (NOT RUN): sign in as two users and try assigning the other user's avatar/logo key and a PRODUCT key as avatar/logo; upload and assign matching AVATAR/LOGO keys; confirm pending orders with no active payment account show the banner and its link, then add an account and verify confirmation stores a snapshot; verify a pre-feature confirmed/completed order shows the contact-seller message; replace avatar/logo and confirm both old and new images still load.
- Do not begin B2 or admin work without separate approval. B1 is a Stage 6 follow-up; no stage numbers changed.
- No Prisma schema, migration, dependency, or database data changes were made in Stage 6. Do not run migrations or seed against `preloved_dev` as part of this work.
