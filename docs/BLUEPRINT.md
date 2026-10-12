# Blueprint v1.1 — Marketplace Preloved

> Location: `docs/BLUEPRINT.md`
> Role: detailed specification and source of truth for approved requirements (see `AGENTS.md` §3 and §14).
> Companion files: `AGENTS.md` (agent rules), `README.md` (current status and handoff).

## 0. How to Read This Document

Every rule carries a status tag so agents never confuse approved rules with drafts.

| Tag            | Meaning                                                                                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[APPROVED]** | Approved by the user. Must be followed. Changing it requires explicit user approval.                                                                                               |
| **[PROPOSED]** | Draft written to complete the blueprint. Not yet approved. Do not treat as final. Confirm with the user before relying on it for architecture, security, privacy, or UX decisions. |
| **[TODO]**     | Unresolved decision. Ask the user before implementing.                                                                                                                             |

Rules for agents:

- Do not silently change an **[APPROVED]** rule.
- Do not implement a **[PROPOSED]** or **[TODO]** item in a way that is hard to reverse without asking the user.
- When a proposed item is approved, change its tag to **[APPROVED]** and add a line to the Changelog (§17).
- If implementation conflicts with this document, record the conflict in `README.md` under Known Issues and TODO instead of editing this file silently.

---

## 1. Product Overview

**[APPROVED]** A preloved (second-hand) marketplace MVP built with Next.js. Sellers list used items. Buyers browse active listings and place orders. Sellers confirm or reject orders, and contact details are revealed to the seller progressively as the order advances.

### 1.1 Goals

- **[APPROVED]** Deliver a working MVP of browse, list, order, and manage-order flows.
- **[APPROVED]** Protect personal information with least-privilege access.
- **[PROPOSED]** Keep the architecture simple enough for a small team to maintain.

### 1.2 Non-Goals for the MVP

- **[PROPOSED]** In-app payment processing. Payment and shipment are arranged between buyer and seller outside the app.
- **[PROPOSED]** Real-time chat, reviews and ratings, wishlists, promotions, and shipping-carrier integration.
- **[PROPOSED]** Admin or moderation dashboard.

### 1.3 Glossary

| Term              | Meaning                                                                        |
| ----------------- | ------------------------------------------------------------------------------ |
| Product           | An item listed for sale by a seller.                                           |
| Order             | A buyer's request to purchase a product, with shipping details.                |
| DTO               | Data Transfer Object: the typed shape sent between server and client.          |
| Seller-facing DTO | An order DTO returned to the seller of that order.                             |
| Mock layer        | Centralized functions in `src/lib/mock/` that return fake data during Stage 1. |

---

## 2. Tech Stack

**[APPROVED]** Follow the versions and configuration already established in the repository. Do not replace libraries, upgrade dependencies, or add dependencies without a clear technical reason.

| Area               | Choice                                    |
| ------------------ | ----------------------------------------- |
| Framework          | Next.js App Router                        |
| Language           | TypeScript (strict mode)                  |
| Styling            | Tailwind CSS, shadcn/ui where appropriate |
| Validation         | Zod                                       |
| Forms              | React Hook Form with Zod resolver         |
| Database           | PostgreSQL                                |
| ORM and migrations | Prisma                                    |
| Authentication     | Auth.js Credentials with JWT sessions     |
| Image storage      | Cloudflare R2 (planned)                   |
| Testing            | Vitest                                    |

> Note for agents: this Next.js version may have breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing code (see `AGENTS.md`).

---

## 3. Users and Roles

### 3.1 Roles

- **[APPROVED]** The system distinguishes **buyers** and **sellers** for order access rules.
- **[APPROVED]** One account may act as both buyer and seller. "Buyer" and "seller" are determined per order: the seller owns the product, the buyer placed the order. A user can never order their own product.
- **[APPROVED]** Unauthenticated visitors may browse active products and view product details. Ordering requires login.

### 3.2 Permission Matrix

