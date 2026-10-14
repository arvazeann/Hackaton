# RuangLagi â€” Marketplace Preloved

## Project Overview

MVP marketplace barang preloved untuk kebutuhan anak kos, dibangun dengan Next.js App Router.

## Tech Stack

Next.js 16.4 + TypeScript, Tailwind CSS, Zod + React Hook Form, PostgreSQL + Prisma, Auth.js Credentials + JWT, bcryptjs, Vitest.

## Current Status

- Current task: Supabase Storage image adapter and non-destructive local-file copy script are implemented. The server adapter accepts the current `SUPABASE_SECRET_KEY` format and retains compatibility with legacy `SUPABASE_SERVICE_ROLE_KEY`; Vercel settings and browser flows remain unverified. Production build was not retried because a Node process may hold `.next`, after a previous build failed with Windows `EPERM` unlinking a build chunk. Earlier Vercel Prisma build work and LAN/Auth.js development are recorded below; UI refresh UI-1 remains in progress.
- Last completed implementation stage: Stage 6 follow-up: Admin Area Phase 2; B1, B2, and Admin Phases 1–2 extend Stage 6 without renumbering. UI refresh is a presentation-only follow-up.
- Product, avatar, and store-logo uploads now use Supabase Storage through server-only credentials; legacy local images can be copied with the non-destructive migration script.

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
- `/login` and `/register` share a responsive animated auth experience while retaining both URLs; optional Google OAuth is enabled only when both server credentials are configured.
- Google sign-in requires Google's verified email and maps it to the existing User row; new Google users receive a random, unusable bcrypt password. No OAuth `Account` table or adapter exists, so provider linking is by verified email and no Google subject is persisted.
- Session JWT contains the user ID, session version, and standard JWT timing identifiers; session resolution checks the current enabled account and role from PostgreSQL.
- Authenticated pages use server-side session checks and redirect visitors to login with a return path.
- Navigation displays signed-in state and provides Auth.js logout.
- Product listing, detail, seller dashboard, create, update, and archive use Prisma through `src/server/services/products.ts`.
- Product UI maps Prisma category/image relations to the existing DTO shape. Public product DTOs omit seller phone and internal password data.
- Product and order mutations use domain API routes with session-derived identity and Prisma services.
- Uploaded product/profile images use authenticated server-side Supabase Storage uploads; PostgreSQL stores UUID keys and ownership metadata, while a validated same-origin route redirects image reads to the public bucket. Seed products continue using existing local SVG assets.
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
- RuangLagi is positioned as a contemporary flea market for boarding-house residents. Homepage, catalog, navigation search, footer, metadata, seller form, and login/register marketing copy focus on affordable dorm essentials without changing authentication or transaction flows.
- Product categories are database-managed and shared by seller create/edit, catalog filters, and admin filters: Furnitur & penyimpanan, Perlengkapan tidur, Elektronik, Dapur, Kebersihan & laundry, Belajar & kerja, and Lainnya. The migration preserves product rows and order snapshots; seed examples use explicit category slugs and boarding-house items.
- UI refresh UI-1 implementation in progress: approved warm-cream/green/orange tokens and DM Sans/DM Serif Display fonts; shared navbar/footer/page-header; peach product cards and status labels; responsive category, condition, price/location filters; sort toolbar and numbered pagination. No service, schema, API, action, or business-rule changes. UI-2 page layout work has not started.

## Important Decisions

