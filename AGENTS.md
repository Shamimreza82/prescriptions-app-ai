# PresManage App — Agent Guide

## Tech Stack
- **Backend:** Express.js + TypeScript, Prisma ORM + PostgreSQL, JWT auth (access + refresh tokens)
- **Frontend:** Next.js 16 (App Router) + TypeScript, React 19, Tailwind CSS, React Query (TanStack), react-hook-form + zod

## Project Structure
```
backend/
  prisma/
    schema.prisma             # Database schema, enums, models (snake_case table/field names via @@map/@map)
    seed.ts                   # Seeds default users (admin + doctor) + plans (Free, Basic, Premium)
  src/
    server.ts                 # Entry point
    app.ts                    # Express app setup + route mounting
    config/
      database.ts             # Prisma client singleton
      env.ts                  # Env vars (JWT, DB, Stripe, etc.)
    middlewares/
      auth.ts                 # authenticate, authorize (role-based)
      errorHandler.ts         # AppError handler + 404
      upload.ts               # Multer file upload config
      validate.ts             # Zod validation middleware (validateBody, validateQuery)
    modules/
      auth/                   # Login, register, refresh, change-password
      doctor/                 # Profile, subscription mgmt (activate, pending, confirm, reject, cancel)
      patient/
      prescription/
      appointment/
      notification/
      plan/                   # Plan CRUD (admin creates/edits/deletes plans)
      subscription/           # Dashboard stats, admin subscription listing
      mr/                     # Medical representative management
    types/
      express.ts              # AuthPayload, AuthRequest
    utils/
      apiResponse.ts          # sendSuccess, sendPaginated, sendError
      errors.ts               # AppError class + factory functions (notFound, badRequest, unauthorized, forbidden)
      jwt.ts                  # signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken
      pagination.ts           # getPaginationParams (supports search, status, planId)
      password.ts             # hashPassword, comparePassword
frontend/
  src/
    app/                      # Next.js App Router pages
      (dashboard)/            # Authenticated layout (sidebar + header)
        layout.tsx            # Dashboard layout with auth guard
        page.tsx              # Role-based redirect (/admin or /doctor)
        dashboard/
          admin/              # Super admin pages
            page.tsx          # Overview stats (pending subs count)
            doctors/page.tsx
            patients/page.tsx
            users/page.tsx
            medical-reps/page.tsx
            plans/page.tsx           # CRUD subscription plans
            subscriptions/page.tsx           # All subscriptions + cancel + status/plan filters
            subscriptions/pending/page.tsx   # Pending subscriptions with confirm/reject
            logs/page.tsx
          doctor/
            page.tsx          # Doctor dashboard
            settings/plans/page.tsx              # View + subscribe to plans (trans ID + notes modal)
            settings/change-password/page.tsx    # Change password with eye toggle
          mr/
            page.tsx
            doctors/page.tsx          # Table view of assigned doctors
            doctors/[id]/prescriptions/page.tsx
      auth/
        login/page.tsx
        register/page.tsx
    components/
      ui/                     # button, input, table, badge, pagination, dialog, confirm-dialog, filter-select, etc.
      layout/                 # sidebar.tsx (nested menus for Settings, Subscriptions), header.tsx
      admin/                  # DataTable.tsx (SearchBar only)
    features/
      plans/                  # Plan CRUD + subscription activation + pending + confirm/reject/cancel
        api.ts / hooks.ts / types.ts
      dashboard/              # Admin/doctor dashboard stats
      auth/ / doctor/ / patient/ / prescription/ / appointment/ / mr/
    lib/
      axios.ts                # Axios instance with token interceptor + refresh queue
      utils.ts                # cn(), formatDate(), localStorage helpers
    providers/
      theme-provider.tsx      # Theme context
      query-provider.tsx      # React Query client
    hooks/
      useAuth.ts              # useAuthGuard, useCurrentUser
```

## Backend Module Architecture
Each feature module follows a strict layered pattern:
```
route.ts → controller.ts → service.ts → repository.ts
```

### Route Pattern
```ts
import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import * as controller from './controller';
import { someSchema } from './validation';

const router = Router();
router.use(authenticate);  // Protect all routes

router.get('/public-endpoint', controller.handlerName);
router.get('/admin-only', authorize('SUPER_ADMIN'), controller.handlerName);
router.post('/create', validateBody(someSchema), controller.handlerName);

export default router;
```

