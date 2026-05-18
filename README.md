# Salon Booking Platform

Telegram bot + REST API + admin panel for salon appointments with prepayment, schedules, reviews, portfolio, notifications, and analytics.

## Stack

- **Backend**: Express, Prisma, PostgreSQL
- **Bot**: Telegraf
- **Admin**: React, Vite, Tailwind, Recharts

## Quick start

### 1. Database

```bash
docker compose up -d postgres
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate:dev
npm run dev
```

### 3. Bot

```bash
cd bot
cp .env.example .env
# Set BOT_TOKEN, BOT_API_SECRET (must match backend BOT_API_SECRET)
npm install
npm run dev
```

### 4. Admin

```bash
cd admin
npm install
npm run dev
```

Open http://localhost:5173

## Railway (Telegram bot)

Railpack needs an explicit start command. This repo provides `bot/railpack.json` and `bot/railway.json`.

### Recommended setup

1. **Settings → Source → Root Directory:** `bot`
2. **Settings → Deploy → Custom start command:** `npm run start` (set manually if auto-detect still fails)
3. **Settings → Build → Custom build command:** `npm ci && npm run build`
4. **Settings → Config-as-code path** (if shown): `/bot/railway.json`  
   Railway does **not** apply `railway.toml` from the repo root when Root Directory is `bot`.
5. **Variables** (required):
   - `BOT_TOKEN`
   - `BOT_USERNAME`
   - `BACKEND_API_URL` (e.g. `https://your-api.up.railway.app/api/v1`)
   - `BOT_API_SECRET`
6. **Redeploy** after saving settings (trigger a new deployment, not just restart).

### If Root Directory stays at repo root

Root `package.json`, `railpack.json`, `railway.json`, and `Procfile` delegate build/start to `bot/`.

### Clear stale Railway config

If deploys still fail after pushing fixes: remove any old **Dockerfile** / **Nixpacks** builder override in the service, set **Builder** to **Railpack**, and empty then re-enter the start command in the dashboard.

## Production

```bash
docker compose up -d --build
# or
sh deploy/scripts/deploy.sh
```

See `deploy/nginx.conf.example` and `deploy/ecosystem.config.cjs` for PM2/nginx.

## Security

- All bot-facing booking/payment/review routes require `X-Bot-Secret` header.
- Admin routes require JWT (`Authorization: Bearer`).
- Slot locking uses PostgreSQL advisory locks + reservation expiry worker.

## Tests

```bash
cd backend && npm test
```
