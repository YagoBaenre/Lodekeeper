# LODEKEEPER — Documento Tecnico de Proyecto

### A Final Fantasy XIV Collection & Free Company Tracker

**Version:** 1.0
**Fecha:** Marzo 2026
**Stack:** Angular (Frontend) · NestJS (Backend) · Docker (Despliegue)
**Dominio:** `lodekeeper.gg`

---

## 1. Analisis de la Idea

### 1.1 Resumen

Lodekeeper es una aplicacion web para jugadores de FFXIV que permite rastrear, visualizar y compartir colecciones (monturas, mascotas, logros, titulos) tanto a nivel individual como de Free Company (FC). Transforma los datos crudos del Lodestone en dashboards visuales, leaderboards, alertas inteligentes e infografias compartibles.

### 1.2 Puntos Fuertes

| Fortaleza | Por que importa |
|---|---|
| **"Almost There" como hook principal** | Mostrar que estas a 1-2 items de completar un set es un disparador psicologico potentisimo. Crea urgencia y engagement inmediato. |
| **Dimension social (FC)** | La mayoria de trackers de FFXIV son individuales. Lodekeeper compite en un nicho poco explotado al ofrecer vision grupal. |
| **Discord webhooks desde el dia 1** | Las FCs viven en Discord. Cada notificacion automatica es marketing organico gratuito dentro de comunidades activas. |
| **Generador de graficos** | Las infografias compartibles son el motor de crecimiento viral en Reddit, Twitter/X y Discord. |
| **Nombre y marca** | "Lodekeeper" es memorable, referencia directa al Lodestone, suena premium y escala bien con nuevas features. |
| **Dual audience** | Sirve tanto a jugadores solo como a lideres de FC sin alienar a ninguno. |
| **Dominio `.gg`** | Estandar en gaming, genera confianza inmediata en el publico objetivo. |

### 1.3 Riesgos y Puntos Debiles

| Riesgo | Severidad | Mitigacion |
|---|---|---|
| **XIVAPI v2 elimino endpoints del Lodestone** | **CRITICA** | Usar Nodestone o scraper propio (ver seccion 4) |
| **Dependencia del Lodestone de Square Enix** | Alta | Cache agresivo + actualizaciones asincronas. Si SE cambia el HTML, Nodestone se rompe. |
| **Rate limiting del Lodestone** | Alta | Cola de jobs con throttling, priorizacion de datos recientes |
| **Datos de coleccion limitados** | Media | Lodestone no expone todas las colecciones (emotes, hairstyles). Requiere input manual o fuentes alternativas. |
| **Competencia existente** | Media | FFXIVCollect.com existe. Diferenciacion via FC features, graficos y Discord integration. |
| **Costes de scraping a escala** | Media | Arquitectura de workers escalable con Bull/BullMQ en NestJS |
| **Privacidad de personajes** | Baja | Algunos jugadores tienen perfiles privados en Lodestone. Manejar gracefully. |

### 1.4 Analisis Competitivo

| Competidor | Que hace | Ventaja de Lodekeeper |
|---|---|---|
| **FFXIVCollect** | Tracker individual de colecciones via API propia | Lodekeeper anade dimension FC, graficos, Discord |
| **Lalachievements** | Tracker de logros | Lodekeeper es mas amplio (mounts, minions, etc.) |
| **Lodestone directo** | Datos crudos del personaje | UX infinitamente mejor, dashboards, alertas |

---

## 2. Arquitectura del Sistema

### 2.1 Diagrama de Alto Nivel

```
+------------------+     +-------------------+     +------------------+
|                  |     |                   |     |                  |
|   Angular SPA    |<--->|   NestJS API      |<--->|   PostgreSQL     |
|   (Frontend)     |     |   (Backend)       |     |   (Base de Datos)|
|                  |     |                   |     |                  |
+------------------+     +--------+----------+     +------------------+
                                  |
                         +--------+----------+
                         |                   |
                         |   Redis           |
                         |   (Cache + Queue) |
                         |                   |
                         +--------+----------+
                                  |
                    +-------------+-------------+
                    |                           |
           +--------+------+          +--------+--------+
           |               |          |                 |
           | XIVAPI v2     |          | Nodestone /     |
           | (Game Data)   |          | Lodestone       |
           | Items, Mounts |          | Scraper         |
           | Minions, etc. |          | (Player Data)   |
           |               |          |                 |
           +---------------+          +-----------------+
```

### 2.2 Stack Tecnologico

