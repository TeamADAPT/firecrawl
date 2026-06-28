# Install Firecrawl Without Docker Or Venv

## 2026-06-28 06:25:34 — Codex
Application dependency/build phase completed. PNPM `10.16.1` active, API dependencies installed, Playwright service dependencies installed, Chromium installed, Go shared library built, API TypeScript built, and Playwright service TypeScript built.

## 2026-06-28 06:21:09 — Codex
Native dependency installation completed. DragonflyDB, RabbitMQ, PostgreSQL 16, and `pg_cron` are running under systemd. Created Firecrawl PostgreSQL role/database and loaded NUQ schema. Runtime secret file created at `/etc/firecrawl/firecrawl.env`.

## 2026-06-28 06:18:16 — Codex
Plan approved. Cache dependency changed from Redis server to DragonflyDB. Queue dependency remains RabbitMQ because Firecrawl uses AMQP/RabbitMQ code paths and NATS is not wire-compatible with `amqplib`.

## 2026-06-28 05:32:17 — Codex
Task opened from direct user request: install this repository without Docker and without Python virtual environments. Active plan: `/adapt/repos/firecrawl/plans/no_docker_no_venv_install.md`.
