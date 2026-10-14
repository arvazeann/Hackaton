# RuangLagi staging verification checklist

Status (2026-10-15): the isolated staging target guard and read-only database `SELECT 1` both **PASS** locally. Application-level persistence, Preview access, synthetic-account flows, and browser E2E remain **NOT TESTED**. All write scenarios below are staging-only. Never run them against Production.

## Current tooling and safe setup

- The repository has Vitest unit/component tests but no installed Playwright, Cypress, or other browser E2E framework. `npm ls @playwright/test playwright cypress --depth=0` returned no packages. Vitest mocks do not prove browser-to-database persistence.
- Minimum recommended browser automation is Playwright (`@playwright/test`) with one Chromium project and a staging-only base URL. Do not add the dependency until staging and account access exist and the owner approves the dependency change. Until then, run these scenarios manually in a protected Preview deployment.
- Create `preloved/.env.staging.local` locally (it is ignored by `.gitignore`). Populate only staging `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_STORAGE_BUCKET`, `STAGING_PROJECT_REF`, `PRODUCTION_PROJECT_REF`, `STAGING_STORAGE_BUCKET`, and `PRODUCTION_STORAGE_BUCKET`. Obtain DB/Storage values from the staging Supabase project. Confirm the production and staging refs/bucket names in their respective dashboards. Never paste secret values into chat, tickets, terminal output, or this file.
- `npm run staging:verify` first validates that both DB and Storage URLs identify the declared staging project, that neither identifies the declared production ref, and that staging and production buckets differ. Only after that guard passes, it dynamically imports Prisma and runs read-only `SELECT 1`. It prints no URLs, hosts, or credentials and performs no writes. Connection errors are reduced to safe categories (DNS, refused endpoint, timeout/reset, TLS, authentication, pooler session cap); a bare `P1001` is explicitly reported as insufficient to distinguish hostname, port, and network causes.
- Do not use the normal local `npm run dev` for staging verification while `.env.local` points to Production. This staging command explicitly loads `.env.staging.local`; it is independent from the app server environment.
- For a deployed Preview, set Preview-only `DATABASE_URL`, Supabase Storage values, and Auth.js variables in Vercel. Verify the project ref and staging bucket there, then redeploy the Preview. Keep Production variables unchanged.

## End-to-end scenarios

Use clearly synthetic identities and records with a unique run marker such as `e2e-20261014-<random>`. Prepare separate buyer, seller, and admin accounts; seller must have an active seller profile and payment account for the confirmed-order flow. Keep the run marker and resulting IDs for read-only database verification. Remove or archive only test-created records using supported UI actions after evidence is captured.

| Area                                         | Scenario and expected result                                                                                                                                                                                                                                              | Persistence evidence                                                                                                                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registration, login, logout                  | Register a synthetic buyer; verify validation and duplicate email handling; sign in, refresh an authenticated page, sign out, and confirm protected pages redirect. If Google is enabled, separately complete Google consent and return to the app.                       | `users` contains the synthetic email and a UUID; `last_login_at` changes after sign-in. Do not inspect/store password hashes.                                                                                                                   |
| Catalog, detail, search, filters, pagination | Confirm only active products are listed; open a product; search a unique test title; filter by category/condition/city/price; change page and confirm query state/results.                                                                                                | Read-only `products` query shows the test item and `status = 'active'`; compare product UUIDs with visible cards and detail.                                                                                                                    |
| Wishlist                                     | Favorite an eligible product, refresh and revisit wishlist, remove it, then refresh again.                                                                                                                                                                                | `favorites` has `(user_id, product_id)` after add and no row after removal.                                                                                                                                                                     |
| Order lifecycle                              | Buyer orders a seller's active test product with synthetic shipping details. Seller confirms using the active test payment account; buyer sees the expected payment state; complete the order. On a separate test product, also verify valid cancellation and its reason. | `orders` shows buyer/seller/product UUIDs, snapshots, expected status transitions and cancellation reason where relevant; product status follows the approved transition. Verify through read-only staging SQL.                                 |
| Profile and addresses                        | Update buyer profile, save an address, refresh, and verify the values persist. Test password change only with the synthetic account.                                                                                                                                      | `users` fields and `updated_at`; `addresses` row owned by the test user. Never select `password_hash`.                                                                                                                                          |
| Photo upload and rendering                   | Upload one valid JPEG/PNG/WebP at or below 3,000,000 bytes, view it on profile/product pages after refresh, then try 3,000,001 bytes and an invalid type. Oversize/invalid files must be rejected clearly.                                                                | `uploaded_files` has the test owner's UUID and expected purpose; product image metadata references its key; the Storage object is readable from the staging bucket and the browser image request succeeds. Verify actual bucket name/ref first. |
| Admin and authorization                      | As admin, inspect test user/product/order, perform one reversible allowed action on a test record, and verify the audit event. As buyer/seller, attempt admin pages/API and another user's private records; access must be denied without leaking data.                   | `audit_logs` contains the test action/target; the targeted staging row reflects the action. Verify non-admin requests do not create admin audit rows.                                                                                           |
| Responsive/interactions                      | Repeat the primary catalog, product detail, wishlist, profile, upload, and order flows at desktop and mobile viewport sizes. Check keyboard focus, errors, loading, and empty states.                                                                                     | No DB query is needed for layout; pair mutation checks with the persistence evidence above.                                                                                                                                                     |