| Action                                                                         | Visitor | Buyer (of the order)                    | Seller (of the product)                       |
| ------------------------------------------------------------------------------ | ------- | --------------------------------------- | --------------------------------------------- |
| Browse active products                                                         | Yes     | Yes                                     | Yes                                           |
| View product detail (any status)                                               | Yes     | Yes                                     | Yes                                           |
| Place an order on an `active` product                                          | No      | Yes                                     | No (own product)                              |
| Place an order on `reserved` or `sold` product                                 | No      | No                                      | No                                            |
| View own shipping info on an order                                             | No      | Yes                                     | No                                            |
| View `shippingName`                                                            | No      | Yes                                     | Yes, from `pending` onward                    |
| View `shippingPhone` and `shippingAddress`                                     | No      | Yes (own)                               | Only when order is `confirmed` or `completed` |
| Create, edit, delete own product                                               | No      | No                                      | Yes                                           |
| Confirm or reject a `pending` order                                            | No      | No                                      | Yes                                           |
| Cancel an order                                                                | No      | **[APPROVED]** `pending` or `confirmed` | **[APPROVED]** `confirmed`                    |
| **[APPROVED for Stage 6]** Add or remove a favorite for a non-archived product | No      | Yes (own account)                       | Yes (own account)                             |
| **[APPROVED for Stage 6]** View or edit own profile                            | No      | Yes                                     | Yes                                           |

The visibility rows in §8 and rules explicitly tagged **[APPROVED]** are final. Other rows remain **[PROPOSED]**.

---

## 4. Domain Model

### 4.1 Entities

**User**

| Field                    | Type                  | Notes                                                                   |
| ------------------------ | --------------------- | ----------------------------------------------------------------------- |
| `id`                     | string (cuid or uuid) | **[PROPOSED]**                                                          |
| `name`                   | string                |                                                                         |
| `email`                  | string, unique        | Login identifier. **[PROPOSED]**                                        |
| `phone`                  | string, nullable      | Never exposed in public product DTOs.                                   |
| `city`                   | string, nullable      | Editable in the account owner's profile.                                |
| `avatarKey`              | string, nullable      | Account-owned uploaded image key; replaced files are not automatically deleted. **[APPROVED for Stage 6 follow-up B1]** |
| `bio`                    | string, nullable      | Maximum 300 characters. **[APPROVED for Stage 6 follow-up B1]**        |
| `passwordHash`           | string                | **[APPROVED]** Never exposed to the client or in any client-facing DTO. |
| `createdAt`, `updatedAt` | datetime              |                                                                         |

**Product**

| Field                    | Type                             | Notes                                                                |
| ------------------------ | -------------------------------- | -------------------------------------------------------------------- |
| `id`                     | string                           |                                                                      |
| `sellerId`               | string                           | FK to User                                                           |
| `title`                  | string                           |                                                                      |
| `description`            | string                           |                                                                      |
| `price`                  | integer (smallest currency unit) | **[APPROVED]** IDR stored as integer rupiah, no decimals             |
| `condition`              | enum                             | **[TODO]** values; **[PROPOSED]** `like_new`, `good`, `fair`, `worn` |
| `category`               | enum or relation                 | **[TODO]** category list                                             |
| `status`                 | enum                             | **[APPROVED]** `active`, `reserved`, `sold`                          |
| `images`                 | list of image refs               | Cloudflare R2 keys or URLs (planned)                                 |
| `createdAt`, `updatedAt` | datetime                         |                                                                      |

**Order**

| Field                    | Type             | Notes                                                                                                                |
| ------------------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| `id`                     | string           |                                                                                                                      |
| `productId`              | string           | FK to Product                                                                                                        |
| `buyerId`                | string           | FK to User                                                                                                           |
| `sellerId`               | string           | FK to User (denormalized from product for access checks). **[APPROVED]** Set from the product owner in the database. |
| `status`                 | enum             | **[APPROVED]** `pending`, `confirmed`, `completed`, `cancelled`, `rejected`                                          |
| `shippingName`           | string           |                                                                                                                      |
| `shippingPhone`          | string           | Stored in full; nullable in DTO per §8.                                                                              |
| `shippingAddress`        | string           | Stored in full; nullable in DTO per §8.                                                                              |
| `cancelReason`           | string, nullable | Database column `cancel_reason`. **[APPROVED]** required when status is `cancelled`. 5–500 characters.               |
| `paymentInstructionCiphertext`, `paymentAccountNumberLast4` | string, nullable | Encrypted confirmation-time payment snapshot; legacy orders remain null. **[APPROVED for Stage 6 follow-up B1]** |
| `createdAt`, `updatedAt` | datetime         |                                                                                                                      |

**Favorite**

| Field       | Type     | Notes                                                   |
| ----------- | -------- | ------------------------------------------------------- |
| `userId`    | UUID     | **[APPROVED for Stage 6]** From the authenticated user. |
| `productId` | UUID     | **[APPROVED for Stage 6]** Database product ID.         |
| `createdAt` | datetime |                                                         |

**[APPROVED for Stage 6]** A user may have at most one favorite row per product. The existing composite key and foreign keys are used without schema changes.

