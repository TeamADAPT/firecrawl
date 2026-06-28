# Replace RabbitMQ With NATS JetStream

## 2026-06-28 06:47:03 — Codex

Task: Replace RabbitMQ as Firecrawl's active queue transport with NATS JetStream in the native no-Docker/no-venv systemd deployment.

Scope:

- Keep DragonflyDB as the Redis-protocol state/cache service.
- Use NATS JetStream for durable queue transport.
- Keep PostgreSQL as NUQ source of truth.
- Remove RabbitMQ from Firecrawl systemd dependencies and runtime environment.
- Add ADR and architecture diagrams.
- Verify against live systemd services.

— Codex
