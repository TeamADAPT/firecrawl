# Replace RabbitMQ With NATS JetStream

## 2026-06-28 06:47:03 - Codex

User approved execution with "do it and add adr and arch diagrams".

Plan:

1. Add `NATS_URL`/`NATS_SUBJECT_PREFIX` configuration.
2. Replace active NUQ RabbitMQ queue transport with NATS:
   - JetStream workqueue stream for prefetch jobs.
   - Core NATS subject for short-lived job completion notifications.
   - PostgreSQL remains source of truth and fallback.
3. Replace extract worker RabbitMQ queue/DLQ with JetStream subjects.
4. Change Firecrawl systemd unit dependencies from RabbitMQ to NATS.
5. Update `/etc/firecrawl/firecrawl.env` to export `NATS_URL` and remove `NUQ_RABBITMQ_URL`.
6. Add ADR and architecture diagrams.
7. Rebuild, install units, restart live services, verify via running system receipts, then disable RabbitMQ.

— Codex
