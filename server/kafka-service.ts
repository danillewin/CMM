import { Kafka, Producer } from 'kafkajs';
import { Meeting, Research } from '@shared/schema';

// Feature toggle for Kafka functionality
const KAFKA_ENABLED = process.env.KAFKA_ENABLED === 'true';

// Kafka configuration
const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'research-management-system';

// Topic names
const MEETINGS_TOPIC = 'completed-meetings';
const RESEARCHES_TOPIC = 'completed-researches';

class KafkaService {
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private isConnected = false;

  constructor() {
    if (!KAFKA_ENABLED) {
      console.log('Kafka integration is disabled');
      return;
    }

    this.kafka = new Kafka({
      clientId: KAFKA_CLIENT_ID,
      brokers: [KAFKA_BROKER],
      retry: {
        initialRetryTime: 100,
        retries: 3
      }
    });

    this.producer = this.kafka.producer();
    this.initialize();
  }

  private async initialize() {
    if (!this.producer || !KAFKA_ENABLED) return;

    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log('Kafka producer connected successfully');
    } catch (error) {
      console.error('Failed to connect to Kafka:', error);
      this.isConnected = false;
    }
  }

  async sendCompletedMeeting(meeting: Meeting, isUpdate: boolean = false) {
    if (!KAFKA_ENABLED || !this.isConnected || !this.producer) {
      console.log('Kafka is disabled or not connected, skipping meeting notification');
      return;
    }

    try {
      const message = {
        id: meeting.id,
        type: 'meeting',
        status: meeting.status,
        action: isUpdate ? 'updated' : 'completed',
        data: {
          respondentName: meeting.respondentName,
          respondentPosition: meeting.respondentPosition,
          companyName: meeting.companyName,
          researcher: meeting.researcher,
          date: meeting.date,
          researchId: meeting.researchId,
          cnum: meeting.cnum
        },
        timestamp: new Date().toISOString()
      };

      await this.producer.send({
        topic: MEETINGS_TOPIC,
        messages: [{
          key: `meeting-${meeting.id}`,
          value: JSON.stringify(message),
          headers: {
            'event-type': 'meeting-completed',
            'source': 'research-management-system'
          }
        }]
      });

      console.log(`Sent completed meeting ${meeting.id} to Kafka topic: ${MEETINGS_TOPIC}`);
    } catch (error) {
      console.error('Failed to send meeting to Kafka:', error);
    }
  }

  async sendCompletedResearch(research: Research, isUpdate: boolean = false) {
    if (!KAFKA_ENABLED || !this.isConnected || !this.producer) {
      console.log('Kafka is disabled or not connected, skipping research notification');
      return;
    }

    try {
      const message = {
        id: research.id,
        type: 'research',
        status: research.status,
        action: isUpdate ? 'updated' : 'completed',
        data: {
          name: research.name,
          team: research.team,
          researcher: research.researcher,
          description: research.description,
          dateStart: research.dateStart,
          dateEnd: research.dateEnd,
          researchType: research.researchType,
          products: research.products
        },
        timestamp: new Date().toISOString()
      };

      await this.producer.send({
        topic: RESEARCHES_TOPIC,
        messages: [{
          key: `research-${research.id}`,
          value: JSON.stringify(message),
          headers: {
            'event-type': 'research-completed',
            'source': 'research-management-system'
          }
        }]
      });

      console.log(`Sent completed research ${research.id} to Kafka topic: ${RESEARCHES_TOPIC}`);
    } catch (error) {
      console.error('Failed to send research to Kafka:', error);
    }
  }

  async disconnect() {
    if (this.producer && this.isConnected) {
      try {
        await this.producer.disconnect();
        console.log('Kafka producer disconnected');
      } catch (error) {
        console.error('Error disconnecting Kafka producer:', error);
      }
    }
  }

  isEnabled(): boolean {
    return KAFKA_ENABLED;
  }

  getStatus(): { enabled: boolean; connected: boolean } {
    return {
      enabled: KAFKA_ENABLED,
      connected: this.isConnected
    };
  }
}

// Export singleton instance
export const kafkaService = new KafkaService();

// Graceful shutdown
process.on('SIGINT', async () => {
  await kafkaService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await kafkaService.disconnect();
  process.exit(0);
});