**[APPROVED for Stage 6 follow-up B1] Address** stores a user's `SHIPPING` or `PICKUP` contact/address, label, default flag, and timestamps. Limits are 10 shipping addresses and one pickup address per user; at most one address per kind may be default. Orders keep immutable shipping snapshots.

**[APPROVED for Stage 6 follow-up B1] SellerProfile** is a private seller activation/profile keyed by User, with unique immutable slug, store name, description (maximum 500), optional logo, city, and nullable province for backfilled sellers. New activation requires province. Existing product owners are backfilled from account name with a collision-safe URL slug.

**[APPROVED for Stage 6 follow-up B1] PaymentAccount** belongs to SellerProfile and stores type (`BANK` or `EWALLET`), provider, encrypted account number, separate last four digits, account holder, active flag, and timestamps. Delete means soft deactivation; at most three accounts may be active.

**[APPROVED for Stage 6 follow-up B1] UploadedFile** records key, session owner, purpose (`AVATAR`, `LOGO`, `PRODUCT`), and creation time. `/api/uploads` writes this ownership metadata. Avatar/logo assignment checks that the key belongs to the session user and has the matching purpose. Replacing an avatar or logo does not hard-delete its file; orphan cleanup is a TODO. Product image ownership validation remains a TODO; the existing product image flow only records upload ownership.

### 4.2 Relationships

- **[APPROVED]** User 1—N Product (as seller).
- **[APPROVED]** User 1—N Order as buyer and User 1—N Order as seller.
- **[APPROVED]** Product 1—N Order over time, but at most one open order (`pending` or `confirmed`) per product at a time (see §6.4).
- **[APPROVED for Stage 6 follow-up B1]** User 1—N Address and UploadedFile; User 1—1 SellerProfile; SellerProfile 1—N PaymentAccount.

### 4.3 Database Rules

- **[APPROVED]** PostgreSQL via Prisma. Schema lives in `prisma/schema.prisma`; migrations through Prisma Migrate.
- **[APPROVED]** An order with status `cancelled` must have a non-empty `cancel_reason`. Enforce in the service layer and, where practical, with a database check constraint.
- **[PROPOSED]** Add indexes on `Product.status`, `Product.sellerId`, `Order.buyerId`, `Order.sellerId`, and `Order.status`.
- **[PROPOSED]** Use soft rules (status changes) rather than hard deletes for orders. Deleting a product with orders is blocked.
- **[APPROVED]** Never modify `prisma/` during Stage 1.

---

## 5. Product Rules

- **[APPROVED]** Public product listings show only products with status `active`.
- **[APPROVED]** Products with status `reserved` or `sold` may be viewed (by direct link) but cannot be ordered. The order action must be disabled in the UI and rejected by the service layer.
- **[APPROVED]** Public product DTOs never include the seller's phone number.
- **[APPROVED]** Product status transitions: `active → reserved` when an order is confirmed; `reserved → sold` when the order is completed; `reserved → active` when a confirmed order is cancelled. The seller may not set `sold` manually while an order is open.
- **[PROPOSED]** A seller may edit a product only while it is `active`.

### 5.1 Product Query

**[APPROVED]** Pagination:

- Default page size: **12**.
- Maximum page size: **48**.
- Requests above 48 must be rejected or clamped (**[TODO]** choose one; **[PROPOSED]** reject with a validation error).

**[PROPOSED]** Query parameters: `page` (default 1), `pageSize`, `q` (search text), `category`, `minPrice`, `maxPrice`, `condition`, `sort` (`newest`, `price_asc`, `price_desc`). The query schema is `.strict()`.

---

## 6. Order Rules

### 6.1 Statuses

**[APPROVED]** `pending`, `confirmed`, `completed`, `cancelled`, `rejected`.

### 6.2 State Machine

**[APPROVED]** Order actions must respect the state machine and the user's role.

| From                                 | To          | Triggered by    | Requirements                                                    |
| ------------------------------------ | ----------- | --------------- | --------------------------------------------------------------- |
| `pending`                            | `confirmed` | Seller          | Product is `active`. Product becomes `reserved`.                |
| `pending`                            | `rejected`  | Seller          | Rejection reason is optional.                                   |
| `pending`                            | `cancelled` | Buyer           | Valid cancel reason (5–500 chars). Product remains `active`.    |
| `confirmed`                          | `completed` | Seller          | Product becomes `sold`.                                         |
| `confirmed`                          | `cancelled` | Buyer or seller | Valid cancel reason (5–500 chars). Product returns to `active`. |
| `completed`, `cancelled`, `rejected` | —           | —               | Terminal. No further transitions.                               |

```
pending ──► confirmed ──► completed
   │            │
   │            └──► cancelled
   ├──► rejected
   └──► cancelled
```

