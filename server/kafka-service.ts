import { Kafka, Producer } from 'kafkajs';
import { Meeting, Research } from '@shared/schema';

// Feature toggle for Kafka functionality - node-rdkafka style
const KAFKA_ENABLED = process.env.KAFKA_ENABLED === 'true';

// Kafka configuration - compatible with node-rdkafka config format
const KAFKA_METADATA_BROKER_LIST = process.env.KAFKA_METADATA_BROKER_LIST || process.env.KAFKA_BROKERS || 'localhost:9092';
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'research-management-system';

// Parse broker list - node-rdkafka compatible
const parseBrokers = (brokerString: string): string[] => {
  return brokerString.split(',').map(broker => broker.trim()).filter(broker => broker.length > 0);
};

// node-rdkafka compatible configuration parameters
const SECURITY_PROTOCOL = process.env.SECURITY_PROTOCOL || 'PLAINTEXT'; // PLAINTEXT, SSL, SASL_PLAINTEXT, SASL_SSL
const SASL_MECHANISM = process.env.SASL_MECHANISM || 'GSSAPI'; // GSSAPI, PLAIN, SCRAM-SHA-256, SCRAM-SHA-512
const SASL_USERNAME = process.env.SASL_USERNAME;
const SASL_PASSWORD = process.env.SASL_PASSWORD;
const SASL_KERBEROS_SERVICE_NAME = process.env.SASL_KERBEROS_SERVICE_NAME || 'kafka';
const SASL_KERBEROS_PRINCIPAL = process.env.SASL_KERBEROS_PRINCIPAL;
const SASL_KERBEROS_KEYTAB = process.env.SASL_KERBEROS_KEYTAB;
const SASL_KERBEROS_KINIT_CMD = process.env.SASL_KERBEROS_KINIT_CMD;

