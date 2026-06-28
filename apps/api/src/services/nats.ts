import {
  AckPolicy,
  DeliverPolicy,
  JSONCodec,
  ReplayPolicy,
  RetentionPolicy,
  StorageType,
  connect,
  nanos,
  type Codec,
  type Consumer,
  type ConsumerConfig,
  type JetStreamClient,
  type JetStreamManager,
  type JetStreamPublishOptions,
  type NatsConnection,
  type StreamConfig,
} from "nats";
import { config } from "../config";
import { logger } from "../lib/logger";

let connection: NatsConnection | null = null;
let jetstream: JetStreamClient | null = null;
let jetstreamManager: JetStreamManager | null = null;
let jsonCodec: Codec<unknown> | null = null;
const consumerCache = new Map<string, Consumer>();

export function natsEnabled(): boolean {
  return Boolean(config.NATS_URL);
}

export function natsSubject(...parts: string[]): string {
  return [config.NATS_SUBJECT_PREFIX, ...parts]
    .filter(Boolean)
    .map(part => part.replace(/[^A-Za-z0-9_*>\-]/g, "_"))
    .join(".");
}

export function getNatsJsonCodec(): Codec<unknown> {
  if (!jsonCodec) {
    jsonCodec = JSONCodec<unknown>();
  }

  return jsonCodec;
}

export async function getNatsConnection(): Promise<NatsConnection> {
  if (connection) return connection;

  if (!config.NATS_URL) {
    throw new Error("NATS_URL is not configured");
  }

  connection = await connect({
    servers: config.NATS_URL,
    name: `${config.NUQ_POD_NAME ?? "firecrawl"}-${process.pid}`,
  });

  connection.closed().then(error => {
    if (error) {
      logger.error("NATS connection closed with error", {
        module: "nats",
        error,
      });
    } else {
      logger.info("NATS connection closed", { module: "nats" });
    }

    connection = null;
    jetstream = null;
    jetstreamManager = null;
    consumerCache.clear();
  });

  return connection;
}

async function getJetStream(): Promise<JetStreamClient> {
  if (jetstream) return jetstream;

  const nc = await getNatsConnection();
  jetstream = nc.jetstream();
  return jetstream;
}

async function getJetStreamManager(): Promise<JetStreamManager> {
  if (jetstreamManager) return jetstreamManager;

  const nc = await getNatsConnection();
  jetstreamManager = await nc.jetstreamManager();
  return jetstreamManager;
}

export async function ensureNatsStream(
  name: string,
  subjects: string[],
  options: Partial<StreamConfig> = {},
): Promise<void> {
  const jsm = await getJetStreamManager();

  try {
    const info = await jsm.streams.info(name);
    const currentSubjects = info.config.subjects ?? [];
    const nextSubjects = Array.from(new Set([...currentSubjects, ...subjects]));

    if (nextSubjects.length !== currentSubjects.length) {
      await jsm.streams.update(name, {
        subjects: nextSubjects,
      });
    }
  } catch (error: any) {
    if (error?.code !== "404" && error?.api_error?.code !== 404) {
      throw error;
    }

    await jsm.streams.add({
      name,
      subjects,
      retention: RetentionPolicy.Workqueue,
      storage: StorageType.File,
      max_consumers: -1,
      max_msgs_per_subject: -1,
      max_msgs: -1,
      max_bytes: -1,
      max_age: 0,
      discard: "old",
      ...options,
    } as Partial<StreamConfig>);
  }
}

export async function ensureNatsConsumer(
  stream: string,
  durableName: string,
  filterSubject: string,
  options: Partial<ConsumerConfig> = {},
): Promise<Consumer> {
  const key = `${stream}:${durableName}`;
  const cached = consumerCache.get(key);
  if (cached) return cached;

  const jsm = await getJetStreamManager();

  try {
    await jsm.consumers.info(stream, durableName);
  } catch (error: any) {
    if (error?.code !== "404" && error?.api_error?.code !== 404) {
      throw error;
    }

    await jsm.consumers.add(stream, {
      durable_name: durableName,
      name: durableName,
      filter_subject: filterSubject,
      ack_policy: AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.All,
      replay_policy: ReplayPolicy.Instant,
      ack_wait: nanos(60_000),
      max_ack_pending: 1_000,
      max_deliver: -1,
      ...options,
    } as Partial<ConsumerConfig>);
  }

  const js = await getJetStream();
  const consumer = await js.consumers.get(stream, durableName);
  consumerCache.set(key, consumer);
  return consumer;
}

export async function publishNatsJson(
  subject: string,
  payload: unknown,
  options: Partial<JetStreamPublishOptions> = {},
) {
  const js = await getJetStream();
  return js.publish(subject, getNatsJsonCodec().encode(payload), options);
}
