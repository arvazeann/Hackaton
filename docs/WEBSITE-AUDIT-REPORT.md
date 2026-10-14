# Website Audit Report — RuangLagi

**Audit date:** 2026-10-14<br>
**Target:** `https://ruanglagi.vercel.app/` and repository branch `qa-remediation-20261014`<br>
**Scope:** public read-only requests, static repository review, safe local checks. No production mutation, login, transaction, upload, migration, or deployment was performed.

## Executive summary

The live root, catalog, login, and registration pages return HTTP 200. The initial server-rendered HTML for both `/` and `/products` contained no product-card links or `<img>` elements. This is a verified empty-looking public catalog observation; whether Production has no active products, a query/runtime problem, or a deployment/data mismatch is unknown because Production database state and Vercel logs were not accessed.

The most actionable confirmed integration risk is that the upload endpoint accepts a 5 MB image, while Vercel Functions reject request bodies above 4.5 MB. Multipart overhead makes the effective maximum file smaller still. This means valid files near the app's stated limit may be rejected at the platform boundary before application validation. No code was changed because reducing the approved 5 MB limit or changing to direct-to-Storage uploads changes product behavior/architecture.

`npm audit` reports 15 advisories (2 Critical, 10 High, 3 Moderate); `npm audit --omit=dev` still reports 4 High findings in Prisma-related package paths. Unit tests and type/lint/format/schema checks pass. Staging verification is blocked because isolated staging identifiers/configuration are absent. A production build and browser interaction tests were not run. **Release status: NOT READY.**

## Pages and features examined

### Live HTTP checks

Requests were public GETs only. Statuses describe HTTP responses, not successful browser hydration or data correctness.