- PostgreSQL is the database; Prisma is used for ORM and migrations.
- Auth.js Credentials uses JWT sessions; bcryptjs with cost 12 hashes passwords.
- Optional Google OAuth requires both `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`; email linking accepts only a Google profile with `email_verified: true`. The current schema does not persist provider account IDs.
- `passwordHash` is never sent to the client or included in session data.
- Buyers can always view their own shipping data; sellers see phone/address only for `confirmed` or `completed` orders.
- Order cancellation requires a 5-500 character reason; cancelled orders require `cancel_reason`.
- Approved category taxonomy: `furnitur-penyimpanan`, `perlengkapan-tidur`, `elektronik`, `dapur`, `kebersihan-laundry`, `belajar-kerja`, and `lainnya`; category records remain database-backed rather than being duplicated as form/filter options.
- `/api/mock` and its client helper were removed after all product, order, favorite, and profile mutations moved to domain routes.
- Product, order, favorite, and profile operations use authenticated database UUIDs directly; no UUID-to-mock-ID mapping is used.
- A new order remains `pending` while its product stays `active`; confirming reserves the product, completing marks it sold, and cancelling a confirmed order restores it to active.
- At most one `pending` or `confirmed` order may exist per product. The service handles unique conflicts without exposing database details.
- Auth.js secret is stored in ignored `.env.local`; never commit or expose it.
- Uploaded media uses the `ruanglagi-images` public Supabase Storage bucket. `SUPABASE_URL`, `SUPABASE_STORAGE_BUCKET`, and either `SUPABASE_SECRET_KEY` (preferred) or legacy `SUPABASE_SERVICE_ROLE_KEY` are server-only; never use a `NEXT_PUBLIC_` prefix. Public access is for image reads; uploads/deletes run only on the authenticated server.
- Payment encryption uses server-only `PAYMENT_ENCRYPTION_KEY` (base64, 32 bytes) and must be generated locally using the command in `.env.example`; never commit its value.
- Seller payment accounts are soft-deactivated, limited to three active entries, and do not modify payment snapshots on existing orders. Address/order shipping snapshots are likewise immutable.
- Product create/update require image metadata to belong to the current seller and have purpose `PRODUCT`; product uploads also require an existing seller profile. Legacy static seed SVGs and local-disk fallback reads remain supported. Old local files are not deleted by the migration script.
- Notification preferences default to enabled without creating preference rows; disabled types skip notification creation while order status remains visible on the order page.
- Admin changes never modify platform roles, password credentials, product images/ownership, or order snapshots. Audit metadata contains allowlisted field names and state transitions only.

## Verification

### Supabase image storage migration — 2026-10-14

- Create a public bucket named `ruanglagi-images` in Supabase Storage and set a 5 MB file limit with JPEG, PNG, and WebP MIME types. Public access is needed for catalog delivery; write/delete calls still use server credentials.
- Set `SUPABASE_URL`, `SUPABASE_STORAGE_BUCKET`, and preferred `SUPABASE_SECRET_KEY` (Supabase `sb_secret_...`) in ignored `.env.local` and Vercel Production/Preview. Legacy `SUPABASE_SERVICE_ROLE_KEY` JWT remains supported. The new secret key is sent as `apikey` only; legacy service-role JWT is sent as both `apikey` and Bearer authorization. Never expose either key to client code.
- To copy old `storage/uploads` files without deleting originals, run `npx tsx scripts/migrate-local-images-to-supabase.ts` after setting the environment. The script skips already-present keys and verifies each copied object's public availability.
- No Prisma schema or migration was needed; existing `ProductImage.storageKey`, `ProductImage.url`, and `UploadedFile.key` columns remain sufficient. `next/image` still receives same-origin `/uploads/<key>` paths, so no remote image host configuration is needed.
- Checks at the time: `npm run typecheck` PASS; `npm run lint` PASS; `npm test -- --reporter=dot` PASS (189 tests); `npm run format:check` PASS; `npm run db:validate` PASS. Build NOT RUN in that follow-up after a previous Windows `EPERM` during `.next` cleanup. Supabase upload, dashboard bucket, legacy copy, browser page coverage, and Vercel persistence were NOT RUN.

### Supabase secret-key compatibility — 2026-10-14

