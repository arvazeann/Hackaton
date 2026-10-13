# AGENTS.md — Marketplace Preloved

## 1. Project Overview

This repository contains a Preloved Marketplace MVP built with Next.js.

The project must follow the project's Blueprint v1.1 as the primary source of truth for architecture, business rules, data contracts, privacy, and implementation stages.

Before making changes, inspect the existing repository structure, package.json, current implementation, and relevant project documentation.

Do not assume files or configurations exist without checking them.

## 2. Tech Stack

Follow the versions and configuration already established in the repository.

- Next.js App Router
- TypeScript with strict mode
- Tailwind CSS
- shadcn/ui where appropriate
- Zod for runtime validation
- React Hook Form with Zod resolver
- Prisma and PostgreSQL for the planned backend
- Auth.js Credentials with JWT sessions for the planned authentication system
- Cloudflare R2 for planned image storage
- Vitest for testing

Do not replace libraries, upgrade dependencies, or introduce additional dependencies without a clear technical reason.

## 3. Source of Truth

Use the following priority when making decisions:

1. Explicitly approved user decisions.
2. Blueprint v1.1 (`docs/BLUEPRINT.md`).
3. Stage-specific implementation brief.
4. Existing repository conventions.
5. Agent judgment for unspecified details.

If requirements conflict, follow the higher-priority source.

Do not silently change approved business rules or invent major features.

Record unresolved decisions as TODOs and ask the user when the decision materially affects architecture, security, privacy, or UX.

## 4. Implementation Stages

Work only on the stage explicitly requested by the user.

- Stage 0: Project setup and foundational configuration.
- Stage 1: Frontend, schemas, DTOs, mock data, and UI navigation.
- Later stages: Implement only according to the approved blueprint and stage brief.

Do not start a subsequent stage automatically.

Do not implement backend infrastructure during Stage 1.

## 5. Coding Standards

- Use TypeScript strict mode.
- Avoid `any`; prefer explicit types and safe narrowing.
- Keep components, schemas, DTOs, mock data, and services organized by responsibility.
- Use reusable components when they improve consistency.
- Keep business logic out of presentation components when practical.
- Use server components by default; add `"use client"` only when client-side interaction requires it.
- Use semantic HTML and accessible form controls.
- Handle loading, empty, error, and success states where relevant.
- Keep naming consistent with existing project conventions.
- Avoid unnecessary abstractions and overengineering.
- Do not duplicate existing utilities or components without a reason.
- Do not use placeholder implementations that falsely imply a feature is complete.

## 6. Data Contracts and Validation

- Treat approved Zod schemas and DTOs as the frontend/backend contract.
- Validate untrusted input at appropriate boundaries.
- Use `.strict()` for the Zod object schemas specified by the blueprint.
- Product query pagination defaults to 12 items and has a maximum page size of 48.
- Cancellation requires a reason containing 5–500 characters.
- `OrderDTO.shippingPhone` and `OrderDTO.shippingAddress` must be nullable.
- `OrderDTO.cancelReason` must be nullable.
- Orders with status `cancelled` must have a `cancel_reason`.
- The mock API `/api/mock` is temporary and must be handled (replaced or removed) in Stage 6.
- Never expose `passwordHash` in client-facing DTOs or UI data.
- Never include seller phone numbers in public product DTOs.
- Keep mock data consistent with the approved DTO definitions.

Do not weaken validation merely to make a form pass.

## 7. Privacy and Security

Apply least-privilege access and minimize exposure of personal information.

Order contact visibility rules:

- Buyers may view their own shipping information.
- Sellers may view `shippingName` from the pending state onward.
- Sellers may view `shippingPhone` and `shippingAddress` only when the order status is `confirmed` or `completed`.
- In seller-facing DTOs, phone and address must be `null` for `pending`, `cancelled`, and `rejected` orders.
- Enforce these rules in the service layer when backend services are implemented.
- Do not treat frontend visibility controls as authorization.
- Never expose secrets, credentials, or private environment variables to client-side code.

Do not introduce real authentication, database access, or file uploads during Stage 1.

## 8. UI and UX

- Follow the approved marketplace design and UX decisions.
- Ensure layouts work on mobile, tablet, and desktop.
- Use consistent spacing, typography, colors, and component variants.
- Provide visible validation errors and useful feedback.
- Ensure disabled actions cannot be triggered through the UI.
- Product listings must show only products with status `active`.
- Products with status `reserved` or `sold` may be viewed but cannot be ordered.
- Order actions must respect the approved state machine and user role.
- Cancellation dialogs must require a valid reason.
- Image upload components in Stage 1 must use local previews only; do not upload files to external storage.

Do not redesign unrelated pages when implementing a narrowly scoped request.

## 9. Mock Data and Module Boundaries

During Stage 1, access mock data through a centralized function layer.

For example:

- `getProducts()`
- `getProductById()`
- `getOrders()`
- `getOrderById()`

Adapt names to the actual repository conventions.

