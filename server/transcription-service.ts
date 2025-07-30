import { createReadStream, readFileSync } from 'fs';
import { join } from 'path';
import FormData from 'form-data';

// Feature toggle for mock transcription service
const MOCK_TRANSCRIPTION_ENABLED = process.env.MOCK_TRANSCRIPTION_ENABLED !== 'false';

// Real transcription service configuration
const TRANSCRIPTION_API_URL = process.env.TRANSCRIPTION_API_URL;
const TRANSCRIPTION_API_KEY = process.env.TRANSCRIPTION_API_KEY;
const TRANSCRIPTION_MODEL = process.env.TRANSCRIPTION_MODEL || 'whisper-1';

export interface TranscriptionRequest {
  files: Express.Multer.File[];
}

export interface TranscriptionResponse {
  text: string;
  processingTime: number;
  fileCount: number;
  totalDuration?: number;
}

// API response interfaces based on Swagger specification
interface APITranscriptionResponse {
  text: string;
  logprobs?: Array<{
    token?: string | null;
    bytes?: number[] | null;
    logprob?: number | null;
  }> | null;
}

interface APITranscriptionVerboseResponse {
  duration: number;
  language: string;
  text: string;
  segments?: Array<{
    id: number;
    avg_logprob: number;
    compression_ratio: number;
    end: number;
    no_speech_prob: number;
    seek: number;
    start: number;
    temperature: number;
    text: string;
    tokens: number[];
  }> | null;
  words?: Array<{
    end: number;
    start: number;
    word: string;
  }> | null;
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

  private async transcribeWithRealAPI(file: Express.Multer.File): Promise<string> {
    if (!TRANSCRIPTION_API_URL) {
      throw new Error('TRANSCRIPTION_API_URL environment variable is required for real transcription service');
    }
    
    if (!TRANSCRIPTION_API_KEY) {
      throw new Error('TRANSCRIPTION_API_KEY environment variable is required for real transcription service');
    }

    try {
      const formData = new FormData();
      
      // Add the audio file
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
      
      // Add required parameters based on Swagger spec
      formData.append('model', TRANSCRIPTION_MODEL);
      
      // Optional parameters with defaults from Swagger
      formData.append('language', 'ru'); // Default language
      formData.append('response_format', 'json'); // Default format
      formData.append('temperature', '0'); // Default temperature
      formData.append('repetition_penalty', '1'); // Default repetition penalty
      formData.append('vad_filter', 'false'); // Default VAD filter
      formData.append('diarization', 'false'); // Default diarization

      const response = await fetch(`${TRANSCRIPTION_API_URL}/v1/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TRANSCRIPTION_API_KEY}`,
          ...formData.getHeaders(),
        },
        body: formData as any,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Transcription API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(`Transcription API request failed: ${response.status} ${response.statusText}`);
      }

      const result: APITranscriptionResponse = await response.json();
      
      if (!result.text) {
        throw new Error('No transcription text received from API');
      }

      return result.text;
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