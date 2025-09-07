# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is a React Router-based full-stack application with Railway API integration
and chat functionality. The project uses Bun as the runtime, React Router v7 for
routing with SSR support, and MongoDB for data persistence.

## Commands

### Development

- `bun dev` - Start development server with HMR on port 5173
- `bun run test run` - Run test suite with Vitest in non-interactive mode
- `bun typecheck` - Run TypeScript type checking
- `bun format` - Format code with Prettier
- `bun build` - Create production build
- `bun start` - Start production server

### Testing

- `bun run test run` - Run all tests in non-interactive mode
- `bun test` - Run tests in watch mode (interactive)
- Individual test files are located alongside source files (e.g.,
  `graphql-client.test.ts`)

## Architecture

### Core Services

**Railway API Integration** (`app/railway-client.ts`, `app/graphql-client.ts`)

- GraphQL client with error handling for Railway's API
- RailwayClient provides typed methods for:
  - `listProjects()` - Fetches all projects across workspaces
  - `listServices(projectId)` - Fetches services with deployments for a project
  - `createService(projectId, source)` - Creates new services from repo or image
    sources
- Uses Railway GraphQL API v2 endpoint:
  `https://backboard.railway.app/graphql/v2`

**Chat System** (`app/services/chat.server.ts`)

- Server-side chat service with MongoDB persistence
- OpenAI integration for AI responses
- Chat and message models with full CRUD operations

### Routing Structure

- Routes defined in `app/routes.ts` using React Router v7 config
- Main routes:
  - `/` - Home page
  - `/chat` - New chat creation
  - `/chats/:chatId` - Individual chat view
  - `/api/messages` - API endpoint for messages

### Environment Variables

Required in `.env`:

- `RAILWAY_API_TOKEN` - Railway API authentication token
- `OPENAI_API_KEY` - OpenAI API key for chat functionality
- `DB_URL` - MongoDB connection string
- `DB_DATABASE` - MongoDB database name
- `DB_ADAPTER` - Database adapter (default: "default")

### Testing Strategy

- Unit tests using Vitest with mocked dependencies
- Test files colocated with source files
- GraphQL client tests mock fetch API
- Railway client tests use mocked GraphQL client

### Key Dependencies

- `dotenv` - Environment variable management
- `tiny-typescript-logger` - Lightweight logging
- `@ai-sdk/openai` & `ai` - AI/chat functionality
- `mongodb` - Database persistence
- React Router ecosystem for SSR and routing
- TailwindCSS for styling

## Important Notes

- Always use `dotenv/config` import for environment variables
- GraphQL requests include proper error handling for 400, 401, 429, 503 status
  codes
- Railway API requires Bearer token authentication
- Tests should mock external dependencies rather than making real API calls