- Storage uses `SUPABASE_SECRET_KEY` as the `apikey` header for current `sb_secret_...` keys and omits the Bearer header. Legacy `SUPABASE_SERVICE_ROLE_KEY` JWT remains supported using both `apikey` and Bearer authorization. Blank unused key variables are treated as unset.
- Checks: `npm run typecheck` PASS; `npm run lint` PASS; `npm run format:check` PASS; tests NOT RUN; production build NOT RUN. Supabase credentials, bucket configuration, uploads, and Vercel deployment were not inspected or exercised.

### Vercel Prisma Client generation — 2026-10-14

| Check                  | Status  | Command / notes                                                                                        |
| ---------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| Prisma Client generate | PASS    | `npm run db:generate` generated Prisma Client 7.10.0 under ignored `src/generated/prisma/`.            |
| Typecheck              | PASS    | `npm run typecheck`                                                                                    |
| Lint                   | PASS    | `npm run lint`                                                                                         |
| Format check           | PASS    | `npm run format:check`                                                                                 |
| Tests                  | PASS    | `npm test` — 36 files, 179 tests; existing Vite CJS deprecation warning.                               |
| Install-script policy  | PASS    | `npm install-scripts ls` — no unreviewed scripts; explicit version-pinned npm allowlist in package.    |
| Production build       | NOT RUN | A build can execute server-side code that reads Supabase and writes `.next`; deployment build pending. |
| Live Vercel UI         | NOT RUN | HTTP 200 returned Vercel Login page; deployment protection prevented application inspection.           |

The latest provided Vercel log still runs `npm run build` without Prisma generation. Commit/push and a new Vercel deployment are required to exercise these changes. No migrations or database writes were run.

### LAN development access and Auth.js host handling — 2026-10-14

| Check                   | Status  | Command / notes                                                                                                                                                                                                          |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Typecheck               | PASS    | `npm run typecheck`                                                                                                                                                                                                      |
| Lint                    | PASS    | `npm run lint`                                                                                                                                                                                                           |
| Format check            | PASS    | `npm run format:check`                                                                                                                                                                                                   |
| Tests                   | PASS    | `npm test -- --reporter=dot` — 179 tests in 36 files; existing Vite CJS deprecation warning remains.                                                                                                                     |
| Build                   | NOT RUN | Existing Next dev server is active on port 3000; a second dev server was refused by the `.next` lock, so a build was not run against the shared output directory.                                                        |
| LAN HTTP checks         | PASS    | `localhost` and current laptop LAN IP `10.106.7.63` returned `/register` with 200; eight dev JavaScript assets fetched from the LAN origin returned 200; invalid register input returned 400.                            |
| Auth.js / Prisma checks | PASS    | From LAN host, duplicate registration returned 409 without writing; a wrong-password check returned to `/login` on the LAN host and issued no session cookie. Prisma read-only user/product count transaction succeeded. |
| Manual browser checks   | NOT RUN | No browser automation or physical second device available. Windows active Wi-Fi profile is `Public`; firewall rule changes were denied because this shell is not elevated. See Known Issues.                             |

Cause/fix: Next 16.4 had an outdated configured LAN origin, so the active private IPv4 address was not permitted for dev assets. Its dev route request also used an internal `localhost` URL even though `Host` and `x-forwarded-host` contained the LAN IP, causing Auth.js error redirects to use localhost. `src/lib/dev-network.ts` now derives only active private IPv4 hosts, filters stale configured private IPs, and normalizes Auth.js request URLs only for validated development hosts. Production behavior is unchanged. `npm run dev:lan` explicitly binds to `0.0.0.0`.

No `.env.local`, database, schema, RLS, or grants were changed. The read-only Prisma check found one user and no products in the selected Supabase database. A cold first homepage request logged one Prisma transaction start timeout; the read-only Prisma transaction passed on retry.

### QA follow-up — 2026-10-13

