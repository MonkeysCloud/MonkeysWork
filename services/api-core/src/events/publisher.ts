import { PubSub } from '@google-cloud/pubsub';
import { v4 as uuidv4 } from 'uuid';

const pubsub = new PubSub({
  projectId: process.env.GCP_PROJECT_ID,
});

const ENV = process.env.ENVIRONMENT || 'dev';

export interface EventPayload {
  event_type: string;
  data: Record<string, any>;
  correlation_id?: string;
}

export async function publishEvent(topicName: string, payload: EventPayload): Promise<string> {
  const fullTopicName = `mw-${ENV}-${topicName}`;
  const topic = pubsub.topic(fullTopicName);

  const event = {
    event_id: uuidv4(),
    event_type: payload.event_type,
    event_version: '1.0',
    timestamp: new Date().toISOString(),
    idempotency_key: `${payload.event_type}:${payload.data.id || uuidv4()}`,
    source: 'api-core',
    correlation_id: payload.correlation_id || uuidv4(),
    data: payload.data,
  };

  const messageId = await topic.publishMessage({
    data: Buffer.from(JSON.stringify(event)),
    attributes: {
      event_type: payload.event_type,
      schema_version: '1.0',
    },
  });

  return messageId;
}
