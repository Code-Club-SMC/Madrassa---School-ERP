# Parent/Guardian Portal and Notifications V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock parent/notification pages with production-backed guardian dashboards and notification event logs.

**Architecture:** Add a delivery-independent `notifications` table and focused server services. Parent access is based on Better Auth user id matching `guardians.user_id`; staff views use existing permission checks.

**Tech Stack:** TanStack Start, TanStack Router file routes, TanStack Query, React 19, TypeScript 7, Drizzle ORM, PostgreSQL, Better Auth, shadcn/Radix UI.

## Global Constraints

- Do not start the dev server unless explicitly requested.
- Use `apply_patch` for source edits.
- Keep parent data access scoped to linked guardians/students.
- Keep V1 free of real SMS/WhatsApp/email delivery, parent chat, and payment links.
- Preserve direct student creation restrictions; student source of truth remains admissions.

---

### Task 1: Notification Data Model and Domain

**Files:**
- Create: `src/db/schema/notifications.ts`
- Modify: `src/db/index.ts`
- Create: `src/lib/server/notifications/domain.ts`
- Create: `src/lib/server/notifications/domain.test.ts`

**Interfaces:**
- Produces: `notificationEvents` Drizzle table.
- Produces: `canReadNotificationEvent(actor, event)` and `notificationReadPatchSchema`.

- [ ] Add notification event schema with `id`, `category`, `audience`, `studentId`, `guardianId`, `userId`, `channel`, `status`, `title`, `body`, `metadata`, `readAt`, `createdAt`, and `updatedAt`.
- [ ] Export the schema from `src/db/index.ts`.
- [ ] Add domain helpers that allow staff/system-wide reads and parent reads only when `event.userId` or `event.guardianId` matches the actor context.
- [ ] Test parent-owned, parent-unowned, and staff-visible cases.
- [ ] Run `bun test src/lib/server/notifications/domain.test.ts`.

### Task 2: Notification Service and API

**Files:**
- Create: `src/lib/server/notifications/service.ts`
- Create: `src/routes/api/notifications/index.ts`
- Create: `src/routes/api/notifications/$id/read.ts`

**Interfaces:**
- Consumes: `notificationEvents`.
- Produces: `listNotifications(request, query)`, `markNotificationRead(request, id, input)`.

- [ ] Add `listNotificationsQuerySchema` with `audience`, `category`, `status`, `read`, and `limit`.
- [ ] Implement staff listing with existing permission checks.
- [ ] Implement parent listing by resolving the current user's guardian ids.
- [ ] Implement read/unread patching with ownership checks.
- [ ] Add API routes that parse query/body, call the service, and use `json`/`errorResponse`.

### Task 3: Guardian Portal Service and API

**Files:**
- Create: `src/lib/server/guardians/service.ts`
- Create: `src/routes/api/parents/me/dashboard.ts`

**Interfaces:**
- Produces: `getMyGuardianDashboard(request)`.
- Produces response with `guardian`, `students`, `notifications`, and rollup `summary`.

- [ ] Resolve the current parent user through `getRequestUser`.
- [ ] Load guardian profiles linked by `guardians.user_id`.
- [ ] Load linked active students and enrollments.
- [ ] Load fee charges/payments/allocations/adjustments and summarize outstanding/paid values.
- [ ] Load current-month attendance totals from `student_attendance`.
- [ ] Load latest published exam results.
- [ ] Load latest student timeline events and notification events.
- [ ] Return empty-state-safe arrays and totals.

### Task 4: Parent and Notification Frontend

**Files:**
- Create: `src/components/parents/parent-api.ts`
- Create: `src/components/parents/parent-types.ts`
- Create: `src/components/parents/parent-portal.tsx`
- Create: `src/components/notifications/notification-api.ts`
- Create: `src/components/notifications/notification-types.ts`
- Create: `src/components/notifications/notification-center.tsx`
- Modify: `src/routes/_authenticated/parents.tsx`
- Modify: `src/routes/_authenticated/notifications.tsx`

**Interfaces:**
- Consumes: `/api/parents/me/dashboard`, `/api/notifications`, `/api/notifications/:id/read`.

- [ ] Replace mock parent route with `<ParentPortal />`.
- [ ] Replace mock notification route with `<NotificationCenter />`.
- [ ] Use TanStack Query array query keys.
- [ ] Show loading, error, empty, and success states.
- [ ] Keep UI dense, readable, and operational.

### Task 5: Parent Auth, Navigation, and Dashboard Routing

**Files:**
- Modify: `src/lib/route-guards.ts`
- Modify: `src/lib/nav-config.ts`
- Modify: `src/components/app/app-sidebar.tsx`
- Modify: `src/routes/login.tsx`
- Modify: `src/routes/_authenticated/dashboard.tsx`

**Interfaces:**
- Parent users can access `/parents`, `/notifications`, and `/dashboard`.
- Parent users are redirected away from staff-only routes.

- [ ] Allow `parent` role through authenticated layout.
- [ ] Redirect parent `/dashboard` to parent dashboard component or render parent portal summary.
- [ ] Add parent nav items only for parent-safe surfaces.
- [ ] Login redirects parent users to `/parents` when no explicit redirect exists.
- [ ] Hide staff system switcher for parent users.

### Task 6: Migration and Verification

**Files:**
- Generate: `drizzle/*.sql`
- Modify: `src/routeTree.gen.ts` through build/tooling.

- [ ] Run `bun run db:generate`.
- [ ] Review generated SQL for additive changes only.
- [ ] Run `bun run db:migrate` against reachable local Postgres.
- [ ] Run `bun test src/lib/server/notifications/domain.test.ts`.
- [ ] Run `bun run lint`.
- [ ] Run `bun run build`.

