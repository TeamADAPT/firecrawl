# ADR 0001: Replace RabbitMQ With NATS JetStream

## Status

Accepted

## Date

2026-06-28

## Context

Firecrawl is deployed on this host as a native systemd stack with no Docker and no Python virtual environments. DragonflyDB already replaces Redis protocol services for cache, rate-limit, and worker state. The remaining RabbitMQ dependency was AMQP queue transport for NUQ prefetch/completion and extract worker jobs.

The active host already provides NATS with JetStream enabled on `127.0.0.1:4222`. `/adapt/secrets/db.env` includes NATS connection settings. RabbitMQ continuing to own AMQP on `5672` contradicts the requested replacement target.

Candidate replacements:

- DragonflyDB: good Redis replacement, not the right durable queue transport boundary for this stack.
- Redpanda: strong Kafka-compatible event log, heavier operational surface than needed for current Firecrawl work queues.
- NATS JetStream: already installed, systemd-managed, lightweight, supports durable work queues and direct pub/sub notifications.

## Decision

Use NATS as Firecrawl's active queue transport:

- NUQ prefetch jobs use JetStream workqueue streams named `FIRECRAWL_NUQ_<QUEUE>`.
- NUQ workers pull from durable consumers named `firecrawl-<queue>-prefetch`.
- NUQ job completion notifications publish to core NATS subjects named `firecrawl.nuq.<queue>.listen.<pod>`.
- Extract jobs use JetStream stream `FIRECRAWL_EXTRACT` with subjects `firecrawl.extract.jobs` and `firecrawl.extract.dlq`.
- PostgreSQL remains the NUQ source of truth.
- DragonflyDB remains the Redis-compatible state/cache layer.
- RabbitMQ is removed from Firecrawl's systemd dependency graph and runtime environment.

Legacy optional AMQP modules for webhook/indexing are deprecated for this deployment and remain disabled unless explicitly configured outside `/etc/firecrawl/firecrawl.env`.

## Consequences

- Firecrawl no longer requires RabbitMQ for the active native deployment.
- JetStream provides durable work queue storage under `/var/lib/nats/jetstream`.
- Completion notifications are fast and ephemeral; Postgres is still checked after listener registration to avoid missed-message races.
- Redpanda is not introduced, keeping broker count and operational overhead lower.
- DragonflyDB remains correctly scoped to Redis protocol behavior instead of being overloaded as the queue broker.