// SSL configuration - node-rdkafka style
const SSL_CA_LOCATION = process.env.SSL_CA_LOCATION;
const SSL_CERTIFICATE_LOCATION = process.env.SSL_CERTIFICATE_LOCATION;
const SSL_KEY_LOCATION = process.env.SSL_KEY_LOCATION;
const SSL_KEY_PASSWORD = process.env.SSL_KEY_PASSWORD;
const SSL_ENDPOINT_IDENTIFICATION_ALGORITHM = process.env.SSL_ENDPOINT_IDENTIFICATION_ALGORITHM || 'https';

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

    // Build node-rdkafka compatible configuration
    const brokerList = parseBrokers(KAFKA_METADATA_BROKER_LIST);
    
    if (brokerList.length === 0) {
      throw new Error('No valid Kafka brokers configured. Please set KAFKA_METADATA_BROKER_LIST or KAFKA_BROKERS environment variable.');
    }
    
    console.log(`Configuring Kafka with ${brokerList.length} broker(s): ${brokerList.join(', ')}`);
    console.log(`Security Protocol: ${SECURITY_PROTOCOL}`);
    
    const kafkaConfig: any = {
      clientId: KAFKA_CLIENT_ID,
      brokers: brokerList,
      retry: {
        initialRetryTime: 100,
        retries: 3
      }
    };

    // Configure SSL based on security protocol - node-rdkafka style
    if (SECURITY_PROTOCOL === 'SSL' || SECURITY_PROTOCOL === 'SASL_SSL') {
      kafkaConfig.ssl = {
        rejectUnauthorized: SSL_ENDPOINT_IDENTIFICATION_ALGORITHM === 'https'
      };

      // Add certificate files if provided - node-rdkafka locations
      if (SSL_CA_LOCATION) {
        kafkaConfig.ssl.ca = [SSL_CA_LOCATION];
      }
      
      if (SSL_CERTIFICATE_LOCATION) {
        kafkaConfig.ssl.cert = SSL_CERTIFICATE_LOCATION;
      }
      
      if (SSL_KEY_LOCATION) {
        kafkaConfig.ssl.key = SSL_KEY_LOCATION;
      }

      if (SSL_KEY_PASSWORD) {
        kafkaConfig.ssl.passphrase = SSL_KEY_PASSWORD;
      }

      console.log('Configuring Kafka with SSL/TLS encryption (node-rdkafka compatible)');
    }

    // Configure SASL based on security protocol and mechanism - node-rdkafka style
    if (SECURITY_PROTOCOL === 'SASL_PLAINTEXT' || SECURITY_PROTOCOL === 'SASL_SSL') {
      if (!SASL_MECHANISM) {
        throw new Error('SASL_MECHANISM is required when using SASL security protocol');
      }

      switch (SASL_MECHANISM) {
        case 'GSSAPI':
          if (!SASL_KERBEROS_PRINCIPAL) {
            throw new Error('GSSAPI mechanism requires SASL_KERBEROS_PRINCIPAL');
          }
          
          const gssapiConfig: any = {
            mechanism: 'gssapi',
            serviceName: SASL_KERBEROS_SERVICE_NAME,
            principal: SASL_KERBEROS_PRINCIPAL
          };

          // Add keytab file if provided
          if (SASL_KERBEROS_KEYTAB) {
            gssapiConfig.keytab = SASL_KERBEROS_KEYTAB;
          }

          // Add custom kinit command if provided
          if (SASL_KERBEROS_KINIT_CMD) {
            gssapiConfig.kinitCmd = SASL_KERBEROS_KINIT_CMD;
          }

          kafkaConfig.sasl = gssapiConfig;
          console.log(`Configuring Kafka with Kerberos (GSSAPI) authentication for principal: ${SASL_KERBEROS_PRINCIPAL}`);
          break;

        case 'PLAIN':
        case 'SCRAM-SHA-256':
        case 'SCRAM-SHA-512':
          if (!SASL_USERNAME || !SASL_PASSWORD) {
            throw new Error(`SASL mechanism ${SASL_MECHANISM} requires SASL_USERNAME and SASL_PASSWORD`);
          }
          kafkaConfig.sasl = {
            mechanism: SASL_MECHANISM.toLowerCase() as 'plain' | 'scram-sha-256' | 'scram-sha-512',
            username: SASL_USERNAME,
            password: SASL_PASSWORD
          };
          console.log(`Configuring Kafka with ${SASL_MECHANISM} authentication for user: ${SASL_USERNAME}`);
          break;

        default:
          throw new Error(`Unsupported SASL mechanism: ${SASL_MECHANISM}`);
      }
    }

    this.kafka = new Kafka(kafkaConfig);
    
    // Configure producer with node-rdkafka style settings
    this.producer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000,
    });
    
    this.initialize();
  }

  private async initialize() {
    if (!this.producer || !KAFKA_ENABLED) return;

    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log('Kafka producer connected successfully (node-rdkafka compatible configuration)');
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
      // Import storage dynamically to avoid circular dependencies
      const { storage } = await import('./storage');
      
      // Get complete meeting data with linked entities
      const linkedJtbds = await storage.getJtbdsByMeeting(meeting.id);
      const relatedResearch = meeting.researchId ? await storage.getResearch(meeting.researchId) : null;

      const message = {
        id: meeting.id,
        type: 'meeting',
        status: meeting.status,
        action: isUpdate ? 'updated' : 'completed',
        data: {
          // Core meeting information - using database column names
          id: meeting.id,
          respondent_name: meeting.respondentName,
          respondent_position: meeting.respondentPosition,
          company_name: meeting.companyName,
          email: meeting.email,
          researcher: meeting.researcher,
          relationship_manager: meeting.relationshipManager,
          recruiter: meeting.salesPerson, // Note: stored as 'recruiter' in DB
          date: meeting.date,
          research_id: meeting.researchId,
          cnum: meeting.cnum,
          gcc: meeting.gcc,
          has_gift: meeting.hasGift,
          status: meeting.status,
          
          // Content data - using database column names
          notes: meeting.notes,
          full_text: meeting.fullText,
          
          // Linked entities
          linkedJtbds: linkedJtbds.map(jtbd => ({
            id: jtbd.id,
            title: jtbd.title,
            description: jtbd.description,
            category: jtbd.category,
            parentId: jtbd.parentId,
            jobStatement: jtbd.jobStatement,
            jobStory: jtbd.jobStory,
            priority: jtbd.priority
          })),
          
          // Related research information - using database column names
          related_research: relatedResearch ? {
            id: relatedResearch.id,
            name: relatedResearch.name,
            team: relatedResearch.team,
            researcher: relatedResearch.researcher,
            research_type: relatedResearch.researchType,
            products: relatedResearch.products,
            status: relatedResearch.status,
            date_start: relatedResearch.dateStart,
            date_end: relatedResearch.dateEnd,
            color: relatedResearch.color
          } : null
        },
        metadata: {
          total_linked_jtbds: linkedJtbds.length,
          has_related_research: !!relatedResearch,
          content_length: {
            notes: meeting.notes?.length || 0,
            full_text: meeting.fullText?.length || 0
          }
        },
        timestamp: new Date().toISOString()
      };



      await this.producer.send({
        topic: MEETINGS_TOPIC,
        messages: [{
          key: `meeting-${meeting.id}`,
          value: JSON.stringify(message),
          headers: {
            'event_type': 'meeting_completed',
            'source': 'research_management_system',
            'entity_type': 'meeting',
            'linked_entities': linkedJtbds.length.toString(),
            'has_research': relatedResearch ? 'true' : 'false'
          }
        }]
      });

      console.log(`Sent completed meeting ${meeting.id} with ${linkedJtbds.length} JTBDs to Kafka topic: ${MEETINGS_TOPIC}`);
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
      // Import storage dynamically to avoid circular dependencies
      const { storage } = await import('./storage');
      
      // Get complete research data with linked entities
      const linkedJtbds = await storage.getJtbdsByResearch(research.id);
      const relatedMeetings = await storage.getMeetings();
      const researchMeetings = relatedMeetings.filter(meeting => meeting.researchId === research.id);

      const message = {
        id: research.id,
        type: 'research',
        status: research.status,
        action: isUpdate ? 'updated' : 'completed',
        data: {
          // Core research information - using database column names
          id: research.id,
          name: research.name,
          team: research.team,
          researcher: research.researcher,
          research_type: research.researchType,
          products: research.products,
          date_start: research.dateStart,
          date_end: research.dateEnd,
          color: research.color,
          status: research.status,
          
          // Content data - using database column names
          description: research.description,
          brief: research.brief,
          
          // Linked entities - using database column names
          linked_jtbds: linkedJtbds.map(jtbd => ({
            id: jtbd.id,
            title: jtbd.title,
            description: jtbd.description,
            category: jtbd.category,
            parent_id: jtbd.parentId,
            job_statement: jtbd.jobStatement,
            job_story: jtbd.jobStory,
            priority: jtbd.priority
          })),
          
          // Related meetings information - using database column names
          related_meetings: researchMeetings.map(meeting => ({
            id: meeting.id,
            respondent_name: meeting.respondentName,
            respondent_position: meeting.respondentPosition,
            company_name: meeting.companyName,
            researcher: meeting.researcher,
            date: meeting.date,
            status: meeting.status,
            cnum: meeting.cnum,
            gcc: meeting.gcc,
            has_gift: meeting.hasGift,
            // Include brief content info without full text for performance
            has_notes: !!meeting.notes,
            has_full_text: !!meeting.fullText,
            notes_length: meeting.notes?.length || 0,
            full_text_length: meeting.fullText?.length || 0
          }))
        },
        metadata: {
          total_linked_jtbds: linkedJtbds.length,
          total_related_meetings: researchMeetings.length,
          completed_meetings: researchMeetings.filter(m => m.status === 'Done').length,
          content_length: {
            description: research.description?.length || 0,
            brief: research.brief?.length || 0
          },
          duration: {
            start: research.dateStart,
            end: research.dateEnd,
            duration_days: Math.ceil(
              (new Date(research.dateEnd).getTime() - new Date(research.dateStart).getTime()) / (1000 * 60 * 60 * 24)
            )
          }
        },
        timestamp: new Date().toISOString()
      };

      await this.producer.send({
        topic: RESEARCHES_TOPIC,
        messages: [{
          key: `research-${research.id}`,
          value: JSON.stringify(message),
          headers: {
            'event_type': 'research_completed',
            'source': 'research_management_system',
            'entity_type': 'research',
            'linked_entities': linkedJtbds.length.toString(),
            'related_meetings': researchMeetings.length.toString(),
            'research_type': research.researchType || 'unknown',
            'team': research.team || 'unknown'
          }
        }]
      });

      console.log(`Sent completed research ${research.id} with ${linkedJtbds.length} JTBDs and ${researchMeetings.length} meetings to Kafka topic: ${RESEARCHES_TOPIC}`);
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