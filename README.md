# Planificador de Eventos, Tareas y Proyectos

## Para qué sirve

Sirve para organizar un evento (una boda, un lanzamiento, etc.) como un **plan de tareas con dependencias**, no como una lista suelta.

Tú defines: qué hay que hacer, cuántos días dura cada cosa y qué tiene que terminar (o empezar) antes que otra. La app calcula el **camino crítico**:

- fechas más tempranas y más tardías de cada tarea
- **holgura**: cuántos días puedes retrasarte y seguir llegando a la fecha límite
- qué tareas son **críticas** (si se atrasan, se atrasa el evento)

Así ves si el plan cabe en la fecha, qué hay que hacer ya y qué todavía puede esperar. El motor de cálculo está en `lib/cpm`.

## Cómo usar la página

Al abrir http://localhost:3000 caes en el **listado de proyectos**. El primer arranque suele traer el ejemplo **Boda Ana & Luis**.

### Listado

En la cabecera: **Nuevo** (formulario de alta) y **Ver listado**.

Cada fila muestra nombre, fecha límite, progreso, número de tareas y el rango del plan (inicio → fin).

- **Nuevo** abre el formulario (nombre y fecha límite). Al crear, abre ese proyecto.
- Pulsa la fila o **Abrir** para entrar al plan.
- **Editar**: cambia nombre o fecha sin abrir el gráfico.
- **Eliminar**: pide confirmación; no se puede deshacer.

### Dentro de un proyecto

Arriba ves el nombre, la fecha límite y un resumen: rango del plan, duración, progreso y **holgura**.

- Holgura positiva: desde hoy hasta tal día aún puedes retrasar el plan.
- Holgura negativa o aviso rojo: el plan **no llega** a la fecha del evento.

En escritorio puedes editar nombre y fecha ahí mismo. En móvil pulsa **Editar**.

**Nueva tarea:** título y días de duración. En móvil el botón está justo bajo el encabezado; en escritorio, a la derecha.

### Calendario

Barras en el tiempo. El color marca si la tarea es crítica. Puedes **arrastrar** una barra para fijar su inicio.

- Escritorio: un clic en el nombre o en la barra abre el detalle.
- Móvil: toca el **nombre** para abrir el detalle; **doble toque** en la barra también lo abre. Un toque en la barra es para moverla, no para abrir.

### Gráfico de tareas

Mapa de dependencias: cada nodo es una tarea, cada flecha un enlace.

Tipos de enlace:

- **Fin → Inicio**: B no empieza hasta que A termine .

En **escritorio** el gráfico es editable: arrastra nodos y conecta los puntos de inicio/fin para crear enlaces (también con un retraso extra en días).

En **móvil** el gráfico es de solo lectura (árbol de izquierda a derecha; puedes desplazarlo). Los enlaces se crean en el detalle: **Añadir predecesor** / **Añadir sucesor** 

### Detalle de una tarea

En escritorio es el panel derecho. En móvil baja como hoja desde abajo.

Ahí puedes:

- cambiar título, duración y progreso (0–100 %)
- ver si es crítica y cuántos días de margen tiene
- ver fechas más tempranas / más tardías
- añadir o quitar predecesores y sucesores
- eliminar la tarea (pide confirmación)

Al guardar, la app recalcula el camino crítico y actualiza el calendario, el gráfico y la holgura.

## Tecnologías

| Capa | Qué usamos |
|---|---|
| App | Next.js 15, React 19, TypeScript |
| Interfaz | Tailwind CSS 4, React Flow (`@xyflow/react`) |
| Datos | Prisma 6, PostgreSQL 16 |
| Validación / fechas | Zod, date-fns |
| Entorno local | Docker Compose (app + Postgres + Adminer) |
| Pruebas e integración continua | Vitest, ESLint, GitHub Actions |

No hace falta instalar Node.js en el equipo: Docker lo trae (Node 22).

## Requisitos

- Git
- Docker y Docker Compose

## Primera vez: montar y ejecutar

```bash
git clone https://github.com/MiguelErnesto/planificador-eventos.git
cd planificador-eventos
docker compose up --build
```

El primer arranque tarda más (construye la imagen e instala dependencias). El contenedor de la app, al iniciar:

1. Instala paquetes (`npm install`)
2. Genera el cliente Prisma y aplica migraciones
3. Si la base está vacía, crea el proyecto de ejemplo **Boda Ana & Luis**

No hace falta copiar `.env`: Compose inyecta `DATABASE_URL`.

Cuando veas que Next está listo, abre **http://localhost:3000** (redirige a `/projects`).

### Servicios y puertos

| Dirección | Servicio |
|---|---|
| http://localhost:3000 | App |
| http://localhost:8080 | Adminer (inspeccionar la base) |
| localhost:5432 | PostgreSQL (`planificador` / `planificador` / `planificador_eventos`) |

Prisma Studio (opcional, no arranca solo):

```bash
docker compose exec app npm run db:studio
```

Luego http://localhost:5555

## Parar

```bash
docker compose down
```

Los datos siguen en el volumen `postgres_data`. Para borrar también la base:

```bash
docker compose down -v
```

## Comandos útiles

No hacen falta en el primer arranque. Se ejecutan **dentro** del contenedor:

```bash
docker compose exec app npm test
docker compose exec app npm run db:seed
docker compose exec app npm run db:reset
```

`db:reset` vuelve a aplicar migraciones y los datos de ejemplo (borra los datos actuales).

## Importar un volcado de la base de datos (opcional)

El repositorio ya incluye `backups/planificador_eventos.sql`. Solo si quieres sustituir los datos de ejemplo por ese volcado, con los contenedores en marcha:

```bash
docker exec -i planificador-postgres psql -U planificador -d planificador_eventos < backups/planificador_eventos.sql
```
