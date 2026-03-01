# Deployment Guide (Vercel + Neon)

## 1) Neon PostgreSQL

1. Create a Neon project and copy the connection string.
2. Run schema once against Neon:
   - `npm run db:schema`
3. Run access migration (if upgrading existing DB):
   - `npm run db:migrate:access`
4. (Optional) Seed sample data:
   - `npm run db:seed`

## 2) Vercel Project

1. Import this repository into Vercel.
2. In Project Settings → Environment Variables, set:
   - `DATABASE_URL` = your Neon connection string
   - `POSTGRES_SSL` = `true`
   - `AUTH_USER_ID` = your login ID (e.g. `tony.stark`)
   - `AUTH_PASSWORD` = your secure password
   - `SESSION_SECRET` = long random secret
   - `FRONTEND_ORIGIN` = your Vercel domain (e.g. `https://your-app.vercel.app`)
3. Deploy.

## 3) Notes

- API is served via Vercel function at `api/[...all].js`.
- Frontend is built by Vite and served from `dist`.
- Sessions are cookie-based (24h), suitable for serverless deployment.
- Project access migration is also auto-ensured on backend startup.