| Check                    | Status  | Command / notes                                                                                                                                                                                                                                                                                                            |
| ------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck                | PASS    | `npm run typecheck`                                                                                                                                                                                                                                                                                                        |
| Lint                     | PASS    | `npm run lint`                                                                                                                                                                                                                                                                                                             |
| Format check             | PASS    | `npm run format:check` after formatting the changed test file and removing the temporary browser script.                                                                                                                                                                                                                   |
| Tests                    | PASS    | `npm test` — 175 tests in 35 files; existing Vite CJS deprecation warning remains.                                                                                                                                                                                                                                         |
| Browser layout checks    | PASS    | Headless Chrome measured `/`, `/login`, and `/register` at 320, 360, 390, 430, 1280, 1440, and 1920 px. `document.documentElement.scrollWidth` matched `clientWidth` at every width; desktop navbar children stayed on one row. Auth transition headings must be interpreted from the active panel; no form was submitted. |
| Image ownership tests    | PASS    | Product service tests cover current seller, another seller, missing stored file, and that create/edit stop before database writes for invalid ownership.                                                                                                                                                                   |
| Production build         | NOT RUN | Next dev server remains active on port 3000; build was not run concurrently.                                                                                                                                                                                                                                               |
| Login/register switch    | PASS    | At 390 px, clicking `Register` on `/login` changed the URL to `/register` and exposed the “Buat akun.” active heading; no form was submitted.                                                                                                                                                                              |
| Forwarded Server Actions | PASS    | `next.config.ts` now allows the exact configured `NEXT_ALLOWED_DEV_ORIGIN` for Server Actions as well as dev assets. Typecheck validates the config; logout itself was not submitted during this follow-up.                                                                                                                |
| Manual browser checks    | NOT RUN | Touch keyboard/focus/hover behavior, redirects for protected routes, and visual inspection at each viewport were not performed.                                                                                                                                                                                            |

Cause/fix: homepage grid children and auth panels could retain intrinsic minimum widths; the auth transition also intentionally renders two half-width panels side-by-side. Constraining the page/grid/card/panel wrappers with `min-w-0`, keeping the animated track within its clipped card, and sizing the navbar wrapper to available width removed document-level horizontal overflow without changing desktop breakpoints. Product uploads now pass the shared owner-and-purpose check in the service layer before create/update.

No form was submitted and no application data or database schema was changed. The dev server on port 3000 was left running.

### Comprehensive QA — 2026-10-13

| Check                                | Status  | Command / notes                                                                                                                                                                                             |
| ------------------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck                            | PASS    | `npm run typecheck`                                                                                                                                                                                         |
| Lint                                 | PASS    | `npm run lint`                                                                                                                                                                                              |
| Format check                         | PASS    | `npm run format:check`                                                                                                                                                                                      |
| Tests                                | PASS    | `npm test` — 172 tests in 35 files; Vite CJS deprecation warning remains.                                                                                                                                   |
| Prisma validation/status             | PASS    | `npm run db:validate`; `npm run db:status` — 13 migrations current on `preloved_dev`.                                                                                                                       |
| Read-only database integrity         | PASS    | 10 users, 21 products, 7 categories, 8 orders, 5 favorites, 5 notifications; all queried product/category/user/order/favorite/notification references valid; cancelled orders have valid reasons.           |
| HTTP smoke checks                    | PASS    | 13 anonymous GET checks: public pages return 200; protected pages carry the expected login redirect marker; protected APIs return 401; GET-only unsupported `/api/orders` returns 405. No data was changed. |
| Desktop browser screenshots          | PASS    | Headless Chrome homepage at 1280, 1440, and 1920 px; navbar remained one row.                                                                                                                               |
| Mobile browser screenshots           | FAIL    | At 390 px, homepage navbar/hero and login card content extend beyond the right viewport edge. See Known Issues.                                                                                             |
| Production build                     | NOT RUN | Next dev server is listening on port 3000; build was not run concurrently on Windows.                                                                                                                       |
| Authenticated/mutating browser flows | NOT RUN | No browser test account or isolated E2E database was prepared; no registration, upload, product/order/favorite/profile/admin mutation was attempted. Google provider callback was not exercised.            |

