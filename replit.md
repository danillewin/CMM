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
- **File Upload & Transcription**: Audio/video file upload with automated transcription to text
- **Bilingual Support**: Complete English/Russian translation system with dynamic language switching

### External Integrations
- **Notion API**: Integration capability for external documentation
- **Anthropic AI**: AI-powered features for research assistance
- **Excel Export**: Data export functionality for reporting
- **Kafka Integration**: Event streaming for completed meetings and researches with SASL_SSL and Kerberos authentication support

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
- July 18, 2025: Implemented audio/video file upload functionality with mock transcription service integration and feature toggle (MOCK_TRANSCRIPTION_ENABLED)
- July 18, 2025: Added customerFullName field to Research Brief tab with bilingual support
- July 18, 2025: Added additionalStakeholders dynamic field array to Research Brief tab with add/remove functionality and bilingual support
- July 18, 2025: Added resultFormat dropdown field to Research Brief tab with predefined options (Презентация, Figma) and bilingual support

## User Preferences

Preferred communication style: Simple, everyday language.