### 6.3 Cancellation

- **[APPROVED]** Cancellation requires a reason of **5–500 characters**.
- **[APPROVED]** The cancellation dialog must require a valid reason; the confirm action stays disabled until the reason is valid.
- **[APPROVED]** An order with status `cancelled` must have `cancel_reason`.
- **[APPROVED]** Buyer may cancel a `pending` order. Buyer or seller may cancel a `confirmed` order. Both require a valid reason.

### 6.4 Concurrency and Integrity

- **[APPROVED]** Only one open order (`pending` or `confirmed`) may exist per product.
- **[APPROVED]** Status changes that affect product status run inside a database transaction that also updates the product status, with a check on the current status to prevent double transitions.

### 6.5 Shipping Information

- **[APPROVED]** The buyer supplies `shippingName`, `shippingPhone`, and `shippingAddress` when placing the order. All three are required at creation and validated by Zod.

---

## 7. Data Contracts (Zod Schemas and DTOs)

### 7.1 General

- **[APPROVED]** Approved Zod schemas and DTOs are the frontend/backend contract.
- **[APPROVED]** Use `.strict()` for the Zod object schemas specified by this blueprint.
- **[APPROVED]** Never weaken validation merely to make a form pass.
- **[APPROVED]** Keep mock data consistent with the approved DTO definitions.
- **[PROPOSED]** Locations: Zod schemas in `src/schemas/`, inferred and hand-written DTO types in `src/types/`. Prefer `z.infer` so schema and type cannot drift.

### 7.2 DTO Definitions

**[APPROVED] constraints** are marked; the rest is **[PROPOSED]**.

**`UserDTO`** (client-facing)

```ts
type UserDTO = {
  id: string;
  name: string;
  email: string;
  // NEVER include passwordHash. [APPROVED]
};
```

**`ProductDTO`** (public)

```ts
type ProductDTO = {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  status: "active" | "reserved" | "sold";
  images: string[];
  seller: { id: string; name: string }; // NEVER include seller phone. [APPROVED]
  isFavorited: boolean; // viewer-specific; derived from the database for signed-in users [APPROVED for Stage 6]
  createdAt: string;
};
```

**`OrderDTO`**

```ts
type OrderDTO = {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected";
  shippingName: string;
  shippingPhone: string | null; // nullable [APPROVED]
  shippingAddress: string | null; // nullable [APPROVED]
  cancelReason: string | null; // nullable [APPROVED]
  createdAt: string;
  updatedAt: string;
  paymentInstruction: { providerName: string; accountHolderName: string; accountNumber: string } | null;
  paymentAccountNumberLast4: string | null;
};
```

**[APPROVED for Stage 6 follow-up B1]** `PaymentAccount.accountNumber` and the complete order payment snapshot are encrypted at rest with AES-256-GCM via `node:crypto` (no added dependency). Use a random 12-byte IV for every encryption and store a key-version prefix with the ciphertext for future rotation. The server-only `PAYMENT_ENCRYPTION_KEY` is base64-encoded and must decode to exactly 32 bytes; validate it with Zod at server startup and fail fast when missing or invalid. Include only an empty setting and a local generation command in `.env.example`; never log the key or plaintext. Store `accountNumberLast4` separately so account lists never decrypt. Decryption belongs in the service layer and only in DTOs allowed to show the full number.

### 7.3 Key Schemas

| Schema                          | Rules                                                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `ProductQuerySchema`            | `.strict()`. `pageSize` default 12, max 48. **[APPROVED]**                                                        |
| `CancelOrderSchema`             | `.strict()`. `reason`: trimmed string, min 5, max 500. **[APPROVED]**                                             |
| `CreateOrderSchema`             | `.strict()`. `productId`, `shippingName`, `shippingPhone`, `shippingAddress`. All fields required. **[APPROVED]** |
| `CreateProductSchema`           | `.strict()`. Title, description, price, condition, category, images. **[PROPOSED]** field limits                  |
| `RegisterSchema`, `LoginSchema` | `.strict()`. Email and password. **[PROPOSED]** password minimum length (e.g. 8)                                  |

### 7.4 Contact Visibility in DTOs

See §8. The service layer builds the DTO per viewer; it must not return the full order and rely on the UI to hide fields.

---

## 8. Privacy and Security

### 8.1 Principles

- **[APPROVED]** Apply least-privilege access and minimize exposure of personal information.
- **[APPROVED]** Frontend visibility controls are never authorization. Enforce rules in the service layer.
- **[APPROVED]** Never expose secrets, credentials, or private environment variables to client-side code.

### 8.2 Order Contact Visibility

