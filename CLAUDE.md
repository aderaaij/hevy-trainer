# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered personal trainer web application that integrates with Hevy (workout tracking app) to create intelligent, personalized workout routines. The AI analyzes users' workout history from Hevy and generates new training programs considering professional training principles like periodization, progressive overload, and deload weeks.

### Core Features
- **User Profile**: Age, weight, injuries, training frequency, focus areas
- **Hevy Integration**: Import workout history and export new routines
- **AI Workout Generation**: OpenAI-powered routine creation based on user data and training history
- **Smart Programming**: Automatic periodization, deload weeks, exercise variation
- **Progress Tracking**: Analyze past performance to inform future programming

## Essential Commands

```bash
# Development
npm run dev        # Start development server with Turbopack at http://localhost:3030

# Production
npm run build      # Create production build
npm run start      # Start production server

# Code Quality
npm run lint       # Run ESLint checks
```

## Architecture and Structure

### Technology Stack

#### Frontend
- **Framework**: Next.js 15.4.3 with App Router
- **Language**: TypeScript with strict mode
- **React**: Version 19.1.0
- **UI Components**: Shadcn/ui (Radix primitives + Tailwind CSS) - ✅ **INSTALLED**
- **Styling**: Tailwind CSS v4 (CSS-based configuration)
- **Forms**: React Hook Form + Zod validation - ✅ **INSTALLED**
- **State Management**: Zustand or Context API - to be implemented
- **HTTP Client**: Axios for API calls - ✅ **INSTALLED**

#### Backend
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL + Auth + Realtime) - ✅ **CONFIGURED**
- **ORM**: Prisma with Supabase - ✅ **INSTALLED & MIGRATED**
- **Authentication**: Supabase Auth - ✅ **IMPLEMENTED**
- **AI Integration**: OpenAI API (GPT-4)
- **External API**: Hevy API integration

#### Infrastructure
- **Hosting**: Vercel
- **Database & Auth**: Supabase
- **Environment**: Node.js 18+
- **Package Manager**: npm

### Directory Structure
```
src/
├── app/                          # Next.js App Router pages and layouts
│   ├── auth/                     # Authentication pages
│   │   ├── login/page.tsx        # Login page
│   │   └── signup/page.tsx       # Signup page
│   ├── dashboard/page.tsx        # Protected dashboard page
│   ├── api/                      # API routes
│   │   ├── auth/                 # Auth API routes
│   │   │   ├── profile/route.ts  # User profile CRUD
│   │   │   └── signout/route.ts  # Sign out endpoint
│   │   └── hevy/                 # Hevy API proxy routes
│   │       ├── workouts/         # Workout endpoints
│   │       ├── routines/         # Routine endpoints
│   │       ├── exercise-templates/ # Exercise template endpoints
│   │       └── routine-folders/  # Routine folder endpoints
│   ├── layout.tsx                # Root layout with HTML structure and fonts
│   ├── page.tsx                  # Home page with auth navigation
│   └── globals.css               # Global styles with Tailwind imports
├── components/                   # Reusable UI components
│   ├── auth/                     # Authentication components
│   │   ├── login-form.tsx        # Login form with validation
│   │   └── signup-form.tsx       # Signup form with user profile
│   ├── ui/                       # Shadcn/ui components
│   └── test-*/                   # API testing components
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase client utilities
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   ├── middleware.ts         # Session management
│   │   └── types.ts              # Auth types
│   ├── hevy/                     # Hevy API integration
│   │   ├── client.ts             # HTTP client (proxied)
│   │   ├── services/             # API service layer
│   │   └── types/                # TypeScript definitions
│   └── analysis/                 # Workout analysis tools
├── generated/prisma/             # Generated Prisma client
├── middleware.ts                 # Next.js middleware for auth
└── types/                        # Shared TypeScript types
```

### Key Architectural Decisions
1. **App Router**: Using Next.js App Router (not Pages Router) - all routes go in `src/app/`
2. **Server Components**: Components are Server Components by default. Use `"use client"` directive for client components
3. **Path Aliases**: Use `@/` to import from `src/` directory
4. **Fonts**: Geist Sans and Geist Mono fonts are configured via `next/font`
5. **Tailwind v4**: Using the new PostCSS-based Tailwind configuration (no config file needed)
6. **Authentication**: Server-side session management with middleware for all routes
7. **Database**: Prisma ORM with Supabase PostgreSQL, generated client in `src/generated/prisma`
8. **Security**: All API keys server-side only, proxy architecture for external APIs

## Development Guidelines

### File Conventions
- Routes: Create folders in `src/app/` for new routes
- Components: Place reusable components in `src/components/`
- API Routes: Create `route.ts` files in `src/app/api/` directories
- Types: Create a `src/types/` directory for shared TypeScript types

### TypeScript Configuration
- Strict mode is enabled
- Path alias `@/*` maps to `./src/*`
- Use proper type annotations for all functions and components

### Styling Approach
- Tailwind CSS utilities for styling
- CSS variables for theming (already configured for light/dark mode)
- Global styles in `src/app/globals.css`

## Important Notes