QA was read-only and did not change application code or database data. Desktop/mobile screenshots were captured with local headless Chrome; browser interactions such as dropdown keyboard/outside-click and reduced-motion behavior remain unverified.

### Anak kos positioning and category taxonomy — 2026-10-13

| Check                 | Status  | Command / notes                                                                                                                                                                                             |
| --------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck             | PASS    | `npm run typecheck`                                                                                                                                                                                         |
| Lint                  | PASS    | `npm run lint`; no errors (two unused auth imports removed).                                                                                                                                                |
| Format check          | PASS    | `npm run format:check`                                                                                                                                                                                      |
| Tests                 | PASS    | `npm test` — 172 passed across 35 files; seed taxonomy, create/edit category persistence, admin category source, and category-plus-search filtering covered. Existing Vite CJS deprecation warning remains. |
| Prisma validation     | PASS    | `npm run db:validate`; schema unchanged and valid.                                                                                                                                                          |
| Migration status      | PASS    | `npm run db:migrate` applied migration 13 to `preloved_dev`; `npm run db:status` reports up to date.                                                                                                        |
| Build                 | NOT RUN | Next dev server is listening on port 3000; build was not run concurrently on Windows.                                                                                                                       |
| Manual browser checks | NOT RUN | Product create/edit UI, catalog filter/search, and admin category dropdown need a browser smoke check. Service/query tests passed.                                                                          |

Read-only post-migration checks: `preloved_dev` has 10 users, 21 products, and 8 orders; all 3 products priced Rp715 remain with the same titles/statuses and order counts (`asd` sold/1 order, `asd` active/0, `Manggalodon` active/1); no product is missing a category. The final order snapshot digest is `3c0f4f687f7e7dccf95d312a031d530b`. Eleven seed demo products with no orders or favorites were refreshed in development. Production was not accessed.

### Login/register redesign — 2026-10-13

| Check                 | Status  | Command / notes                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Typecheck             | PASS    | `npm run typecheck`                                                                                                                                                                                                                                                                                                                                                                        |
| Lint                  | PASS    | `npm run lint`                                                                                                                                                                                                                                                                                                                                                                             |
| Format check          | PASS    | `npm run format:check`                                                                                                                                                                                                                                                                                                                                                                     |
| Tests                 | PASS    | `npm test` — 168 passed across 34 files; Vite CJS Node API deprecation warning remains.                                                                                                                                                                                                                                                                                                    |
| Build                 | NOT RUN | A Next.js dev server was already active on port 3000. Build was not run alongside it to avoid `.next` conflicts on Windows.                                                                                                                                                                                                                                                                |
| Manual browser checks | PASS    | Headless Chrome desktop on localhost and laptop LAN IP, plus 390 px mobile viewport: Login/Register switch both ways, URL compatibility, validation, registration/duplicate, pending/double-submit guard, Credentials wrong/correct, callback redirect, session reload, and no horizontal overflow. Physical phone: NOT RUN. Google OAuth: NOT RUN because credentials are not configured. |

Google setup: create a Google OAuth Web client, set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in ignored `.env.local`, and authorize `http://localhost:3000/api/auth/callback/google` for local testing. For remote/phone access, use an HTTPS domain or tunnel and authorize its exact `/api/auth/callback/google` URI; Google Web OAuth rejects raw non-loopback IP redirect hosts. The Google button remains hidden until both server variables are set. No schema or migration was changed.

### Local-network authentication follow-up — 2026-10-13