**[APPROVED]**

| Order status | Buyer (own order) | Seller: `shippingName` | Seller: `shippingPhone` and `shippingAddress` |
| ------------ | ----------------- | ---------------------- | --------------------------------------------- |
| `pending`    | Visible           | Visible                | `null`                                        |
| `confirmed`  | Visible           | Visible                | Visible                                       |
| `completed`  | Visible           | Visible                | Visible                                       |
| `cancelled`  | Visible           | Visible                | `null`                                        |
| `rejected`   | Visible           | Visible                | `null`                                        |

- Buyers may always view their own shipping information.
- In seller-facing DTOs, phone and address must be `null` for `pending`, `cancelled`, and `rejected` orders.
- Enforce in the service layer when backend services are implemented.

**[APPROVED for Stage 6 follow-up B1] Payment instruction visibility:** buyer and seller participants receive the decrypted payment snapshot only for `confirmed` and `completed` orders. For `pending`, `cancelled`, and `rejected`, it is `null`. Existing confirmed/completed orders have no snapshot backfill; buyer UI displays “Contact the seller for payment details.”

### 8.3 Other Rules

- **[APPROVED]** `passwordHash` is never sent to the client.
- **[APPROVED]** Seller phone numbers are never included in public product DTOs.
- **[PROPOSED]** Every service function receives the authenticated user and checks ownership and role before reading or writing.
- **[PROPOSED]** Do not log phone numbers, addresses, passwords, or tokens.
- **[PROPOSED]** Add rate limiting to login and registration before launch (Stage 8).
- **[PROPOSED]** Environment variables are validated at startup with Zod; only `NEXT_PUBLIC_` variables may reach the client.

---

## 9. Authentication and Session (Stage 3)

- **[APPROVED]** Auth.js with the Credentials provider and JWT sessions.
- **[PROPOSED]** Registration with email and password; passwords hashed with a strong adaptive hash (argon2id or bcrypt).
- **[PROPOSED]** The JWT contains only `id` (and role data if any). No `passwordHash`, phone, or address.
- **[PROPOSED]** Protected routes (create product, my products, my orders, place order) redirect unauthenticated users to login and return them afterward.
- **[PROPOSED]** Server actions and services read the session on the server; never trust a user id sent from the client.
- **[PROPOSED]** Generic error messages on failed login (do not reveal whether the email exists).
- **[TODO]** Email verification and password reset are out of scope unless approved.

---

## 10. Image Storage

- **[APPROVED]** Cloudflare R2 is the planned storage.
- **[APPROVED]** Stage 1 image upload components use **local previews only**; no files are uploaded anywhere.
- **[APPROVED — interim demo storage, 2026-10-13]** After Stage 1, seller-selected product images are stored on the app owner's local machine outside `public/`. The server-only `UPLOAD_DIR` setting selects the directory and defaults to `./storage/uploads`.
- **[APPROVED — interim demo storage]** Accept JPEG, PNG, and WebP only, at most 5 MB per file and 5 images per product. The server checks file signatures, generates UUID filenames, and stores only generated filename keys in the database. Public image URLs are served through a validated same-origin route; filesystem paths are never returned to clients.
- **[APPROVED — interim demo storage]** Local disk is for a single-machine demo and is not a production or multi-instance storage design. Cloudflare R2 remains the planned production solution.
- **[PROPOSED]** Real upload (later stage) uses presigned URLs generated server-side; R2 credentials never reach the client.
- **[PROPOSED]** Limits: JPEG, PNG, or WebP; max 5 MB each; max 5 images per product. Validate type and size on the server.
- **[PROPOSED]** Store object keys in the database; build public URLs at read time.

---

## 11. UI and UX

### 11.1 Global Rules

- **[APPROVED]** Layouts work on mobile, tablet, and desktop.
- **[APPROVED]** Consistent spacing, typography, colors, and component variants.
- **[APPROVED]** Visible validation errors and useful feedback.
- **[APPROVED]** Handle loading, empty, error, and success states where relevant.
- **[APPROVED]** Disabled actions cannot be triggered through the UI.
- **[APPROVED]** Semantic HTML and accessible form controls.
- **[APPROVED]** Do not redesign unrelated pages when implementing a narrowly scoped request.

### 11.2 Pages

All route names are **[PROPOSED]**.

