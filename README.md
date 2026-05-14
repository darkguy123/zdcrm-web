This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
# zdcrmhub

## Monorepo Scaffolding (Phase 1)

This repository now includes monorepo scaffolding:

- `apps/api`: NestJS API skeleton
- `apps/web`: planned migration target for the existing Next.js frontend
- `packages/*`: shared package placeholders

Current frontend still runs from repository root during migration.

### New backend setup

1. Install dependencies:
	- `npm install`
2. Start postgres:
	- `docker compose up -d postgres`
3. Copy env file:
	- `cp apps/api/.env.example apps/api/.env`
4. Generate Prisma client:
	- `npm run db:generate`
5. Apply migration:
	- `npm run db:migrate`
6. Run API:
	- `npm run dev:api`

Health endpoint:
- `http://localhost:4000/api/v1/health`
