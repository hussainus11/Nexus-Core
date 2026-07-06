# NexusCore Backend — Setup Guide

## Prerequisites

| Tool | Min version |
|------|-------------|
| Node.js | 20 LTS |
| PostgreSQL | 14+ |
| RabbitMQ | 3.12+ (optional — app degrades gracefully) |

---

## 1. Install dependencies

```bash
cd nexuscore-backend
npm install
```

---

## 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your real values:

```env
NEXUSCORE_DATABASE_URL=postgresql://postgres:password@localhost:5432/nexuscore_db
NEXUSCORE_JWT_SECRET=change-me-in-production
NEXUSCORE_RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

---

## 3. Create the database

```sql
-- In psql or pgAdmin:
CREATE DATABASE nexuscore_db;
```

---

## 4. Generate Prisma client + run migration

```bash
# Generate the client
npm run prisma:generate

# Push schema to DB (development)
npx prisma db push

# Or run a proper named migration
npx prisma migrate dev --name init
```

---

## 5. Seed the database

```bash
npm run prisma:seed
```

This seeds:
- Demo company + branch
- Admin user: `admin@nexuscore.io` / `nexuscore123`
- All permissions (22 module:action pairs)
- Admin role with all permissions
- 3 BPM processes + stages (Cutting, Fabric, WhatsApp)
- 4 fabric types (Cotton, Polyester, Denim, Linen)
- 3 shifts (Morning / Afternoon / Night)

---

## 6. Start the server

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build
npm run start:prod
```

---

## 7. Access

| Resource | URL |
|----------|-----|
| REST API | http://localhost:3000/api/v1 |
| Swagger docs | http://localhost:3000/api/docs |
| WebSocket | ws://localhost:3000/nexuscore |

---

## Module → Route map

| Module | Prefix |
|--------|--------|
| Auth | `/api/v1/auth` |
| Users | `/api/v1/users` |
| Roles | `/api/v1/roles` |
| Permissions | `/api/v1/permissions` |
| Company | `/api/v1/company` |
| Branches | `/api/v1/branches` |
| Fabric Types | `/api/v1/fabric-types` |
| Fabric Rolls | `/api/v1/fabric-rolls` |
| Cutting Orders | `/api/v1/cutting-orders` |
| BPM | `/api/v1/bpm` |
| Notifications | `/api/v1/notifications` |
| Reports | `/api/v1/reports` |
| WhatsApp | `/api/v1/whatsapp` |

---

## RabbitMQ queues

| Queue | Purpose |
|-------|---------|
| `nexuscore.cutting.events` | Cutting order lifecycle events |
| `nexuscore.bpm.events` | BPM task stage changes |
| `nexuscore.notifications` | Push to DB + WebSocket |
| `nexuscore.audit.events` | Audit log fanout |

RabbitMQ is **optional** — if unavailable the app starts normally and events are silently dropped with a warning log.

---

## WebSocket events (namespace `/nexuscore`)

| Event | Direction | Payload |
|-------|-----------|---------|
| `notification.new` | server → client | `Notification` object |
| `bpm.task.updated` | server → client | `{ taskId, toStageId }` |
| `order.status.changed` | server → client | `{ orderId, status }` |
| `cutting.progress` | server → client | batch progress |
| `join_order_room` | client → server | `orderId` |
| `leave_order_room` | client → server | `orderId` |

Auth: send JWT in socket handshake: `io('/nexuscore', { auth: { token } })`

---

## Frontend BPM Task Queue

Page: `frontend/app/bpm/tasks`
API helper: `frontend/lib/nexuscore-api.ts`

Set env vars in `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

---

## Microservices extraction (future)

Each module is self-contained (no inter-module imports). To extract:

1. Copy module folder to its own NestJS app
2. Change `PrismaModule` to point to its own DB shard (or keep shared)
3. Replace direct `PrismaService` calls with microservice messages
4. Add an API Gateway on port 3000 to route requests

Planned service ports:
- `cutting-service` → 3001
- `bpm-service` → 3002
- `notification-service` → 3003
- `auth-service` → 3004
- `report-service` → 3005
