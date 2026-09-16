# Trufeta

**Trust + Fête** — Cameroon’s credential-gated event marketplace with
escrow-protected payments, digital ticketing, and an admin trust layer.

```
trufeta/
├── backend/                 # NestJS-shaped domain modules (PostgreSQL backend with Prisma config)
├── frontend/                # Next.js App Router UI
├── docs/
│   └── Trufeta_Complete_Build_Prompt.md
├── package.json             # monorepo scripts
└── README.md
```

## Backend (`backend/`)

```
backend/
├── drizzle/
│   ├── schema.ts
│   └── client.ts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── seed.ts
│   ├── common/
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── types/
│   ├── config/
│   ├── auth/
│   ├── users/
│   ├── events/
│   ├── bookings/
│   ├── payments/
│   │   └── providers/
│   │       └── campay.provider.ts
│   ├── escrow/
│   │   └── jobs/
│   │       └── auto-release.job.ts
│   ├── tickets/
│   ├── reviews/
│   ├── disputes/
│   ├── notifications/
│   │   └── mailer/
│   ├── admin/
│   ├── client/
│   ├── service-providers/
│   ├── chat/
│   ├── uploads/
│   └── maps/
├── nest-cli.json
├── tsconfig.json
├── .env.example
└── package.json
```

Domain logic is organised as NestJS modules. The current runtime adapter is
**Next.js server actions + route handlers** so the platform healthcheck on
`:3000` stays green. Each folder is ready to promote to a Nest controller/service
pair without rewriting business rules.

## Frontend (`frontend/`)

```
frontend/
├── app/
│   ├── (marketing)/page.tsx
│   ├── (dev)/dev/register/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── access-request/page.tsx
│   │   └── unauthorised/page.tsx
│   ├── (client)/
│   │   ├── client/page.tsx
│   │   ├── client/events/page.tsx
│   │   └── client/notifications/page.tsx
│   ├── (organiser)/
│   │   ├── dashboard/page.tsx
│   │   ├── events/page.tsx
│   │   └── vendors/…                # marketplace + book flow
│   ├── (service-provider)/
│   │   └── vendor/dashboard/
│   ├── (admin)/admin/
│   ├── api/
│   │   ├── health/
│   │   └── cron/escrow-release/
│   ├── layout.tsx
│   └── globals.css
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   └── types/
├── styles/theme.css
├── public/
├── next.config.ts
├── tsconfig.json
└── .env.example
```

## Quick start

```bash
# install (from repo root)
npm install

# apply schema
npm run db:push
# or introspect your existing local PostgreSQL database into Prisma
npm run prisma:pull

# develop
npm run dev

# production
npm run build && npm run start
```

## Admin account

Password: **`trufeta-demo`**

| Role  | Email            |
|-------|------------------|
| Admin | admin@trufeta.cm |

## Environment

Copy `backend/.env.example` / `frontend/.env.example`. Critical vars:

- `DATABASE_URL`
- `SESSION_SECRET`
- `CRON_SECRET` (for `/api/cron/escrow-release`)
- `CAMPAY_API_URL` / `CAMPAY_TOKEN` (optional — sandbox authorises without them)
- SMTP_* (optional — emails are logged to `email_log` until wired). **Production
  default is Brevo SMTP relay** — see `backend/docs/email-setup.md`.

## Design system

- **Fonts:** Fraunces · Inter · IBM Plex Mono  
- **Palette:** ink · paper · marigold · berry  
- **Motion:** Framer Motion scroll-reveal on marketing screens

## Access model

No open registration. Public users submit an Access Request; admins approve and
credentials are emailed. `/dev/register` is **development-only** (404 in production).
