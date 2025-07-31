# Audio/Video File Upload and Transcription Feature

## Overview
Added audio/video file upload functionality to the Research Results tab that allows users to upload media files, process them through an external transcription service API, and save the transcribed text to the Full Text field. The system supports both mock and real transcription services.

## Features Implemented

### 1. File Upload Component (`client/src/components/file-upload.tsx`)
- **Drag & Drop Interface**: Users can drag and drop files or click to browse
- **File Type Validation**: Supports audio (MP3, WAV, OGG, M4A, AAC, FLAC) and video (MP4, AVI, MOV, WMV, WEBM, MKV) formats
- **Multiple File Support**: Can upload up to 5 files at once
- **File Size Limit**: 100MB per file
- **Progress Tracking**: Shows upload and processing progress
- **Error Handling**: Clear error messages for invalid files or processing failures
- **Visual Feedback**: File icons, progress bars, and status indicators

### 2. Transcription Service (`server/transcription-service.ts`)
- **Dual Mode Operation**: Supports both mock and real transcription services
- **Feature Toggle**: Controlled by `MOCK_TRANSCRIPTION_ENABLED` environment variable (default: enabled)
- **Real API Integration**: Uses OpenAI Node.js library for reliable transcription service integration
- **Mock Service**: Provides realistic simulation for development and testing
- **File Validation**: Validates file types and sizes before processing
- **Health Check**: Endpoint to check service status and configuration
- **Error Handling**: Comprehensive error handling with detailed logging

### 3. Backend API (`server/routes.ts`)
- **File Upload Endpoint**: `POST /api/transcribe` with multer middleware
- **Memory Storage**: Files are processed in memory without saving to disk
- **File Type Filtering**: Server-side validation for audio/video files
- **Error Handling**: Comprehensive error responses for various failure scenarios
- **Health Check**: `GET /api/transcribe/health` for service monitoring

### 4. Integration with Research Results
- **Seamless Integration**: File upload component appears before the Full Text field
- **Auto-append**: Transcribed text is automatically appended to existing content
- **Auto-save**: Research is automatically saved after successful transcription
- **Processing State**: Form is disabled during file processing to prevent conflicts

## Technical Implementation

### File Upload Flow
1. User selects/drops audio or video files
2. Files are validated client-side for type and size
3. Files are uploaded to `/api/transcribe` endpoint
4. Server processes files through transcription service
5. Transcribed text is returned and appended to Full Text field
6. Research is automatically saved with updated content

### Security Features
- **File Type Validation**: Both client and server validate file types
- **Size Limits**: 100MB per file, 5 files maximum
- **Memory Storage**: Files are not persisted to disk
- **Error Isolation**: Processing errors don't affect the rest of the application

### Service Configuration

#### Mock Service Configuration
- **Environment Variable**: `MOCK_TRANSCRIPTION_ENABLED` (default: true)
- **Realistic Processing**: Simulates 2-10 seconds processing time
- **Varied Content**: Multiple transcription templates for different scenarios
- **Debug Logging**: Comprehensive logging for troubleshooting

#### Real API Service Configuration
- **API URL**: `TRANSCRIPTION_API_URL` - Base URL for the transcription service
- **API Key**: `TRANSCRIPTION_API_KEY` - Bearer token for authentication
- **Model**: `TRANSCRIPTION_MODEL` - AI model to use (default: whisper-1)
- **Language**: Default language set to 'ru' (Russian) but configurable
- **Response Format**: JSON format for structured responses
- **Processing**: Sequential file processing to avoid API rate limits

## Usage Instructions

### For Users
1. Navigate to any Research detail page
2. Click on the "Results" tab
3. Use the file upload area to drag/drop or select audio/video files
4. Click "Process & Transcribe" to start transcription
5. Wait for processing to complete (progress bar shows status)
6. Transcribed text will be automatically added to the Full Text field
7. Save the research to persist the transcribed content

### For Developers

#### Environment Variables Setup
```bash
# Mock Service (default)
MOCK_TRANSCRIPTION_ENABLED=true

# Real API Service
MOCK_TRANSCRIPTION_ENABLED=false
TRANSCRIPTION_API_URL=https://your-transcription-api.com
TRANSCRIPTION_API_KEY=your_bearer_token_here
TRANSCRIPTION_MODEL=whisper-1
```

#### Configuration Steps
1. **Enable/Disable Mock Service**: Set `MOCK_TRANSCRIPTION_ENABLED=false` to use real API
2. **Configure Real Service**: Set required environment variables for API integration
3. **OpenAI Library**: Uses official OpenAI Node.js client with toFile helper for reliable uploads
4. **File Processing**: Seamless buffer-to-file conversion with proper MIME type handling
5. **Error Handling**: Comprehensive error logging and user feedback
6. **Customize File Limits**: Modify limits in `routes.ts` multer configuration
7. **Add File Types**: Update accepted types in both client and server validation

## OpenAI Client Integration

The real transcription service uses the official OpenAI Node.js library with the following features:

### Supported Parameters
- **file**: Audio/video file (converted using toFile helper)
- **model**: AI model identifier (configurable via TRANSCRIPTION_MODEL)
- **language**: Language code (default: 'ru' for Russian)
- **response_format**: Output format (default: 'json')
- **temperature**: Model temperature (default: 0)
- **Note**: Advanced parameters depend on the specific service compatibility

### Authentication & Configuration
- **API Key**: Bearer token via `TRANSCRIPTION_API_KEY` environment variable
- **Base URL**: Custom service URL via `TRANSCRIPTION_API_URL` (optional)
- **Client Initialization**: Lazy initialization with proper error handling

### Response Handling
- **Native Integration**: Leverages OpenAI client's built-in response processing
- **Type Safety**: Full TypeScript support with proper type definitions
- **Error Handling**: Comprehensive error catching with detailed logging
- **Buffer Processing**: Direct buffer-to-file conversion using toFile helper

## Future Enhancements
- Support for additional file formats
- Batch processing optimization
- Transcription confidence scores from API
- Speaker identification via diarization
- Timestamp support from verbose responses
- Custom transcription settings per request
- Parallel processing for multiple files
- Progress tracking for long-running transcriptions

## Environment Variables
- `MOCK_TRANSCRIPTION_ENABLED`: Enable/disable mock transcription service (default: true)

## API Endpoints
- `POST /api/transcribe`: Upload and transcribe audio/video files
- `GET /api/transcribe/health`: Check transcription service health and configuration