Read-only SQL examples (run only in the **staging** Supabase SQL editor; substitute synthetic values locally):

```sql
SELECT id, email, created_at, last_login_at
FROM users
WHERE email IN ('buyer-e2e@example.test', 'seller-e2e@example.test');

SELECT id, title, status, seller_id, updated_at
FROM products
WHERE title LIKE '[E2E] run-marker%';

SELECT user_id, product_id, created_at
FROM favorites
WHERE user_id = '<buyer-uuid>' AND product_id = '<test-product-uuid>';

SELECT id, order_code, buyer_id, seller_id, product_id, status, cancel_reason, updated_at
FROM orders
WHERE order_code = '<test-order-code>';

SELECT key, owner_id, purpose, created_at
FROM uploaded_files
WHERE owner_id IN ('<buyer-uuid>', '<seller-uuid>');

SELECT id, actor_id, action, target_type, target_id, created_at
FROM audit_logs
WHERE target_id = '<test-target-id>';
```

These queries deliberately omit passwords, encrypted payment data, and unrelated user data. Capture only synthetic IDs/results as test evidence.

## OAuth and Preview protection

- Auth.js uses the default `/api/auth` handler mounted at `src/app/api/auth/[...nextauth]/route.ts`; the Google callback path is `/api/auth/callback/google`. There is no custom `basePath` in `auth.ts`.
- For the active Preview, add the exact redirect URI `https://<active-preview-host>/api/auth/callback/google` to the staging Google OAuth Web client. Its authorized JavaScript origin, if required by the client setup, is `https://<active-preview-host>`. Do not add wildcards or alter Production OAuth settings. Set the paired `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` only for the intended Preview environment.
- If Deployment Protection blocks browser automation, use Vercel **Project Settings → Deployment Protection → Protection Bypass for Automation**. Create a dedicated secret; store it only in a local/CI secret manager and send it as `x-vercel-protection-bypass`. For browser follow-up requests, Vercel documents `x-vercel-set-bypass-cookie: true`. Never place the secret in source, URLs, screenshots, or logs. Alternatively, an authorized team member can use Vercel Authentication in the browser.
- Provider metadata or a correct redirect URI checks configuration only. Mark OAuth PASS only after completing the actual Google consent/callback/login flow on the Preview deployment.

## Current execution status

- Staging target guard and connection probe: **PASS** on 2026-10-15 using the ignored local `.env.staging.local`; only read-only `SELECT 1` ran. No data was changed. This does not verify application-level queries or deployed connectivity.
- Browser E2E and DB persistence scenarios: **NOT TESTED** pending Preview access and synthetic-account evidence. A prior Preview log showed a session-pool connection-limit error (`P2039`); its current status under relevant serverless concurrency is **NOT TESTED**.
- Google Preview OAuth: **NOT TESTED** pending the active Preview host and staging OAuth client configuration.
- Upload cap boundary unit tests: **PASS**; real Storage upload and image rendering in staging: **NOT TESTED**.
- Build: attempted on 2026-10-15 and stopped before compilation with `EPERM` unlinking `.next/app-path-routes-manifest.json`; no file cleanup or retry was performed. Next reported `.env.local` loaded, so the attempt is not treated as an isolated staging build. Dependency audit remains separate from this checklist.
