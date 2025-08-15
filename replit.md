# Overview

This is a corporate Service Desk ticketing system built as a full-stack TypeScript application. The system provides comprehensive ticket management, service catalog, knowledge base, and administrative features for organizations. It follows a modular architecture with a React frontend, Express backend, and PostgreSQL database using Drizzle ORM.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: wouter for client-side routing with protected routes based on user roles
- **State Management**: TanStack Query for server state management and caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Authentication**: JWT-based authentication with role-based access control (RBAC)

## Backend Architecture
- **Framework**: Express.js with TypeScript for the REST API
- **Database ORM**: Drizzle ORM with PostgreSQL as the primary database
- **Authentication**: JWT tokens with bcrypt for password hashing
- **Email Service**: Nodemailer for transactional emails and notifications
- **Job Processing**: Custom job queue implementation for background tasks like SLA checks
- **File Storage**: Configurable storage system for attachments

## Database Design
- **Multi-tenancy**: Organization-based isolation with departments and teams
- **User Management**: Role-based permissions (ADMIN, AGENT, APPROVER, REQUESTER, AUDITOR)
- **Ticket System**: Comprehensive ticket lifecycle with status tracking, priorities, and SLA management
- **Service Catalog**: Categorized services with dynamic form configurations
- **Knowledge Base**: Article management with versioning and publishing workflow
- **Audit Trail**: Complete event tracking for tickets and system changes

## Key Features
- **Ticket Management**: Full CRUD operations with status transitions, assignments, and comments
- **SLA Tracking**: Automated SLA monitoring with escalation rules
- **Automation Rules**: Configurable business rules for ticket routing and actions
- **Approval Workflows**: Multi-step approval processes for specific ticket types
- **File Attachments**: Support for file uploads with tickets and comments
- **Real-time Updates**: Live updates for ticket changes and notifications

## Security Architecture
- **Authentication**: Secure JWT implementation with token expiration
- **Authorization**: Role-based access control at both route and UI component levels
- **Data Validation**: Comprehensive input validation using Zod schemas
- **CORS Protection**: Configured for secure cross-origin requests

# External Dependencies

## Database
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Drizzle Kit**: Database migrations and schema management

## UI and Styling
- **Radix UI**: Headless UI components for accessibility and functionality
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Icon library for consistent iconography

## Development and Build Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds

## Email and Communication
- **Nodemailer**: SMTP email delivery for notifications and alerts
- **Email Templates**: HTML email templates for various system events

## Authentication and Security
- **jsonwebtoken**: JWT token generation and validation
- **bcrypt**: Password hashing and verification
- **Zod**: Runtime type validation and schema parsing

## State Management and Data Fetching
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form state management with validation

## Monitoring and Observability
- **Custom Logging**: Request/response logging for API endpoints
- **Error Handling**: Centralized error handling with proper HTTP status codes