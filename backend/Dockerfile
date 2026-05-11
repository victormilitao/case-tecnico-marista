# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm i --no-save tsx
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database/migrations ./src/database/migrations
COPY --from=builder /app/src/database/migrate.ts ./src/database/migrate.ts
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
EXPOSE 3333
CMD ["sh", "-c", "npx tsx src/database/migrate.ts && node dist/main.js"]
