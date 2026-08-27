# Homelab Command Center

Personal dashboard for a Linux homelab: live host metrics, Docker containers, service health, Ollama, and Cloudflare Tunnel — with login, audit logs, and an OpenAI-compatible API in front of local models.

Built with Next.js, TypeScript, Tailwind CSS, Prisma, and PostgreSQL.

## Features

- **Host** — CPU, memory, storage, network, uptime
- **Containers** — list, start/stop/restart, logs (name confirmation + audit)
- **Services** — health checks for Docker, PostgreSQL, Redis, Ollama, Open WebUI, Nginx Proxy Manager, Cloudflare Tunnel
- **Ollama** — load/unload models, run prompts, generate API keys for other apps
- **Tunnel** — ingress rules, import/apply `config.yml`, reload cloudflared
- **Alerts** — CPU, memory, storage, services, containers, tunnel
- **History** — metric snapshots in PostgreSQL (live / 1h / 6h / 24h / 7d / 30d)
- **Auth** — username/password, httpOnly JWT cookie

## Requirements

| | Local dev | Homelab (Docker) |
|---|---|---|
| Node.js | 20+ | not required |
| Docker Engine + Compose | optional (Postgres) | required |
| Linux host | optional | recommended (`network_mode: host`, storage bind-mount) |

The production Compose file uses **host networking**. The app binds `PORT` on the machine itself (default **3001**). `ports:` in Compose is ignored.

## Quick start (homelab)

```bash
git clone https://github.com/YOUR_USER/homelab-cc.git
cd homelab-cc
cp .env.example .env
```

Edit `.env` before the first run:

```bash
# Required
AUTH_SECRET=at-least-16-random-characters
AUTH_USERNAME=admin
AUTH_PASSWORD=choose-a-strong-password

# HTTP on LAN / Tailscale
AUTH_COOKIE_SECURE=false

# HTTPS via Cloudflare Tunnel (set this when you expose the dashboard publicly)
# AUTH_COOKIE_SECURE=true

PORT=3001
```

Generate a secret if you want:

```bash
openssl rand -base64 32
```

Start the stack (Postgres, migrations, dashboard):

```bash
docker compose up -d --build
```

Open `http://<host-ip>:3001` and sign in.

Stop:

```bash
docker compose down
```

Postgres data stays in the `postgres_data` volume until you add `-v`.

### What Compose mounts

| Mount | Why |
|---|---|
| Docker socket (read-only) | Container list and control |
| Host `/` → `/host` (`:ro,rslave`) | Real disk usage on `/storage` |
| `/etc/cloudflared` (read-write) | Tunnel page can write `config.yml` |

The dashboard runs as root inside the container so it can read the Docker socket. It also uses `pid: host` so Apply on `/tunnel` can signal cloudflared.

If `/storage` shows nothing, the host bind-mount is missing or `HOST_FS_ROOT` does not match.

## Local development

Needs Node 20+ and PostgreSQL (Compose Postgres is enough).

```bash
cp .env.example .env
# Set DATABASE_URL, AUTH_SECRET, AUTH_USERNAME, AUTH_PASSWORD
docker compose up -d postgres
npx prisma migrate dev
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Hot reload in Docker (slower on macOS):

```bash
docker compose -f docker-compose.dev.yml up --build
```

Dev Compose publishes **3000** (not host network). Service probes default to `172.17.0.1` so the container can reach host daemons.

## Environment

Copy from [`.env.example`](.env.example). Compose reads `.env` from the project directory.

### Required

| Variable | Notes |
|---|---|
| `AUTH_SECRET` | ≥ 16 characters. Signs the session cookie. |
| `AUTH_USERNAME` / `AUTH_PASSWORD` | Bootstraps the first admin if the users table is empty. |
| `AUTH_COOKIE_SECURE` | `false` for HTTP; `true` behind HTTPS or login cookies are dropped. |

Postgres is started by Compose. Override `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` if you want. The dashboard `DATABASE_URL` is wired for you (`127.0.0.1:5432` in host mode).

### Optional probes

Defaults assume services on localhost (host network):

| Variable | Default |
|---|---|
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` |
| `OPENWEBUI_URL` | `http://127.0.0.1:8080` |
| `NPM_URL` | `http://127.0.0.1:81` |
| `CLOUDFLARE_TUNNEL_METRICS_URL` | `http://127.0.0.1:20241/metrics` |
| `REDIS_HOST` / `REDIS_PORT` | `127.0.0.1` / `6379` |