| Route                             | Purpose                                                         | Auth               |
| --------------------------------- | --------------------------------------------------------------- | ------------------ |
| `/`                               | Home with featured and latest active products                   | Public             |
| `/products`                       | Product listing with search, filters, pagination                | Public             |
| `/products/[id]`                  | Product detail; order button disabled for `reserved` and `sold` | Public             |
| `/products/new`                   | Create product (with local image preview in Stage 1)            | Seller             |
| `/products/[id]/edit`             | Edit own product                                                | Seller             |
| `/my/products`                    | Seller's own products and status                                | Logged in          |
| `/orders/new` or dialog on detail | Place order with shipping form                                  | Logged in          |
| `/my/orders`                      | Buyer's orders                                                  | Logged in          |
| `/seller/orders`                  | Orders received by the seller                                   | Logged in          |
| `/orders/[id]`                    | Order detail with role-aware actions                            | Order participants |
| `/login`, `/register`             | Authentication                                                  | Public             |
| `/profile`                        | Account, address book, private seller profile, payment accounts, buyer/seller overview | Logged in |

### 11.3 Order Actions by Role

- **[APPROVED]** Actions shown must match the state machine (§6.2) and the viewer's role.
- **[APPROVED]** The cancellation dialog requires a valid reason (5–500 characters) before the confirm button is enabled.

---

## 12. Architecture and Module Boundaries

### 12.1 Directory Layout

Adjust to the real repository; this is **[PROPOSED]** except where noted.

```
src/
  app/                    UI routes (App Router)           [APPROVED boundary]
  components/             Reusable UI components           [APPROVED boundary]
  schemas/                Zod schemas                      [APPROVED boundary]
  types/                  DTO and shared types             [APPROVED boundary]
  lib/seed-data.ts        Seed fixtures, not used by runtime UI
  server/
    services/             Business logic and authorization
    actions/              Server actions (thin; call services)
prisma/
  schema.prisma           Database schema
docs/
  BLUEPRINT.md            This file
```

### 12.2 Layering

- **[APPROVED]** Use server components by default; add `"use client"` only when interaction requires it.
- **[APPROVED]** Keep business logic out of presentation components when practical.
- **[APPROVED for Stage 6]** Server components read through Prisma services. Client mutations use domain Route Handlers (`/api/products`, `/api/orders`, `/api/favorites`, `/api/profile`) that verify the session, validate with Zod, and call services. Services enforce ownership and business rules and return safe DTOs.
- **[APPROVED]** During Stage 1, mock data is accessed only through a centralized function layer (e.g. `getProducts()`, `getProductById()`, `getOrders()`, `getOrderById()`), adapted to repository naming. UI components never import mock data directly.
- **[APPROVED]** The temporary `/api/mock` endpoint was removed in Stage 6 after all runtime callers moved to domain routes.
- **[APPROVED for Stage 6]** Runtime UI for products, orders, favorites, and profiles uses Prisma services; seed fixtures remain separate from runtime data access.

---

## 13. Implementation Stages

**[APPROVED]** Work only on the stage the user explicitly requests. Never start a later stage automatically. Stage status lives in `README.md`.

| Stage | Name                                                   | Status of definition                       |
| ----- | ------------------------------------------------------ | ------------------------------------------ |
| 0     | Project setup and foundational configuration           | **[APPROVED]**                             |
| 1     | Frontend, schemas, DTOs, mock data, UI navigation      | **[APPROVED]**                             |
| 2     | Database, Prisma, migration, and seed                  | **[APPROVED]** (name from project history) |
| 3     | Authentication and session                             | **[APPROVED]** (name from project history) |
| 4     | Product services and actions                           | **[PROPOSED]**                             |
| 5     | Order services, state machine, and privacy enforcement | **[APPROVED]**                             |
| 6     | Full migration from mock to Prisma; domain API routes  | **[APPROVED]**                             |
| 7     | Image upload to Cloudflare R2                          | **[PROPOSED]** (local-disk interim approved separately) |
| 8     | Hardening, tests, deployment readiness                 | **[PROPOSED]**                             |

### Stage 0 — Setup **[APPROVED]**

- Scope: project scaffold, TypeScript strict, Tailwind, shadcn/ui, lint and format, Vitest.
- Done when: app builds and lint passes on a clean checkout.

### Stage 1 — Frontend with Mock Data **[APPROVED]**

- Scope: pages and navigation, Zod schemas, DTO types, centralized mock accessors, forms with React Hook Form, local image previews.
- Out of scope: real auth, database access, file uploads, backend infrastructure, changes to `prisma/`.
- Boundaries: `src/app/`, `src/components/`, `src/schemas/`, `src/types/`, `src/lib/mock/`, and explicitly permitted supporting files.
- Done when: all pages in §11.2 work with mock data, schemas validate per §7, cancellation dialog enforces §6.3, and typecheck, lint, tests, and build are run and reported.

### Stage 2 — Database **[APPROVED]**

