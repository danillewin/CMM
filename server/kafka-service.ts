import { Kafka, Producer } from "kafkajs";
import { Meeting, Research } from "@shared/schema";

// Feature toggle for Kafka functionality - node-rdkafka style
const KAFKA_ENABLED = process.env.KAFKA_ENABLED === "true";

// Kafka configuration - compatible with node-rdkafka config format
const KAFKA_METADATA_BROKER_LIST =
  process.env.KAFKA_METADATA_BROKER_LIST ||
  process.env.KAFKA_BROKERS ||
  "localhost:9092";
const KAFKA_CLIENT_ID =
  process.env.KAFKA_CLIENT_ID || "research-management-system";

// Types for Kafka summarization message
interface SummarizationScript {
  blockName: string;
  blockElements: Array<SummarizationScript | SummarizationQuestion>;
  question?: string;
  payAttentionFor?: string | null;
}

interface SummarizationQuestion {
  question: string;
  payAttentionFor: string | null;
}

interface SummarizationMessage {
  text: string;
  systemPromptAddition: string;
  script: SummarizationScript[];
}

// Types for Kafka summarization response
interface SummarizationResponseBlock {
  blockName: string;
  blockElements: Array<
    SummarizationResponseBlock | SummarizationResponseQuestion
  >;
  blockSummary: string;
  question?: string;
  answer?: string;
}

interface SummarizationResponseQuestion {
  question: string;
  answer: string;
}

interface SummarizationResponse {
  items: SummarizationResponseBlock[];
  summary: string;
}

interface SummarizationResponseMessage {
  meetingId: number;
  result: SummarizationResponse;
}

// Parse broker list - node-rdkafka compatible
const parseBrokers = (brokerString: string): string[] => {
  return brokerString
    .split(",")
    .map((broker) => broker.trim())
    .filter((broker) => broker.length > 0);
};

// node-rdkafka compatible configuration parameters
const SECURITY_PROTOCOL = process.env.SECURITY_PROTOCOL || "PLAINTEXT"; // PLAINTEXT, SSL, SASL_PLAINTEXT, SASL_SSL
const SASL_MECHANISM = process.env.SASL_MECHANISM || "GSSAPI"; // GSSAPI, PLAIN, SCRAM-SHA-256, SCRAM-SHA-512
const SASL_USERNAME = process.env.SASL_USERNAME;
const SASL_PASSWORD = process.env.SASL_PASSWORD;
const SASL_KERBEROS_SERVICE_NAME =
  process.env.SASL_KERBEROS_SERVICE_NAME || "kafka";
const SASL_KERBEROS_PRINCIPAL = process.env.SASL_KERBEROS_PRINCIPAL;
const SASL_KERBEROS_KEYTAB = process.env.SASL_KERBEROS_KEYTAB;
const SASL_KERBEROS_KINIT_CMD = process.env.SASL_KERBEROS_KINIT_CMD;

// SSL configuration - node-rdkafka style
const SSL_CA_LOCATION = process.env.SSL_CA_LOCATION;
const SSL_CERTIFICATE_LOCATION = process.env.SSL_CERTIFICATE_LOCATION;
const SSL_KEY_LOCATION = process.env.SSL_KEY_LOCATION;
const SSL_KEY_PASSWORD = process.env.SSL_KEY_PASSWORD;
const SSL_ENDPOINT_IDENTIFICATION_ALGORITHM =
  process.env.SSL_ENDPOINT_IDENTIFICATION_ALGORITHM || "https";

// Topic names
const MEETINGS_TOPIC = "completed-meetings";
const RESEARCHES_TOPIC = "completed-researches";
const SUMMARIZATION_TOPIC = "meeting-summarization";
const SUMMARIZATION_RESPONSE_TOPIC = "meeting-summarization-response";

class KafkaService {
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private consumer: any = null;
  private isConnected = false;
  private isConsumerRunning = false;

