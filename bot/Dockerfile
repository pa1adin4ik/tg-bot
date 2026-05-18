FROM node:22-alpine AS build
WORKDIR /app/bot
COPY bot/package.json bot/package-lock.json* ./
RUN npm install
COPY bot .
RUN npm run build

FROM node:22-alpine
WORKDIR /app/bot
ENV NODE_ENV=production
COPY --from=build /app/bot/package.json ./
COPY --from=build /app/bot/node_modules ./node_modules
COPY --from=build /app/bot/dist ./dist
CMD ["node", "dist/bot.js"]
