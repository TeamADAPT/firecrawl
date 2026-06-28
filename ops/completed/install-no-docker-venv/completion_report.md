# Completion Report

## Current Status Note

As of 2026-06-28, RabbitMQ is superseded for the active Firecrawl runtime by NATS JetStream. See `/adapt/repos/firecrawl/docs/adr/0001-replace-rabbitmq-with-nats-jetstream.md` and `/adapt/repos/firecrawl/ops/completed/replace-rabbitmq-with-nats/completion_report.md`.

— Codex

## 2026-06-28 06:29:00 — Codex
Firecrawl is installed and running natively on systemd without Docker, Podman, or Python virtual environments.

Runtime services:
- `dragonfly.service`: active, Redis protocol on `127.0.0.1:6379`.
- `rabbitmq-server.service`: active, AMQP listener on `5672`.
- `postgresql@16-main.service`: active, `pg_cron` configured for database `firecrawl`.
- `firecrawl.target`: active.
- `firecrawl-api.service`: active on `3002`.
- `firecrawl-playwright.service`: active on `3000`.
- `firecrawl-worker.service`: active on `3005`.
- `firecrawl-extract-worker.service`: active on `3004`.
- `firecrawl-nuq-worker@0..4.service`: active on `3006..3010`.
- `firecrawl-nuq-prefetch-worker.service`: active on `3011`.
- `firecrawl-nuq-reconciler-worker.service`: active on `3012`.

Live receipts:
- DragonflyDB: `redis-cli PING` returned `PONG`; `INFO server` reported `dragonfly_version:df-v1.39.0`.
- RabbitMQ: `rabbitmq-diagnostics ping` succeeded; `check_running` reported fully booted; listener reported AMQP on port `5672`.
- PostgreSQL: database `firecrawl`; `cron.database_name=firecrawl`; NUQ tables present: `group_crawl`, `queue_crawl_finished`, `queue_scrape`, `queue_scrape_backlog`.
- Playwright service: `POST http://127.0.0.1:3000/scrape` for `https://example.com` returned content length `559` and no error.
- Firecrawl API: `POST http://127.0.0.1:3002/v1/scrape` for `https://example.com` returned `success=true`, title `Example Domain`, status `200`, markdown length `180`.
- Firecrawl API logs showed the live job was taken, scraped via Playwright, marked done, and request completed.

Installed durable files:
- `/etc/firecrawl/firecrawl.env`
- `/etc/firecrawl/playwright.env`
- `/etc/systemd/system/firecrawl.target`
- `/etc/systemd/system/firecrawl-api.service`
- `/etc/systemd/system/firecrawl-playwright.service`
- `/etc/systemd/system/firecrawl-worker.service`
- `/etc/systemd/system/firecrawl-extract-worker.service`
- `/etc/systemd/system/firecrawl-nuq-worker@.service`
- `/etc/systemd/system/firecrawl-nuq-prefetch-worker.service`
- `/etc/systemd/system/firecrawl-nuq-reconciler-worker.service`
- `/adapt/repos/firecrawl/ops/systemd/*`

Notes:
- DragonflyDB replaces Redis through Redis protocol compatibility.
- RabbitMQ remains the queue transport because Firecrawl uses `amqplib` and `NUQ_RABBITMQ_URL`; NATS is not a drop-in replacement.
- Runtime secrets are not committed; they live in `/etc/firecrawl/firecrawl.env`.

— Codex