- Scope: `prisma/schema.prisma` matching §4, initial migration, seed data consistent with DTOs.
- Done when: migration applies cleanly to a fresh PostgreSQL database and seed runs.

### Stage 3 — Authentication and Session **[APPROVED]**

- Scope: Auth.js Credentials, JWT session, register and login, route protection, session helper for server code (§9).
- Out of scope: product and order services, image upload.
- Done when: users can register, log in, log out, and protected routes behave correctly; `passwordHash` never reaches the client.

### Stage 4 — Product Services and Actions **[PROPOSED]**

- Scope: `src/server/services/` and `actions/` for create, read, update, and list products with pagination (§5.1), ownership checks, public DTO without seller phone.
- Done when: listing returns only `active` products and ownership rules are covered by tests.

### Stage 5 — Order Services **[APPROVED]**

- Scope: place order, confirm, reject, cancel, complete; state machine and product status coupling in transactions; viewer-specific DTOs per §8.2.
- Done when: tests cover every transition, forbidden transition, cancel reason validation, and every row of the §8.2 visibility table.

### Stage 6 — Full Migration from Mock to Prisma **[APPROVED]**

- Scope: migrate favorites and profile to Prisma; move product/order mutations to per-domain API routes; remove `/api/mock` and unused mock runtime; preserve seed fixtures separately; disable favorite actions for visitors.
- Done when: no runtime UI or mutation path reads/writes mock product, order, favorite, or profile data; domain routes authenticate and validate input; service tests cover favorite/profile ownership and privacy; `/api/mock` and `postMock` have no runtime references; seed fixtures remain available without a mock store.

### Stage 6 follow-up: B1 — Profile Hub Core **[APPROVED]**

- Scope: account profile/avatar/bio/password, address book, seller activation/private profile, encrypted payment accounts and order payment snapshots, buyer/seller dashboard aggregates, saved-address checkout prefill, and uploaded-file ownership metadata.
- Existing product owners receive a backfilled SellerProfile with account name and collision-safe slug; province remains nullable until the seller completes the profile. New product creation requires a complete active store. New order confirmation requires an active payment account.
- Payment account deletion is soft deactivation and the limit of three applies to active accounts. Existing confirmed/completed orders receive no payment snapshot backfill. Editing/deleting source addresses or payment accounts never changes order snapshots.
- Migration backfill blocks reserved URL words and generates lowercase URL-safe unique slugs with collision-safe suffixes. It takes the account name for the store name and permits a null province; new activation requires a province, and backfilled sellers are prompted to complete their store profile. Seeded seller profiles mirror that nullable-province state.
- Sellers with pending orders and no active payment account see a dashboard banner explaining that confirmation is blocked and linking to payment account management. Pre-feature confirmed/completed orders keep a null payment snapshot; buyers see a neutral contact-the-seller message. Upload ownership tests cover foreign-owner and wrong-purpose avatar/logo assignments.
- **[APPROVED] User decisions for B1:** (1) Encrypt payment account numbers and order payment snapshots at rest with AES-256-GCM using `node:crypto`, random 12-byte IVs, a version prefix, and a server-only base64 32-byte key validated with Zod at startup; fail fast if missing/invalid, document local key generation in `.env.example`, and never log key or plaintext. Store account last-four separately and decrypt only in services for authorized DTOs. (2) Treat account deletion as soft deactivation and apply the three-account limit only to active accounts; order snapshots remain immutable. (3) Backfill existing sellers from account names using lowercase URL-safe collision-safe slugs with reserved words blocked; nullable province is allowed only for backfill until sellers complete their store profile, while new activation requires province. Keep seed profiles aligned. (4) Place B1 under Stage 6 as a follow-up without renumbering; it extends Stage 6's original scope.
- **[APPROVED] B1 additions:** `/api/uploads` records each uploaded key, owner, purpose, and timestamp. Avatar/logo assignment requires matching session owner and purpose. Do not hard-delete replaced avatar/logo files; orphan cleanup remains a TODO. Keep the existing product image flow except for writing ownership metadata; enforcing PRODUCT ownership on attachment remains a TODO. Sellers with pending orders and no payment account receive the dashboard blocker banner; legacy confirmed/completed orders have no backfilled snapshot and show buyers the neutral contact-seller message. Test foreign-owner and wrong-purpose key rejection for avatar/logo assignment.
- **[APPROVED]** B1 extends the original Stage 6 scope without renumbering stages. Public store page, notifications, wishlist, store vacation mode (B2), and admin work remain outside B1.

### Stage 7 — Image Upload **[PROPOSED]**

