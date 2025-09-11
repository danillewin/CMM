import { storage } from "./storage";
import { transcriptionService } from "./transcription-service";
import { ObjectStorageService } from "./objectStorage";

const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds

export class AsyncTranscriptionProcessor {
  private objectStorageService: ObjectStorageService;
  
  constructor() {
    this.objectStorageService = new ObjectStorageService();
  }

  /**
   * Process transcription for a single file attachment
   */
  async processFileTranscription(attachmentId: number): Promise<void> {
    const attachment = await storage.getMeetingAttachment(attachmentId);
    if (!attachment) {
      console.error(`Attachment ${attachmentId} not found`);
      return;
    }

    console.log(`Starting transcription for file: ${attachment.originalName} (ID: ${attachmentId})`);
    
    try {
      // Update status to in_progress
      await storage.updateMeetingAttachment(attachmentId, {
        transcriptionStatus: 'in_progress',
        lastTranscriptionAttempt: new Date()
      });

      // Download file from object storage
      const objectFile = await this.objectStorageService.getObjectEntityFile(attachment.objectPath);
      const [metadata] = await objectFile.getMetadata();
      
      // Get file buffer
      const chunks: Buffer[] = [];
      const stream = objectFile.createReadStream();
      
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve());
        stream.on('error', (error) => reject(error));
      });

      const fileBuffer = Buffer.concat(chunks);

      // Create a mock Express.Multer.File object for the transcription service
      const multerFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: attachment.originalName,
        encoding: '7bit',
        mimetype: attachment.mimeType,
        size: attachment.fileSize,
        buffer: fileBuffer,
        destination: '',
        filename: attachment.fileName,
        path: '',
        stream: stream as any,
      };

      // Transcribe the file
      const result = await transcriptionService.transcribeFiles({ files: [multerFile] });
      
      // Update attachment with successful transcription
      await storage.updateMeetingAttachment(attachmentId, {
        transcriptionStatus: 'completed',
        transcriptionText: result.text,
        errorMessage: undefined
      });

      console.log(`Successfully completed transcription for file: ${attachment.originalName}`);
      
    } catch (error) {
      console.error(`Transcription failed for file ${attachment.originalName}:`, error);
      
      const newRetryCount = attachment.transcriptionRetryCount + 1;
      const shouldRetry = newRetryCount < MAX_RETRY_COUNT;
      
      await storage.updateMeetingAttachment(attachmentId, {
        transcriptionStatus: shouldRetry ? 'pending' : 'failed',
        transcriptionRetryCount: newRetryCount,
        lastTranscriptionAttempt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });

      if (shouldRetry) {
        console.log(`Scheduling retry ${newRetryCount}/${MAX_RETRY_COUNT} for file: ${attachment.originalName}`);
        // Schedule retry after delay
        setTimeout(() => {
          this.processFileTranscription(attachmentId).catch(console.error);
        }, RETRY_DELAY_MS * newRetryCount); // Exponential backoff
      } else {
        console.log(`Max retries reached for file: ${attachment.originalName}. Marking as failed.`);
      }
    }
  }

  /**
   * Process transcription for all pending files for a meeting
   */
  async processAllPendingTranscriptions(meetingId: number): Promise<void> {
    const attachments = await storage.getMeetingAttachments(meetingId);
    const pendingAttachments = attachments.filter(
      att => att.transcriptionStatus === 'pending' || 
      (att.transcriptionStatus === 'failed' && att.transcriptionRetryCount < MAX_RETRY_COUNT)
    );

    console.log(`Processing ${pendingAttachments.length} pending transcriptions for meeting ${meetingId}`);

    // Process files sequentially to avoid overwhelming the transcription service
    for (const attachment of pendingAttachments) {
      try {
        await this.processFileTranscription(attachment.id);
        // Add small delay between files
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing transcription for attachment ${attachment.id}:`, error);
      }
    }
  }

  /**
   * Retry failed transcriptions for a specific file
   */
  async retryFailedTranscription(attachmentId: number): Promise<boolean> {
    const attachment = await storage.getMeetingAttachment(attachmentId);
    if (!attachment) {
      console.error(`Attachment ${attachmentId} not found`);
      return false;
    }

    if (attachment.transcriptionStatus === 'failed' || attachment.transcriptionStatus === 'pending') {
      // Reset retry count and try again
      await storage.updateMeetingAttachment(attachmentId, {
        transcriptionStatus: 'pending',
        transcriptionRetryCount: 0,
        errorMessage: undefined
      });

      // Process the transcription
      await this.processFileTranscription(attachmentId);
      return true;
    }

    return false;
  }

  /**
   * Get transcription status summary for a meeting
   */
  async getTranscriptionSummary(meetingId: number): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
  }> {
    const attachments = await storage.getMeetingAttachments(meetingId);
    
    return {
      total: attachments.length,
      pending: attachments.filter(att => att.transcriptionStatus === 'pending').length,
      inProgress: attachments.filter(att => att.transcriptionStatus === 'in_progress').length,
      completed: attachments.filter(att => att.transcriptionStatus === 'completed').length,
      failed: attachments.filter(att => att.transcriptionStatus === 'failed').length,
    };
  }

  /**
   * Start async transcription for all uploaded files in a meeting
   */
  async startAsyncTranscriptionForMeeting(meetingId: number): Promise<void> {
    // Process in background without blocking the response
    process.nextTick(() => {
      this.processAllPendingTranscriptions(meetingId).catch(error => {
        console.error(`Background transcription processing failed for meeting ${meetingId}:`, error);
      });
    });
  }
}

// Create a singleton instance
export const asyncTranscriptionProcessor = new AsyncTranscriptionProcessor();