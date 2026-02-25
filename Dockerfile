# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copia o standalone do Next (inclui server.js e node_modules mínimos)
COPY --from=builder /app/.next/standalone ./
# Static e public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Zeabur injeta $PORT, então só garante fallback
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]