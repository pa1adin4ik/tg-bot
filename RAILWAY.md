# Railway deployment notes

The failure in the screenshot is not a code crash. Railway is blocking deployment before build because the service still has an invalid multi-region setting with the `sfo` region key. Remove multi-region for that service in the Railway dashboard, then redeploy.

## Recommended service split

- `tg-bot`
  Root directory: `/bot`
  Build command: `npm ci && npm run build`
  Start command: `npm run start`

- `backend-api`
  Root directory: `/backend`
  Build command: `npm ci && npm run build`
  Start command: `npm run start`

- `backend-worker`
  Root directory: `/backend`
  Build command: `npm ci && npm run build`
  Start command: `npm run worker`

## Important runtime rules

- Run the Telegram bot with exactly `1` replica.
  The bot uses long polling and in-memory Telegraf sessions, so multiple replicas are not safe.

- Keep `EMBEDDED_WORKERS_ENABLED=false` on the backend API service.
  This prevents duplicate background jobs when the API is scaled.

- Keep `WORKER_ENABLED=true` on the dedicated worker service.

- Set `BACKEND_API_URL` on the bot to the backend public URL with `/api/v1`.
  Example: `https://your-backend.up.railway.app/api/v1`

## Backend environment checklist

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `BOT_API_SECRET`
- `TELEGRAM_BOT_TOKEN` if notifications depend on Telegram sending

## Bot environment checklist

- `BOT_TOKEN`
- `BOT_USERNAME`
- `BACKEND_API_URL`
- `BOT_API_SECRET`

## Notes

- The backend build now runs Prisma client generation automatically, which is required on fresh Railway builds.
- Prisma migrations are not auto-applied during startup. Run `npm run prisma:migrate:deploy` for the backend service when you are ready to apply migrations.