| URL                                                                         | Result                        | Notes                                                                                                                                      |
| --------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`                                                                         | 200, 34,613 bytes             | Title and Indonesian `lang` present; no product links or image tags in response HTML.                                                      |
| `/products`                                                                 | 200, 52,118 bytes             | No product links or image tags in response HTML.                                                                                           |
| `/login`, `/register`                                                       | 200                           | HTML is served; forms were not submitted.                                                                                                  |
| `/favorites`                                                                | 200, redirects to `/wishlist` | Alias behavior observed.                                                                                                                   |
| `/wishlist`, `/orders`, `/notifications`, `/profile`, `/dashboard/products` | 200                           | Page shell served; no authenticated session or protected content was exercised.                                                            |
| `/store/demo`                                                               | 200                           | Dynamic store page response; whether this slug exists was not verified.                                                                    |
| `/api/products` GET                                                         | 405                           | Expected from current code: this route implements POST only; public catalogue is server-rendered.                                          |
| `/api/auth/providers`                                                       | 200                           | Response lists `credentials` and `google`; proves provider configuration is active, not callback validity. No credential values were read. |
| `/api/mock`                                                                 | 404                           | Consistent with current repo; removed mock route is not deployed at this URL.                                                              |
| `/robots.txt`, `/sitemap.xml`                                               | 404                           | No corresponding route/file was found.                                                                                                     |

The home HTML includes the expected heading and section headings, but contains zero `<img>` tags and zero product-detail links. On this repository's `src/app/page.tsx`, a product image/card is rendered only when the product query returns an item. The live response is therefore consistent with an empty result, but cannot establish the Production database contents or prove that this exact branch is deployed.

### Repository feature inventory

The App Router includes public homepage/catalog/product/store routes; Auth.js login, registration, Credentials and optional Google; seller product create/edit/archive; favorites/wishlist; orders and state transitions; profile, address book, seller store and payment account; notifications; and admin overview/users/addresses/products/orders/audit logs. There is no cart, review, chat, email delivery, or payment gateway implementation in the route inventory.

Relevant implementation reviewed: `auth.ts`, `src/lib/session.ts`, `src/server/admin/authorization.ts`, API route handlers under `src/app/api/`, service modules under `src/server/services/`, `src/server/storage/supabase-image-storage.ts`, `src/app/api/uploads/route.ts`, `src/app/uploads/[filename]/route.ts`, `src/server/security/payment-encryption.ts`, `prisma/schema.prisma`, `next.config.ts`, `src/app/layout.tsx`, `package.json`, and `package-lock.json`.

## Findings

### BUG-01 — Medium — Vercel request ceiling conflicts with 5 MB server upload limit

- **Status:** Confirmed by repository code and Vercel documentation; actual user failure at the exact threshold was not exercised.
- **Evidence:** `src/app/api/uploads/route.ts` parses `request.formData()` and forwards the file to `saveImageToSupabase`. `src/server/storage/supabase-image-storage.ts` accepts files up to `IMAGE_MAX_BYTES`; `src/lib/product-images.ts` defines the existing 5 MB limit. The upload body passes through a Vercel Function. Vercel documents a 4.5 MB maximum request/response payload and returns 413 above it: [Vercel Function limitations](https://vercel.com/docs/functions/limitations), [Vercel guidance for large uploads](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions).
- **Reproduction:** From the deployed site, select a JPEG/PNG/WebP near the configured 5 MB cap and submit upload. A request body over 4.5 MB may receive platform `413 FUNCTION_PAYLOAD_TOO_LARGE` before route validation. Multipart headers/boundaries mean the file must be smaller than the request-body ceiling.
- **Impact:** Some files accepted by the UI/server validation contract cannot reach the Supabase upload code in production.
- **Recommendation:** Decide between a lower supported file cap with matching UI/schema copy, or a server-authorized direct-to-Supabase upload flow using short-lived/scoped authorization and owner/purpose metadata. Preserve server-side ownership validation and test actual Vercel behavior before release. No code change made because this requires an approved product/architecture choice.

### BUG-02 — Medium — Public production catalogue appears empty

- **Status:** Live response observation confirmed; root cause not verified.
- **Evidence:** GET `/` (200) and `/products` (200) each had zero rendered `<img>` tags and zero product-detail links. Current code in `src/app/page.tsx` and `src/app/products/page.tsx` obtains products from `listProducts` in `src/server/services/products.ts`.
- **Reproduction:** Open the public home and catalog URLs with no session; inspect the initial HTML for product links/images. Both were absent at audit time.
- **Impact:** Anonymous buyers cannot discover products if the browser view matches the returned HTML.
- **Possible causes:** No active production products, database/query failure handled by an empty state, or the live deployment differs from this branch. These are hypotheses only.
- **Recommendation:** In Vercel deployment logs, inspect server errors for `listProducts`; use a read-only Production query to count active products and compare the deployed commit. Do not seed or modify Production as a diagnostic.

### SEC-01 — High — Dependency advisories remain in the locked dependency tree

- **Status:** Confirmed by `npm audit` against the current lockfile on 2026-10-14.
- **Evidence:** Full audit: 15 findings (2 Critical, 10 High, 3 Moderate). `npm audit --omit=dev`: 4 High (Prisma-related paths: `@prisma/config`, `deepmerge-ts`, `mysql2`, `prisma`). Installed relevant versions include Next 16.4.0, Prisma / `@prisma/client` 7.10.0, Vitest 2.1.9, Vite 5.4.21, Tinypool 1.1.1. No fix or upgrade was applied. This audit does not prove exploitability on the deployed request path; assess dependency reachability and compatible patched versions before release.
- **Impact:** Known vulnerable code exists in the resolved dependency tree, including paths included by the production-only audit. The dev dependency advisories also affect developer/CI environments.
- **Recommendation:** Review the current npm advisory remediation paths in an isolated branch; keep framework/Prisma compatibility, run tests and build after changes, and do not blindly apply major downgrade suggestions.

### SEC-02 — Low — Several browser hardening response headers are absent

- **Status:** Observed on the public root response; no exploit was attempted.
- **Evidence:** HTTPS response included `Strict-Transport-Security`. It did not include `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, or `Permissions-Policy`. No response-header configuration was found in `next.config.ts`.
- **Impact:** Reduced defense in depth against content injection, framing, MIME sniffing, and referrer leakage. This observation alone does not establish an exploitable application vulnerability.
- **Recommendation:** Add a policy after assessing Auth.js, Next.js scripts, Supabase images, and any required embedding; verify it against production routes before enforcing CSP.

### SEO-01 — Low — Canonical/social metadata and crawler endpoints are missing

- **Status:** Confirmed in live HTML and repository inventory.
- **Evidence:** Root and catalog HTML had title/description but no canonical or Open Graph tags. `/robots.txt` and `/sitemap.xml` returned 404. `src/app/layout.tsx` defines title and description only; no sitemap/robots app route was found.
- **Impact:** Weaker link previews and crawler discovery; not a transaction blocker.
- **Recommendation:** Add canonical metadata for public routes plus appropriate Open Graph/Twitter metadata and generated robots/sitemap if public search indexing is desired.

### OAuth / Supabase / payments — unresolved integration verification

- Live `/api/auth/providers` shows Google enabled. This does not prove the callback URI currently registered with Google. The prior QA report documented a `redirect_uri_mismatch` for a temporary Vercel deployment URL; that is historical evidence and is not proof that the current stable production callback fails. A login attempt and Google Cloud Console check were not performed.
- Supabase bucket existence/public-read configuration, current server key validity, image GET/HEAD/redirect behavior, upload persistence after redeploy, and database migration state were not checked. Public HTML had no product images, so no live image URL could be inspected.
- Code review found server-only Supabase variables and authenticated upload handling. Uploads store owner/purpose metadata; product services validate image ownership/purpose and storage existence. Replacement cleanup checks remaining database references before deleting Supabase objects. Unit tests mock external storage; this audit did not verify these behaviors against an isolated staging project.
- Payment code supports distinct v1/v2 AES-256-GCM keys; tests use synthetic data. The staging guard exited before database connection because staging and production project references are not configured. No key rotation or re-encryption was run.

