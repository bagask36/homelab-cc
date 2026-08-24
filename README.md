# Homelab Command Center

A production-quality personal homelab monitoring dashboard built with Next.js, React, TypeScript, and Tailwind CSS.

## Status

**Milestone 1 — Project Foundation** (complete)

- Next.js 16 App Router with TypeScript
- Tailwind CSS v4 + shadcn/ui
- Dark-first dashboard shell with sidebar and header
- Placeholder pages for all monitoring sections

Monitoring features are not yet implemented. Summary cards and charts show placeholder values.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

**Milestone 2 — Server Monitoring**

- Implement `GET /api/metrics`
- Collect hostname, OS, CPU, RAM, uptime, and load average
- Wire live data into dashboard summary cards
