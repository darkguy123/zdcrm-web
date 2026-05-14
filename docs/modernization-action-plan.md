# ZDCRM Modernization Action Plan

Date: 2026-05-13
Owner: Engineering
Status: Proposed

## 1. Current State Baseline

This repository is currently a frontend-first Next.js codebase with no NestJS backend service in the workspace.

Observed baseline:
- Next.js 14.2.5 (not 15 yet)
- React Query is already installed and used
- Tailwind and Radix/ShadCN-style UI primitives are present
- Auth handling is mostly client-side with token storage and route redirects
- API calls are spread across multiple folders with mixed conventions

Evidence in repository:
- package and scripts: package.json
- app router and providers: app/layout.tsx, contexts/AllProviders.tsx
- current auth approach: contexts/auth.tsx
- axios wrapper and interceptor: utils/axios.ts

## 2. Target Architecture

## 2.1 Workspace Shape (Monorepo)

Target layout:

- apps/web: Next.js 15 frontend
- apps/api: NestJS API server
- packages/shared-types: DTO-safe shared types (frontend-safe)
- packages/shared-validation: Zod schemas (frontend) and class-validator DTO mappings (backend)
- packages/config: eslint, tsconfig, env schema, constants
- packages/ui: reusable design system components

Migration approach:
- Keep current project running while creating apps/api and shared packages.
- Move features incrementally by domain (auth, orders, inventory, delivery).

## 2.2 Domain Modules (Backend)

NestJS modules:
- auth
- users
- businesses
- branches
- customers
- products
- inventory
- enquiries
- orders
- payments
- deliveries
- notifications
- analytics
- audit-logs

Cross-cutting backend modules:
- common (filters, interceptors, guards)
- config (env schema and typed config)
- database (Prisma or TypeORM)
- queue (BullMQ/Redis)
- security (rate limit, CSRF policy, sanitization)

## 2.3 Frontend Feature Organization

Within apps/web/src:
- modules/auth
- modules/orders
- modules/enquiries
- modules/inventory
- modules/delivery
- modules/analytics
- modules/admin
- shared/components
- shared/lib
- shared/api
- shared/state

Rules:
- UI components remain presentational.
- Business logic lives in hooks/services/selectors.
- API clients live in shared/api by bounded context.
- Validation schemas are imported from shared-validation.

## 3. Delivery Phases (12 Weeks)

## Phase 1 (Weeks 1-2): Foundation and Restructure [Critical]

Deliverables:
- Monorepo scaffold and CI checks (lint, test, build)
- Next.js 15 upgrade plan completed and tested in staging
- Core folder normalization and duplicate file cleanup
- Shared env management with schema validation
- ADR documents for architecture decisions

