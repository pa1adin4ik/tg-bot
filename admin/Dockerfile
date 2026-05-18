FROM node:22-alpine AS build
WORKDIR /app/admin
COPY admin/package.json admin/package-lock.json* ./
RUN npm install
COPY admin .
RUN npm run build

FROM nginx:alpine
COPY admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/admin/dist /usr/share/nginx/html
EXPOSE 80
