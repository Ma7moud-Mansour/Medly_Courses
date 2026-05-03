# Vercel Environment Variables Template

Copy these values into:

`Vercel -> Project -> Settings -> Environment Variables`

Do **not** put real secrets in GitHub or source files.

## Required

```bash
DATABASE_URL=<PASTE_DATABASE_URL_HERE>
AUTH_SECRET=<GENERATE_32_BYTE_HEX_SECRET>
EMAIL_CODE_SECRET=<GENERATE_32_BYTE_HEX_SECRET>
MEDIA_ACCESS_SECRET=<GENERATE_32_BYTE_HEX_SECRET>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=<PASTE_SMTP_EMAIL_HERE>
SMTP_PASS=<PASTE_SMTP_APP_PASSWORD_HERE>
SMTP_FROM=Medly <PASTE_SMTP_EMAIL_HERE>
```

## Optional

```bash
MAX_ACTIVE_PLAYBACK_DEVICES=2
MANUAL_PAYMENT_EXPIRY_HOURS=24
MEDIA_STORAGE_PROVIDER=local
```

## Seed only

Use these only if you intentionally run a production-safe seed:

```bash
SEED_ADMIN_EMAIL=<PASTE_PRODUCTION_ADMIN_EMAIL_HERE>
SEED_ADMIN_PASSWORD=<PASTE_STRONG_ADMIN_PASSWORD_HERE>
SEED_SUPPORT_EMAIL=<OPTIONAL_SUPPORT_EMAIL_HERE>
SEED_SUPPORT_PASSWORD=<OPTIONAL_STRONG_SUPPORT_PASSWORD_HERE>
SEED_STUDENT_EMAIL=<DO_NOT_USE_DEMO_STUDENT_IN_PRODUCTION>
SEED_STUDENT_PASSWORD=<DO_NOT_USE_DEMO_STUDENT_IN_PRODUCTION>
```

## Secure secret generation

Run this command locally:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it 3 times and use the outputs for:

- `AUTH_SECRET`
- `EMAIL_CODE_SECRET`
- `MEDIA_ACCESS_SECRET`
