# 🏠 HomePro — Home Improvement Bidding Marketplace

A production-ready, full-stack marketplace that connects **homeowners** (who post
projects) with **contractors** (who bid on them). Includes secure authentication
with role-based access control, a project-creation wizard with media uploads, a
bidding & comparison system, real-time in-app messaging, reviews & ratings, and
an admin console.

> Built as a single **Next.js (App Router)** application with a custom Express
> server that hosts the API, applies security middleware (Helmet/CORS), and runs
> the **Socket.io** real-time layer in the same process.

---

## ✨ Features

### Homeowners
- **Multi-step project wizard** — title, category, description, urgency, budget
  range (or "request quotes"), location, and **drag-and-drop image/video uploads**.
- **Project dashboard** — active and historical listings.
- **Bid management** — compare incoming bids side-by-side (price, timeline,
  contractor rating). Accepting a bid automatically closes the project to others.
- **Reviews** — rate the contractor (1–5 stars) after completion.

### Contractors
- **Onboarding profile** — business name, license number, service categories,
  service radius, and bio.
- **Searchable job board** — filter by category, ZIP/location, budget, and keyword.
- **Bidding** — amount, estimated start/completion dates, and a written proposal.

### Shared
- **Real-time chat** (Socket.io) that **opens only after a bid is placed**, keeping
  contact details off-platform. Supports secure photo attachments.
- **Review & rating system** that updates each contractor's public average.

### Admin
- Platform metrics, user management (activate/deactivate), and project moderation
  (flag/unflag).

---

## 🧱 Tech Stack

| Layer       | Technology |
|-------------|------------|
| Frontend    | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| Backend     | Next.js API routes + custom Express server (Helmet, CORS) |
| Database    | PostgreSQL + Prisma ORM |
| Auth        | JWT (httpOnly cookie), bcrypt, email verification & password reset, RBAC |
| Real-time   | Socket.io |
| Storage     | Pluggable — local disk (dev) or AWS S3 (prod) |
| Validation  | Zod (input sanitization on every endpoint) |

---

## 🗄️ Database Schema

Normalized relational schema (see [`prisma/schema.prisma`](prisma/schema.prisma)):

- **users** — credentials, role, verification flags
- **profiles** — homeowner/contractor details + denormalized rating
- **tokens** — hashed email-verify / password-reset tokens
- **projects** — listing details, status, budget, location, moderation flags
- **project_media** — uploaded images/videos
- **bids** — amount, dates, proposal, status (one per contractor per project)
- **messages** — per-thread chat with optional attachments
- **reviews** — 1–5 star rating + comment (one per project per reviewer)

All tables have indexes on foreign keys and common filter columns, plus
`created_at`/`updated_at` timestamps.

---

## 🚀 Local Setup

