# Medly

Medly is an Arabic-first medical learning platform built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, and PostgreSQL. The current codebase now includes a production-structured authentication flow on top of the existing Prisma-backed admin system.

## Included now

- Real student registration with password hashing
- Real login with password verification
- Email verification codes for student registration and student login
- Secure httpOnly session cookies
- Logout with server-side session cleanup
- Role-based redirects after login
- Server-backed route protection for `/admin`, `/dashboard`, `/checkout`, and learning routes
- Prisma-backed admin operations, audit logs, overrides, tickets, impersonation tracking, and enrollments

## Authentication architecture

The auth flow is split into small layers:

1. `src/lib/auth/password.ts`
   - password hashing and verification via Argon2id
2. `src/lib/auth/session.ts`
   - signed session cookie helpers and expiration handling
3. `src/lib/auth/auth-service.ts`
   - shared user/session helpers for login, register, and logout
4. `src/lib/auth/email-auth.ts`
   - creates email verification challenges, sends 6-digit codes, and completes student auth only after code verification
5. `src/lib/auth/server-session.ts`
   - resolves the authenticated user from the signed cookie and PostgreSQL session row
6. `middleware.ts`
   - protects admin and student routes using the real session cookie

## Roles

Supported roles in the platform:

- `student`
- `admin`
- `support`
- `instructor`

Redirect behavior after login:

- `admin` -> `/admin`
- `support` -> `/admin`
- `student` -> `/dashboard`
- `instructor` -> `/dashboard` (current fallback)

## Environment variables

This project uses custom session auth and Prisma directly. It does not use NextAuth, so use `AUTH_SECRET` instead of `NEXTAUTH_SECRET`.

Copy `.env.example` to `.env.local` or `.env` and update it:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/medly?sslmode=require"
AUTH_SECRET="replace-with-a-long-random-secret"
EMAIL_CODE_SECRET="replace-with-a-second-long-random-secret"
MEDIA_ACCESS_SECRET="replace-with-a-third-long-random-secret"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-email-app-password"
SMTP_FROM="Medly <your-email@example.com>"
MAX_ACTIVE_PLAYBACK_DEVICES="2"
MANUAL_PAYMENT_EXPIRY_HOURS="24"
MEDIA_STORAGE_PROVIDER="local"
```

For Gmail before you have a custom domain:

- keep `SMTP_HOST="smtp.gmail.com"`
- use the Gmail account that will send Medly verification codes in `SMTP_USER`
- create a Gmail App Password and place it in `SMTP_PASS`
- keep `SMTP_FROM` the same Gmail address, for example `Medly <your-gmail@gmail.com>`

Student login/register now sends a 6-digit code to Gmail and only creates the real session after the code is confirmed on `/verify-email`.

## Run PostgreSQL locally on Windows

This workspace is set up to use a local PostgreSQL instance with:

- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Database: `medly`

If you followed the local setup completed in this workspace, a portable PostgreSQL bundle now lives at:

```text
C:\Users\Midoo\postgresql-local
```

Convenience commands:

```bash
npm run db:status
npm run db:start
npm run db:stop
```

If you install PostgreSQL elsewhere, set `MEDLY_POSTGRES_DIR` before running the db scripts.

## Install and run

```bash
npm install
npm run db:start
npx prisma generate
npm run prisma:migrate:deploy
npm run dev
```

Local app URL:

```text
http://localhost:3000
```

## Default admin login

By default the seed creates:

- Admin email: `admin@medly.com`
- Admin password: `Admin@123456`

Log in from:

- [http://localhost:3000/login](http://localhost:3000/login)

The shared login page automatically redirects admin/support users to `/admin`.

## Auth routes and pages

- `/login`
- `/register`
- `/verify-email`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/logout`
- `GET /api/me`

## Security notes

- Passwords are hashed with Argon2id before storage
- Plain text passwords are never stored
- Session cookies are `httpOnly`
- Session cookies are marked `secure` in production
- Authorization checks are enforced on the server
- Blocking a user also clears active server sessions for that account

## Admin system

The admin stack remains Prisma-backed:

- `src/lib/admin/repository.ts`
- `src/lib/admin/actions.ts`
- `/admin`
- `/admin/students`
- `/admin/students/[id]`
- `/admin/tickets`
- `/admin/audit-logs`
- `/admin/courses`

## Validation and verification completed

- `npx prisma generate`
- `npm run lint`
- `npm run build`

Current lint status: no errors, only legacy warnings about `<img>` usage in older UI files.

## Deployment

This project uses custom auth, not NextAuth, so the correct production secret is `AUTH_SECRET`, not `NEXTAUTH_SECRET`.

For the final production publishing checklist on Vercel, environment variables, Prisma migrations, Git safety, and custom domain setup, see [`DEPLOY_CHECKLIST.md`](./DEPLOY_CHECKLIST.md).

For a copy-paste-ready list of Vercel environment variables with placeholders only, see [`VERCEL_ENV_TEMPLATE.md`](./VERCEL_ENV_TEMPLATE.md).
