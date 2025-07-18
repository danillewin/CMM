# Audio/Video File Upload and Transcription Feature

## Overview
Added audio/video file upload functionality to the Research Results tab that allows users to upload media files, process them through an external transcription service, and save the transcribed text to the Full Text field.

## Features Implemented

### 1. File Upload Component (`client/src/components/file-upload.tsx`)
- **Drag & Drop Interface**: Users can drag and drop files or click to browse
- **File Type Validation**: Supports audio (MP3, WAV, OGG, M4A, AAC, FLAC) and video (MP4, AVI, MOV, WMV, WEBM, MKV) formats
- **Multiple File Support**: Can upload up to 5 files at once
- **File Size Limit**: 100MB per file
- **Progress Tracking**: Shows upload and processing progress
- **Error Handling**: Clear error messages for invalid files or processing failures
- **Visual Feedback**: File icons, progress bars, and status indicators

### 2. Mock Transcription Service (`server/transcription-service.ts`)
- **Feature Toggle**: Controlled by `MOCK_TRANSCRIPTION_ENABLED` environment variable (default: enabled)
- **Realistic Processing**: Simulates processing time based on file count and size
- **Multiple Transcription Templates**: Provides varied, realistic transcription content
- **File Validation**: Validates file types and sizes before processing
- **Health Check**: Endpoint to check service status and configuration

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

### Mock Service Configuration
- **Environment Variable**: `MOCK_TRANSCRIPTION_ENABLED` (default: true)
- **Realistic Processing**: Simulates 2-10 seconds processing time
- **Varied Content**: Multiple transcription templates for different scenarios
- **Debug Logging**: Comprehensive logging for troubleshooting

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
1. **Enable/Disable Mock Service**: Set `MOCK_TRANSCRIPTION_ENABLED=false` to disable mock service
2. **Real Service Integration**: Replace mock implementation in `transcription-service.ts` with actual API calls
3. **Customize File Limits**: Modify limits in `routes.ts` multer configuration
4. **Add File Types**: Update accepted types in both client and server validation

## Future Enhancements
- Integration with real transcription services (Google Speech-to-Text, AWS Transcribe, etc.)
- Support for additional file formats
- Batch processing optimization
- Transcription confidence scores
- Speaker identification
- Timestamp support
- Custom transcription settings

## Environment Variables
- `MOCK_TRANSCRIPTION_ENABLED`: Enable/disable mock transcription service (default: true)

## API Endpoints
- `POST /api/transcribe`: Upload and transcribe audio/video files
- `GET /api/transcribe/health`: Check transcription service health and configuration