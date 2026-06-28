# Completion Report

## 2026-06-28 06:57:06 — Codex

RabbitMQ has been replaced by NATS JetStream for Firecrawl's active native systemd runtime.

Runtime state:

- `nats.service`: active on `127.0.0.1:4222`.
- `dragonfly.service`: active, Redis protocol state/cache.
- `postgresql@16-main.service`: active, NUQ source of truth.
- `firecrawl.target`: active.
- `firecrawl-api.service`: active.
- `firecrawl-worker.service`: active.
- `firecrawl-extract-worker.service`: active.
- `firecrawl-nuq-worker@0..4.service`: active.
- `firecrawl-nuq-prefetch-worker.service`: active.
- `firecrawl-nuq-reconciler-worker.service`: active.
- `rabbitmq-server.service`: inactive and disabled.
- Port `5672`: no listener.

NATS receipts:

- Stream `FIRECRAWL_NUQ_QUEUE_SCRAPE`: subject `firecrawl.nuq.queue_scrape.prefetch`, WorkQueue retention, file storage.
- Consumer `firecrawl-queue_scrape-prefetch`: pull mode, filter `firecrawl.nuq.queue_scrape.prefetch`, explicit ack.
- After RabbitMQ was stopped, the consumer reported last delivered `consumer sequence: 2`, stream sequence `2`, ack floor `2`, outstanding acks `0`, redelivered messages `0`, unprocessed messages `0`.
- Stream `FIRECRAWL_NUQ_QUEUE_CRAWL_FINISHED`: created with durable prefetch consumer.
- Stream `FIRECRAWL_EXTRACT`: subjects `firecrawl.extract.jobs` and `firecrawl.extract.dlq`; consumers `firecrawl-extract-jobs` and `firecrawl-extract-dlq`.

Live verification receipts:

- `pnpm build` in `apps/api`: passed.
- `/etc/firecrawl/firecrawl.env`: contains `NATS_URL` and `NATS_SUBJECT_PREFIX`; does not contain `NUQ_RABBITMQ_URL`.
- `/etc/systemd/system/firecrawl*.service`: dependencies point to `nats.service`; no RabbitMQ/AMQP references.
- `POST http://127.0.0.1:3002/v0/scrape` for `https://example.com` after `rabbitmq-server.service` was stopped returned HTTP `200`, `success=true`, title `Example Domain`, markdown length `180`.
- Fresh system logs showed `NuQ job prefetch sent`, `Acquired job`, `Job done 019f0d04-5259-7712-8778-4396b1914299`, and `NuQ job received` through `nuq/nats`.
- `POST http://127.0.0.1:3002/v1/scrape` for `https://example.com` returned HTTP `200`, `success=true`, title `Example Domain`, status `200`, markdown length `180`.

Documentation added:

- `/adapt/repos/firecrawl/docs/adr/0001-replace-rabbitmq-with-nats-jetstream.md`
- `/adapt/repos/firecrawl/docs/architecture/native-nats-firecrawl.md`
- `/adapt/repos/firecrawl/plans/replace_rabbitmq_with_nats.md`

Files changed:

- `/adapt/repos/firecrawl/README.md`
- `/adapt/repos/firecrawl/apps/api/package.json`
- `/adapt/repos/firecrawl/apps/api/pnpm-lock.yaml`
- `/adapt/repos/firecrawl/apps/api/src/config.ts`
- `/adapt/repos/firecrawl/apps/api/src/services/nats.ts`
- `/adapt/repos/firecrawl/apps/api/src/services/worker/nuq.ts`
- `/adapt/repos/firecrawl/apps/api/src/services/extract-queue.ts`
- `/adapt/repos/firecrawl/apps/api/src/services/extract-worker.ts`
- `/adapt/repos/firecrawl/apps/api/src/services/queue-worker.ts`
- `/adapt/repos/firecrawl/apps/api/src/services/worker/nuq-fdb-worker.ts`
- `/adapt/repos/firecrawl/apps/api/src/services/worker/nuq-worker-runner.ts`
- `/adapt/repos/firecrawl/ops/systemd/firecrawl-api.service`
- `/adapt/repos/firecrawl/ops/systemd/firecrawl-worker.service`
- `/adapt/repos/firecrawl/ops/systemd/firecrawl-extract-worker.service`
- `/adapt/repos/firecrawl/ops/systemd/firecrawl-nuq-worker@.service`
- `/adapt/repos/firecrawl/ops/systemd/firecrawl-nuq-prefetch-worker.service`
- `/adapt/repos/firecrawl/ops/systemd/firecrawl-nuq-reconciler-worker.service`
- `/etc/firecrawl/firecrawl.env`
- `/etc/systemd/system/firecrawl-api.service`
- `/etc/systemd/system/firecrawl-worker.service`
- `/etc/systemd/system/firecrawl-extract-worker.service`
- `/etc/systemd/system/firecrawl-nuq-worker@.service`
- `/etc/systemd/system/firecrawl-nuq-prefetch-worker.service`
- `/etc/systemd/system/firecrawl-nuq-reconciler-worker.service`

— Codex
