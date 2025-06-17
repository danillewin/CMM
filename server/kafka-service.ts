import { Kafka, Producer } from 'kafkajs';
import { Meeting, Research } from '@shared/schema';

// Feature toggle for Kafka functionality
const KAFKA_ENABLED = process.env.KAFKA_ENABLED === 'true';

// Kafka configuration
const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'research-management-system';

// SASL/SSL Authentication configuration
const KAFKA_SSL_ENABLED = process.env.KAFKA_SSL_ENABLED === 'true';
const KAFKA_SASL_MECHANISM = process.env.KAFKA_SASL_MECHANISM || 'GSSAPI'; // GSSAPI, PLAIN, SCRAM-SHA-256, SCRAM-SHA-512
const KAFKA_SASL_USERNAME = process.env.KAFKA_SASL_USERNAME;
const KAFKA_SASL_PASSWORD = process.env.KAFKA_SASL_PASSWORD;
const KAFKA_SASL_KERBEROS_SERVICE_NAME = process.env.KAFKA_SASL_KERBEROS_SERVICE_NAME || 'kafka';
const KAFKA_SASL_KERBEROS_PRINCIPAL = process.env.KAFKA_SASL_KERBEROS_PRINCIPAL;
const KAFKA_SASL_KERBEROS_KEYTAB = process.env.KAFKA_SASL_KERBEROS_KEYTAB;
const KAFKA_SASL_KERBEROS_KINIT_CMD = process.env.KAFKA_SASL_KERBEROS_KINIT_CMD;

// SSL Certificate configuration
const KAFKA_SSL_CA = process.env.KAFKA_SSL_CA;
const KAFKA_SSL_CERT = process.env.KAFKA_SSL_CERT;
const KAFKA_SSL_KEY = process.env.KAFKA_SSL_KEY;
const KAFKA_SSL_REJECT_UNAUTHORIZED = process.env.KAFKA_SSL_REJECT_UNAUTHORIZED !== 'false';

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

    // Build Kafka configuration with SSL/SASL support
    const kafkaConfig: any = {
      clientId: KAFKA_CLIENT_ID,
      brokers: [KAFKA_BROKER],
      retry: {
        initialRetryTime: 100,
        retries: 3
      }
    };

    // Add SSL configuration if enabled
    if (KAFKA_SSL_ENABLED) {
      kafkaConfig.ssl = {
        rejectUnauthorized: KAFKA_SSL_REJECT_UNAUTHORIZED
      };

      // Add certificate files if provided
      if (KAFKA_SSL_CA) {
        kafkaConfig.ssl.ca = [KAFKA_SSL_CA];
      }
      
      if (KAFKA_SSL_CERT) {
        kafkaConfig.ssl.cert = KAFKA_SSL_CERT;
      }
      
      if (KAFKA_SSL_KEY) {
        kafkaConfig.ssl.key = KAFKA_SSL_KEY;
      }

      console.log('Configuring Kafka with SSL/TLS encryption');
    }

    // Add SASL authentication configuration
    if (KAFKA_SASL_MECHANISM && (KAFKA_SASL_USERNAME || KAFKA_SASL_KERBEROS_PRINCIPAL)) {
      kafkaConfig.sasl = {
        mechanism: KAFKA_SASL_MECHANISM as 'plain' | 'scram-sha-256' | 'scram-sha-512' | 'gssapi'
      };

      switch (KAFKA_SASL_MECHANISM) {
        case 'GSSAPI':
          if (!KAFKA_SASL_KERBEROS_PRINCIPAL) {
            throw new Error('GSSAPI mechanism requires KAFKA_SASL_KERBEROS_PRINCIPAL');
          }
          
          const gssapiConfig: any = {
            mechanism: 'gssapi',
            serviceName: KAFKA_SASL_KERBEROS_SERVICE_NAME,
            principal: KAFKA_SASL_KERBEROS_PRINCIPAL
          };

          // Add keytab file if provided
          if (KAFKA_SASL_KERBEROS_KEYTAB) {
            gssapiConfig.keytab = KAFKA_SASL_KERBEROS_KEYTAB;
          }

          // Add custom kinit command if provided
          if (KAFKA_SASL_KERBEROS_KINIT_CMD) {
            gssapiConfig.kinitCmd = KAFKA_SASL_KERBEROS_KINIT_CMD;
          }

          kafkaConfig.sasl = gssapiConfig;
          console.log(`Configuring Kafka with Kerberos (GSSAPI) authentication for principal: ${KAFKA_SASL_KERBEROS_PRINCIPAL}`);
          break;

        case 'PLAIN':
        case 'SCRAM-SHA-256':
        case 'SCRAM-SHA-512':
          if (!KAFKA_SASL_USERNAME || !KAFKA_SASL_PASSWORD) {
            throw new Error(`SASL mechanism ${KAFKA_SASL_MECHANISM} requires KAFKA_SASL_USERNAME and KAFKA_SASL_PASSWORD`);
          }
          kafkaConfig.sasl = {
            mechanism: KAFKA_SASL_MECHANISM.toLowerCase() as 'plain' | 'scram-sha-256' | 'scram-sha-512',
            username: KAFKA_SASL_USERNAME,
            password: KAFKA_SASL_PASSWORD
          };
          console.log(`Configuring Kafka with ${KAFKA_SASL_MECHANISM} authentication for user: ${KAFKA_SASL_USERNAME}`);
          break;

        default:
          throw new Error(`Unsupported SASL mechanism: ${KAFKA_SASL_MECHANISM}`);
      }
    }

    this.kafka = new Kafka(kafkaConfig);
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