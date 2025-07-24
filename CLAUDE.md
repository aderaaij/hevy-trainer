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
npm run dev        # Start development server with Turbopack at http://localhost:3000

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
- **UI Components**: Shadcn/ui (Radix primitives + Tailwind CSS) - to be installed
- **Styling**: Tailwind CSS v4 (CSS-based configuration)
- **Forms**: React Hook Form + Zod validation - to be installed
- **State Management**: Zustand or Context API - to be implemented
- **HTTP Client**: Axios for API calls - to be installed

#### Backend
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL + Auth + Realtime) - to be configured
- **ORM**: Prisma with Supabase - to be installed
- **Authentication**: Supabase Auth
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
└── app/              # Next.js App Router pages and layouts
    ├── layout.tsx    # Root layout with HTML structure and fonts
    ├── page.tsx      # Home page component
    └── globals.css   # Global styles with Tailwind imports
```

### Key Architectural Decisions
1. **App Router**: Using Next.js App Router (not Pages Router) - all routes go in `src/app/`
2. **Server Components**: Components are Server Components by default. Use `"use client"` directive for client components
3. **Path Aliases**: Use `@/` to import from `src/` directory
4. **Fonts**: Geist Sans and Geist Mono fonts are configured via `next/font`
5. **Tailwind v4**: Using the new PostCSS-based Tailwind configuration (no config file needed)

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
3. **Environment Variables**: Use `.env.local` for local environment variables (create if needed)
4. **Required Environment Variables**:
   - `OPENAI_API_KEY` - For GPT-4 integration
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
   - `NEXT_PUBLIC_HEVY_API_KEY` - Hevy API key for workout data integration

## API Integrations

### Hevy API - Complete Endpoint Documentation

#### Workout Endpoints (6 endpoints)
- `GET /v1/workouts` - Get paginated list of workouts
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

### Setting up Supabase Client
```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
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