import {
  AckPolicy,
  DeliverPolicy,
  ReplayPolicy,
  type ConsumerMessages,
} from "nats";
import { logger as _logger } from "../lib/logger";
import {
  ensureNatsConsumer,
  ensureNatsStream,
  natsSubject,
  publishNatsJson,
} from "./nats";

const EXTRACT_STREAM = "FIRECRAWL_EXTRACT";
const EXTRACT_SUBJECT = natsSubject("extract", "jobs");
const EXTRACT_DLQ_SUBJECT = natsSubject("extract", "dlq");
const EXTRACT_CONSUMER = "firecrawl-extract-jobs";
const EXTRACT_DLQ_CONSUMER = "firecrawl-extract-dlq";

export type ExtractJobData = {
  extractId: string;
  request: any;
  teamId: string;
  subId?: string | null;
  apiKeyId?: number | null;
  agent?: any;
  createdAt: number;
};

const consumers: ConsumerMessages[] = [];

async function ensureExtractQueues(): Promise<void> {
  await ensureNatsStream(EXTRACT_STREAM, [
    EXTRACT_SUBJECT,
    EXTRACT_DLQ_SUBJECT,
  ]);
}

export async function addExtractJob(
  extractId: string,
  data: ExtractJobData,
): Promise<void> {
  await ensureExtractQueues();
  await publishNatsJson(EXTRACT_SUBJECT, data, { msgID: extractId });
  _logger.info("Extract job added to queue", {
    module: "extract-queue",
    extractId,
    transport: "nats",
  });
}

export async function consumeExtractJobs(
  handler: (
    data: ExtractJobData,
    ack: () => void,
    nack: () => void,
  ) => Promise<void>,
): Promise<void> {
  await ensureExtractQueues();
  const consumer = await ensureNatsConsumer(
    EXTRACT_STREAM,
    EXTRACT_CONSUMER,
    EXTRACT_SUBJECT,
    {
      ack_policy: AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.All,
      replay_policy: ReplayPolicy.Instant,
      max_ack_pending: 1,
      max_deliver: 1,
    },
  );
  const messages = await consumer.consume({ max_messages: 1 });
  consumers.push(messages);

  void (async () => {
    for await (const msg of messages) {
      const data = msg.json<ExtractJobData>();
      const logger = _logger.child({
        module: "extract-queue",
        extractId: data.extractId,
      });

      logger.info("Processing extract job");

      let settled = false;
      let settlement: Promise<void> = Promise.resolve();

      const ack = () => {
        if (settled) return;
        settled = true;
        msg.ack();
      };

      const nack = () => {
        if (settled) return;
        settled = true;
        settlement = publishNatsJson(EXTRACT_DLQ_SUBJECT, data, {
          msgID: `${data.extractId}-dlq-${Date.now()}`,
        }).then(() => msg.ack());
      };

      try {
        await handler(data, ack, nack);
        await settlement;
        if (!settled) msg.ack();
      } catch (error) {
        logger.error("Extract job handler threw an error", { error });
        await publishNatsJson(EXTRACT_DLQ_SUBJECT, data, {
          msgID: `${data.extractId}-dlq-${Date.now()}`,
        });
        msg.ack();
      }
    }
  })().catch(error => {
    _logger.error("Extract NATS consumer loop failed", {
      module: "extract-queue",
      error,
    });
  });

  _logger.info("Started consuming extract jobs", {
    module: "extract-queue",
    transport: "nats",
  });
}

export async function consumeExtractDLQ(
  handler: (data: ExtractJobData) => Promise<void>,
): Promise<void> {
  await ensureExtractQueues();
  const consumer = await ensureNatsConsumer(
    EXTRACT_STREAM,
    EXTRACT_DLQ_CONSUMER,
    EXTRACT_DLQ_SUBJECT,
    {
      ack_policy: AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.All,
      replay_policy: ReplayPolicy.Instant,
      max_ack_pending: 1,
    },
  );
  const messages = await consumer.consume({ max_messages: 1 });
  consumers.push(messages);

  void (async () => {
    for await (const msg of messages) {
      const data = msg.json<ExtractJobData>();
      const logger = _logger.child({
        module: "extract-dlq",
        extractId: data.extractId,
      });

      logger.info("Processing dead-lettered extract job");

      try {
        await handler(data);
        msg.ack();
      } catch (error) {
        logger.error("DLQ handler threw an error, requeueing", { error });
        msg.nak(5000);
      }
    }
  })().catch(error => {
    _logger.error("Extract NATS DLQ consumer loop failed", {
      module: "extract-dlq",
      error,
    });
  });

  _logger.info("Started consuming extract DLQ", {
    module: "extract-dlq",
    transport: "nats",
  });
}

export async function shutdownExtractQueue(): Promise<void> {
  await Promise.all(consumers.splice(0).map(consumer => consumer.close()));
}
