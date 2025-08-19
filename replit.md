# Overview

This is a fuel supply control system built as a full-stack TypeScript application. The system manages fuel requests, approvals, and supply chain operations with a professional interface designed specifically for fuel management workflows. It provides essential request management with a streamlined React frontend, Express backend, and PostgreSQL database using Drizzle ORM.

# User Preferences

Preferred communication style: Simple, everyday language.
Visual Design: Professional fuel system design using the custom "Sistema de Controle de Abastecimento" color palette with blue primary (hsl(207, 90%, 54%)), clean borders, and business-focused interface. No yellow/amber colors anywhere in the system.

# Recent Changes

✓ Complete visual transformation to fuel system design
✓ Implemented custom color scheme from design documentation  
✓ Updated all dashboard components with fuel-specific terminology
✓ Replaced all yellow/amber colors with professional palette
✓ Applied clean, business-focused interface throughout system

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
- **Simple Ticket Creation**: Users can quickly create tickets with title, description, and priority
- **Direct Communication**: Real-time chat-like comments between users and support team
- **Basic Status Tracking**: Open, In Progress, Resolved, Closed
- **Team Assignment**: Simple assignment to support team members
- **File Attachments**: Basic file upload support for tickets
- **Clean Design**: Simple, professional design with soft pastel colors and conventional typography
- **Accessible UI/UX**: Clean interface with excellent readability and intuitive navigation

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
- **Clean Design System**: Soft pastel color palette with excellent contrast and readability
- **Professional Typography**: Inter and Roboto fonts for clean, readable interface
- **Simple Components**: Minimal styling with focus on usability and accessibility

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