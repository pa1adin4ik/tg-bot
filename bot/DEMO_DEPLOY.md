# Demo Bot Deployment

This demo mode is designed for the simplest possible public preview of the Telegram bot.

## What this mode does

- runs only the Telegram bot
- does not require backend deployment
- does not require PostgreSQL
- uses local demo services, masters, bookings, and payment flow in memory
- exposes a small HTTP server for health checks
- supports webhook mode so the bot can run as a single public web service

## Recommended Render setup

Create a single `Web Service` from the `bot` directory.

- Root Directory: `bot`
- Build Command: `npm ci && npm run build`
- Start Command: `npm run start`

## Environment variables

- `NODE_ENV=production`
- `BOT_TOKEN=your_botfather_token`
- `BOT_USERNAME=your_bot_username_without_at`
- `DEMO_MODE=true`
- `BOT_MODE=webhook`
- `WEBHOOK_BASE_URL=https://your-service-name.onrender.com`
- `WEBHOOK_SECRET=change-me-webhook-secret-min-16-chars`
- `LOG_LEVEL=info`

## Notes

- `BACKEND_API_URL` is not required in demo mode.
- The health endpoint is available at `/health`.
- The webhook endpoint is generated automatically as `/telegram/webhook/<WEBHOOK_SECRET>`.
- This mode is for demos only. Demo bookings are stored only in process memory and reset on restart/redeploy.