| Capa | Tecnologia | Justificacion |
|---|---|---|
| **Frontend** | Angular 19+ | Framework robusto, TypeScript nativo, gran ecosistema de componentes |
| **UI Components** | Angular Material / PrimeNG | Componentes listos para dashboards y tablas |
| **Backend** | NestJS | Arquitectura modular, TypeScript, decoradores, inyeccion de dependencias |
| **Base de Datos** | PostgreSQL | Relacional, ideal para datos estructurados de personajes/FCs/colecciones |
| **ORM** | TypeORM / Prisma | Type-safe queries, migraciones automaticas |
| **Cache** | Redis | Cache de datos del Lodestone + broker para colas de trabajo |
| **Colas** | BullMQ | Jobs asincrono para scraping del Lodestone con rate limiting |
| **Auth** | JWT + Passport | Autenticacion stateless, compatible con OAuth |
| **Contenedores** | Docker + Docker Compose | Desarrollo local uniforme, despliegue reproducible |
| **CI/CD** | GitHub Actions | Automatizacion de tests, builds y deploys |

### 2.3 Estructura de Carpetas (Monorepo)

```
lodekeeper/
├── docker-compose.yml
├── .env.example
├── README.md
│
├── frontend/                    # Angular app
│   ├── Dockerfile
│   ├── angular.json
│   ├── package.json
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/            # Servicios singleton, guards, interceptors
│   │   │   ├── shared/          # Componentes reutilizables, pipes, directives
│   │   │   ├── features/        # Modulos por funcionalidad
│   │   │   │   ├── auth/
│   │   │   │   ├── character/
│   │   │   │   ├── collection/
│   │   │   │   ├── fc-dashboard/
│   │   │   │   ├── graphics/
│   │   │   │   └── leaderboard/
│   │   │   └── app.routes.ts
│   │   ├── assets/
│   │   └── environments/
│   └── tsconfig.json
│
├── backend/                     # NestJS app
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/              # Configuracion centralizada
│   │   ├── auth/                # Modulo de autenticacion
│   │   ├── users/               # Gestion de usuarios
│   │   ├── characters/          # Personajes FFXIV
│   │   ├── collections/         # Mounts, minions, achievements
│   │   ├── free-company/        # Datos de FC
│   │   ├── lodestone/           # Servicio de scraping (Nodestone)
│   │   ├── xivapi/              # Servicio para XIVAPI v2 (game data)
│   │   ├── graphics/            # Generacion de infografias
│   │   ├── notifications/       # Alertas y Discord webhooks
│   │   ├── queue/               # Workers de BullMQ
│   │   └── database/
│   │       ├── entities/
│   │       └── migrations/
│   └── tsconfig.json
│
└── shared/                      # Tipos e interfaces compartidas
    ├── package.json
    └── src/
        ├── types/
        ├── constants/
        └── utils/
```

---

## 3. Modelo de Datos

### 3.1 Entidades Principales

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    User      │     │    Character      │     │  FreeCompany    │
├──────────────┤     ├──────────────────┤     ├─────────────────┤
│ id           │1───*│ id               │*───1│ id              │
│ email        │     │ lodestoneId      │     │ lodestoneId     │
│ password     │     │ name             │     │ name            │
│ createdAt    │     │ server           │     │ server          │
│ settings     │     │ dataCenter       │     │ tag             │
└──────────────┘     │ portrait         │     │ memberCount     │
                     │ title            │     │ slogan          │
                     │ verified         │     │ lastScrapedAt   │
                     │ userId (FK)      │     └─────────────────┘
                     │ freeCompanyId(FK)│
                     │ lastScrapedAt    │
                     └──────────────────┘

┌──────────────────┐     ┌────────────────────────┐
│  Collectible     │     │  CharacterCollectible   │
├──────────────────┤     ├────────────────────────┤
│ id               │1───*│ characterId (FK)       │
│ type (enum)      │     │ collectibleId (FK)     │
│ name             │     │ obtainedAt             │
│ icon             │     └────────────────────────┘
│ source           │
│ patch            │
│ rarity           │
└──────────────────┘

┌──────────────────┐     ┌────────────────────────┐
│  Achievement     │     │  CharacterAchievement   │
├──────────────────┤     ├────────────────────────┤
│ id               │1───*│ characterId (FK)       │
│ name             │     │ achievementId (FK)     │
│ description      │     │ obtainedAt             │
│ category         │     └────────────────────────┘
│ points           │
│ icon             │
│ patch            │
└──────────────────┘
```

### 3.2 Tipos Enum

```typescript
enum CollectibleType {
  MOUNT = 'mount',
  MINION = 'minion',
  TITLE = 'title',
  EMOTE = 'emote',
  HAIRSTYLE = 'hairstyle',
  ORCHESTRION = 'orchestrion',
}

