# Homelab Command Center

A production-quality personal homelab monitoring dashboard built with Next.js, React, TypeScript, and Tailwind CSS.

## Status

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
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker (local)

Run the app in Docker — no local Node.js install required.

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

This uses the production image (fast and reliable). Stop any local `npm run dev` first if port 3000 is already in use.

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

## Requirements

- Node.js 20+

## Next Milestone

**Milestone 3 — Storage and Network**

- Implement `GET /api/storage` and `GET /api/network`
- Add disk usage, filesystem info, network RX/TX
- Wire storage summary card and network chart
