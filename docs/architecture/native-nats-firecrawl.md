# Native Firecrawl NATS Architecture

## Runtime Topology

```mermaid
flowchart LR
  client[API client] --> api[firecrawl-api.service]
  api --> pg[(PostgreSQL firecrawl)]
  api --> df[(DragonflyDB Redis protocol)]
  api --> nats[(NATS JetStream)]
  api --> playwright[firecrawl-playwright.service]

  prefetch[firecrawl-nuq-prefetch-worker.service] --> pg
  prefetch --> nats

  nuq[firecrawl-nuq-worker@.service] --> nats
  nuq --> pg
  nuq --> df
  nuq --> playwright

  worker[firecrawl-worker.service] --> nats
  worker --> pg
  worker --> df

  extract[firecrawl-extract-worker.service] --> nats
  extract --> pg
  extract --> df

  reconciler[firecrawl-nuq-reconciler-worker.service] --> pg

  rabbit[RabbitMQ / AMQP 5672 removed from Firecrawl runtime]
```

## Queue Subjects And Streams

```mermaid
flowchart TB
  subgraph NUQ[NUQ queues]
    pg[(PostgreSQL source of truth)]
    prefetcher[Prefetch worker]
    stream1[(FIRECRAWL_NUQ_QUEUE_SCRAPE)]
    stream2[(FIRECRAWL_NUQ_QUEUE_CRAWL_FINISHED)]
    workers[NUQ workers]
    api[API waiters]

    pg --> prefetcher
    prefetcher -->|firecrawl.nuq.queue_scrape.prefetch| stream1
    prefetcher -->|firecrawl.nuq.queue_crawl_finished.prefetch| stream2
    stream1 -->|durable pull consumer| workers
    stream2 -->|durable pull consumer| workers
    workers -->|firecrawl.nuq.<queue>.listen.<pod>| api
    workers --> pg
    api --> pg
  end

  subgraph Extract[Extract jobs]
    extractJobs[(FIRECRAWL_EXTRACT)]
    producer[API extract producer]
    extractWorker[Extract worker]
    dlqWorker[Extract DLQ handler]

    producer -->|firecrawl.extract.jobs| extractJobs
    extractJobs -->|firecrawl.extract.jobs durable consumer| extractWorker
    extractWorker -->|firecrawl.extract.dlq on crash| extractJobs
    extractJobs -->|firecrawl.extract.dlq durable consumer| dlqWorker
  end
```

## Scrape Job Sequence

```mermaid
sequenceDiagram
  participant Client
  participant API as firecrawl-api.service
  participant PG as PostgreSQL NUQ tables
  participant PF as NUQ prefetch worker
  participant JS as NATS JetStream
  participant W as NUQ worker
  participant PW as Playwright service

  Client->>API: POST /v1/scrape
  API->>PG: Insert scrape job with listen_channel_id
  API->>JS: Subscribe firecrawl.nuq.queue_scrape.listen.<pod>
  PF->>PG: Promote queued jobs to active with locks
  PF->>JS: Publish firecrawl.nuq.queue_scrape.prefetch
  W->>JS: Pull from durable prefetch consumer
  W->>JS: Ack prefetch message
  W->>PW: Render/scrape page
  W->>PG: Mark job completed or failed
  W->>API: Publish completion subject
  API->>PG: Read final job result
  API->>Client: Return scrape response
```

## Service Dependency Graph

```mermaid
flowchart LR
  target[firecrawl.target]
  nats[nats.service]
  dragonfly[dragonfly.service]
  postgres[postgresql@16-main.service]
  playwright[firecrawl-playwright.service]
  api[firecrawl-api.service]
  worker[firecrawl-worker.service]
  extract[firecrawl-extract-worker.service]
  nuqWorker[firecrawl-nuq-worker@.service]
  prefetch[firecrawl-nuq-prefetch-worker.service]
  reconciler[firecrawl-nuq-reconciler-worker.service]

  target --> api
  target --> worker
  target --> extract
  target --> nuqWorker
  target --> prefetch
  target --> reconciler
  target --> playwright

  api --> nats
  api --> dragonfly
  api --> postgres
  api --> playwright

  worker --> nats
  worker --> dragonfly
  worker --> postgres

  extract --> nats
  extract --> dragonfly
  extract --> postgres

  nuqWorker --> nats
  nuqWorker --> dragonfly
  nuqWorker --> postgres

  prefetch --> nats
  prefetch --> dragonfly
  prefetch --> postgres

  reconciler --> nats
  reconciler --> dragonfly
  reconciler --> postgres
```