### Controller Pattern
```ts
import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../types/express';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import * as service from './service';

export const handlerName = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await service.doSomething(req.user!.userId, req.body);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
```

### Service Pattern
```ts
import { notFound } from '../../utils/errors';
import * as repo from './repository';

export const doSomething = async (id: string, input: InputType) => {
  const entity = await repo.findById(id);
  if (!entity) throw notFound('Entity not found');
  return repo.update(id, input);
};
```

### Response Helpers
- `sendSuccess(res, data, status=200)` → `{ success: true, data }`
- `sendPaginated(res, data[], total, page, limit)` → `{ data, page, limit, total, totalPages }`
- `sendError(res, message, status=400)` → `{ success: false, message }`

### Error Factory Functions
- `notFound(msg?)` → 404
- `badRequest(msg)` → 400
- `unauthorized(msg?)` → 401
- `forbidden(msg?)` → 403
- All return `new AppError(message, statusCode)`

### Auth Types
```ts
// backend/src/types/express.ts
interface AuthPayload { userId: string; email: string; role: string; doctorId?: string; mrId?: string; }
type AuthRequest = Request & { user?: AuthPayload };
```

## Frontend Feature Module Architecture
Each feature module follows a consistent pattern:
```
types.ts → schema.ts → api.ts → hooks.ts → components/
```

### API Layer (api.ts)
```ts
import { api } from '@/lib/axios';

// Non-paginated: strip success/data envelope
export const getX = () =>
  api.get<{ success: boolean; data: XData }>('/url').then((r) => r.data.data);

// Paginated: return full shape
export const getXList = (params?: { page?: number; limit?: number; search?: string }) =>
  api.get('/url', { params }).then((r) => r.data);
```

### React Query Hooks (hooks.ts)
```ts
import { useQuery, useMutation } from '@tanstack/react-query';
import * as api from './api';

export const keys = { list: ['feature', 'list'] as const };

// Query with params
export const useXList = (params?: { page?: number; search?: string }) =>
  useQuery({
    queryKey: [...keys.list, params],
    queryFn: () => api.getXList(params),
  });

// Mutation
export const useCreateX = () =>
  useMutation({
    mutationFn: api.createX,
    onSuccess: (data) => {
      toast.success('Created');
      // invalidate queries
    },
    onError: (err) => toast.error(err.message),
  });
```

### Form Pattern
```ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
type Form = z.infer<typeof schema>;

const { register, handleSubmit, setValue, formState: { errors } } = useForm<Form>({
  resolver: zodResolver(schema),
});
```

### Auth Guard
```ts
// In layout: call at top
useAuthGuard();  // Redirects to /auth/login if no token in localStorage
```

### Axios Instance (`@/lib/axios`)
- Request interceptor: injects `Authorization: Bearer <token>` from localStorage
- Response interceptor: on 401, attempts token refresh via `/auth/refresh-token`, queues failed requests, retries after refresh
- On refresh failure: clears localStorage, redirects to `/auth/login`

### LocalStorage Helpers (`@/lib/utils`)
- `getUser()` / `setUser(user)` — persists user object
- `getAuthToken()` / `getRefreshToken()` — JWT tokens
- `setTokens(access, refresh)` / `clearTokens()` — token management
- `getUser()` has SSR guard (`typeof window === 'undefined'`)

### Pagination
- Backend returns `{ data, page, limit, total, totalPages }`
- Frontend uses `@/components/ui/pagination` with props:
  ```tsx
  <Pagination page={page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
  ```

### Styling (Tailwind)
- Custom classes: `premium-card-static`, `gradient-primary`, `gradient-success`, `gradient-warning`, `gradient-info`, `text-gradient`, `glass-strong`, `premium-input`, `shadow-glow`
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Dark mode via `dark:` prefix and `theme-provider.tsx`

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `admin@presmanage.com` | `admin123` |
| **Doctor** | `doctor@example.com` | `doctor123` |
| **Medical Representative** | `mr@example.com` | `mr123` |
| **Receptionist** | `receptionist@example.com` | `rec123` |
- **Assigned to:** Dr. John Doe (seeded doctor)
- **Dashboard:** `/dashboard/mr`
- **Permissions:** View-only — can see assigned doctors' prescriptions and patients
- **Sidebar routes:**
  - `/dashboard/admin` — overview stats
  - `/dashboard/admin/doctors` — manage doctors
  - `/dashboard/admin/patients` — all patients
  - `/dashboard/admin/users` — manage users
  - `/dashboard/admin/medical-reps` — manage MRs + assign doctors
  - `/dashboard/admin/plans` — CRUD subscription plans
  - `/dashboard/admin/subscriptions` — all subscriptions (with status/plan filters + cancel)
  - `/dashboard/admin/subscriptions/pending` — pending subscriptions (verify trans ID, confirm/reject)
  - `/dashboard/admin/logs` — activity audit logs

