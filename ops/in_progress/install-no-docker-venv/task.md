# Install Firecrawl Without Docker Or Venv

## 2026-06-28 06:18:16 — Codex
Plan approved. Cache dependency changed from Redis server to DragonflyDB. Queue dependency remains RabbitMQ because Firecrawl uses AMQP/RabbitMQ code paths and NATS is not wire-compatible with `amqplib`.

## 2026-06-28 05:32:17 — Codex
Task opened from direct user request: install this repository without Docker and without Python virtual environments. Active plan: `/adapt/repos/firecrawl/plans/no_docker_no_venv_install.md`.
