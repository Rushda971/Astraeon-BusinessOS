# Astraeon Restaurant ERP — Authentication API

The active backend implementation is under `server/src`. The `server/Backend` directory is a legacy implementation and is not used by the current server scripts.

## Setup

```bash
npm ci
Copy-Item .env.example .env
npm run prisma:migrate
npm run prisma:generate
npm run dev
```

Run these commands from the `server` directory. Set a strong `JWT_SECRET` in `.env` before starting the API. The API runs on `http://localhost:5000` by default. From the repository root, `npm run dev` starts both frontend and backend.

Authentication email delivery also requires `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `MAIL_FROM`. `SMTP_SECURE` is optional: use `false` with port `587` (STARTTLS) or `true` with port `465` (implicit TLS). For Gmail, enable 2-Step Verification and use a Google App Password as `SMTP_PASSWORD`; a normal account password will be rejected. `MAIL_FROM` should be an address authorized by the SMTP account, for example `Astraeon <account@example.com>`. Never commit real SMTP credentials.

## Endpoints

| Method | Endpoint | Authentication |
| --- | --- | --- |
| POST | `/api/auth/register` | No |
| POST | `/api/auth/verify-otp` | No |
| POST | `/api/auth/resend-otp` | No |
| POST | `/api/auth/login` | No |
| POST | `/api/auth/forgot-password` | No |
| POST | `/api/auth/reset-password` | No |
| GET | `/api/auth/profile` | Bearer token |
| POST | `/api/auth/logout` | Bearer token |
| POST | `/api/employees` | Bearer token |
| GET | `/api/employees` | Bearer token |
| GET | `/api/employees?search=aisha` | Bearer token |
| GET | `/api/employees/:id` | Bearer token |
| PUT | `/api/employees/:id` | Bearer token |
| DELETE | `/api/employees/:id` | Bearer token |

### Register body

```json
{ "fullName": "Asha Sharma", "email": "asha@example.com", "password": "secure-passphrase" }
```

Use `Authorization: Bearer <token>` for protected endpoints. Logout is stateless: remove the returned JWT from the client after receiving its successful response.

### Employee body

```json
{
  "name": "Aisha Khan",
  "email": "aisha@example.com",
  "phone": "9876543210",
  "role": "Manager",
  "salary": 45000,
  "joiningDate": "2026-08-19",
  "status": "ACTIVE"
}
```

With the API running, open `http://localhost:5000/frontend/Employee/employee.html`. It expects an authentication token in `localStorage` under `token`, `accessToken`, or `jwt`; unauthenticated sessions are redirected to the login page.

## Local demo data

To add repeatable sample records to a local SQLite database, configure `DEMO_SEED_PASSWORD` in `server/.env` with a local value of at least 12 characters, then run from the repository root:

```bash
node server/prisma/seed-demo.js
```

The seed runs only outside production and only creates records that are not already present. It creates a local owner account, sample inventory, employees, menu products, a completed order/sale, and another order. The demo account uses `demo.manager@astraeon.local`; the password is supplied only through `DEMO_SEED_PASSWORD` and is never printed by the seed script. Do not use demo data in a shared database.
