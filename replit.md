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

### External Integrations
- **Notion API**: Integration capability for external documentation
- **Anthropic AI**: AI-powered features for research assistance
- **Excel Export**: Data export functionality for reporting

## External Dependencies

### Production Dependencies
- **Database**: Neon serverless PostgreSQL for cloud database hosting
- **UI Components**: Comprehensive Radix UI ecosystem for accessible components
- **Charts**: Recharts for data visualization
- **File Processing**: xlsx for Excel file operations
- **Drag & Drop**: dnd-kit for interactive UI elements

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
- June 16, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.