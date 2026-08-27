# Homelab Command Center

A production-quality personal homelab monitoring dashboard built with Next.js, React, TypeScript, and Tailwind CSS.

## Status

**Milestone 9 — Control Panel** (complete)

- Start, stop, and restart containers with explicit name confirmation
- View container logs (last 200 lines, audit logged)
- PostgreSQL audit log for all control actions
- Control actions and audit history on `/containers`

**Milestone 8 — Alerts** (complete)

- `GET /api/alerts` — live evaluation of CPU, memory, storage, services, containers, and tunnel
- Warning/critical thresholds for resource usage
- Dashboard alerts panel and dedicated `/alerts` page
- Header shows active alert count and overall status

**Milestone 7 — Authentication** (complete)

- Username/password login with httpOnly JWT session cookie
- `proxy.ts` protects dashboard pages and API routes
- Bootstrap first admin from `AUTH_USERNAME` / `AUTH_PASSWORD`
- Settings page for changing password
- Sign out control in the header

**Milestone 6 — Historical Metrics** (complete)

- PostgreSQL + Prisma for periodic metric snapshots (30s collector)
- `GET /api/metrics/history?range=1h|6h|24h|7d|30d` with downsampling
- Dashboard chart range selector: Live, 1h, 6h, 24h, 7d, 30d
- 30-day retention with automatic cleanup
- Docker Compose includes PostgreSQL and applies migrations via a one-shot `migrate` service

**Milestone 5 — Services** (complete)

- `GET /api/services` — health checks for Docker, PostgreSQL, Redis, Ollama, Open WebUI, Cloudflare Tunnel, Nginx Proxy Manager
- `GET /api/ollama` — model list, running models, response time
- `GET /api/tunnel` — Cloudflare Tunnel metrics probe
- Live services panel on dashboard plus `/services`, `/ollama`, `/tunnel` pages

**Milestone 4 — Docker** (complete)

- `GET /api/docker` — container list, status, image, CPU, memory, network, restart count
- Docker Engine integration via `/var/run/docker.sock`
- Dashboard Docker card and overview panel
- `/containers` page with full container table

**Milestone 3 — Storage and Network** (complete)

- `GET /api/storage` — disk usage and filesystem list
- `GET /api/network` — RX/TX counters per interface
- Live storage summary card and network throughput chart
- `/storage` and `/network` pages with detailed views

**Milestone 2 — Server Monitoring** (complete)

- `GET /api/metrics` — hostname, OS, CPU, RAM, uptime, load average
- Live dashboard summary cards with 3s polling (SWR)
- CPU and memory charts with short-term in-memory history

**Milestone 1 — Project Foundation** (complete)

- Next.js 16 App Router with TypeScript
- Tailwind CSS v4 + shadcn/ui
- Dark-first dashboard shell with sidebar and header
- Docker Compose for local/production runs

## Getting Started

```bash
npm install
cp .env.example .env
# Set DATABASE_URL, AUTH_SECRET, AUTH_USERNAME, AUTH_PASSWORD
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

Authentication and historical metrics require PostgreSQL plus `DATABASE_URL` and `AUTH_SECRET`.

## Docker (local)

Run the app in Docker — no local Node.js install required.

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

Default Docker credentials (change these for anything beyond local use):

- Username: `admin`
- Password: `changeme`

This uses the production image (fast and reliable) and starts PostgreSQL automatically. Stop any local `npm run dev` first if port 3000 is already in use.

Docker monitoring requires mounting the Docker socket (already configured in `docker-compose.yml`):

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

Storage metrics need the host filesystem mounted into the container (also configured):

```yaml
volumes:
  - /:/host:ro,rslave
environment:
  HOST_FS_ROOT: /host
```

Without that bind mount, `/storage` only sees the container overlay and reports “No storage filesystems available”.

Use a different host port:

```bash
PORT=3001 docker compose up --build
```

Stop the stack:

```bash
docker compose down
```

### Development with hot reload

For live code changes inside Docker (slower on macOS):

```bash
docker compose -f docker-compose.dev.yml up --build
```

Make sure nothing else is listening on port 3000 before starting Docker:

```bash
lsof -i :3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |
| `npx prisma migrate dev` | Apply database migrations (local dev) |

## Requirements

- Node.js 20+

## Next Milestone

All planned MVP milestones are complete. Possible follow-ups:

- Alert persistence and notification channels
- Multi-user roles and permissions
- Remote homelab deployment hardening