### Prerequisites
- **Node.js 20+**
- **PostgreSQL 14+** (or use the included `docker-compose.yml`)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
```
Then edit `.env`. At minimum set `DATABASE_URL` and a strong `JWT_SECRET`
(generate one with `openssl rand -base64 48`). See `.env.example` for every
option (storage driver, AWS S3, CORS origins, mail driver).

### 3. Start PostgreSQL

**Option A — Docker (recommended):**
```bash
docker compose up -d db
```
This starts Postgres on `localhost:5432` matching the default `DATABASE_URL`.

**Option B — existing Postgres:** create a database and point `DATABASE_URL` at it.

### 4. Run migrations & generate the client
```bash
npm run prisma:migrate     # creates tables (dev migration)
# or, against an existing migrated DB:
# npm run prisma:deploy
```

### 5. Seed demo data (optional but recommended)
```bash
npm run db:seed
```
This creates demo accounts (password **`Password123!`** for all):

| Role        | Email                       |
|-------------|-----------------------------|
| Admin       | `admin@homepro.local`       |
| Homeowner   | `homeowner@homepro.local`   |
| Contractor  | `contractor@homepro.local`  |
| Contractor  | `contractor2@homepro.local` |

### 6. Start the dev server
```bash
npm run dev
```
Open **http://localhost:3000**.

> The frontend, API, and Socket.io all run from the single custom server
> (`server.ts`) — there's nothing else to start.

### Verification & reset emails in development
With `MAIL_DRIVER=console` (the default), verification and password-reset links
are **printed to the server console**. Copy the link from your terminal to
complete those flows locally.

---

## 📜 NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the dev server (Next + API + Socket.io) with hot reload |
| `npm run build` | Generate Prisma client and build for production |
| `npm run start` | Run the production server |
| `npm run prisma:migrate` | Create & apply a dev migration |
| `npm run prisma:deploy` | Apply migrations (CI/production) |
| `npm run prisma:studio` | Open Prisma Studio (DB GUI) |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Drop, re-migrate, and re-seed the database |
| `npm run typecheck` | TypeScript type-check |
| `npm run lint` | ESLint |

---

## 🔌 API Overview

All endpoints live under `/api`. Auth is via an httpOnly JWT cookie set on login.

**Auth:** `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`,
`GET /auth/me`, `POST /auth/verify-email`, `POST /auth/forgot-password`,
`POST /auth/reset-password`

**Projects:** `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id`,
`POST /projects/:id/media`, `POST /projects/:id/complete`

**Bids:** `GET/POST /projects/:id/bids`, `POST /bids/:id/accept`,
`POST /bids/:id/reject`, `GET /bids/mine`

**Messaging:** `GET/POST /projects/:id/messages`, `GET /messages/threads`,
`POST /uploads`

**Reviews:** `POST /reviews`

**Profiles:** `GET/PATCH /profile`, `GET /profile/:userId`

**Admin:** `GET /admin/metrics`, `GET/PATCH /admin/users(/:id)`,
`GET /admin/projects`, `POST /admin/projects/:id/flag`

---

## 🔒 Security

- **JWT in httpOnly, SameSite cookies** — not exposed to JavaScript.
- **bcrypt** password hashing (cost 12); reset/verify tokens stored **hashed**.
- **Role-based access control** enforced server-side on every protected route.
- **Zod validation + sanitization** on all inputs (control-character stripping,
  length limits, type coercion) to mitigate injection/XSS. React escapes output.
- **Prisma** parameterizes all queries (no raw SQL → no SQL injection).
- **Helmet** security headers + configurable **CORS** allow-list (custom server),
  plus defense-in-depth headers in `next.config.mjs`.
- **Centralized error handling** returns clean HTTP status codes and never leaks
  internals.
- **Upload validation** — MIME allow-list and 25 MB size cap.
- Email-enumeration-safe password reset and login responses.

---

## ☁️ Deployment

### Docker (full stack)
```bash
docker compose --profile app up --build
```
This runs Postgres + the app, applies migrations on boot, and serves on port 3000.
**Change `JWT_SECRET`** (and any other secrets) before deploying anywhere real.

### Manual / PaaS
1. Provision a PostgreSQL database and set `DATABASE_URL`.
2. Set production env vars (`JWT_SECRET`, `APP_URL`, `CORS_ORIGINS`,
   `STORAGE_DRIVER=s3` + AWS creds, a real `MAIL_DRIVER`).
3. `npm ci && npm run build`
4. `npm run prisma:deploy`
5. `npm run start`

### Switching to S3 storage
Set `STORAGE_DRIVER=s3` and the `AWS_*` variables, then add the SDK:
```bash
npm install @aws-sdk/client-s3
```
The storage layer (`src/lib/storage.ts`) lazily imports the SDK only when needed.

---

## 📁 Project Structure
```
prisma/
  schema.prisma        # database schema
  seed.ts              # demo data
server.ts              # custom Express + Socket.io + Next server
src/
  app/
    api/...            # all backend API routes
    (auth)/...         # login, register, verify, reset
    dashboard/         # role-aware dashboard
    projects/          # job board, wizard, detail
    messages/          # chat inbox
    admin/             # admin console
    contractors/[id]/  # public contractor profiles
  components/          # UI, AuthProvider, Chat, ProjectCard, ...
  lib/                 # prisma, auth, guard, validation, storage, mailer, http
```