| Check                 | Status | Command / notes                                                                                                                                                                                                                                         |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck             | PASS   | `npm run typecheck`                                                                                                                                                                                                                                     |
| Lint                  | PASS   | `npm run lint`                                                                                                                                                                                                                                          |
| Format check          | PASS   | `npm run format:check`                                                                                                                                                                                                                                  |
| Tests                 | PASS   | `npm test` — 164 passed across 33 files; existing Vite CJS Node API deprecation warning                                                                                                                                                                 |
| Build                 | FAIL   | `npm run build` and `npm run build -- --webpack` returned Windows `EPERM` unlinking an existing `.next` chunk after dev stopped. Isolated worktree retries failed resolving generated Prisma/Next client modules. No existing `.next` file was deleted. |
| Prisma validation     | PASS   | `npm run db:validate`                                                                                                                                                                                                                                   |
| Migration status      | PASS   | `npm run db:status` — 12 migrations, database up to date                                                                                                                                                                                                |
| Manual browser checks | PASS   | Headless Chrome desktop on laptop LAN IP and `localhost`: registration, validation/duplicate, auto-login, wrong/correct login, session reload, protected redirect/callback, logout, and host-scoped cookies. Physical phone: NOT RUN.                   |

Cause verified from the Next.js dev-server warning: the ignored local `.env.local` allowed the stale LAN IP `192.168.10.12`, while this laptop currently uses `10.28.71.37`. Updated only `NEXT_ALLOWED_DEV_ORIGIN` in `.env.local` to the active IP and documented the expected hostname/IP format in `.env.example`. After restart, browser requests from the LAN IP loaded the app resources without the previous blocked-origin warning. Auth.js needs no static `AUTH_URL` for this setup; callbacks followed the request host and cookies remained scoped to the host used for login. No schema, migration, or authentication code changed. Synthetic registration accounts remain in the local development database; no database reset or cleanup was performed.

### UI refresh — UI-1 shared components — 2026-10-13

| Check                 | Status  | Command / notes                                                                                                                                        |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Typecheck             | PASS    | `npm run typecheck`                                                                                                                                    |
| Lint                  | PASS    | `npm run lint`                                                                                                                                         |
| Format check          | PASS    | `npm run format:check`                                                                                                                                 |
| Tests                 | PASS    | `npm test` — 164 passed across 33 files; existing Vite CJS Node API deprecation warning                                                                |
| Build                 | NOT RUN | The project's `next dev` processes are active; do not run build and dev together on Windows because of `.next` EPERM conflicts. Stop dev before build. |
| Manual browser checks | NOT RUN | No browser runner is available; the two named reference screenshots are not in the repository. Use the manual checklist below.                         |

The four automated checks passed after the latest UI-1 code changes. Production build remains required before UI-1 can be marked complete. No database or migration was touched.

### Catalog sort dropdown follow-up — 2026-10-13

All native choice `<select>` controls under `src/app` and `src/components` now use the shared Radix Select presentation. This covers catalog sorting, admin filters and product editing, product category/condition, saved addresses, payment selection, and profile address/payment forms. The catalog category and condition filters remain their existing radio controls. The shared component maps empty options back to empty form values and preserves names used by GET forms and `FormData`; React Hook Form fields remain connected through `Controller`. No business rules or backend behavior changed.

| Check                 | Status  | Command / notes                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck             | PASS    | `npm run typecheck`                                                                                                                                                                                                                                                                                                                             |
| Lint                  | PASS    | `npm run lint`                                                                                                                                                                                                                                                                                                                                  |
| Format check          | PASS    | `npm run format:check`                                                                                                                                                                                                                                                                                                                          |
| Tests                 | PASS    | `npm test` — 164 passed across 33 files; existing Vite CJS Node API deprecation warning                                                                                                                                                                                                                                                         |
| Build                 | NOT RUN | Existing `next dev` process is active; build was not run alongside it due the project's Windows `.next` EPERM risk.                                                                                                                                                                                                                             |
| Manual browser checks | NOT RUN | Desktop Chrome verified `/products` in closed/open states, pointer opening, outside-click closing, selected styling, and pointer/keyboard selection with the expected `sort` form value. Admin/profile/order/product-edit dropdown routes were not exercised because they require authenticated sessions not available in this browser session. |

