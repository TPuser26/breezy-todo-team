# Full-Stack Express + React Application

## Overview

This is a full-stack web application built with Express.js backend and React frontend. The application uses a modern tech stack including TypeScript, PostgreSQL with Drizzle ORM, TailwindCSS with shadcn/ui components, and is configured for both development and production environments.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: TailwindCSS with shadcn/ui component library
- **State Management**: React Query for server state, React hooks for local state
- **Routing**: React Router for client-side navigation
- **UI Components**: Comprehensive shadcn/ui component library with Radix UI primitives
- **Authentication**: Custom auth context using hooks

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Session Management**: PostgreSQL session store
- **Middleware**: Express JSON/URL-encoded parsing, logging middleware

### Build System
- **Frontend Build**: Vite with React plugin
- **Backend Build**: esbuild for server bundling
- **Development**: TSX for TypeScript execution
- **CSS Processing**: PostCSS with TailwindCSS

## Key Components

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Type-safe database schema definition in `shared/schema.ts`
- **Migrations**: Database migrations managed in `./migrations` directory
- **Connection**: Neon serverless connection with WebSocket support

### API Layer
- **Routes**: Centralized route registration in `server/routes.ts`
- **Storage**: Abstracted storage interface with in-memory implementation
- **Error Handling**: Global error handling middleware
- **Logging**: Request/response logging with timing information

### Frontend Components
- **Authentication**: Complete auth flow with email/password and Google OAuth
- **Dashboard**: User dashboard with welcome section and statistics
- **UI Library**: Extensive shadcn/ui component collection
- **Responsive Design**: Mobile-first approach with responsive breakpoints

## Data Flow

1. **Frontend to Backend**: React components make API calls using React Query
2. **Backend Processing**: Express routes handle requests and interact with storage layer
3. **Database Operations**: Storage interface abstracts database operations using Drizzle ORM
4. **Response Flow**: Data flows back through the same layers with proper error handling

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Connection String**: Required `DATABASE_URL` environment variable

### Authentication Services
- **Supabase**: Authentication provider with Google OAuth support
- **Session Storage**: PostgreSQL-based session storage

### UI Framework
- **shadcn/ui**: Modern React component library
- **Radix UI**: Headless UI primitives
- **Lucide React**: Icon library
- **TailwindCSS**: Utility-first CSS framework

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR
- **Backend**: TSX with nodemon-like reloading
- **Database**: Development database connection
- **Environment**: NODE_ENV=development

### Production
- **Frontend**: Static build served from `dist/public`
- **Backend**: esbuild bundle executed with Node.js
- **Database**: Production PostgreSQL connection
- **Environment**: NODE_ENV=production

### Build Process
1. Frontend assets built with Vite
2. Backend compiled with esbuild
3. Static assets served by Express in production
4. Database migrations applied with Drizzle Kit

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 07, 2025. Initial setup