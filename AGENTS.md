# AGENTS.md

## Project Overview

Prescriptions App - A doctor prescription management system with AI capabilities.

## Tech Stack

### Frontend
- Next.js 16, React 19, TypeScript
- Tailwind CSS + tailwindcss-animate
- Radix UI (Dialog, DropdownMenu, Select, Label, Slot)
- TanStack React Query + Devtools
- React Hook Form + Zod validation (@hookform/resolvers)
- Axios HTTP client
- Lucide React icons
- Recharts for charts
- Sonner for toasts
- date-fns for date handling
- qrcode for QR generation
- class-variance-authority + tailwind-merge + clsx (UI utilities)

### Backend
- Express.js + TypeScript
- Prisma ORM (v6)
- PostgreSQL (via Prisma)
- JWT authentication (access + refresh tokens)
- Zod validation
- Multer for file uploads
- PDFKit for PDF generation (+ QR codes)
- Winston + winston-daily-rotate-file for logging
- bcryptjs for password hashing
- helmet + hpp + cors for security
- express-rate-limit for rate limiting
- uuid for ID generation
- dotenv for env config

## Commands

### Development
```bash
npm run dev              # Run both frontend and backend concurrently
npm run dev:frontend     # Frontend only (Next.js)
npm run dev:backend      # Backend only (Express + ts-node-dev hot reload)
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
npm run db:push          # Push schema to DB (non-destructive)
npm run db:migrate       # Run Prisma migrations (dev)
npm run db:seed          # Seed the database
```

### Backend (standalone)
```bash
npm run start            # Start production backend (compiled JS)
npm run prisma:generate  # Generate Prisma client (backend scope)
npm run prisma:push      # Push schema (backend scope)
npm run prisma:migrate   # Run migrations (backend scope)
npm run prisma:seed      # Run seed (backend scope)
npm run backup:db        # Run DB backup script
npm run docker:build     # Build Docker images
npm run docker:up        # Start Docker containers
npm run docker:down      # Stop Docker containers
```

### Deploy (PM2 + Nginx)
```bash
bash deploy.sh              # Full deploy (pull, build, restart)
pm2 status                  # Check process status
pm2 logs pres-api           # View backend logs
pm2 logs pres-frontend      # View frontend logs
```

### CI/CD (GitHub Actions)
- `.github/workflows/ci.yml` — Typecheck + lint + build on every push/PR
- `.github/workflows/deploy.yml` — Auto-deploy to VPS on push to `main`

**Required GitHub Secrets:**
| Secret | Description |
|--------|-------------|
| `VPS_HOST` | VPS IP or domain |
| `VPS_USER` | SSH username |
| `VPS_SSH_KEY` | Private SSH key |

Prisma generate runs inside `deploy.sh` — no separate DB in CI needed.

## Project Structure

```
/
├── frontend/                # Next.js frontend
│   └── src/
│       ├── app/             # App router pages
│       │   ├── (dashboard)/ # Role-based dashboards (admin/doctor/mr/receptionist)
│       │   └── auth/        # Login / Register
│       ├── components/      # Shared components
│       │   ├── admin/       # Admin-specific components
│       │   ├── layout/      # Header, Sidebar
│       │   └── ui/          # Button, Card, Table, Dialog, etc.
│       ├── contexts/        # React contexts (sidebar)
│       ├── features/        # Feature modules (auth, patients, prescriptions, etc.)
│       ├── hooks/           # Custom hooks (useAuth)
│       ├── lib/             # Axios instance, constants, utils
│       ├── providers/       # Query, Theme, Toast providers
│       └── types/           # TypeScript type definitions
├── backend/                 # Express API
│   ├── src/
│   │   ├── config/          # Env config, database (PrismaClient singleton)
│   │   ├── fonts/           # Noto Sans (Regular/Bold, Bengali variants) for PDFs
│   │   ├── middlewares/      # auth (JWT), errorHandler, upload (Multer), validate (Zod)
│   │   ├── modules/         # Feature modules (layered: route → controller → service → repository)
│   │   │   ├── admin/
│   │   │   ├── appointment/
│   │   │   ├── auth/
│   │   │   ├── doctor/
│   │   │   ├── mr/          # Medical Representative
│   │   │   ├── notification/
│   │   │   ├── patient/
│   │   │   ├── plan/
│   │   │   ├── prescription/
│   │   │   ├── receptionist/
│   │   │   └── subscription/
│   │   ├── types/           # Express type extensions (req.user)
│   │   └── utils/           # apiResponse, auditLogger, catchAsync, errors, jwt, logger, pagination, password
│   ├── prisma/              # Schema & migrations
│   ├── uploads/             # Uploaded files (signatures, logos, profile images)
│   ├── backups/             # DB backup files
│   └── scripts/             # Utility scripts (backup-db.sh)
```

## Database Models (Prisma)

10 models + 1 join table: User, Doctor, Receptionist, Mr, Patient, Prescription, Medicine, Investigation, Appointment, Plan, Subscription, Payment, Notification, AuditLog, DoctorMrAssignment.

Enums: UserRole, Gender, BloodGroup, AppointmentStatus, SubscriptionStatus.

## Code Conventions

- Use TypeScript strict mode
- Follow existing code style and patterns
- Use optional chaining for nullable properties
- Prefer explicit types over `any`
- Use existing UI component patterns (Radix + Tailwind + CVA)
- API routes follow RESTful conventions
- Use Zod for validation on both frontend and backend
- API response format: `{ success: true, data: ... }` or `{ success: false, message: "..." }`
- Each module follows: route → controller → service → repository layered architecture
