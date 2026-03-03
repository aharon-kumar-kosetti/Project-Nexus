# Project Nexus

A full-stack project command center to track software ideas from planning to deployment.

Project Nexus helps you manage projects with timeline context, progress tracking, kanban workflow, documentation uploads, and owner/admin access control in one clean dashboard.

## Highlights

- Authenticated project workspace (register, login, profile, password update)
- Grid + kanban project views with live filtering/search
- Project metadata tracking (status, priority, progress, deadlines, tasks)
- Document uploads per project (up to 5 files/request, 4MB each)
- Access-sharing model (owner/admin/write + shared read-only access)
- Built-in support message flow between users and admin

## Tech Stack

- **Frontend:** React 19, Vite
- **Backend:** Node.js, Express 5
- **Database:** PostgreSQL (`pg`)
- **Auth:** Cookie-based session auth (`cookie-session`)
- **Deployment:** Vercel (frontend + serverless API)

## Project Structure

```text
src/                 # React app (UI, components, API clients)
server/              # Express app, routes, DB, migrations, seed
api/[...all].js      # Vercel serverless entry for API
uploads/             # Uploaded project docs (local runtime storage)
DEPLOYMENT.md        # Deployment steps for Vercel + Neon
```

## Getting Started (Local)

### 1) Install dependencies

```bash
npm install
```

### 2) Create environment file

Copy `.env.example` to `.env`, then update values for your local machine:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/project_nexus
PORT=3001
POSTGRES_SSL=false
FRONTEND_ORIGIN=http://localhost:5173
SESSION_SECRET=replace_with_a_long_random_secret
```

> Notes:
> - `AUTH_USER_ID` and `AUTH_PASSWORD` are only needed for legacy migration workflows and are not required for normal app login.
> - No default credentials are required in README setup. Create your account from the app UI after startup.

### 3) Prepare database

```bash
npm run db:schema
npm run db:migrate:access
```

Optional sample data:

```bash
npm run db:seed
```

### 4) Run frontend + backend

```bash
npm run dev:all
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

### 5) Create first account

Open the app and register a new user from the authentication screen.

## Deployment

For Vercel + Neon deployment, follow:

- `DEPLOYMENT.md`

Required production environment variables:

- `DATABASE_URL`
- `POSTGRES_SSL=true`
- `SESSION_SECRET`
- `FRONTEND_ORIGIN`

## API Overview

Base API path: `/api`

- `GET /api/health` — health check
- `POST /api/auth/register` / `POST /api/auth/login` / `POST /api/auth/logout`
- `GET /api/auth/me` / `PUT /api/auth/profile` / `PUT /api/auth/password`
- `GET|POST|PUT|DELETE /api/projects`
- `POST /api/projects/:id/access` / `DELETE /api/projects/:id/access/:sharedUserId`
- `POST /api/projects/:id/docs` / `DELETE /api/projects/:id/docs/:docId`
- `GET|POST /api/support/tickets`

## Security Notes

- Session auth uses HTTP-only cookies.
- Use a strong `SESSION_SECRET` in all environments.
- In production, set strict CORS via `FRONTEND_ORIGIN`.
- Do not commit `.env` or real credentials.
