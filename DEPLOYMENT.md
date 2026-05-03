# Medly Deployment Guide

This project is ready to deploy on Vercel with PostgreSQL and Prisma.

## 1) What this project uses

- Framework: Next.js App Router
- Database ORM: Prisma
- Database: PostgreSQL
- Auth: custom cookie/session auth (not NextAuth)
- Email: SMTP via `nodemailer`

Important:

- Use `AUTH_SECRET`, not `NEXTAUTH_SECRET`
- Use the actual `SMTP_*` variables in this project, not `EMAIL_SERVER_*`
- Never commit `.env` or real secrets to GitHub

## 2) Push the project to GitHub

From your machine:

```bash
git init
git add .
git commit -m "Prepare Medly for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/medly.git
git push -u origin main
```

## 3) Create a PostgreSQL database

Starter-friendly options:

- Neon
- Supabase
- Vercel Postgres
- Prisma Postgres

Pick one managed PostgreSQL provider, create a database, then copy the connection string into `DATABASE_URL`.

Example shape:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/medly?sslmode=require"
```

If your provider gives separate pooled and direct URLs, use the standard Prisma-compatible PostgreSQL URL for `DATABASE_URL`.

## 4) Import the GitHub repo into Vercel

1. Open Vercel
2. Click `Add New` -> `Project`
3. Import the Medly GitHub repository
4. Keep the framework as `Next.js`
5. Root directory should stay the project root

The build command is already configured in `package.json`:

```bash
npm run build
```

Which runs:

```bash
prisma generate && next build
```

## 5) Add environment variables in Vercel

In `Project Settings -> Environment Variables`, add these values:

### Required

```bash
DATABASE_URL=
AUTH_SECRET=
EMAIL_CODE_SECRET=
MEDIA_ACCESS_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

### Optional but recommended

```bash
MAX_ACTIVE_PLAYBACK_DEVICES=2
MANUAL_PAYMENT_EXPIRY_HOURS=24
MEDIA_STORAGE_PROVIDER=local
```

### Optional seed variables

Only use these if you intentionally run the seed script in a non-production or curated environment:

```bash
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
SEED_SUPPORT_EMAIL=
SEED_SUPPORT_PASSWORD=
SEED_STUDENT_EMAIL=
SEED_STUDENT_PASSWORD=
```

## 6) Run Prisma migrations for production

This project now includes an initial Prisma migration.

Use this command against the production database:

```bash
npx prisma migrate deploy
```

You can run it from:

- your CI/CD pipeline, or
- your machine with `DATABASE_URL` pointed to the hosted production database

Do not use `prisma db push` in production.

## 7) Deploy

After:

- GitHub repo is connected
- environment variables are added
- `DATABASE_URL` is set
- migrations are applied

trigger a Vercel deployment.

## 8) Domain later

When you buy the domain later:

1. Open `Vercel -> Project -> Settings -> Domains`
2. Add your domain
3. Follow the DNS instructions Vercel shows for that exact domain

Typical Vercel DNS patterns:

- apex/root domain: `A` record to `76.76.21.21`
- `www`: `CNAME` to `cname.vercel-dns.com`

Always follow the exact values shown in your Vercel project because DNS setup can vary by configuration.

## 9) Local verification before deploy

Run these commands locally:

```bash
npm install
npx prisma generate
npm run build
```

If you want to test migrations locally:

```bash
npm run prisma:migrate:deploy
```

## 10) Important production note about seed data

The current seed script is useful for development and internal testing.

Before running any seed against production:

- review what it inserts
- remove demo/sample data if you do not want it live
- prefer a dedicated production-safe seed if needed

If you only need the app deployed, you can deploy without running the demo seed.
