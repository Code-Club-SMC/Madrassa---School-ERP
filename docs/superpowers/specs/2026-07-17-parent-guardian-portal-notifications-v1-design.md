# Parent/Guardian Portal and Notifications V1 Design

## Scope

Build the first production-backed parent/guardian surface and notification event log. V1 replaces mock parent/notification pages with real PostgreSQL-backed data while keeping the feature operationally small.

Included:
- Parent portal for authenticated `parent` users based on `guardians.user_id`.
- Staff/admin parent-management view for guardian account retry/link visibility.
- Linked student cards with enrollment, primary guardian, fee summary, attendance summary, published exam results, and latest timeline events.
- Notification event records that can be listed, marked read, and connected to student timeline events.
- Admin notification dashboard that shows system-wide notification events.
- Parent account retry remains admin-triggered from existing student guardian APIs.

Not included:
- Real SMS/WhatsApp/email provider delivery.
- Payment links or online payment collection.
- Parent chat/messaging.
- Parent self-service profile edits.
- Public unauthenticated guardian access.

## Architecture

Add a dedicated `notifications` database table for delivery-independent notification events. It stores event category, target audience, optional student/guardian/user references, channel, status, title/body, metadata, read state, and timestamps. This is the notification foundation; SMS/WhatsApp delivery can attach to these rows in V2.

Add server modules under `src/lib/server/notifications` and `src/lib/server/guardians`. Notification APIs use staff permissions for global views and ownership checks for parent views. Guardian portal APIs allow parent users to read only students linked to their guardian record.

Frontend uses existing TanStack Query, shadcn/Radix UI primitives, and app layout conventions. The parent portal remains a work-focused dashboard, not a marketing page.

## Data Flow

Parent login:
1. Better Auth authenticates a `parent` user.
2. Auth guard allows parent users into the authenticated layout.
3. Parent default surface is `/parents`.
4. `/api/parents/me/dashboard` resolves guardian rows where `guardians.user_id` equals the current user id.
5. The service loads linked students, enrollments, fee ledgers, attendance summary, published exam results, student timeline events, and notification events.

Staff notification view:
1. Staff opens `/notifications`.
2. `/api/notifications` returns recent notification events if the actor has dashboard/finance/admission/report access.
3. Staff can mark notification events read.

## Error Handling

Parent APIs return `401` when unauthenticated, `403` when a non-parent attempts parent-only ownership access, and `404` when no guardian profile is linked. Parent account creation failures are not fatal to admissions; they continue to be recorded through student timeline events and surfaced in the portal/admin views.

## Testing

Add focused domain tests for notification event target visibility and read-state transitions. Verify with:
- `bun test src/lib/server/notifications/domain.test.ts`
- `bun run lint`
- `bun run build`
- `bun run db:generate`
- `bun run db:migrate` against local Postgres

