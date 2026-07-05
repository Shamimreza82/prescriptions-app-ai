# AGENTS.md

## Project Overview

Prescriptions App - A doctor prescription management system with AI capabilities.

## Tech Stack

### Frontend
- Next.js 16, React 19, TypeScript
- Tailwind CSS + tailwindcss-animate
- Radix UI components
- TanStack React Query
- React Hook Form + Zod validation
- Lucide React icons
- Sentry for error tracking
- Recharts for charts
- Sonner for toasts

### Backend
- Express.js + TypeScript
- Prisma ORM
- PostgreSQL (via Prisma)
- JWT authentication
- Multer for file uploads
- PDFKit for PDF generation
- Winston for logging
- Sentry for error tracking
- Zod for validation

## Commands

### Development
```bash
npm run dev              # Run both frontend and backend concurrently
npm run dev:frontend     # Frontend only (Next.js)
npm run dev:backend      # Backend only (Express)
```

### Build
```bash
npm run build            # Build both frontend and backend
```

### Type Checking
```bash
npm run typecheck        # Typecheck both frontend and backend
```

### Linting
```bash
cd frontend && npm run lint
```

### Database
```bash
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes to database
npm run db:seed          # Seed the database
```

## Project Structure

```
/
├── frontend/            # Next.js frontend
│   └── src/
│       ├── app/         # Next.js app router pages
│       ├── components/  # Shared components
│       ├── contexts/    # React contexts
│       ├── features/    # Feature-specific code
│       ├── hooks/       # Custom hooks
│       ├── lib/         # Utilities
│       ├── providers/   # Provider components
│       └── types/       # TypeScript types
├── backend/             # Express API
│   ├── src/
│   │   ├── config/      # Configuration
│   │   ├── middlewares/ # Express middlewares
│   │   ├── modules/     # Feature modules
│   │   ├── types/       # TypeScript types
│   │   └── utils/       # Utilities
│   └── prisma/          # Prisma schema & migrations
└── docker-compose.yml   # Docker configuration
```

## Code Conventions

- Use TypeScript strict mode
- Follow existing code style and patterns
- Use optional chaining for nullable properties
- Prefer explicit types over `any`
- Use existing UI component patterns (Radix + Tailwind)
- API routes follow RESTful conventions
- Use Zod for validation on both frontend and backend