Work items:
1. Introduce workspace structure (apps/*, packages/*).
2. Move existing web app into apps/web with minimal behavior change.
3. Standardize API client layer and remove duplicate API helper locations.
4. Build error boundary + loading/skeleton standards for all route groups.
5. Add repository-level coding standards and module boundaries.

Acceptance criteria:
- App boots with no feature regression for existing dashboard routes.
- Lint and typecheck pass in CI.
- No copy-suffixed source files remain in production paths.

## Phase 2 (Weeks 2-3): Database and API Core [Critical]

Deliverables:
- PostgreSQL schema finalized and versioned migrations
- NestJS service skeleton with module registration
- DTO validation and global exception filter
- Pagination and filter conventions across list endpoints

Schema entities:
- users
- businesses
- branches
- role_permissions
- customers
- products
- inventory
- orders
- order_items
- payments
- deliveries
- notifications
- audit_logs
- feedback

Acceptance criteria:
- Migrations run from clean database.
- CRUD smoke tests pass for users, customers, products, orders.
- Error format is consistent across all endpoints.

## Phase 3 (Weeks 3-5): Enquiry and Order Rebuild [Critical]

Deliverables:
- New enquiry workflow (autosave, validation, history lookup)
- Convert enquiry to order with transaction safety
- Canonical order lifecycle engine with timeline history
- Payment synchronization and communication logs

Required order statuses:
1. START_ARRANGEMENT
2. PENDING_QC
3. READY_FOR_DISPATCH
4. DISPATCHED
5. CLIENT_NOTIFIED
6. DELIVERED
7. DELIVERED_AND_NOTIFIED
8. CANCELLED
9. ON_HOLD

Acceptance criteria:
- Status transitions enforce legal state machine rules.
- Timeline entries are immutable and audit-safe.
- Part payment and full payment edge cases covered by tests.

## Phase 4 (Weeks 5-6): Inventory and POS [High]

Deliverables:
- Product catalog with SKU and variation model
- Branch-level stock ledger with low-stock alerts
- POS flow for walk-in sales and split payments
- Receipt generation and inventory deduction on completion

Acceptance criteria:
- Stock cannot go negative without override permission.
- POS checkout median interaction time under 45 seconds on tablet.

## Phase 5 (Weeks 6-7): Delivery and Logistics [High]

Deliverables:
- Rider assignment workflow
- Delivery timeline and status updates
- Public tracking link and driver portal token model
- Delivery confirmation and feedback capture

Acceptance criteria:
- Every delivery status change emits an audit log entry.
- Public tracking links are scoped, signed, and expiring.

## Phase 6 (Weeks 7-8): Commerce and CRM Unification [Critical]

Deliverables:
- Shared product, customer, and order records between storefront and CRM
- Headless commerce integration APIs
- Real-time inventory updates from all order sources

Acceptance criteria:
- Storefront order appears in CRM in under 3 seconds.
- Single customer profile merges web and CRM identities.

## Phase 7 (Weeks 8-9): Analytics and Reporting [High]

Deliverables:
- Financial dashboard APIs and widgets
- KPI cards with role-based visibility
- CSV/PDF export pipelines

Acceptance criteria:
- KPI calculations reconciled against source of truth queries.
- Dashboard filters support date, branch, and representative.

## Phase 8 (Weeks 9-10): Communication and Automation [High]

Deliverables:
- WhatsApp notification service with queue-based delivery
- Template management and trigger engine
- Feedback request automation

Acceptance criteria:
- Retries and dead-letter queue configured for failed sends.
- Notification audit trail linked to order and customer IDs.

## Phase 9 (Weeks 10-11): Security and Performance [Critical]

Deliverables:
- Security hardening (Helmet, rate limit, input sanitization)
- Auth improvements (refresh tokens, session expiry, device logs)
- Redis caching and query/index optimization

Acceptance criteria:
- OWASP top-10 checklist review completed.
- P95 API latency reduced by agreed target for key endpoints.

## Phase 10 (Weeks 11-12): DevOps and Deployment [High]

Deliverables:
- CI/CD workflows for web and api
- Staging and production environments
- Migration workflows and rollback runbooks
- Monitoring, alerting, and log aggregation

Acceptance criteria:
- One-click staging deployment from main.
- Production rollback tested successfully.

## 4. Cross-Cutting Engineering Standards

## 4.1 Authentication and Authorization
- JWT access token + refresh token rotation.
- Password hashing with bcrypt.
- RBAC and permission matrix at endpoint and UI levels.
- Login activity and device/session history.
- MFA-ready interfaces and challenge flow placeholders.

## 4.2 Data and Transaction Integrity
- Use DB transactions for enquiry-to-order conversion, order creation, payment posting, and inventory deduction.
- Add unique constraints and foreign keys for customer, order, and payment relationships.
- Use idempotency keys for payment webhook processing.

## 4.3 API and Frontend Conventions
- Unified response envelope for success/error.
- Cursor or offset pagination standard across list endpoints.
- Typed query keys and API clients in one location per domain.
- Error boundaries and skeletons on all major route segments.

## 4.4 Observability
- Correlation ID on every request.
- Structured logs for API, worker, and webhook handlers.
- Audit log schema for critical actions.

## 5. Week 1 Immediate Backlog (Execution Start)

1. Create monorepo skeleton with apps/web and apps/api.
2. Scaffold NestJS api with modules: auth, users, businesses, branches.
3. Add PostgreSQL (local docker) and migration tooling.
4. Define env schema and split env files by environment.
5. Implement global exception filter and DTO validation pipe.
6. Move current axios calls to domain API client structure.
7. Build auth contract v1 (login, refresh, me) and integrate in web.
8. Add CI workflow for lint, typecheck, test, build.

Definition of done for Week 1:
- Local dev can run web + api + db with one command.
- Login flow works against new backend in staging mode.
- CI passes on pull request.

## 6. Risks and Mitigations

Risk: Rewrite fatigue and moving target scope.
Mitigation: Feature-flag migration and preserve current UI while swapping services by domain.

Risk: Data migration errors from legacy sources.
Mitigation: Write repeatable import scripts and reconciliation reports.

Risk: Performance regressions during module transition.
Mitigation: Add baseline metrics now and enforce performance budgets in CI checks.

Risk: Security gaps in public links and driver portal.
Mitigation: Signed expiring links, scope tokens, rate limiting, and audit trails.

## 7. Team and Ownership Model

Minimum squad composition:
- 1 technical lead
- 2 frontend engineers
- 2 backend engineers
- 1 QA automation engineer
- 1 DevOps engineer (part-time acceptable)

Ownership split:
- Frontend squad: app router migration, module UI, query/state patterns.
- Backend squad: NestJS modules, DB schema, queues, security.
- Shared: architecture reviews, contracts, integration test suite.

## 8. Success Metrics

Delivery metrics:
- Sprint completion ratio >= 85%
- Production defect leakage <= 5% of released tickets

System metrics:
- API P95 latency under target by endpoint class
- Failed notification rate under 1%
- Inventory mismatch incidents reduced to near zero

Business metrics:
- Faster order-to-dispatch cycle time
- Improved on-time delivery percentage
- Improved payment reconciliation accuracy

## 9. Final Recommendation

Proceed with phased modernization, not isolated patching.

Execution order:
1. Stabilize architecture and contracts
2. Build backend core and data foundation
3. Rebuild order/inventory workflows
4. Unify commerce integration
5. Harden security and performance
6. Complete deployment automation and observability

This path upgrades ZDCRM from fragmented modules to a production-grade unified CRM ecosystem with predictable operations and growth capacity.