enum CollectibleSource {
  RAID = 'raid',
  TRIAL = 'trial',
  DUNGEON = 'dungeon',
  CRAFTING = 'crafting',
  TREASURE_MAP = 'treasure_map',
  PVP = 'pvp',
  MOGSTATION = 'mogstation',
  ACHIEVEMENT = 'achievement',
  EVENT = 'event',
  OTHER = 'other',
}
```

---

## 4. Fuentes de Datos — Analisis Critico

### 4.1 XIVAPI v2 (Datos del juego)

**URL:** `https://v2.xivapi.com`
**Uso en Lodekeeper:** Catalogo maestro de items, monturas, mascotas, logros, acciones.

XIVAPI v2 es una reimplementacion desde cero. Cambios clave:

| Aspecto | v1 | v2 |
|---|---|---|
| Terminologia | "Content", "Columns" | "Sheets", "Fields" |
| Esquema | SaintCoinach | EXDSchema |
| Lodestone endpoints | Si (personajes, FCs) | **ELIMINADOS** |
| Estabilidad | Sin versionado | Pin de version de schema y parche |
| Busqueda | Elasticsearch separado | Endpoint unico unificado |
| Datos de parche | Solo el actual | **Todos desde 7.0** |

**Endpoint principal:**
```
GET /api/sheet/{SheetName}/{RowId}?fields=Field1,Field2
```

**Ejemplo — obtener una montura:**
```
GET /api/sheet/Mount/1?fields=Name,Icon,Order
```

**Sheets relevantes para Lodekeeper:**
- `Mount` — Todas las monturas
- `Companion` — Todas las mascotas (minions)
- `Achievement` — Todos los logros
- `Title` — Todos los titulos
- `Emote` — Todos los emotes
- `Item` — Base de datos de items
- `Action` — Acciones/habilidades

**Libreria oficial para JS/TS:**
```bash
npm install @xivapi/js@latest
```

**Importante:** La v0.4.5 (XIVAPI v1) esta deprecada. La v1.0.3+ ya apunta a v2.

### 4.2 Nodestone (Datos de jugadores — Lodestone scraping)

**Paquete:** `@xivapi/nodestone`
**Lenguaje:** TypeScript (96.5%)
**Uso en Lodekeeper:** Obtener datos de personajes, FCs, colecciones de cada jugador.

Dado que XIVAPI v2 elimino los endpoints del Lodestone, Nodestone es la alternativa principal. Es un parser de HTML del Lodestone mantenido por el mismo equipo de XIVAPI.

```bash
npm install @xivapi/nodestone
```

**Capacidades:**
- Parseo de perfiles de personaje
- Datos de Free Company
- Listas de logros
- Monturas y mascotas de un personaje

**Riesgos:**
- Depende de la estructura HTML del Lodestone (se puede romper con updates de SE)
- Requiere rate limiting agresivo para no ser bloqueado
- El repositorio depende de `lodestone-css-selectors` (selectores CSS del Lodestone)

### 4.3 Estrategia de Datos Combinada

```
XIVAPI v2 ──────> Catalogo maestro (QUE existe en el juego)
                   - Lista completa de monturas, minions, logros
                   - Iconos, descripciones, fuentes
                   - Se actualiza automaticamente con cada parche

Nodestone ───────> Datos de jugador (QUIEN tiene QUE)
                   - Monturas/minions que posee un personaje
                   - Logros desbloqueados
                   - Datos de FC y miembros

Lodekeeper DB ──> Cruce de datos
                   - Catalogo XIVAPI vs Coleccion del jugador
                   - = Lo que te falta, lo que casi tienes, rankings
```

---

## 5. Docker — Configuracion de Despliegue

### 5.1 docker-compose.yml

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "4200:80"
    depends_on:
      - backend
    environment:
      - API_URL=http://backend:3000

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=postgresql://lodekeeper:${DB_PASSWORD}@postgres:5432/lodekeeper
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - XIVAPI_BASE_URL=https://v2.xivapi.com
    volumes:
      - ./backend/src:/app/src

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=lodekeeper
      - POSTGRES_USER=lodekeeper
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 5.2 Dockerfile — Frontend (Angular)

```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 5.3 Dockerfile — Backend (NestJS)

```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Run stage
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
```

### 5.4 Comandos de Desarrollo

```bash
# Levantar todo el entorno
docker compose up -d