No database or migration was touched.

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
- Physical-phone browser scenarios remain NOT RUN; desktop browser auth flows from the laptop LAN IP and localhost are recorded above. Other feature/browser scenarios remain NOT RUN; the manual checklists below still apply. Migration and SQL constraint checks ran only on isolated temporary databases, which were dropped after verification.
- Historical Stage 3 audit scenarios below describe the behavior at that audit date; the P2 UUID mismatch was resolved by the Stage 4–6 Prisma migrations.
- **Image storage rollout:** Supabase Storage code is implemented, but the dashboard bucket, Vercel environment variables, legacy-file copy, browser flows, and deployed Vercel persistence still require manual setup/verification. Abandoned uploads can remain unreferenced if compensating deletion also fails.
- Manual image browser checks (single/multiple selection, remove/re-add, detail/list/home display, server restart persistence, traversal and invalid-upload cases) remain NOT RUN.
- Email verification and password reset are out of MVP scope per the Stage 3 brief.
- Registration/login rate limiting remains a pre-launch TODO from the Blueprint.
- `npm install` reported 15 dependency vulnerabilities (3 moderate, 10 high, 2 critical); review with a separate dependency-audit task before release.
- Vitest reports the existing Vite CJS Node API deprecation warning.
- **LAN development firewall:** active interface `Wi-Fi 2` is categorized `Public`. This shell is not elevated, so the requested Private-only TCP 3000 allow rule and Public-profile block rule could not be installed. Existing Windows Node.js inbound allow rules include profile `Public` with any port; use an Administrator terminal and a trusted Private network before sharing the dev server with another device.
- UI refresh browser checks remain NOT RUN. `docs/design-reference/reference-dribbble.png` and `docs/design-reference/current-home.png` were not found; implementation follows the written approved brief.
- **QA-P2-01 — Mobile horizontal clipping:** resolved in the 2026-10-13 follow-up. Headless Chrome reports no document overflow at all seven tested viewport widths on `/`, `/login`, and `/register`; manual visual and touch checks remain NOT RUN.
- **QA-P3-01 — Uploaded product image ownership:** resolved in the 2026-10-13 follow-up for product create/update. Uploaded keys require an `UploadedFile` owned by the session seller with purpose `PRODUCT`; legacy static seed SVGs remain allowed. Safe orphan cleanup remains TODO.
- Legacy category-filter URLs using removed slugs (such as `fashion-pria` or `perabot`) are not aliases after migration; use the current database category slugs. Product records remain present and were reassigned to the new taxonomy.
- “Paling disukai” homepage sorting/count is a future idea only; favorite behavior and ordering were not changed in this task.
- The product DTO does not distinguish an uploaded/seed image from the legacy `/products/item-1.svg` no-image fallback. The card renders a neutral inline placeholder only for an empty image URL; replacing the legacy fallback reliably would require a service/DTO change, outside the approved presentation-only scope.
- `/favorites` and `/wishlist` both exist and remain unchanged; review whether to consolidate them in a later approved task.

## Next Approved Step

Configure the Supabase Storage bucket and server environment variables, run the non-destructive legacy-image copy, then deploy the reviewed code and verify authenticated upload/display flows. Do not remove old local files until copied objects and all page views are confirmed.

## Handoff Notes