Do not import mock data directly throughout unrelated UI components.

Keep Stage 1 changes within the approved module boundaries:

- `src/app/`
- `src/components/`
- `src/schemas/`
- `src/types/`
- `src/lib/mock/`
- Any explicitly permitted supporting files.

Do not modify `prisma/` during Stage 1.

## 10. File and Dependency Changes

- Inspect a file before modifying it.
- Preserve working functionality unless a change is required.
- Avoid overwriting existing work unnecessarily.
- Do not delete files or change configuration unrelated to the task.
- Do not add dependencies without justification.
- Never place secrets or `.env` values in source code.
- Follow existing package manager conventions and lockfiles.

## 11. Testing and Verification

After implementation, run the relevant checks supported by the repository:

- Type checking
- Linting
- Production build
- Relevant tests

Use existing package scripts where available.

Do not claim a check passed unless it was actually executed and passed.

If a command fails, investigate the cause and report unresolved failures honestly.

Do not conceal warnings or errors by weakening TypeScript, disabling lint rules globally, or removing tests.

## 12. Completion Report

At the end of every task, report:

1. Summary of changes.
2. Files created, modified, or deleted.
3. Tests and checks executed, with their actual results.
4. Known limitations and unresolved issues.
5. Decisions or approvals needed from the user.

Do not automatically proceed to the next implementation stage.

## 13. Communication

- Be concise and specific.
- Explain important architectural or security decisions.
- Ask before making major changes outside the requested scope.
- Prefer fixing the root cause instead of adding workarounds.
- Do not claim features are production-ready when they are only mocked.
- Keep documentation aligned with actual implementation.

The user has final approval over design, UX, business rules, and stage progression.

## 14. Project Documentation and Token Efficiency

- Treat `README.md` as the concise, current project status and handoff document.
- Treat `docs/BLUEPRINT.md` as the detailed specification and source of truth for approved requirements.
- Treat `AGENTS.md` as persistent instructions for all coding tasks.
- Before starting a task, read `AGENTS.md` and the relevant sections of `README.md`. Consult the blueprint and source files only as needed.
- Do not reread or summarize the entire conversation when repository documentation already contains the relevant decisions.
- After completing each task or stage, update `README.md` with actual changes, current stage, test results, unresolved issues, and the next approved step.
- Record only verified facts. Never claim tests passed unless they were executed successfully.
- Keep the README concise. Do not duplicate the full blueprint, source code, or lengthy logs.
- Preserve previous important decisions and unresolved TODOs when updating documentation.
- Never automatically start the next stage.
- If implementation conflicts with the blueprint, document the conflict instead of silently changing the specification.

## 15. README.md Structure

`README.md` must follow this structure. Stage status and verification results live only in `README.md`, never in `AGENTS.md`, so they do not go stale.

1. **Project Overview**: Next.js-based preloved marketplace MVP.
2. **Tech Stack**: Next.js App Router + TypeScript, Tailwind CSS, Zod + React Hook Form, PostgreSQL + Prisma, Auth.js Credentials + JWT, Vitest.
3. **Current Status**: current stage, last completed stage, and status. Update based on the actual repository state, not assumptions. (Reference at the time of writing: current stage is Stage 3 — Authentication & Session; last completed is Stage 2 — Database, Prisma, Migration, and Seed.)
4. **Architecture**: list the directories that actually exist, for example:
   - UI: `src/app/`, `src/components/`
   - Schemas: `src/schemas/`
   - DTOs: `src/types/`
   - Mock data: `src/lib/mock/`
   - Backend services: `src/server/services/`
   - Server actions: `src/server/actions/`
   - Database schema: `prisma/schema.prisma`

   Adjust this list to match the real structure.

5. **Implemented Features**: record only features that are actually implemented and verified.
6. **Important Decisions**: keep approved decisions, including:
   - PostgreSQL is the database.
   - Prisma is used for ORM and migrations.
   - Auth.js Credentials uses JWT sessions.
   - `passwordHash` must never be sent to the client.
   - Buyers can always view their own shipping data.
   - Sellers can view phone and address only when the order status is `confirmed` or `completed`.
   - Order cancellation requires a reason of 5–500 characters.
   - `cancelled` orders must have a `cancel_reason`.
   - The `/api/mock` mock API is temporary and must be handled in Stage 6.
7. **Verification**: record the date, the commands run, and the actual results. Each item uses the status `NOT RUN`, `PASS`, or `FAIL`:
   - Typecheck
   - Lint
   - Format check
   - Tests
   - Build
   - Manual browser checks
8. **Known Issues and TODO**: bugs, unresolved decisions, dependency audit, and pending manual checks.
9. **Next Approved Step**: only the next stage the user has approved, with its scope.
10. **Handoff Notes**: the minimum context the next agent needs:
    - Key relevant files.
    - Current implementation state.
    - Things that must not be changed.
    - Checks that must be run.
    - Blockers to resolve before continuing.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
