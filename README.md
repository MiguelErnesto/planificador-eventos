# Planificador de Eventos y Bodas

MVP de logística con dependencias visuales y algoritmo de camino crítico (CPM).

## Requisitos

- **Docker** y **Docker Compose**
- No hace falta Node.js en el host (el sistema puede seguir en Node 18). El contenedor `app` usa **Node 22**.

El IDE edita los archivos en esta carpeta; el runtime corre en Docker gracias al bind-mount `.` → `/app`.

## Arranque

```bash
docker compose up --build
```

Abre [http://localhost:3000](http://localhost:3000). El primer arranque instala dependencias, aplica migraciones y, si la base está vacía, crea el proyecto **Boda Ana & Luis**.

Para parar:

```bash
docker compose down
```

## Comandos (dentro del contenedor)

No uses `npm` en el host. Todo va por `docker compose exec app`:

```bash
docker compose exec app npm test
docker compose exec app npm run db:seed
docker compose exec app npm run db:reset
docker compose exec app npx prisma migrate deploy
```

| Comando | Descripción |
|---------|-------------|
| `docker compose up --build` | App (Node 22) + Postgres 16 |
| `docker compose exec app npm test` | Tests del motor CPM (Vitest) |
| `docker compose exec app npm run db:seed` | Reemplaza datos con el ejemplo de boda |
| `docker compose exec app npm run db:reset` | Reset DB + seed |

## Variables

- `DATABASE_URL` — dentro del contenedor usa el hostname `postgres` (Compose la inyecta; ver `.env.example`).

## Stack

Next.js (App Router), Tailwind CSS, Prisma, PostgreSQL, React Flow, CPM en TypeScript puro (`lib/cpm`).

Documentación de arquitectura: [`docs/arquitectura-planificador.pdf`](docs/arquitectura-planificador.pdf) · Plan: [`docs/plan-mvp.md`](docs/plan-mvp.md)