### Tunnel management (`/tunnel`)

| Variable | Typical value |
|---|---|
| `CLOUDFLARE_TUNNEL_ID` | UUID from `cloudflared tunnel list` |
| `CLOUDFLARE_TUNNEL_CONFIG_PATH` | `/etc/cloudflared/config.yml` |
| `CLOUDFLARE_TUNNEL_CREDENTIALS_FILE` | **Real credentials path** (see below) |
| `CLOUDFLARE_TUNNEL_CONFIG_DIR` | Directory mounted into the container |
| `CLOUDFLARE_TUNNEL_RELOAD_CMD` | Leave empty; the app sends `SIGHUP`. Do not use `systemctl` from Docker. |

`credentials.json` in `.env.example` is a placeholder. cloudflared usually stores:

```text
/home/<user>/.cloudflared/<tunnel-uuid>.json
```

If Apply writes the wrong path, cloudflared fails with *credentials file doesn't exist*. Check the working file:

```bash
grep credentials-file /etc/cloudflared/config.yml
```

Use that path in `CLOUDFLARE_TUNNEL_CREDENTIALS_FILE`, then recreate the dashboard container.

## Public access (Cloudflare Tunnel + NPM)

A common layout: Tunnel → Nginx Proxy Manager `:80` → dashboard `:3001`.

1. DNS: `cloudflared tunnel route dns <TUNNEL_ID> dashboard.example.com`
2. Ingress (last rule must be catch-all):

```yaml
  - hostname: dashboard.example.com
    service: http://localhost:80
  - service: http_status:404
```

3. In NPM, proxy `dashboard.example.com` to the **host LAN IP**, not `172.17.0.1`, when the app uses `network_mode: host`:

```text
http://192.168.1.x:3001
```

4. UFW often blocks Docker → host-network ports. Other published ports work; `:3001` may hang until you allow the Docker networks:

```bash
sudo ufw allow from 172.16.0.0/12 to any port 3001 proto tcp
sudo ufw reload
```

5. Set `AUTH_COOKIE_SECURE=true` and recreate the dashboard if you serve HTTPS.

Verify:

```bash
curl -I --max-time 5 -H "Host: dashboard.example.com" http://127.0.0.1:80
curl -I --max-time 10 https://dashboard.example.com
```

You want `307` to `/login` (or `200` if already signed in), not a timeout.

## Ollama API keys

On **Ollama**, generate a key (shown once). Other apps call the dashboard, which proxies to local Ollama.

```text
Base URL:  https://dashboard.example.com/api/v1
API key:   hcc_…
```

```bash
curl https://dashboard.example.com/api/v1/chat/completions \
  -H "Authorization: Bearer hcc_…" \
  -H "Content-Type: application/json" \
  -d '{"model":"YOUR_MODEL","messages":[{"role":"user","content":"Hello"}]}'
```

```python
from openai import OpenAI
client = OpenAI(
    base_url="https://dashboard.example.com/api/v1",
    api_key="hcc_…",
)
```

Allowed routes: `GET /api/v1/models`, `POST /api/v1/chat/completions`, `/completions`, `/embeddings`. Keys are stored hashed; revoke them on the same page.

## Update

```bash
cd homelab-cc
git pull
docker compose up -d --build
```

The one-shot `migrate` service applies Prisma migrations before the dashboard starts.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm run start` | Production build / run |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npx prisma migrate dev` | Migrations (local) |
| `npx prisma migrate deploy` | Migrations (CI / Compose `migrate` service) |

## License

Private homelab project. Add a license file if you publish the repo.
