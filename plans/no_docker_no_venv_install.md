# No-Docker No-Venv Firecrawl Install Plan

## Superseded Runtime Note

As of 2026-06-28, RabbitMQ is superseded for the active native runtime by `plans/replace_rabbitmq_with_nats.md` and ADR `docs/adr/0001-replace-rabbitmq-with-nats-jetstream.md`. DragonflyDB remains the Redis-protocol replacement.

## Objective
Install and run Firecrawl from `/adapt/repos/firecrawl` without Docker, Podman, Python virtual environments, or container-managed dependencies.

## Current Evidence
- Repository branch: `working`.
- Host runtime present: Node.js `v22.23.1`, npm `10.9.8`, Rust `1.96.0`, PostgreSQL `16.14`, systemd `255`.
- Host runtime missing: `pnpm`, Go, DragonflyDB/Redis-compatible service, RabbitMQ server.
- Firecrawl API entrypoints live under `apps/api`.
- Playwright microservice entrypoint lives under `apps/playwright-service-ts`.
- Docker compose maps required services to native equivalents: Redis-compatible cache, RabbitMQ, PostgreSQL, Playwright service, API, queue worker, extract worker, NUQ workers, NUQ prefetch worker, NUQ reconciler worker.
- `apps/api/src/harness.ts` requires explicit `NUQ_DATABASE_URL` and `NUQ_RABBITMQ_URL` to avoid Docker/Podman container bootstrap.
- `/adapt/secrets/db.env` contains NATS settings but no RabbitMQ/AMQP settings. Firecrawl imports `amqplib` and reads `NUQ_RABBITMQ_URL`; NATS is not a drop-in RabbitMQ replacement for this repository without a code-level queue adapter.

## Install Approach
1. Use system packages only:
   - Install Go, DragonflyDB, RabbitMQ, `postgresql-16-cron`, and Playwright browser OS dependencies through system package or upstream binary installation.
   - Enable PNPM through system Node/Corepack using the repository-declared `pnpm@10.16.1`.
2. Prepare native services:
   - Enable/start PostgreSQL, DragonflyDB, and RabbitMQ with systemd.
   - Create a local PostgreSQL database/user for Firecrawl.
   - Load `apps/nuq-postgres/nuq.sql` into PostgreSQL after enabling `pg_cron`.
3. Install application dependencies:
   - Run `pnpm install` in `apps/api`.
   - Run `pnpm install` in `apps/playwright-service-ts`.
   - Install Playwright browser binaries and host dependencies from the Playwright package, not Docker.
4. Build runtime artifacts:
   - Build `apps/api`.
   - Build `apps/playwright-service-ts`.
   - Build `apps/api/sharedLibs/go-html-to-md/libhtml-to-markdown.so` with system Go.
5. Configure environment:
   - Create system-level environment files under `/etc/firecrawl/`.
   - Set localhost service URLs:
     - `REDIS_URL=redis://127.0.0.1:6379` backed by DragonflyDB.
     - `REDIS_RATE_LIMIT_URL=redis://127.0.0.1:6379` backed by DragonflyDB.
     - `PLAYWRIGHT_MICROSERVICE_URL=http://127.0.0.1:3000/scrape`
     - `NUQ_DATABASE_URL=postgresql://...@127.0.0.1:5432/...`
     - `NUQ_DATABASE_URL_LISTEN=postgresql://...@127.0.0.1:5432/...`
     - `NUQ_RABBITMQ_URL=amqp://127.0.0.1:5672`
     - `USE_DB_AUTHENTICATION=false`
6. Install systemd units:
   - `firecrawl-playwright.service`
   - `firecrawl-api.service`
   - `firecrawl-worker.service`
   - `firecrawl-extract-worker.service`
   - `firecrawl-nuq-worker@.service`
   - `firecrawl-nuq-prefetch-worker.service`
   - `firecrawl-nuq-reconciler-worker.service`
7. Verify against the live running system:
   - `systemctl status` for all Firecrawl and dependency services.
   - `journalctl` receipts showing successful startup.
   - HTTP receipt from `http://127.0.0.1:3002`.
   - Live API scrape receipt through the running API, not a simulation script.
   - PostgreSQL receipt showing NUQ schema/tables exist.
   - DragonflyDB Redis-protocol and RabbitMQ AMQP connectivity receipts.

## Guardrails
- Do not run `docker`, `docker compose`, `podman`, or any container runtime.
- Do not create or use Python virtual environments.
- Do not replace RabbitMQ with NATS unless a separate code change introduces a compatible queue adapter.
- Do not commit generated runtime artifacts such as `node_modules`, build outputs, logs, or browser caches.

## Approval
Approved by user on 2026-06-28. Proceed with native installation using DragonflyDB for Redis-compatible storage and RabbitMQ for AMQP queueing.
