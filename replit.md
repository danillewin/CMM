# Research Interview Management System

## Overview

This is a full-stack web application built for managing research interviews and customer research data. The system provides comprehensive functionality for tracking meetings, researches, teams, positions, and Jobs-to-be-Done (JTBDs) with an intuitive interface for research professionals.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom theme configuration
- **Form Handling**: React Hook Form with Zod validation
- **Rich Text Editing**: MDEditor for markdown content

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Development Server**: tsx for TypeScript execution
- **Build Process**: esbuild for production bundling

### Data Flow
1. **Client Requests**: React components make API calls through TanStack Query
2. **API Layer**: Express routes handle HTTP requests and validation
3. **Data Layer**: Drizzle ORM manages database operations with PostgreSQL
4. **Response Flow**: Data flows back through the same layers with proper error handling

## Key Components

### Database Schema
- **Teams**: Research team management
- **Positions**: Job position tracking for respondents
- **Researches**: Core research project data with status tracking
- **Meetings**: Interview session management with detailed metadata
- **JTBDs**: Jobs-to-be-Done framework implementation
- **Junction Tables**: Many-to-many relationships between researches/meetings and JTBDs

### Core Features
- **Meeting Management**: Schedule, track, and document customer interviews
- **Research Projects**: Organize research initiatives with timelines and team assignments
- **Calendar View**: Visual timeline of meetings and research activities
- **Dashboard Analytics**: Charts and metrics for research progress
- **Roadmap Planning**: Timeline visualization for research projects
- **JTBD Integration**: Link research activities to business outcomes
- **File Upload & Transcription**: Audio/video file upload with automated transcription via external API service or mock implementation
- **Bilingual Support**: Complete English/Russian translation system with dynamic language switching

### External Integrations
- **Notion API**: Integration capability for external documentation
- **Anthropic AI**: AI-powered features for research assistance
- **Excel Export**: Data export functionality for reporting
- **Kafka Integration**: Event streaming for completed meetings and researches with SASL_SSL and Kerberos authentication support
- **Active Directory**: LDAP integration for resolving user logins to full names with mock mode for development
- **Model Context Protocol (MCP)**: Standardized protocol for LLMs to retrieve system data via 12 tools accessible through HTTP endpoints

## External Dependencies

### Production Dependencies
- **Database**: Neon serverless PostgreSQL for cloud database hosting
- **UI Components**: Comprehensive Radix UI ecosystem for accessible components
- **Charts**: Recharts for data visualization
- **File Processing**: xlsx for Excel file operations
- **Drag & Drop**: dnd-kit for interactive UI elements
- **Event Streaming**: KafkaJS for real-time event notifications

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **Drizzle Kit**: Database migration and schema management
- **PostCSS**: CSS processing with Tailwind integration

## Deployment Strategy

### Environment Setup
- **Development**: Local development with hot reloading via Vite
- **Production**: Cloud Run deployment with optimized builds
- **Database**: Neon PostgreSQL with connection pooling

### Build Process
1. **Frontend Build**: Vite compiles React app to static assets
2. **Backend Build**: esbuild bundles Express server
3. **Database**: Drizzle migrations ensure schema consistency
4. **Deployment**: Cloud Run handles containerized deployment

### Configuration
- **Port Configuration**: Local port 5000, external port 80
- **Environment Variables**: Database URL and API keys via environment
- **Static Serving**: Production serves frontend from Express

