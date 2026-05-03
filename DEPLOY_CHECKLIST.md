# Medly Deploy Checklist

Use this checklist to publish Medly to GitHub and Vercel safely, without leaking secrets.

## 0) Before you push anything

- Do **not** commit `.env`
- Do **not** commit real database credentials
- Do **not** commit SMTP passwords or app passwords
- Put secrets only in:
  - local `.env`
  - Vercel `Project Settings -> Environment Variables`

## 1) Check Git safety first

This repository should ignore:

```bash
.env
.env.*
!.env.example
```

If `.env` was accidentally added to Git before, remove it from tracking without deleting the local file:

```bash
git rm --cached .env
```

Then commit the `.gitignore` fix:

```bash
git add .gitignore
git commit -m "Stop tracking local environment file"
```

## 2) Push the project to GitHub

```bash
git init
git add .
git commit -m "Prepare Medly for production deployment"
git branch -M main
git remote add origin <GITHUB_REPO_URL>
git push -u origin main
```

## 3) Create a managed PostgreSQL database

Low-cost starter options:

- Neon
- Supabase
- Vercel Postgres
- Prisma Postgres

The only value Medly needs from the database provider is:

```bash
DATABASE_URL
```

Do **not** place `DATABASE_URL` inside source code or GitHub.

## 4) Generate secure secrets

Run this command:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it **3 times** and use the outputs for:

- `AUTH_SECRET`
- `EMAIL_CODE_SECRET`
- `MEDIA_ACCESS_SECRET`

## 5) Environment Variables for Vercel

Add these in:

`Vercel -> Project -> Settings -> Environment Variables`

| Variable | Required | Example (safe example only) | Used for |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://USER:PASSWORD@HOST:5432/medly?sslmode=require` | PostgreSQL connection for Prisma |
| `AUTH_SECRET` | Yes | `4f8b...` | Signing custom auth sessions |
| `EMAIL_CODE_SECRET` | Yes | `91c2...` | Hashing/signing email verification codes |
| `MEDIA_ACCESS_SECRET` | Yes | `bb0d...` | Protecting media access tokens |
| `SMTP_HOST` | Yes | `smtp.gmail.com` | SMTP mail host |
| `SMTP_PORT` | Yes | `465` | SMTP port |
| `SMTP_SECURE` | Yes | `true` | TLS/SSL SMTP mode |
| `SMTP_USER` | Yes | `medly@example.com` | SMTP login user |
| `SMTP_PASS` | Yes | `gmail-app-password` | SMTP app password |
| `SMTP_FROM` | Yes | `Medly <medly@example.com>` | Sender email identity |
| `MAX_ACTIVE_PLAYBACK_DEVICES` | Optional | `2` | Limits active video devices per user |
| `MANUAL_PAYMENT_EXPIRY_HOURS` | Optional | `24` | Vodafone Cash/manual payment expiry window |
| `MEDIA_STORAGE_PROVIDER` | Optional | `local` | Storage provider mode |
| `SEED_ADMIN_EMAIL` | Optional | `admin@example.com` | Seeded admin email |
| `SEED_ADMIN_PASSWORD` | Optional | `ChangeThisAdminPassword123` | Seeded admin password |
| `SEED_SUPPORT_EMAIL` | Optional | `support@example.com` | Seeded support email |
| `SEED_SUPPORT_PASSWORD` | Optional | `ChangeThisSupportPassword123` | Seeded support password |
| `SEED_STUDENT_EMAIL` | Optional | `student@example.com` | Seeded student email |
| `SEED_STUDENT_PASSWORD` | Optional | `ChangeThisStudentPassword123` | Seeded student password |

## 6) Import the project into Vercel

1. Open Vercel
2. Click `Add New Project`
3. Import the project from GitHub
4. Leave framework detection as `Next.js`
5. Add the Environment Variables before the first production deploy

## 7) Build configuration

Medly should build with:

```bash
prisma generate && next build
```

This is already set in `package.json` under the `build` script.

So on Vercel, you can:

- either leave the build command empty and let Vercel use `npm run build`
- or explicitly set:

```bash
npm run build
```

## 8) Production migrations

Production should use:

```bash
npx prisma migrate deploy
```

Do **not** use:

```bash
prisma db push
```

in production.

You can run `prisma migrate deploy` in one of two ways:

### Option A: Run locally against production DB

Temporarily place the production `DATABASE_URL` in your local `.env`, then run:

```bash
npx prisma migrate deploy
```

### Option B: Run from CI/CD

Run the same command in your deployment pipeline or another controlled environment with the production `DATABASE_URL` injected securely.

## 9) Deploy on Vercel

After:

- GitHub is connected
- env vars are added
- database is created
- `DATABASE_URL` is set
- migration is applied

deploy the project.

## 10) Add your domain later

After the Vercel deployment works:

1. Open `Vercel -> Project -> Settings -> Domains`
2. Add your domain
3. Follow the exact DNS records Vercel shows you

General pattern:

- apex/root domain usually uses an `A record`
- `www` usually uses a `CNAME`

Do **not** guess the DNS values manually.
Always use the exact values Vercel gives you for that project.

## 11) Final local check before publish

Run:

```bash
npm install
npx prisma generate
npm run build
```

## 12) Seed warning

The current seed script is useful for development and testing.

Before running seed data in production:

- review what it inserts
- remove demo/sample content you do not want live
- do not run it blindly on production

The current development seed creates real-looking sample content, including:

- default admin account
- default support account
- default student account
- extra sample student/reviewer accounts
- sample categories
- sample instructors
- sample courses and curriculum
- sample exams and questions
- sample enrollments and lesson progress
- sample wishlists and reviews
- sample support tickets and replies
- sample payment orders and notifications

Use the dedicated production-safe seed instead, or skip seeding entirely if you plan to create everything from the admin panel.