- Key files: `src/server/services/` (products, orders, favorites, notifications, profile-hub), `src/server/security/payment-encryption.ts`, `src/components/profile/profile-hub.tsx`, `src/app/store/[slug]/`, `src/app/notifications/`, `src/app/wishlist/`, notification/profile API routes, and the B1/B2 Prisma migrations/schema.
- Keep Auth.js on JWT sessions, preserve bcrypt password hashes, and never add `passwordHash` to DTO/session responses.
- LAN development uses `npm run dev:lan`; `src/lib/dev-network.ts` scopes allowed dev hosts to current private IPv4 addresses and normalizes only validated Auth.js dev requests. `.env.local` is local-only and was not changed.
- Stage 6 domain routes and Prisma services handle all runtime marketplace reads and writes. `/api/mock`, `postMock`, and mock runtime accessors are removed; seed fixtures are intentionally retained separately.
- Run typecheck, lint, tests, build, and read-only DB validation after relevant changes; browser checks are still pending.
- `scripts/migrate-local-images-to-supabase.ts` copies and verifies old local images while retaining source files. `src/app/uploads/[filename]/route.ts` preserves same-origin image paths and local fallback; keep bucket and service credentials configured in each hosting environment.
- Set `PAYMENT_ENCRYPTION_KEY` to a generated base64-encoded 32-byte value before starting the server. Keep the key backed up and private; losing it makes encrypted payment data unreadable. Ciphertext carries the `v1` prefix for key-versioning.
- Manual browser checklist (NOT RUN): verify `/profile` loads for a seller and a plain buyer; activate a store; add and soft-delete payment accounts and verify the three-active limit; add addresses and verify the default rule; change a password; upload an avatar; verify the seller dashboard banner without an account; confirm an order with and without an account; verify the buyer sees payment instructions only after confirmation; verify old confirmed orders show “Contact the seller for payment details”; sign in as a second user and verify they cannot open the first user's addresses or payment accounts. Also try assigning another user's uploaded key and a wrong-purpose key to avatar/logo; upload matching AVATAR/LOGO keys; replace avatar/logo and confirm prior files remain available.
- B1 and B2 are Stage 6 follow-ups; no stage numbers changed. Keep public store DTOs allowlisted and notification messages free of contact/payment data.
- B1, B2, and Admin migrations are applied to `preloved_dev`; do not reset, db push, or seed that database without separate approval.
- Admin migrations `20261013140000_admin_area` and `20261013150000_admin_area_phase2` are applied to `preloved_dev`; latest status is up to date. Three isolated Admin verification databases remain because automated command review rejected their deletion: `preloved_admin_verify_20261013`, `preloved_admin_shadow_verify_20261013`, and `preloved_admin_preverify_20261013` (the latter has one synthetic user).
- Admin browser checklist (NOT RUN; use an admin and a regular account): verify anonymous and USER access are denied on every admin page/API; ADMIN dashboard, filters and 12/48 pagination; emails masked until explicit audited reveal; address summaries remain masked; order lists disclose no contact/payment data; each service and route rejects non-admin calls; bootstrap promotes only a pre-existing account and reruns safely. Confirm no admin UI mutation controls are present.
- Admin Phase 2 browser checklist (NOT RUN; use an enabled ADMIN, a second ADMIN, and a regular account): verify name edits and role/password fields are rejected; disable blocks a user's next request and login, and the old session remains invalid after re-enable; self-disable and disabling the last enabled ADMIN are rejected; active products edit/archive only without pending/confirmed orders and keep images/ownership/order snapshots; only pending orders cancel with a 5–500 character reason, without changing product/payment/shipping snapshots; both recipients honor notification preferences; retries do not duplicate notifications; audit rows omit personal values and cancellation reason.
- UI-1 manual visual checklist (NOT RUN): inspect desktop, tablet, and mobile navbar/footer; page-header typography and breadcrumb when wired in UI-2; active/reserved/sold/new product card states and missing-image placeholder; favorite behavior; category/condition/price/location controls and mobile filter disclosure; sort and numbered pagination with filters preserved; keyboard order and focus rings on cream and green surfaces; check text contrast at rendered sizes.
- B2 manual browser checklist (NOT RUN; use two accounts): open a public store without login and verify its safe fields/products and unknown-slug 404; turn vacation mode on and confirm the seller disappears from home/listing while its store/direct product remain visible, new orders are blocked, and existing orders can still be processed; exercise notification bell/count, every order notification, disabled/enabled preferences, mark-one/read-all, and verify disabled types create no notification while order status remains visible; save products to the private wishlist and confirm reserved/sold labels and disabled order actions; attempt to favorite one's own product; as the second account, try direct access to the first user's wishlist and notifications.
