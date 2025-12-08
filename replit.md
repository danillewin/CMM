# Research Interview Management System

## Overview
This full-stack web application is designed to manage research interviews and customer research data. It provides a comprehensive platform for tracking meetings, research projects, teams, positions, and Jobs-to-be-Done (JTBDs). The system aims to offer an intuitive interface for research professionals, enabling efficient organization and analysis of customer research data. Key ambitions include streamlining research workflows, providing data-driven insights through analytics, and integrating with advanced AI capabilities for research assistance.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: shadcn/ui on top of Radix UI for accessible and customizable components.
- **Styling**: Tailwind CSS for utility-first styling with a custom theme.
- **Visualizations**: Recharts for data visualization in dashboards and calendar views.

### Technical Implementations
- **Frontend**: React with TypeScript, Vite for bundling, Wouter for routing, TanStack Query for server state management, React Hook Form with Zod for form handling, and MDEditor for rich text.
- **Backend**: Node.js with TypeScript, Express.js for REST APIs, and Drizzle ORM with PostgreSQL for database interactions.
- **Data Flow**: Client requests via TanStack Query, handled by Express routes and validated, processed by Drizzle ORM, with responses flowing back through the layers.
- **Internationalization**: Complete English/Russian bilingual support with dynamic language switching.
- **File Management**: Features for audio/video upload with transcription, and research artifact file uploads (documents up to 50MB) with drag-and-drop.
- **Annotation System**: Text annotation for meeting reports with error types (Substitution, Insertion, Deletion) and correction text functionality.

### Feature Specifications
- **Core Data Entities**: Management of Teams, Positions, Researches, Meetings, and JTBDs.
- **Meeting & Research Management**: Scheduling, tracking, and documentation of interviews and research projects. Includes custom filter management and temporary data persistence across forms.
- **Dashboard & Calendar**: Visual analytics and timeline views for research activities and progress.
- **Roadmap Planning**: Timeline visualization for research projects with year-based filtering.
- **AI Integration**: AI-powered features for research assistance, including manual summarization triggers and re-analysis capabilities.
- **User Authentication**: LDAP integration with Active Directory for resolving user logins.
- **Data Export**: Excel export functionality for reporting.
- **Model Context Protocol (MCP)**: Exposure of system data to LLMs via 12 standardized tools accessible through HTTP endpoints.

### System Design Choices
- **Database**: PostgreSQL accessed via Drizzle ORM.
- **Deployment**: Optimized for Cloud Run with containerized deployment.
- **Development**: Vite for fast local development.
- **Performance**: Server-side data processing for analytics and calendar endpoints, optimized data loading for roadmap.
- **Separation of Concerns**: Centralized database access in a storage layer using a repository pattern.

## External Dependencies

- **Database**: Neon serverless PostgreSQL.
- **UI Components**: Radix UI ecosystem.
- **Charting Library**: Recharts.
- **File Processing**: xlsx for Excel operations.
- **Drag & Drop**: dnd-kit.
- **Event Streaming**: KafkaJS for real-time notifications with SASL_SSL and Kerberos authentication.
- **AI Services**: Anthropic AI (for AI-powered features), OpenAI Node.js library (for transcription).
- **External Documentation**: Notion API.
- **Directory Services**: ldapts library for Active Directory integration.
- **LLM Integration**: @modelcontextprotocol/sdk library for MCP.