  constructor() {
    if (!KAFKA_ENABLED) {
      console.log("Kafka integration is disabled");
      return;
    }

    // Build node-rdkafka compatible configuration
    const brokerList = parseBrokers(KAFKA_METADATA_BROKER_LIST);

    if (brokerList.length === 0) {
      throw new Error(
        "No valid Kafka brokers configured. Please set KAFKA_METADATA_BROKER_LIST or KAFKA_BROKERS environment variable.",
      );
    }

    console.log(
      `Configuring Kafka with ${brokerList.length} broker(s): ${brokerList.join(", ")}`,
    );
    console.log(`Security Protocol: ${SECURITY_PROTOCOL}`);

    const kafkaConfig: any = {
      clientId: KAFKA_CLIENT_ID,
      brokers: brokerList,
      retry: {
        initialRetryTime: 100,
        retries: 3,
      },
    };

    // Configure SSL based on security protocol - node-rdkafka style
    if (SECURITY_PROTOCOL === "SSL" || SECURITY_PROTOCOL === "SASL_SSL") {
      kafkaConfig.ssl = {
        rejectUnauthorized: SSL_ENDPOINT_IDENTIFICATION_ALGORITHM === "https",
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

      console.log(
        "Configuring Kafka with SSL/TLS encryption (node-rdkafka compatible)",
      );
    }

    // Configure SASL based on security protocol and mechanism - node-rdkafka style
    if (
      SECURITY_PROTOCOL === "SASL_PLAINTEXT" ||
      SECURITY_PROTOCOL === "SASL_SSL"
    ) {
      if (!SASL_MECHANISM) {
        throw new Error(
          "SASL_MECHANISM is required when using SASL security protocol",
        );
      }

      switch (SASL_MECHANISM) {
        case "GSSAPI":
          if (!SASL_KERBEROS_PRINCIPAL) {
            throw new Error(
              "GSSAPI mechanism requires SASL_KERBEROS_PRINCIPAL",
            );
          }

          const gssapiConfig: any = {
            mechanism: "gssapi",
            serviceName: SASL_KERBEROS_SERVICE_NAME,
            principal: SASL_KERBEROS_PRINCIPAL,
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
          console.log(
            `Configuring Kafka with Kerberos (GSSAPI) authentication for principal: ${SASL_KERBEROS_PRINCIPAL}`,
          );
          break;

        case "PLAIN":
        case "SCRAM-SHA-256":
        case "SCRAM-SHA-512":
          if (!SASL_USERNAME || !SASL_PASSWORD) {
            throw new Error(
              `SASL mechanism ${SASL_MECHANISM} requires SASL_USERNAME and SASL_PASSWORD`,
            );
          }
          kafkaConfig.sasl = {
            mechanism: SASL_MECHANISM.toLowerCase() as
              | "plain"
              | "scram-sha-256"
              | "scram-sha-512",
            username: SASL_USERNAME,
            password: SASL_PASSWORD,
          };
          console.log(
            `Configuring Kafka with ${SASL_MECHANISM} authentication for user: ${SASL_USERNAME}`,
          );
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

    // Configure consumer
    this.consumer = this.kafka.consumer({
      groupId: `${KAFKA_CLIENT_ID}-summarization-consumer`,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    this.initialize();
  }

  private async initialize() {
    if (!this.producer || !this.consumer || !KAFKA_ENABLED) return;

    try {
      await this.producer.connect();
      await this.consumer.connect();
      this.isConnected = true;
      console.log(
        "Kafka producer and consumer connected successfully (node-rdkafka compatible configuration)",
      );

      // Start consuming summarization responses
      this.startSummarizationResponseConsumer();
    } catch (error) {
      console.error("Failed to connect to Kafka:", error);
      this.isConnected = false;
    }
  }

  async sendCompletedMeeting(meeting: Meeting, isUpdate: boolean = false) {
    if (!KAFKA_ENABLED || !this.isConnected || !this.producer) {
      console.log(
        "Kafka is disabled or not connected, skipping meeting notification",
      );
      return;
    }

    try {
      // Import storage dynamically to avoid circular dependencies
      const { storage } = await import("./storage");

      // Get complete meeting data with linked entities
      const linkedJtbds = await storage.getJtbdsByMeeting(meeting.id);
      const relatedResearch = meeting.researchId
        ? await storage.getResearch(meeting.researchId)
        : null;
      const attachments = await storage.getMeetingAttachments(meeting.id);

      const message = {
        id: meeting.id,
        type: "meeting",
        status: meeting.status,
        action: isUpdate ? "updated" : "completed",
        data: {
          // Core meeting information
          respondentName: meeting.respondentName,
          respondentPosition: meeting.respondentPosition,
          companyName: meeting.companyName,
          email: meeting.email,
          researcher: meeting.researcher,
          relationshipManager: meeting.relationshipManager,
          salesPerson: meeting.salesPerson,
          date: meeting.date,
          researchId: meeting.researchId,
          cnum: meeting.cnum,
          gcc: meeting.gcc,
          hasGift: meeting.hasGift,

          // Content data - full information
          notes: meeting.notes,
          fullText: meeting.fullText,

          // Summarization data
          summarizationStatus: meeting.summarizationStatus,
          summarizationResult: meeting.summarizationResult,

          // File attachments
          attachments: attachments.map((attachment) => ({
            id: attachment.id,
            fileName: attachment.fileName,
            originalName: attachment.originalName,
            fileSize: attachment.fileSize,
            mimeType: attachment.mimeType,
            uploadedAt: attachment.uploadedAt,
            transcriptionStatus: attachment.transcriptionStatus,
            transcriptionText: attachment.transcriptionText,
            hasTranscription: !!attachment.transcriptionText,
            retryCount: attachment.transcriptionRetryCount,
            lastAttempt: attachment.lastTranscriptionAttempt,
            errorMessage: attachment.errorMessage,
          })),

          // Linked entities
          linkedJtbds: linkedJtbds.map((jtbd) => ({
            id: jtbd.id,
            name: jtbd.title || jtbd.jobStatement || jtbd.jobStory || "",
            description: jtbd.description,
            category: jtbd.category,
            parentId: jtbd.parentId,
          })),

          // Related research information
          relatedResearch: relatedResearch
            ? {
                id: relatedResearch.id,
                name: relatedResearch.name,
                team: relatedResearch.team,
                researcher: relatedResearch.researcher,
                researchType: relatedResearch.researchType,
                products: relatedResearch.products,
                status: relatedResearch.status,
                dateStart: relatedResearch.dateStart,
                dateEnd: relatedResearch.dateEnd,
              }
            : null,
        },
        metadata: {
          totalLinkedJtbds: linkedJtbds.length,
          hasRelatedResearch: !!relatedResearch,
          totalAttachments: attachments.length,
          hasSummarization: !!meeting.summarizationResult,
          contentLength: {
            notes: meeting.notes?.length || 0,
            fullText: meeting.fullText?.length || 0,
          },
          attachmentsSummary: {
            total: attachments.length,
            transcribed: attachments.filter(a => a.transcriptionStatus === 'completed').length,
            pending: attachments.filter(a => a.transcriptionStatus === 'pending').length,
            failed: attachments.filter(a => a.transcriptionStatus === 'failed').length,
          },
        },
        timestamp: new Date().toISOString(),
      };

      await this.producer.send({
        topic: MEETINGS_TOPIC,
        messages: [
          {
            key: `meeting-${meeting.id}`,
            value: JSON.stringify(message),
            headers: {
              "event-type": "meeting-completed",
              source: "research-management-system",
              "entity-type": "meeting",
              "linked-entities": linkedJtbds.length.toString(),
              "has-research": relatedResearch ? "true" : "false",
              "has-attachments": attachments.length > 0 ? "true" : "false",
              "has-summarization": meeting.summarizationResult ? "true" : "false",
              "transcribed-attachments": attachments.filter(a => a.transcriptionStatus === 'completed').length.toString(),
            },
          },
        ],
      });

      console.log(
        `Sent completed meeting ${meeting.id} with ${linkedJtbds.length} JTBDs, ${attachments.length} attachments to Kafka topic: ${MEETINGS_TOPIC}`,
      );
    } catch (error) {
      console.error("Failed to send meeting to Kafka:", error);
    }
  }

  async sendCompletedResearch(research: Research, isUpdate: boolean = false) {
    if (!KAFKA_ENABLED || !this.isConnected || !this.producer) {
      console.log(
        "Kafka is disabled or not connected, skipping research notification",
      );
      return;
    }

    try {
      // Import storage dynamically to avoid circular dependencies
      const { storage } = await import("./storage");

      // Get complete research data with linked entities
      const linkedJtbds = await storage.getJtbdsByResearch(research.id);
      const researchMeetings = await storage.getMeetingsByResearch(research.id);
      
      // Get attachments for all related meetings
      const allAttachments: any[] = [];
      for (const meeting of researchMeetings) {
        const meetingAttachments = await storage.getMeetingAttachments(meeting.id);
        allAttachments.push(...meetingAttachments.map(att => ({
          ...att,
          meetingId: meeting.id
        })));
      }

      const message = {
        id: research.id,
        type: "research",
        status: research.status,
        action: isUpdate ? "updated" : "completed",
        data: {
          // Core research information
          name: research.name,
          team: research.team,
          researcher: research.researcher,
          researchType: research.researchType,
          products: research.products,
          dateStart: research.dateStart,
          dateEnd: research.dateEnd,
          color: research.color,

          // Content data - full information
          description: research.description,
          brief: research.brief,

          // Linked entities
          linkedJtbds: linkedJtbds.map((jtbd) => ({
            id: jtbd.id,
            name: jtbd.title || jtbd.jobStatement || jtbd.jobStory || "",
            description: jtbd.description,
            category: jtbd.category,
            parentId: jtbd.parentId,
          })),

          // Related meetings information with attachments and summarization
          relatedMeetings: researchMeetings.map((meeting) => {
            const meetingAttachments = allAttachments.filter(att => att.meetingId === meeting.id);
            return {
              id: meeting.id,
              respondentName: meeting.respondentName,
              respondentPosition: meeting.respondentPosition,
              companyName: meeting.companyName,
              researcher: meeting.researcher,
              date: meeting.date,
              status: meeting.status,
              cnum: meeting.cnum,
              gcc: meeting.gcc,
              hasGift: meeting.hasGift,
              // Include brief content info without full text for performance
              hasNotes: !!meeting.notes,
              hasFullText: !!meeting.fullText,
              notesLength: meeting.notes?.length || 0,
              fullTextLength: meeting.fullText?.length || 0,
              // Summarization data
              summarizationStatus: meeting.summarizationStatus,
              hasSummarization: !!meeting.summarizationResult,
              // Attachments summary
              attachmentsCount: meetingAttachments.length,
              transcribedAttachments: meetingAttachments.filter(a => a.transcriptionStatus === 'completed').length,
              attachments: meetingAttachments.map(att => ({
                id: att.id,
                fileName: att.fileName,
                originalName: att.originalName,
                fileSize: att.fileSize,
                mimeType: att.mimeType,
                uploadedAt: att.uploadedAt,
                transcriptionStatus: att.transcriptionStatus,
                hasTranscription: !!att.transcriptionText,
                errorMessage: att.errorMessage,
              })),
            };
          }),

          // Overall attachments summary for research
          attachmentsSummary: {
            totalAttachments: allAttachments.length,
            transcribedAttachments: allAttachments.filter(a => a.transcriptionStatus === 'completed').length,
            pendingAttachments: allAttachments.filter(a => a.transcriptionStatus === 'pending').length,
            failedAttachments: allAttachments.filter(a => a.transcriptionStatus === 'failed').length,
            byMimeType: allAttachments.reduce((acc: any, att) => {
              acc[att.mimeType] = (acc[att.mimeType] || 0) + 1;
              return acc;
            }, {}),
          },
        },
        metadata: {
          totalLinkedJtbds: linkedJtbds.length,
          totalRelatedMeetings: researchMeetings.length,
          completedMeetings: researchMeetings.filter((m) => m.status === "Done")
            .length,
          meetingsWithSummarization: researchMeetings.filter((m) => !!m.summarizationResult).length,
          totalAttachments: allAttachments.length,
          contentLength: {
            description: research.description?.length || 0,
            brief: research.brief?.length || 0,
          },
          duration: {
            start: research.dateStart,
            end: research.dateEnd,
            durationDays: Math.ceil(
              (new Date(research.dateEnd).getTime() -
                new Date(research.dateStart).getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          },
          attachmentStats: {
            totalFiles: allAttachments.length,
            totalSize: allAttachments.reduce((sum, att) => sum + att.fileSize, 0),
            transcriptionComplete: allAttachments.filter(a => a.transcriptionStatus === 'completed').length,
            transcriptionPending: allAttachments.filter(a => a.transcriptionStatus === 'pending').length,
            transcriptionFailed: allAttachments.filter(a => a.transcriptionStatus === 'failed').length,
          },
        },
        timestamp: new Date().toISOString(),
      };

      await this.producer.send({
        topic: RESEARCHES_TOPIC,
        messages: [
          {
            key: `research-${research.id}`,
            value: JSON.stringify(message),
            headers: {
              "event-type": "research-completed",
              source: "research-management-system",
              "entity-type": "research",
              "linked-entities": linkedJtbds.length.toString(),
              "related-meetings": researchMeetings.length.toString(),
              "total-attachments": allAttachments.length.toString(),
              "meetings-with-summarization": researchMeetings.filter((m) => !!m.summarizationResult).length.toString(),
              "transcribed-attachments": allAttachments.filter(a => a.transcriptionStatus === 'completed').length.toString(),
              "research-type": research.researchType || "unknown",
              team: research.team || "unknown",
            },
          },
        ],
      });

      console.log(
        `Sent completed research ${research.id} with ${linkedJtbds.length} JTBDs, ${researchMeetings.length} meetings, and ${allAttachments.length} attachments to Kafka topic: ${RESEARCHES_TOPIC}`,
      );
    } catch (error) {
      console.error("Failed to send research to Kafka:", error);
    }
  }

  isEnabled(): boolean {
    return KAFKA_ENABLED;
  }

  getStatus(): { enabled: boolean; connected: boolean } {
    return {
      enabled: KAFKA_ENABLED,
      connected: this.isConnected,
    };
  }

  // Helper function to parse research guide questions from JSON string
  private parseGuideQuestions(guideQuestionsJson: string | null): any[] {
    if (!guideQuestionsJson || typeof guideQuestionsJson !== "string")
      return [];

    try {
      const parsed = JSON.parse(guideQuestionsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  // Map research guide questions to summarization script format
  private mapGuideToScript(research: Research | null): SummarizationScript[] {
    if (!research) return [];

    const guideMainQuestions = this.parseGuideQuestions(
      research.guideMainQuestions,
    );

    return guideMainQuestions
      .map((block: any, blockIndex: number) => {
        const blockElements: Array<
          SummarizationScript | SummarizationQuestion
        > = [];

        // Add direct questions from this block
        if (block.questions && Array.isArray(block.questions)) {
          block.questions.forEach((question: any) => {
            if (question.text) {
              blockElements.push({
                question: question.text,
                payAttentionFor: question.comment || null,
              });
            }
          });
        }

        // Add subblocks recursively
        if (block.subblocks && Array.isArray(block.subblocks)) {
          block.subblocks.forEach((subblock: any, subIndex: number) => {
            const subElements: Array<
              SummarizationScript | SummarizationQuestion
            > = [];

            // Add questions from subblock
            if (subblock.questions && Array.isArray(subblock.questions)) {
              subblock.questions.forEach((question: any) => {
                if (question.text) {
                  subElements.push({
                    question: question.text,
                    payAttentionFor: question.comment || null,
                  });
                }
              });
            }

            // Add sub-subblocks recursively
            if (subblock.subblocks && Array.isArray(subblock.subblocks)) {
              subblock.subblocks.forEach((subSubblock: any) => {
                const subSubElements: Array<SummarizationQuestion> = [];

                if (
                  subSubblock.questions &&
                  Array.isArray(subSubblock.questions)
                ) {
                  subSubblock.questions.forEach((question: any) => {
                    if (question.text) {
                      subSubElements.push({
                        question: question.text,
                        payAttentionFor: question.comment || null,
                      });
                    }
                  });
                }

                if (subSubElements.length > 0) {
                  subElements.push({
                    blockName:
                      subSubblock.name ||
                      `Подраздел ${blockIndex + 1}.${subIndex + 1}`,
                    blockElements: subSubElements,
                  });
                }
              });
            }

            if (subElements.length > 0) {
              blockElements.push({
                blockName:
                  subblock.name || `Раздел ${blockIndex + 1}.${subIndex + 1}`,
                blockElements: subElements,
              });
            }
          });
        }

        return {
          blockName: block.name || `Часть ${blockIndex + 1}`,
          blockElements,
        };
      })
      .filter((block) => block.blockElements.length > 0);
  }

  // Send Kafka message for meeting summarization
  async sendMeetingSummarization(meetingId: number): Promise<void> {
    if (!KAFKA_ENABLED || !this.isConnected || !this.producer) {
      console.log(
        "Kafka is disabled or not connected, skipping meeting summarization",
      );
      return;
    }

    try {
      // Import storage dynamically to avoid circular dependencies
      const { storage } = await import("./storage");

      // Get meeting data
      const meeting = await storage.getMeeting(meetingId);
      if (!meeting) {
        console.error(`Meeting ${meetingId} not found for summarization`);
        return;
      }

      // Get all transcriptions for this meeting
      const attachments = await storage.getMeetingAttachments(meetingId);
      const completedTranscriptions = attachments.filter(
        (att) =>
          att.transcriptionStatus === "completed" && att.transcriptionText,
      );

      if (completedTranscriptions.length === 0) {
        console.warn(
          `No completed transcriptions found for meeting ${meetingId}`,
        );
        return;
      }

      // Combine all transcription texts
      const combinedText = completedTranscriptions
        .map((att) => att.transcriptionText)
        .filter((text) => text)
        .join("\n\n");

      // Get research data for script mapping
      const research = meeting.researchId
        ? await storage.getResearch(meeting.researchId)
        : null;

      // Map research guide to script format
      const script = this.mapGuideToScript(research || null);

      // Create summarization message
      const summarizationMessage: SummarizationMessage = {
        text: combinedText,
        systemPromptAddition:
          "Саммари должно быть в стиле, как будто ты просоленный моряк.",
        script: script,
      };

      // Send to Kafka
      await this.producer.send({
        topic: SUMMARIZATION_TOPIC,
        messages: [
          {
            key: `meeting-summarization-${meetingId}`,
            value: JSON.stringify(summarizationMessage),
            headers: {
              "event-type": "meeting-summarization",
              source: "research-management-system",
              "meeting-id": meetingId.toString(),
              "transcription-count": completedTranscriptions.length.toString(),
              "research-id": research?.id?.toString() || "none",
            },
          },
        ],
      });

      // Update meeting summarization status to 'in_progress'
      const updateData = {
        respondentName: meeting.respondentName,
        respondentPosition: meeting.respondentPosition,
        cnum: meeting.cnum,
        gcc: meeting.gcc || undefined,
        companyName: meeting.companyName || undefined,
        email: meeting.email || undefined,
        researcher: meeting.researcher || undefined,
        relationshipManager: meeting.relationshipManager,
        salesPerson: meeting.salesPerson,
        date: meeting.date,
        researchId: meeting.researchId,
        status: meeting.status as any,
        notes: meeting.notes || undefined,
        fullText: meeting.fullText || undefined,
        hasGift: meeting.hasGift as any,
        summarizationStatus: "in_progress" as any,
      };
      await storage.updateMeeting(meetingId, updateData);

      console.log(
        `Sent summarization request for meeting ${meetingId} to Kafka topic: ${SUMMARIZATION_TOPIC}`,
      );
      console.log(
        `Transcription count: ${completedTranscriptions.length}, Script blocks: ${script.length}`,
      );
    } catch (error) {
      console.error("Failed to send meeting summarization to Kafka:", error);

      // Update meeting summarization status to 'failed' if there was an error
      try {
        const { storage } = await import("./storage");
        const meeting = await storage.getMeeting(meetingId);
        if (meeting) {
          const updateData = {
            respondentName: meeting.respondentName,
            respondentPosition: meeting.respondentPosition,
            cnum: meeting.cnum,
            gcc: meeting.gcc || undefined,
            companyName: meeting.companyName || undefined,
            email: meeting.email || undefined,
            researcher: meeting.researcher || undefined,
            relationshipManager: meeting.relationshipManager,
            salesPerson: meeting.salesPerson,
            date: meeting.date,
            researchId: meeting.researchId,
            status: meeting.status as any,
            notes: meeting.notes || undefined,
            fullText: meeting.fullText || undefined,
            hasGift: meeting.hasGift as any,
            summarizationStatus: "failed" as any,
          };
          await storage.updateMeeting(meetingId, updateData);
        }
      } catch (updateError) {
        console.error(
          "Failed to update meeting summarization status to failed:",
          updateError,
        );
      }
    }
  }

  /**
   * Start consuming summarization responses
   */
  private async startSummarizationResponseConsumer() {
    if (!this.consumer || !KAFKA_ENABLED || this.isConsumerRunning) return;

    try {
      await this.consumer.subscribe({
        topic: SUMMARIZATION_RESPONSE_TOPIC,
        fromBeginning: false,
      });

      this.isConsumerRunning = true;
      console.log(
        `Started consuming from topic: ${SUMMARIZATION_RESPONSE_TOPIC}`,
      );

      await this.consumer.run({
        eachMessage: async ({
          topic,
          partition,
          message,
        }: {
          topic: string;
          partition: number;
          message: any;
        }) => {
          try {
            if (topic === SUMMARIZATION_RESPONSE_TOPIC && message.value) {
              const responseData = JSON.parse(
                message.value.toString(),
              ) as SummarizationResponseMessage;
              await this.handleSummarizationResponse(responseData);
            }
          } catch (error) {
            console.error(
              "Error processing summarization response message:",
              error,
            );
          }
        },
      });
    } catch (error) {
      console.error("Error starting summarization response consumer:", error);
      this.isConsumerRunning = false;
    }
  }

  /**
   * Handle incoming summarization response
   */
  private async handleSummarizationResponse(
    responseMessage: SummarizationResponseMessage,
  ) {
    const { meetingId, result } = responseMessage;

    console.log(`Received summarization response for meeting ${meetingId}`);

    try {
      const { storage } = await import("./storage");
      const meeting = await storage.getMeeting(meetingId);

      if (!meeting) {
        console.error(
          `Meeting ${meetingId} not found when processing summarization response`,
        );
        return;
      }

      // Update meeting with summarization result
      const updateData = {
        respondentName: meeting.respondentName,
        respondentPosition: meeting.respondentPosition,
        cnum: meeting.cnum,
        gcc: meeting.gcc || undefined,
        companyName: meeting.companyName || undefined,
        email: meeting.email || undefined,
        researcher: meeting.researcher || undefined,
        relationshipManager: meeting.relationshipManager,
        salesPerson: meeting.salesPerson,
        date: meeting.date,
        researchId: meeting.researchId,
        status: meeting.status as any,
        notes: meeting.notes || undefined,
        fullText: meeting.fullText || undefined,
        hasGift: meeting.hasGift as any,
        summarizationStatus: "completed" as any,
        summarizationResult: result,
      };

      await storage.updateMeeting(meetingId, updateData);

      console.log(
        `Successfully stored summarization result for meeting ${meetingId}`,
      );
      console.log(`Summary: ${result.summary}`);
      console.log(`Blocks: ${result.items.length}`);
    } catch (error) {
      console.error(
        `Failed to store summarization result for meeting ${meetingId}:`,
        error,
      );

      // Try to update status to failed
      try {
        const { storage } = await import("./storage");
        const meeting = await storage.getMeeting(meetingId);
        if (meeting) {
          const failedUpdateData = {
            respondentName: meeting.respondentName,
            respondentPosition: meeting.respondentPosition,
            cnum: meeting.cnum,
            gcc: meeting.gcc || undefined,
            companyName: meeting.companyName || undefined,
            email: meeting.email || undefined,
            researcher: meeting.researcher || undefined,
            relationshipManager: meeting.relationshipManager,
            salesPerson: meeting.salesPerson,
            date: meeting.date,
            researchId: meeting.researchId,
            status: meeting.status as any,
            notes: meeting.notes || undefined,
            fullText: meeting.fullText || undefined,
            hasGift: meeting.hasGift as any,
            summarizationStatus: "failed" as any,
          };
          await storage.updateMeeting(meetingId, failedUpdateData);
        }
      } catch (updateError) {
        console.error(
          "Failed to update meeting summarization status to failed:",
          updateError,
        );
      }
    }
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect() {
    if (!KAFKA_ENABLED) return;

    try {
      if (this.consumer && this.isConsumerRunning) {
        await this.consumer.disconnect();
        this.isConsumerRunning = false;
        console.log("Kafka consumer disconnected");
      }

      if (this.producer && this.isConnected) {
        await this.producer.disconnect();
        this.isConnected = false;
        console.log("Kafka producer disconnected");
      }
    } catch (error) {
      console.error("Error during Kafka disconnect:", error);
    }
  }
}

// Export singleton instance
export const kafkaService = new KafkaService();

// Graceful shutdown
process.on("SIGINT", async () => {
  await kafkaService.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await kafkaService.disconnect();
  process.exit(0);
});
