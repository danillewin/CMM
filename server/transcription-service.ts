import { createReadStream, readFileSync } from 'fs';
import { join } from 'path';

// Feature toggle for mock transcription service
const MOCK_TRANSCRIPTION_ENABLED = process.env.MOCK_TRANSCRIPTION_ENABLED !== 'false';

export interface TranscriptionRequest {
  files: Express.Multer.File[];
}

export interface TranscriptionResponse {
  text: string;
  processingTime: number;
  fileCount: number;
  totalDuration?: number;
}

class TranscriptionService {
  private mockTranscriptions = [
    "This is a mock transcription of an audio file. The speaker discusses various topics including product development, user feedback, and future roadmap planning. Key insights include the importance of user-centered design and iterative development processes.",
    
    "In this recording, we hear about customer research methodologies and best practices. The discussion covers interview techniques, data analysis approaches, and how to effectively communicate findings to stakeholders. Several case studies are mentioned throughout the conversation.",
    
    "The audio contains a detailed discussion about market research findings. Topics include customer pain points, competitive analysis, and opportunities for product improvement. The speaker emphasizes the need for data-driven decision making and continuous customer engagement.",
    
    "This transcription captures a team meeting about project planning and resource allocation. Key points include timeline considerations, budget constraints, and team coordination strategies. The discussion also touches on risk management and contingency planning.",
    
    "The recording features an interview with a subject matter expert discussing industry trends and future predictions. Topics covered include technological advancements, market shifts, and strategic recommendations for organizations looking to stay competitive.",
  ];

  private getRandomTranscription(): string {
    const randomIndex = Math.floor(Math.random() * this.mockTranscriptions.length);
    return this.mockTranscriptions[randomIndex];
  }

  private simulateProcessingTime(files: Express.Multer.File[]): number {
    // Simulate processing time based on file count and size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const baseTime = 2000; // 2 seconds base
    const sizeMultiplier = Math.min(totalSize / (1024 * 1024), 10); // Max 10 seconds for size
    const fileMultiplier = files.length * 500; // 500ms per file
    
    return baseTime + (sizeMultiplier * 1000) + fileMultiplier;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async transcribeFiles(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const { files } = request;
    
    if (!files || files.length === 0) {
      throw new Error('No files provided for transcription');
    }

    // Validate file types
    const validTypes = [
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/flac',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm', 'video/mkv'
    ];

    const invalidFiles = files.filter(file => {
      const isValidMimeType = validTypes.includes(file.mimetype);
      const isValidExtension = /\.(mp3|wav|ogg|m4a|aac|flac|mp4|avi|mov|wmv|webm|mkv)$/i.test(file.originalname);
      return !isValidMimeType && !isValidExtension;
    });

    if (invalidFiles.length > 0) {
      throw new Error(`Invalid file types detected: ${invalidFiles.map(f => f.originalname).join(', ')}`);
    }

    if (MOCK_TRANSCRIPTION_ENABLED) {
      // Mock implementation
      console.log(`Mock transcription service: Processing ${files.length} files`);
      
      const processingTime = this.simulateProcessingTime(files);
      
      // Simulate processing delay
      await this.sleep(Math.min(processingTime, 5000)); // Cap at 5 seconds for demo
      
      // Generate mock transcription based on file count
      let combinedTranscription = '';
      
      if (files.length === 1) {
        combinedTranscription = this.getRandomTranscription();
      } else {
        // For multiple files, combine different transcriptions
        const transcriptions = files.map((_, index) => {
          const transcription = this.getRandomTranscription();
          return `\n\n--- File ${index + 1}: ${files[index].originalname} ---\n${transcription}`;
        });
        combinedTranscription = transcriptions.join('\n');
      }

      return {
        text: combinedTranscription,
        processingTime,
        fileCount: files.length,
        totalDuration: files.length * 180, // Mock 3 minutes per file
      };
    } else {
      // Real implementation would go here
      // This is where you would integrate with actual transcription services
      // like Google Speech-to-Text, AWS Transcribe, Azure Speech, etc.
      throw new Error('Real transcription service not implemented yet');
    }
  }

  async healthCheck(): Promise<{ status: string; mockEnabled: boolean }> {
    return {
      status: 'healthy',
      mockEnabled: MOCK_TRANSCRIPTION_ENABLED,
    };
  }
}

export const transcriptionService = new TranscriptionService();