- Scope: R2 bucket integration, presigned upload, server-side validation, image display.
- **[APPROVED interim implementation, 2026-10-13]** Local-disk storage is implemented separately for the single-machine MVP/demo; it does not start or complete this R2 stage.

### Stage 8 — Hardening **[PROPOSED]**

- Scope: rate limiting, dependency audit, security review, accessibility pass, error pages, deployment configuration.

---

## 14. Testing and Verification

- **[APPROVED]** After implementation, run the relevant checks supported by the repository: type checking, linting, production build, and relevant tests (Vitest).
- **[APPROVED]** Use existing package scripts. Do not claim a check passed unless it was executed and passed.
- **[APPROVED]** Do not hide failures by weakening TypeScript, disabling lint rules globally, or removing tests.
- **[APPROVED for Stage 5]** Minimum test targets by area:
  - Schemas: pagination defaults and max, cancel reason bounds (4 fails, 5 passes, 500 passes, 501 fails), `.strict()` rejecting unknown keys.
  - Services: each state transition, role checks, contact visibility per status, `passwordHash` absent from every DTO, seller phone absent from public product DTO, transaction rollback on a lost status race, and safe handling of uniqueness conflicts.
  - UI: cancel dialog disabled until valid reason; order button disabled for `reserved` and `sold`.
- **[APPROVED for Stage 6]** Test favorite add/remove idempotency, per-user isolation, product validation, and DTO favorite state; profile self-read/update, allowlisted fields, nullable mapping, and password hash exclusion; domain route authentication, validation, and service delegation; and absence of runtime mock callers. Use an isolated database for integration tests when configured; otherwise report them as `NOT RUN`.
- **[APPROVED]** Record results in the README Verification section using `NOT RUN`, `PASS`, or `FAIL`, with date and command.

---

## 15. Documentation Rules

- **[APPROVED]** `README.md` is the concise, current status and handoff document; its structure is defined in `AGENTS.md` §15.
- **[APPROVED]** This blueprint is the detailed specification. Do not duplicate it in the README.
- **[APPROVED]** After each task or stage, update `README.md` with actual changes, current stage, test results, unresolved issues, and the next approved step.
- **[APPROVED]** Preserve earlier important decisions and TODOs when updating documentation.

---

## 16. Open Decisions

Resolve these with the user before implementing the affected area. Move each to **[APPROVED]** in the relevant section when decided.

| #   | Decision                              | Affects     | Current proposal                                                       |
| --- | ------------------------------------- | ----------- | ---------------------------------------------------------------------- |
| 1   | Product condition and category values | §4, §7, §11 | Condition: `like_new`, `good`, `fair`, `worn`; categories to be listed |
| 2   | Over-limit page size: reject or clamp | §5.1        | Reject                                                                 |
| 3   | Password rules and hashing algorithm  | §9          | Min 8 chars, argon2id or bcrypt                                        |
| 4   | Email verification and password reset | §9          | Out of MVP scope                                                       |
| 5   | Image limits                          | §10         | 5 MB, 5 images, JPEG/PNG/WebP                                          |
| 6   | Final route names                     | §11.2       | As listed                                                              |
| 7   | Stage 4, 7, 8 scope                   | §13         | As listed                                                              |

---

## 17. Changelog

| Version | Date               | Change                                                                                                                                                                                                                                                     |
| ------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1     | **[TODO]** fill in | Full blueprint drafted. Items tagged **[PROPOSED]** or **[TODO]** await user approval.                                                                                                                                                                     |
| 1.1     | 2026-10-13         | Approved Stage 5 order scope and business rules: dual buyer/seller accounts, IDR integer pricing, state transitions, cancellation permissions, optional rejection reason, single open order, transactional product coupling, and required shipping fields. |
| 1.1     | 2026-10-13         | Approved local-disk image storage as an interim single-machine demo solution; Cloudflare R2 remains planned for production.                                                                                                                                |
| 1.1     | 2026-10-13         | Approved and completed Stage 6: Prisma favorites and profile, per-domain API routes, visitor favorite controls disabled, `/api/mock` and mock runtime removed, with seed fixtures preserved separately.                                                    |
| 1.1     | 2026-10-13         | Approved Stage 6 follow-up B1 profile hub, addresses, seller activation, encrypted payment accounts/snapshots, upload ownership metadata, migration backfill, dashboard scope, and the explicit exclusion of B2/admin. |
| 1.1     | 2026-10-13         | Recorded the B1-approved AES-256-GCM/key-rotation requirements, payment-account soft deletion, seller backfill and seed slug rules, upload ownership checks and cleanup TODOs, and in-flight order messaging/banner behavior. |
