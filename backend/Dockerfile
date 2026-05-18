FROM node:22-alpine AS build
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./backend/
COPY prisma ./prisma
WORKDIR /app/backend
RUN npm install
COPY backend .
RUN npm run prisma:generate && npm run build

FROM node:22-alpine
WORKDIR /app/backend
ENV NODE_ENV=production
COPY --from=build /app/backend/package.json ./
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/prisma ../prisma
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy --schema ../prisma/schema/schema.prisma && node dist/server.js"]