# Rebuild tras cambios
docker compose up -d --build

# Ver logs
docker compose logs -f backend

# Parar todo
docker compose down

# Reset completo (incluye datos)
docker compose down -v
```

---

## 6. API Endpoints — Backend NestJS

### 6.1 Autenticacion

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/auth/register` | Registro de usuario |
| POST | `/auth/login` | Login, devuelve JWT |
| POST | `/auth/refresh` | Renovar token |

### 6.2 Personajes

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/characters/link` | Vincular personaje via Lodestone ID |
| POST | `/characters/:id/verify` | Verificar propiedad del personaje |
| GET | `/characters/:id` | Datos del personaje |
| GET | `/characters/:id/collections` | Colecciones del personaje |
| GET | `/characters/:id/achievements` | Logros del personaje |
| GET | `/characters/:id/missing` | Items que le faltan |
| POST | `/characters/:id/refresh` | Forzar re-scraping del Lodestone |

### 6.3 Free Company

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/fc/:id` | Datos de la FC |
| GET | `/fc/:id/members` | Lista de miembros |
| GET | `/fc/:id/collections` | Colecciones agregadas de la FC |
| GET | `/fc/:id/leaderboard` | Ranking de miembros por coleccion |
| GET | `/fc/:id/almost-there` | Items que la mayoria casi tiene |
| GET | `/fc/:id/feed` | Feed de actividad reciente |

### 6.4 Colecciones y Datos del Juego

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/collectibles` | Catalogo completo (filtrable por tipo) |
| GET | `/collectibles/:id` | Detalle de un coleccionable |
| GET | `/achievements` | Catalogo de logros |
| GET | `/achievements/:id` | Detalle de un logro |

### 6.5 Graficos y Notificaciones

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/graphics/character-card` | Generar card de personaje (PNG) |
| POST | `/graphics/fc-summary` | Generar resumen de FC (PNG) |
| POST | `/notifications/discord/webhook` | Configurar webhook de Discord |
| GET | `/notifications/settings` | Obtener config de notificaciones |
| PUT | `/notifications/settings` | Actualizar config de notificaciones |

---

## 7. Flujo de Verificacion de Personaje

Para confirmar que un usuario es dueno de un personaje FFXIV:

```
1. Usuario introduce su Lodestone ID o busca su personaje
2. Backend genera un codigo unico (ej: "LK-a7f3x9")
3. Usuario pega ese codigo en su "Lodestone Profile Bio"
4. Usuario pulsa "Verificar" en Lodekeeper
5. Backend scrapea el perfil del Lodestone via Nodestone
6. Si el codigo esta en la bio → personaje verificado y vinculado
7. Usuario puede borrar el codigo de su bio
```

---

## 8. Sistema de Scraping — Arquitectura de Workers

### 8.1 Flujo de Actualizacion

```
                    ┌─────────────┐
                    │  Scheduler  │  (Cron cada 6-12h)
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  BullMQ     │  Cola de jobs
                    │  Queue      │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Worker 1 │ │ Worker 2 │ │ Worker N │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │             │             │
             ▼             ▼             ▼
        ┌─────────────────────────────────────┐
        │          Lodestone (via Nodestone)   │
        │          Rate limited: ~1 req/seg   │
        └─────────────────────────────────────┘
```

### 8.2 Estrategia de Rate Limiting

```typescript
// Configuracion de BullMQ para respetar el Lodestone
const queue = new Queue('lodestone-scraping', {
  limiter: {
    max: 1,        // 1 job a la vez
    duration: 1500, // cada 1.5 segundos
  },
});
```

### 8.3 Priorizacion de Scraping

1. **Alta prioridad:** Personajes recien vinculados, verificaciones
2. **Media prioridad:** Personajes activos (logeados en Lodekeeper < 7 dias)
3. **Baja prioridad:** Personajes inactivos (sin login > 30 dias)

---

## 9. Roadmap de Desarrollo

### Fase 1 — MVP (v0.1)

- [ ] Setup del monorepo (Angular + NestJS + Docker)
- [ ] Autenticacion basica (registro/login con JWT)
- [ ] Integracion con XIVAPI v2 para catalogo de monturas y mascotas
- [ ] Integracion con Nodestone para datos de personaje
- [ ] Vinculacion y verificacion de personaje
- [ ] Tracker individual: monturas y mascotas (owned vs missing)
- [ ] Vista basica de "Almost There"
- [ ] Base de datos PostgreSQL con entidades principales

