# Astraeon Restaurant ERP — Authentication API

## Setup

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Copy or update `.env` with a strong `JWT_SECRET` before deploying. The API runs on `http://localhost:5000` by default.

## Endpoints

| Method | Endpoint | Authentication |
| --- | --- | --- |
| POST | `/api/auth/register` | No |
| POST | `/api/auth/login` | No |
| GET | `/api/auth/profile` | Bearer token |
| POST | `/api/auth/logout` | Bearer token |

### Register body

```json
{ "fullName": "Asha Sharma", "email": "asha@example.com", "password": "secure-passphrase" }
```

Use `Authorization: Bearer <token>` for protected endpoints. Logout is stateless: remove the returned JWT from the client after receiving its successful response.
