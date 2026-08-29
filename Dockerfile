FROM node:22-bookworm

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
# Prisma 6 get-config lee .env del disco, no solo el entorno del RUN.
RUN printf 'DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"\n' > .env \
  && npm ci

COPY . .

# Recrear .env: COPY . . no lo trae (.dockerignore). Borrar al final para no pisar Railway.
RUN printf 'DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"\n' > .env \
  && npm run build \
  && rm -f .env

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["sh", "-c", "rm -f /app/.env && npx prisma migrate deploy && npx tsx scripts/maybe-seed.ts && npx next start --hostname 0.0.0.0 --port ${PORT:-3000}"]
