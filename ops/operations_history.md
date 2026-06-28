# Operations History

## 2026-06-28 06:21:09 — Codex
Installed native system dependencies and configured live dependency services without Docker or venv. Added DragonflyDB APT source, installed DragonflyDB, RabbitMQ, Go, `postgresql-16-cron`, Redis CLI tools, and build support packages; enabled `pg_cron`; created `/etc/firecrawl/firecrawl.env`; created PostgreSQL `firecrawl` role/database; loaded NUQ schema from `apps/nuq-postgres/nuq.sql`. Files touched: `/usr/share/keyrings/dragonfly-keyring.public`, `/etc/apt/sources.list.d/dragonfly.sources`, `/etc/firecrawl/firecrawl.env`, `/var/lib/postgresql/16/main/postgresql.auto.conf`, `/adapt/repos/firecrawl/apps/nuq-postgres/nuq.sql`, `/adapt/repos/firecrawl/ops/operations_history.md`, `/adapt/repos/firecrawl/ops/decisions.log`, `/adapt/repos/firecrawl/ops/in_progress/install-no-docker-venv/task.md`.

## 2026-06-28 06:18:16 — Codex
Reviewed `/adapt/secrets/db.env` for queue/cache replacement signals without printing secret values; confirmed NATS settings are present but Firecrawl requires AMQP/RabbitMQ through `amqplib` and `NUQ_RABBITMQ_URL`. Files touched: `/adapt/repos/firecrawl/plans/no_docker_no_venv_install.md`, `/adapt/repos/firecrawl/ops/operations_history.md`, `/adapt/repos/firecrawl/ops/decisions.log`, `/adapt/repos/firecrawl/ops/in_progress/install-no-docker-venv/task.md`.

## 2026-06-28 05:33:35 — Codex
Recorded failed documentation checkpoint commit caused by missing repository Git author identity, then configured repo-local Git identity for Codex. Files touched: `/adapt/repos/firecrawl/.git/config`, `/adapt/repos/firecrawl/ops/operations_history.md`, `/adapt/repos/firecrawl/ops/decisions.log`.

## 2026-06-28 05:32:17 — Codex
Created operational scaffolding and no-Docker/no-venv installation plan. Files touched: `/adapt/repos/firecrawl/plans/no_docker_no_venv_install.md`, `/adapt/repos/firecrawl/ops/operations_history.md`, `/adapt/repos/firecrawl/ops/decisions.log`, `/adapt/repos/firecrawl/ops/in_progress/install-no-docker-venv/task.md`.
