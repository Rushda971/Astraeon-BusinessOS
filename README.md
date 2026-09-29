# Astraeon BusinessOS

A restaurant operations dashboard for managing staff, inventory, menu products, orders, sales, and operational reports. The repository contains a React application and an Express API backed by Prisma and SQLite.

## Features

- Account registration, email OTP verification, login, and password recovery
- Dashboard summaries for sales, orders, stock, and employees
- Employee records and role-protected management operations
- Inventory items, categories, suppliers, stock movements, adjustments, and waste records
- Menu categories and products
- Orders and sales workflows backed by inventory records
- Inventory, movement, and employee reports
- Demo data seeding for local development

## Modules

| Module | Implementation |
| --- | --- |
| Authentication | React forms and Express endpoints with password hashing, JWT authentication, OTP verification, and reset flows |
| Employees | Employee records, filtering, summaries, and status updates |
| Inventory | Items, stock actions, categories, suppliers, and movement history |
| Menu | Categories, products, and availability controls |
| Orders and sales | Order lifecycle and sale records connected to inventory |
| Reports and customers | Frontend summaries derived from the available employee, inventory, order, and sales APIs |

## Tech stack

- React, React Router, Vite, CSS, Recharts, and Framer Motion
- Node.js, Express, Helmet, CORS, and Nodemailer
- Prisma ORM with SQLite by default
- JWT and bcrypt for authentication

## Architecture

The Vite client runs separately from the Express API during development. Vite proxies `/api` requests to the backend on port 5000. Prisma schema and migrations are in `server/prisma/`. The API can also serve a built client from `client/app/dist` under `/frontend`.

## Project structure

```text
.
├── client/
│   ├── Frontend/          # Earlier static HTML/CSS/JavaScript client
│   └── app/               # Active React/Vite application
├── server/
│   ├── prisma/            # Prisma schema, migrations, and demo seed
│   └── src/               # Express app, routes, controllers, middleware, and services
├── package.json           # Root development command
└── README.md
```

`client/Frontend/` and `server/Backend/` are legacy implementations; the current root development command uses `client/app/` and `server/src/`.

## Prerequisites

- Node.js 20 or newer and npm
- SQLite (used through Prisma; no separate server is needed for the default local setup)
- SMTP account settings only if you want email delivery for OTP and password recovery

## Installation

Install each package from its own directory:

```bash
npm ci
npm ci --prefix server
npm ci --prefix client/app
```

## Environment setup

Copy `server/.env.example` to `server/.env` and replace the placeholders on your machine. Do not commit `server/.env`. `DATABASE_URL` defaults to a local SQLite file. Set `JWT_SECRET` to a long random value before starting the API. SMTP settings must be configured for email delivery; without them, OTP email operations return an unavailable response.

If you create the demo owner account with the seed script, configure `DEMO_SEED_PASSWORD` in `server/.env` with a local value of at least 12 characters. The seed script does not print the password.

## Database setup

From the repository root, apply the committed migrations and generate the Prisma client:

```bash
npm run db:migrate
npm run db:generate
```

To populate local sample records, set `DEMO_SEED_PASSWORD` first and run:

```bash
npm run db:seed
```

The seed is disabled when `NODE_ENV=production`. Use a disposable local database for demo data.

## Run the application

Start both development processes from the repository root:

```bash
npm run dev
```

The frontend is available at `http://localhost:3000`; the API listens at `http://localhost:5000`. Alternatively, run `npm run dev --prefix server` and `npm run dev --prefix client/app` in separate terminals. Build the frontend with `npm run build --prefix client/app`.

## GitHub Pages deployment

The `Deploy website to GitHub Pages` workflow builds the React app from `client/app/` and publishes its `dist/` directory. After the workflow succeeds, the project site is available at `https://rushda971.github.io/Astraeon-BusinessOS/`. The frontend uses hash-based routes so links and refreshes work on static hosting.

GitHub Pages hosts static files only; it does not run this repository's Express API or SQLite database. The login and data-backed modules therefore need a separately deployed API. Set the repository Actions variable `VITE_API_BASE_URL` to that API's HTTPS origin to connect the deployed frontend. The API must allow requests from the Pages site through its CORS configuration.

## API overview

Routes are mounted under `/api`:

- `/api/auth` — registration, OTP verification/resend, login, profile, logout, and password recovery
- `/api/employees` — employee records, summaries, and status updates
- `/api/inventory` — items, categories, suppliers, stock operations, movements, and summaries
- `/api/menu` — menu categories and products
- `/api/orders` — order creation, listing, status changes, and summaries
- `/api/sales` — sales creation, listing, status changes, and summaries

Protected endpoints require a bearer JWT. See [server/README.md](server/README.md) for the documented authentication and employee endpoints.

## Authentication

Passwords are hashed with bcrypt. Email verification and password recovery use expiring, hashed OTP values delivered through SMTP. Protected API calls use bearer tokens. Configure a strong `JWT_SECRET` for every deployed environment and use HTTPS in production.

## Screenshots

Screenshots are not currently included in the repository. Add reviewed application screenshots here when they are ready for publication.

## Security notes

- Keep `.env` files, real credentials, tokens, and production data out of Git.
- `server/.env.example` contains placeholders only.
- The demo seed is for local development and refuses to run in production.
- Review CORS origins, SMTP configuration, JWT settings, and database backups before deployment.

## Future scope

The codebase includes operational modules for restaurant management. Deployment automation, production hosting configuration, and end-to-end verification are not documented as established features here.

## Author and contributors

Maintainer: [Rushda971](https://github.com/Rushda971). Contributions are welcome through GitHub issues and pull requests.

## License

No license file is currently included. Add a license before granting public reuse rights.