## UI/UX, accessibility, and performance

- The live response is Indonesian (`<html lang="id">`), has a document title and description, and presents the expected homepage headings. No visual layout, mobile viewport, keyboard sequence, focus behavior, form validation, hydration, or console test was possible because browser automation is unavailable.
- Source review found image alt text in the product card, store and uploader components; accessible labels/roles and focus-visible styles are used in several controls. This static inspection is not an accessibility conformance test.
- Homepage response was 34,613 bytes and catalog response 52,118 bytes as received by PowerShell. No Lighthouse/Web Vitals, asset transfer-size, CPU, load, or image optimization measurement was run. The only HTML images observed were zero; product-image performance cannot be evaluated from this empty-looking result.
- Next.js hosted fonts use `next/font`; `src/app/layout.tsx` declares title/description. No `robots.txt` or sitemap exists.

## Verification matrix

| Check                                                     | Status     | Evidence / limitation                                                                                                                                          |
| --------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Git branch/status                                         | PASS       | `qa-remediation-20261014`, clean and tracking `origin/qa-remediation-20261014` at audit start.                                                                 |
| Public HTTP page checks                                   | PASS       | Read-only GETs listed above; this means responses arrived, not that UI interactions work.                                                                      |
| Browser desktop/mobile, JS, keyboard, console, form flows | NOT TESTED | No browser automation tool available.                                                                                                                          |
| `npm test -- --reporter=dot`                              | PASS       | 39 files, 206 tests. Vite CJS Node API deprecation warning. Unit/mocked tests only.                                                                            |
| `npm run typecheck`                                       | PASS       | `tsc --noEmit`.                                                                                                                                                |
| `npm run lint`                                            | PASS       | ESLint.                                                                                                                                                        |
| `npm run format:check`                                    | PASS       | Prettier check.                                                                                                                                                |
| `npm run db:validate`                                     | PASS       | Prisma schema validation; no database connection.                                                                                                              |
| `npm audit --json`                                        | FAIL       | 15 advisories: 2 Critical, 10 High, 3 Moderate.                                                                                                                |
| `npm audit --omit=dev --json`                             | FAIL       | 4 High findings in Prisma-related paths.                                                                                                                       |
| `npm run staging:verify`                                  | BLOCKED    | Guard stopped: distinct staging and production project refs are required. No database connection.                                                              |
| Production DB/schema/migration verification               | NOT TESTED | Would require a safe read-only Production database connection; none performed.                                                                                 |
| Supabase Storage live integration/redeploy persistence    | NOT TESTED | No isolated staging project/bucket credentials verified; no Production upload.                                                                                 |
| Google OAuth current callback                             | NOT TESTED | Provider is configured; provider console and callback completion unavailable/not attempted.                                                                    |
| Production build                                          | BLOCKED    | Local Next.js server process is listening on port 3000 and owns this repository's `.next` runtime; build was not started to avoid disturbing live local files. |
| Production data-changing E2E                              | BLOCKED    | No isolated staging database/bucket is configured; Production writes were prohibited.                                                                          |
| Live browser / performance / accessibility tooling        | NOT TESTED | No browser automation or Lighthouse runner configured/connected.                                                                                               |

## Files changed and regression

- Added this report: `docs/WEBSITE-AUDIT-REPORT.md`.
- Updated `README.md` with this audit's current state and verification outcome.
- No application source, schema, migration, environment file, dependency, Production data, or deployment setting changed. No regression tests were added because no application code changed.

## Prioritized recommendations

1. Resolve the Vercel upload-size mismatch without silently changing the agreed 5 MB product limit; then run an isolated staging upload test near the boundary.
2. Determine why the public live catalog response contains no products/images using Vercel logs and a read-only active-product count; check the actual deployed commit.
3. Triage the 4 production-only High audit findings and the full dependency audit; prepare compatible fixes in isolation and rerun full validation/build.
4. Configure a separate Supabase staging project/database/bucket and verify their project IDs differ from Production before integrations or mutations.
5. Test Google OAuth against the stable production callback and the configured OAuth client; update exact redirect URI if required.
6. Verify public image retrieval, authenticated owner uploads, replacement/deletion, and image persistence after a staging redeploy.
7. Decide whether SEO metadata/crawler endpoints and browser security headers are required; add and verify them without breaking Auth.js or image delivery.
8. Once staging and browser tooling exist, complete desktop/mobile keyboard/form/E2E checks and a production build in an isolated workspace.

## Release status

**NOT READY.** The public catalog appears empty in returned HTML; uploads near the configured cap conflict with Vercel's request ceiling; the production-only dependency audit still has four High findings; and OAuth, Supabase, database state, build, and browser/integration behavior remain unverified.
