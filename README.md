# Planificador de Proyectos, Eventos y Tareas

App web para planificar eventos (bodas, etc.) como un grafo de tareas con dependencias. Calcula el **camino crítico (CPM)**: fechas más tempranas/tardías, holgura y qué tareas no pueden retrasarse. El grafo se edita en pantalla (nodos, enlaces FS/SS/FF, lag, progreso).

Stack: Next.js, Prisma, PostgreSQL, React Flow. El motor CPM está en `lib/cpm`.

## Requisitos

- Git
- Docker y Docker Compose  
  No hace falta Node.js en el PC.

## Arranque

```bash
git clone https://github.com/MiguelErnesto/planificador-eventos.git
cd planificador-eventos
docker compose up --build
```

Abre http://localhost:3000

El primer arranque instala dependencias, aplica migraciones y, si la base está vacía, crea el proyecto de ejemplo Boda Ana & Luis.

## Importar base de datos

Importar base de datos con los datos actuales, luego del seeder inicial

Enlace de la descarga:
https://github.com/MiguelErnesto/planificador-eventos/blob/main/backups/planificador_eventos.sql

Guardarlo en el directorio /backups del proyecto.

Para restaurar en el servidor de base de datos:

```bash
cd /home/miguel/proyectos/planificador-eventos
docker exec -i planificador-postgres psql -U planificador -d planificador_eventos < backups/planificador_eventos.sql
```

## Parar
```bash
docker compose down
```

## Comandos útiles (dentro del contenedor, no hay que ejecutarlos inicialmente)
```bash
docker compose exec app npm test
docker compose exec app npm run db:seed
docker compose exec app npm run db:reset
```

