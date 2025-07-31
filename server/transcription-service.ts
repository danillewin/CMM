import { createReadStream, readFileSync } from 'fs';
import { join } from 'path';
import OpenAI, { toFile } from 'openai';

// Feature toggle for mock transcription service
const MOCK_TRANSCRIPTION_ENABLED = process.env.MOCK_TRANSCRIPTION_ENABLED !== 'false';

// Real transcription service configuration
const TRANSCRIPTION_API_URL = process.env.TRANSCRIPTION_API_URL;
const TRANSCRIPTION_API_KEY = process.env.TRANSCRIPTION_API_KEY;
const TRANSCRIPTION_MODEL = process.env.TRANSCRIPTION_MODEL || 'whisper-1';

// Initialize OpenAI client for real transcription service
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient && TRANSCRIPTION_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: TRANSCRIPTION_API_KEY,
      baseURL: TRANSCRIPTION_API_URL,
    });
  }
  return openaiClient!;
}

export interface TranscriptionRequest {
  files: Express.Multer.File[];
}

export interface TranscriptionResponse {
  text: string;
  processingTime: number;
  fileCount: number;
  totalDuration?: number;
}

// OpenAI transcription response is handled by the library

class TranscriptionService {
  private mockTranscriptions = [
    "SPEAKER_00:\nThis is a mock transcription of an audio file. The speaker discusses various topics including product development and user feedback.\n\nSPEAKER_01:\nKey insights include the importance of user-centered design and iterative development processes.",
    
    "SPEAKER_00:\nIn this recording, we hear about customer research methodologies and best practices.\n\nSPEAKER_01:\nThe discussion covers interview techniques, data analysis approaches, and how to effectively communicate findings to stakeholders.",
    
    "SPEAKER_00:\nThe audio contains a detailed discussion about market research findings. Topics include customer pain points and competitive analysis.\n\nSPEAKER_01:\nThe speaker emphasizes the need for data-driven decision making and continuous customer engagement.",
    
    "SPEAKER_00:\nThis transcription captures a team meeting about project planning and resource allocation.\n\nSPEAKER_01:\nKey points include timeline considerations, budget constraints, and team coordination strategies.",
    
    "SPEAKER_00:\nThe recording features an interview with a subject matter expert discussing industry trends.\n\nSPEAKER_01:\nTopics covered include technological advancements, market shifts, and strategic recommendations for organizations.",
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

  private formatTranscriptionWithSpeakers(transcription: any): string {
    // If segments are available with speaker information, format them
    if (transcription.segments && Array.isArray(transcription.segments)) {
      const formattedSegments = transcription.segments
        .filter((segment: any) => segment.text && segment.text.trim())
        .map((segment: any) => {
          const speaker = segment.speaker || 'SPEAKER_00'; // Default speaker if not provided
          const text = segment.text.trim();
          return `${speaker}:\n${text}`;
        });
      
      if (formattedSegments.length > 0) {
        return formattedSegments.join('\n\n');
      }
    }
    
    // Fallback to plain text if no segments with speakers
    return transcription.text;
  }

  private async transcribeWithRealAPI(file: Express.Multer.File): Promise<string> {
    if (!TRANSCRIPTION_API_KEY) {
      throw new Error('TRANSCRIPTION_API_KEY environment variable is required for real transcription service');
    }

    try {
      const openai = getOpenAIClient();
      
      // Convert the buffer to a File object that OpenAI can use
      const audioFile = await toFile(file.buffer, file.originalname, {
        type: file.mimetype,
      });

      console.log(`Transcribing file: ${file.originalname} (${file.size} bytes) with model: ${TRANSCRIPTION_MODEL}`);

      // Create transcription using OpenAI client with verbose_json for segments
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: TRANSCRIPTION_MODEL,
        language: 'ru', // Default language for Russian
        response_format: 'verbose_json', // Request detailed response with segments
        temperature: 0,
        // Note: Custom parameters like repetition_penalty, vad_filter, diarization 
        // are not standard OpenAI API parameters and depend on the specific service
      });

      if (!transcription.text) {
        throw new Error('No transcription text received from API');
      }

      console.log(`Successfully transcribed ${file.originalname}: ${transcription.text.length} characters`);
      
      // Format transcription using segments with speaker identification
      return this.formatTranscriptionWithSpeakers(transcription);

    } catch (error) {
      console.error('Error transcribing file:', file.originalname, error);
      if (error instanceof Error) {
        throw new Error(`Failed to transcribe ${file.originalname}: ${error.message}`);
      } else {
        throw new Error(`Failed to transcribe ${file.originalname}: Unknown error`);
      }
    }
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
      // Real transcription service implementation
      console.log(`Real transcription service: Processing ${files.length} files`);
      const startTime = Date.now();
      
      try {
        // Process files sequentially to avoid overwhelming the API
        const transcriptions: string[] = [];
        
        for (const file of files) {
          console.log(`Processing file: ${file.originalname} (${file.size} bytes)`);
          const transcription = await this.transcribeWithRealAPI(file);
          transcriptions.push(transcription);
        }
        
        // Combine transcriptions
        let combinedTranscription = '';
        if (files.length === 1) {
          combinedTranscription = transcriptions[0];
        } else {
          // For multiple files, combine with file separators
          combinedTranscription = transcriptions.map((transcription, index) => {
            return `\n\n--- File ${index + 1}: ${files[index].originalname} ---\n${transcription}`;
          }).join('\n');
        }
        
        const processingTime = Date.now() - startTime;
        console.log(`Real transcription completed in ${processingTime}ms`);
        
        return {
          text: combinedTranscription,
          processingTime,
          fileCount: files.length,
          totalDuration: undefined, // Real API doesn't provide duration info in basic response
        };
      } catch (error) {
        console.error('Real transcription service error:', error);
        throw error;
      }
    }
  }

  async healthCheck(): Promise<{ status: string; mockEnabled: boolean; apiConfigured?: boolean }> {
    const result = {
      status: 'healthy',
      mockEnabled: MOCK_TRANSCRIPTION_ENABLED,
      apiConfigured: false,
    };
    
    if (!MOCK_TRANSCRIPTION_ENABLED) {
      result.apiConfigured = !!(TRANSCRIPTION_API_URL && TRANSCRIPTION_API_KEY);
      
      if (!result.apiConfigured) {
        result.status = 'configuration_error';
      }
    }
    
    return result;
  }
}

export const transcriptionService = new TranscriptionService();