## Changelog
- June 16, 2025: Initial setup
- June 16, 2025: Added Kafka integration for completed meetings and researches with feature toggle (KAFKA_ENABLED)
- June 16, 2025: Enhanced Kafka integration with SASL_SSL and Kerberos (GSSAPI) authentication support
- June 16, 2025: Added Kafka cluster support with multiple brokers via comma-separated KAFKA_BROKERS configuration
- June 23, 2025: Updated Kafka service to use node-rdkafka compatible configuration parameters (SECURITY_PROTOCOL, SASL_*, SSL_*_LOCATION)
- June 23, 2025: Enhanced Kafka messages to include complete entity information: full meeting/research content, linked JTBDs, related entities, and comprehensive metadata
- July 18, 2025: Added comprehensive bilingual support (English/Russian) with reactive translation system using i18next
- July 18, 2025: Implemented audio/video file upload functionality with comprehensive transcription service supporting both mock and real API integration
- July 30, 2025: Enhanced transcription service with real API implementation using OpenAI Node.js library, supporting external transcription services with environment variable configuration (TRANSCRIPTION_API_URL, TRANSCRIPTION_API_KEY, TRANSCRIPTION_MODEL)
- July 31, 2025: Refactored transcription service to use official OpenAI Node.js library with toFile helper for improved reliability and type safety
- July 31, 2025: Enhanced transcription output formatting to use speaker-based segmentation (SPEAKER_00, SPEAKER_01, etc.) from segments array instead of plain text
- July 18, 2025: Added customerFullName field to Research Brief tab with bilingual support
- July 18, 2025: Added additionalStakeholders dynamic field array to Research Brief tab with add/remove functionality and bilingual support
- July 18, 2025: Added resultFormat dropdown field to Research Brief tab with predefined options (Презентация, Figma) and bilingual support
- July 18, 2025: Added collapsible "Фон проекта" (Project Background) section to Research Brief tab with 5 text fields and bilingual support
- July 25, 2025: Implemented comprehensive custom filter management system across all three main tabs (Meetings, Researches, Calendar) with bookmark icon interface integrated into existing filter menus
- July 25, 2025: Added ResearcherFilterManager component with save/load/delete functionality for custom filter combinations, allowing team leads to preserve complex filter states
- July 25, 2025: Enhanced database schema with custom_filters table and API endpoints for persistent filter storage with bilingual support
- July 25, 2025: Implemented comprehensive temporary data persistence system across all tabbed forms (Research and Meeting components)
- July 25, 2025: Added handleTempDataUpdate functionality allowing users to edit multiple tabs without losing changes until Save is clicked
- July 25, 2025: Enhanced MeetingForm component with onTempDataUpdate prop support and field-level change tracking for seamless tab switching
- August 4, 2025: Successfully migrated from memory storage to PostgreSQL database using Neon serverless platform with complete data persistence
- August 8, 2025: Optimized Roadmap page performance by implementing year-based filtering with dedicated API endpoint (/api/roadmap/researches) that loads only relevant research data per selected year instead of all research data
- August 8, 2025: Completed comprehensive database architecture refactoring by centralizing all database access in storage layer, removing direct database calls from routes.ts to implement proper separation of concerns with repository pattern
- August 8, 2025: Enhanced performance optimization with server-side data processing for dashboard analytics and calendar endpoints, reducing client-side computation and API request overhead
- August 8, 2025: Optimized Research page UX by implementing improved loading states (keeping search bar and table header visible during data load), moved Apply Filters button to filters modal for better organization, and removed unnecessary duplicate check API call from new research creation flow for better performance
- August 15, 2025: Moved Research Type field from Brief tab to Overview tab for better form organization and user experience
- August 15, 2025: Added "Not assigned" option to Research Type field dropdown to provide additional flexibility in research classification
- August 15, 2025: Set "Not assigned" as the default value for Research Type field
- August 15, 2025: Repositioned Research Type field to center position in Overview tab (Status, Research Type, Color order)
- August 18, 2025: Implemented intelligent navigation context preservation for research-to-meeting workflow - when users navigate from a research to a connected meeting, the back button now correctly returns them to the originating research instead of the general meetings page
- October 9, 2025: Added phone field to meetings schema, forms, and database with proper validation and persistence
- October 9, 2025: Implemented Active Directory (LDAP) integration using ldapts library for resolving user logins to full names with concurrency-safe design (fresh client per lookup to prevent race conditions)
- October 9, 2025: Added AD mock mode for development with configurable environment variables (AD_ENABLED, AD_URL, AD_BASE_DN, AD_BIND_DN, AD_BIND_PASSWORD) for production LDAP integration
- October 9, 2025: Enhanced AD integration to format user names as "FullName (login)" for better identification in UI and data exports
- October 9, 2025: Optimized transcription service memory usage to reduce overhead from 7x to 2-3x by implementing direct buffer-to-File conversion, explicit buffer cleanup after processing, incremental string building instead of array accumulation, and clearing processed file references to enable garbage collection
- October 23, 2025: Implemented Model Context Protocol (MCP) integration using @modelcontextprotocol/sdk library to expose system data to LLMs through standardized tools
- October 23, 2025: Added 12 MCP tools for data retrieval (get_teams, get_positions, get_researches, get_meetings, get_jtbds, get_dashboard_data, get_calendar_meetings, get_calendar_researches, etc.) that reuse the storage layer
- October 23, 2025: Created MCP endpoint POST /api/mcp using StreamableHTTPServerTransport for JSON-RPC 2.0 protocol compliance, supporting both tools/list and tools/call methods
- October 25, 2025: Fixed critical bug where meeting summarization status was incorrectly reset to "not_started" when saving from Информация tab - now properly preserves completed/in-progress status across all meeting tabs
- October 25, 2025: Added manual summarization trigger functionality with "Trigger Analysis" button in Результаты tab allowing users to manually initiate or retry AI interview analysis when status is not_started or failed
- October 25, 2025: Enhanced manual summarization trigger to support re-analysis of completed interviews - button now shows "Re-analyze" when status is completed, allowing users to request fresh AI analysis even after successful completion (blocked only during in_progress to prevent duplicate concurrent processing)
- November 18, 2025: Fixed critical bug where saving meeting details from Results tab was overwriting summarization results with null - enhanced updateMeeting method in storage layer to preserve existing summarization fields when not explicitly provided in update payload, ensuring Kafka service retains exclusive control over summarization data updates
- December 3, 2025: Implemented text annotation feature for meeting reports allowing users to mark errors in text with three types: Substitution (yellow), Insertion (green), and Deletion (red)
- December 3, 2025: Added textAnnotations database table with fields for meetingId, errorType, startOffset, endOffset, and selectedText with proper foreign key constraints
- December 3, 2025: Created AnnotatedTextField component with synchronized textarea overlay for inline annotation display while maintaining text editability
- December 3, 2025: Added API endpoints for text annotations: GET/POST /api/meetings/:id/annotations, DELETE /api/annotations/:id
- December 3, 2025: Integrated text annotation feature into meeting Results tab with color-coded highlights and annotation management list

## User Preferences

Preferred communication style: Simple, everyday language.