### Fase 2 — FC Features (v0.2)

- [ ] Dashboard de Free Company
- [ ] Colecciones agregadas de FC
- [ ] Leaderboard de miembros
- [ ] Feed de actividad de la FC
- [ ] "Almost There" a nivel de FC
- [ ] Sistema de colas con BullMQ para scraping programado

### Fase 3 — Social (v0.3)

- [ ] Achievement tracker (individual + FC)
- [ ] Generador de graficos (character cards, FC summaries)
- [ ] Discord webhooks
- [ ] Notificaciones in-app
- [ ] Alertas de nuevo parche

### Fase 4 — Expansion (v1.0)

- [ ] Colecciones adicionales: titulos, emotes, orchestrion
- [ ] Paginas publicas de FC
- [ ] PWA para movil
- [ ] Character cards compartibles
- [ ] Ranking comunitario de monturas mas raras

---

## 10. Variables de Entorno

```env
# Base de datos
DB_PASSWORD=your_secure_password
DATABASE_URL=postgresql://lodekeeper:${DB_PASSWORD}@localhost:5432/lodekeeper

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h

# XIVAPI
XIVAPI_BASE_URL=https://v2.xivapi.com

# Discord
DISCORD_WEBHOOK_ENCRYPTION_KEY=your_encryption_key

# App
APP_URL=https://lodekeeper.gg
NODE_ENV=development
PORT=3000
```

---

## 11. Decisiones Arquitectonicas Clave

| Decision | Razon |
|---|---|
| **Monorepo sin Nx/Turborepo** | Simplicidad. Solo 2 apps + 1 shared. No necesita build orchestration compleja. |
| **PostgreSQL sobre MongoDB** | Datos altamente relacionales (usuarios ↔ personajes ↔ colecciones ↔ FCs). SQL brilla aqui. |
| **BullMQ sobre cron simple** | Retry automatico, rate limiting built-in, dashboard de monitoring, concurrencia controlada. |
| **Nodestone sobre scraper custom** | Mantenido por el equipo XIVAPI, TypeScript nativo, selectores CSS actualizados por la comunidad. |
| **XIVAPI v2 sobre v1** | v1 esta deprecada. v2 tiene versionado, es mas rapida, y se actualiza automaticamente con parches. |
| **JWT sobre sessions** | Stateless, escala horizontalmente, compatible con futuro mobile/PWA. |
| **Redis dual-purpose** | Cache de datos scrapeados + broker de BullMQ. Un solo servicio, dos funciones. |
| **Generacion de imagenes server-side** | Control total del output, no depende del navegador. Usar `sharp` o `canvas` en Node. |

---

## 12. Consideraciones Legales

- **Square Enix Material Usage License:** Lodekeeper usa assets y datos de FFXIV. Debe cumplir con la [Material Usage License](https://support.na.square-enix.com/rule.php?id=5382&tag=authc) de SE.
- **No comercial (inicialmente):** La licencia de materiales de SE es restrictiva con uso comercial. Monetizacion requiere cuidado.
- **Creditos obligatorios:** Incluir disclaimers de copyright de SE y XIVAPI en la app.
- **Datos de usuario:** Cumplir GDPR si hay usuarios europeos. Politica de privacidad clara.

**Disclaimer sugerido:**
> FINAL FANTASY is a registered trademark of Square Enix Holdings Co., Ltd. FINAL FANTASY XIV © SQUARE ENIX CO., LTD. All Rights Reserved. Lodekeeper is not affiliated with or endorsed by Square Enix.

---

## 13. Referencias y Recursos

| Recurso | URL |
|---|---|
| XIVAPI v2 | https://v2.xivapi.com |
| XIVAPI v2 Docs | https://v2.xivapi.com/docs/welcome/ |
| XIVAPI v2 API Ref | https://v2.xivapi.com/api/docs |
| XIVAPI v2 Migration | https://v2.xivapi.com/docs/migrate/ |
| XIVAPI JS Client | https://github.com/xivapi/xivapi-js |
| XIVAPI Angular Client | https://github.com/xivapi/angular-client |
| Nodestone | https://github.com/xivapi/nodestone |
| Lodestone CSS Selectors | https://github.com/xivapi/lodestone-css-selectors |
| Angular | https://angular.dev |
| NestJS | https://nestjs.com |
| BullMQ | https://bullmq.io |
| TypeORM | https://typeorm.io |
| Docker Compose | https://docs.docker.com/compose |

---

*Documento generado para el proyecto Lodekeeper. Marzo 2026.*
