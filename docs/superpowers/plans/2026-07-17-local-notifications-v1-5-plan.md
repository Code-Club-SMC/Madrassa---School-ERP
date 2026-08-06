# Local Notifications V1.5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert notifications into a local-only in-app communication module with admin announcements and cleaner TanStack Query cache patterns.

**Architecture:** Keep `notification_events` as the single source. Add local visibility fields, local-only statuses, staff-created announcements, and query key factories. No provider integrations or outbound delivery abstractions are introduced.

**Tech Stack:** TanStack Start, TanStack Router file API routes, TanStack Query, React 19, TypeScript 7, Drizzle ORM, PostgreSQL, Better Auth, shadcn/Radix UI.

## Global Constraints

- Do not start the dev server unless explicitly requested.
- No SMS, WhatsApp, email, push, or third-party integration.
- Notifications remain local in PostgreSQL and the authenticated app UI.
- Parent access remains scoped by `guardians.user_id`.
- Use TanStack Query array keys and targeted invalidation.

---

### Task 1: Local Notification Schema and Domain

**Files:**

- Modify: `src/db/schema/notifications.ts`
- Modify: `src/lib/server/notifications/domain.ts`
- Modify: `src/lib/server/notifications/domain.test.ts`

**Interfaces:**

- Produces `NotificationStatus = "recorded" | "published" | "scheduled" | "archived"`.
- Produces `isNotificationVisibleNow(status, publishAt, expiresAt, now)`.

- [x] Add `source`, `publishAt`, and `expiresAt` fields to `notification_events`.
- [x] Restrict `NotificationChannel` TypeScript type to `"in_app"`.
- [x] Replace provider-shaped status values with local statuses.
- [x] Add visibility tests for scheduled, expired, archived, and visible notices.

### Task 2: Announcement Service and API

**Files:**

- Modify: `src/lib/server/notifications/service.ts`
- Modify: `src/routes/api/notifications/index.ts`

**Interfaces:**

- Produces `createLocalAnnouncement(request, input)`.
- Consumes `createAnnouncementSchema`.

- [x] Add create-announcement input schema with title, body, audience, category, publishAt, expiresAt.
- [x] Require authorized staff role or website-content edit permission for creation.
- [x] Insert local notification events with `source = "announcement"`.
- [x] Ensure listing excludes future scheduled, expired, and archived notices by default.
- [x] Add `POST /api/notifications`.

### Task 3: Query Key Factories

**Files:**

- Modify: `src/components/notifications/notification-api.ts`
- Modify: `src/components/parents/parent-api.ts`
- Modify: `src/components/notifications/notification-center.tsx`
- Modify: `src/components/parents/parent-portal.tsx`

**Interfaces:**

- Produces `notificationKeys` and `parentKeys`.

- [x] Add serializable query key factories.
- [x] Replace ad hoc query keys with factories.
- [x] Invalidate list/dashboard keys after notification mutations.

### Task 4: Local Announcement UI

**Files:**

- Modify: `src/components/notifications/notification-center.tsx`

**Interfaces:**

- Consumes `createLocalAnnouncement`.

- [x] Add staff-only “New Announcement” dialog.
- [x] Use local form state for title, body, audience, category, publish date, and expiry date.
- [x] On success, invalidate notification list keys and close the dialog.
- [x] Keep parent users read-only.

### Task 5: Migration and Verification

**Files:**

- Generate: `drizzle/*.sql`
- Modify: `src/routeTree.gen.ts` if route metadata changes.

- [x] Run `bun run db:generate`.
- [x] Review generated SQL for additive/local-notification changes.
- [x] Run `bun run db:migrate` against local Postgres.
- [x] Run `bun test src/lib/server/notifications/domain.test.ts`.
- [x] Run `bun run lint`.
- [x] Run `bun run build`.
