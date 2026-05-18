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
