# ZDCRM API (NestJS)

## Quick start

1. Copy env file:
   - cp .env.example .env
2. Start postgres from repository root:
   - docker compose up -d postgres
3. Install dependencies at repository root:
   - npm install
4. Generate Prisma client:
   - npm run db:generate
5. Apply migration:
   - npm run db:migrate
6. Run API:
   - npm run dev:api

Health check:
- GET http://localhost:4000/api/v1/health

## Initial scaffolded modules
- auth
- users
- businesses
- branches
- database (Prisma service)

## Notes
- This is a skeleton for Phase 1-2 implementation.
- Auth endpoints currently expose contract placeholders and should be replaced with JWT + refresh token logic in Phase 1.3.