## Doctor Dashboard Settings
- **Plans:** `/dashboard/doctor/settings/plans` — view plans, subscribe (trans ID + notes modal), see pending/active status
- **Change Password:** `/dashboard/doctor/settings/change-password` — update password with eye toggle

## Database Models (Prisma)
- **User** — `id, email, password, role (SUPER_ADMIN|DOCTOR|RECEPTIONIST|MEDICAL_REPRESENTATIVE), isActive, isVerified, refreshToken`
- **Doctor** — `id, userId (unique), fullName, degree, specialization, bmdcRegNo, clinicName, clinicAddress, phone, signatureImg, clinicLogo, chamberSchedule, isProfileComplete`
- **Patient** — `id, patientId (unique), doctorId, fullName, age, gender, bloodGroup, weight, height, phone, address`
- **Prescription** — `id, prescriptionNo (unique), doctorId, patientId, symptoms, diagnosis, medicines[], investigations[]`
- **Appointment** — `id, doctorId, patientId, date, time, status (SCHEDULED|COMPLETED|CANCELLED|NO_SHOW)`
- **Subscription** — `id, doctorId (unique), planId, status (PENDING|ACTIVE|EXPIRED|CANCELLED), patientLimit, prescriptionLimit, startDate, endDate`
- **Plan** — `id, name (unique), description, price, patientLimit, prescriptionLimit, duration, isActive`
- **Payment** — `id, subscriptionId, amount, currency, status, paymentMethod, transactionId, notes`
- **AuditLog** — `id, userId, action, entity, entityId, details, ipAddress, createdAt`
- **Notification** — `id, userId, title, message, type, isRead`
- **Mr** — `id, userId (unique), fullName, phone`
- **DoctorMrAssignment** — `id, doctorId, mrId (unique pair)`

## Common Commands
```bash
npm run dev                 # Start both backend + frontend
npm run dev:backend         # Backend only (port 5000)
npm run dev:frontend        # Frontend only (port 3000)
cd backend && npx prisma db push   # Sync schema to DB
cd backend && npm run prisma:seed  # Seed demo data
cd backend && npx tsc --noEmit     # Type-check backend
cd frontend && npx tsc --noEmit    # Type-check frontend
```

## Environment Variables
- `backend/.env` — `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN` (default `15m`), `JWT_REFRESH_EXPIRES_IN` (default `7d`), `PORT` (default `5000`), `FRONTEND_URL`
- `frontend/.env.local` — `NEXT_PUBLIC_API_URL` (default `http://localhost:5000/api`)

## Key Conventions Summary
| Area | Convention |
|---|---|
| **Backend route exports** | `export default router` |
| **Controller exports** | Named functions (`export const handler = async (...) =>`) |
| **Importing controllers** | `import * as controller from './controller'` |
| **Error handling** | `try/catch` → `next(error)` in every controller handler |
| **Auth on routes** | `router.use(authenticate)` at top, `authorize('ROLE')` per-route |
| **Validation** | `validateBody(schema)` / `validateQuery(schema)` — higher-order middleware |
| **Frontend API calls** | `api.get<T>(url).then(r => r.data)` |
| **Query key factory** | Named constant with `as const` tuples |
| **Query with params** | `queryKey: [...keys.list, params]` |
| **Pagination component** | Controlled: `page, totalPages, total, onPageChange` |
| **Data fetching pattern** | `useQuery + api.ts` for reads, `useMutation + api.ts` for writes |
| **ConfirmDialog** | Reusable: `<ConfirmDialog open title message confirmLabel variant loading onConfirm />` in `@/components/ui/confirm-dialog` |
| **FilterSelect** | Reusable: `<FilterSelect value onChange options placeholder />` in `@/components/ui/filter-select` |
| **Sidebar nested menus** | Parent items with `children: [{ href, label, icon }]` render collapsible submenus |
| **Subscription flow** | Doctor subscribes → `PENDING` (paid) / `ACTIVE` (free) → Admin verifies trans ID → confirms → `ACTIVE` |
| **Plan schema** | All tables/fields use snake_case via `@@map` / `@map` in Prisma schema |
