# Astraeon Restaurant ERP — Authentication API

The active backend implementation is under `server/src`. The `server/Backend` directory is a legacy implementation and is not used by the current server scripts.

## Setup

```bash
npm install
npx prisma migrate dev --name employee
npx prisma generate
npm run dev
```

Copy or update `.env` with a strong `JWT_SECRET` before deploying. The API runs on `http://localhost:5000` by default.

Authentication email delivery also requires `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `MAIL_FROM`. Never commit real SMTP credentials.

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