1. **Turbopack**: Development server uses Turbopack for faster builds
2. **No Test Setup**: No testing framework is currently configured
3. **Environment Variables**: Use `.env.local` for local environment variables
4. **Required Environment Variables**:
   - `OPENAI_API_KEY` - For GPT-4 integration (server-side only)
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Supabase publishable key (replaces anon key)
   - `SUPABASE_SECRET_KEY` - Supabase secret key (server-side only)
   - `HEVY_API_KEY` - Hevy API key for workout data integration (server-side only, DO NOT prefix with NEXT_PUBLIC_)
   - `DATABASE_URL` - PostgreSQL connection string for Prisma (pooled)
   - `DIRECT_URL` - PostgreSQL direct connection string for migrations

## Database Schema

The application uses PostgreSQL via Supabase with the following tables:

### Core Tables

#### `user_profiles`
- **Purpose**: Extends Supabase auth.users with fitness-specific data
- **Key Fields**: `userId` (FK to auth.users), `age`, `weight`, `trainingFrequency`, `focusAreas[]`, `injuries[]`, `experienceLevel`
- **Relations**: One-to-many with workouts, routines, and analyses

#### `imported_workouts`
- **Purpose**: Stores workout data imported from Hevy API
- **Key Fields**: `hevyWorkoutId` (unique), `workoutData` (JSONB), `performedAt`, `name`
- **Relations**: Belongs to user_profiles via `userId`

#### `generated_routines`
- **Purpose**: AI-generated workout routines for users
- **Key Fields**: `routineData` (JSONB), `aiContext` (JSONB), `hevyRoutineId`, `exportedToHevy`
- **Relations**: Belongs to user_profiles via `userId`

#### `training_analyses`
- **Purpose**: Stores workout analysis results from the simplified analyzer
- **Key Fields**: `analysisData` (JSONB), `periodStart`, `periodEnd`
- **Relations**: Belongs to user_profiles via `userId`

### Schema Management
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name description

# Reset database (development only)
npx prisma migrate reset
```

## API Integrations

### Hevy API - Complete Endpoint Documentation

#### Important API Limitations
- **Maximum pageSize for workouts**: 10 (this is a hard limit from the Hevy API)
- When fetching workouts, always use `pageSize: 10` or less

#### Workout Endpoints (6 endpoints)
- `GET /v1/workouts` - Get paginated list of workouts (max pageSize: 10)
- `GET /v1/workouts/count` - Get total workout count
- `GET /v1/workouts/events` - Get workout events with date filtering
- `GET /v1/workouts/{workoutId}` - Get single workout by ID
- `POST /v1/workouts` - Create new workout
- `PUT /v1/workouts/{workoutId}` - Update existing workout

#### Routine Endpoints (4 endpoints)
- `GET /v1/routines` - Get paginated list of routines
- `GET /v1/routines/{routineId}` - Get single routine by ID
- `POST /v1/routines` - Create new routine
- `PUT /v1/routines/{routineId}` - Update existing routine

#### Exercise Template Endpoints (2 endpoints)
- `GET /v1/exercise_templates` - Get paginated list of exercise templates
- `GET /v1/exercise_templates/{exerciseTemplateId}` - Get single exercise template by ID

#### Routine Folder Endpoints (3 endpoints)
- `GET /v1/routine_folders` - Get paginated list of routine folders
- `GET /v1/routine_folders/{folderId}` - Get single routine folder by ID
- `POST /v1/routine_folders` - Create new routine folder

### Available Services
All services are available via `import { serviceName } from '@/lib/hevy'`:

1. **workoutService** - Complete workout management with CRUD operations
2. **routineService** - Complete routine management with CRUD operations
3. **exerciseTemplateService** - Read-only exercise template access
4. **routineFolderService** - Routine folder management

### OpenAI Integration
- GPT-4 for workout generation
- Structured prompts for fitness programming
- JSON response parsing for routine creation

## Common Tasks

### Adding a New Page
Create a new folder in `src/app/` with a `page.tsx` file:
```typescript
// src/app/example/page.tsx
export default function ExamplePage() {
  return <div>Example Page</div>
}
```

### Adding an API Route
Create a `route.ts` file in the appropriate directory:
```typescript
// src/app/api/example/route.ts
export async function GET() {
  return Response.json({ message: 'Hello' })
}
```

### Using Client Components
Add the `"use client"` directive for interactive components:
```typescript
"use client"
export default function InteractiveComponent() {
  // Can use hooks, event handlers, etc.
}
```

### Database Operations with Prisma
```typescript
// Import Prisma client
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

// Example: Create user profile
await prisma.userProfile.create({
  data: {
    userId: user.id,
    age: 25,
    weight: 70,
    trainingFrequency: 4,
    experienceLevel: 'intermediate'
  }
})
```

### Authentication with Supabase
```typescript
// Browser client
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// Server client (for API routes and Server Components)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Check authentication
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth/login')
```

### Integrating with OpenAI
```typescript
// src/lib/openai.ts
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateWorkout(userProfile: UserProfile, workoutHistory: WorkoutHistory[]) {
  // Implementation for workout generation
}
```