# Academic Setup Edit and Deactivate Actions Design

## Context

Admissions and student registry now depend on backend academic structures as the source of truth for placement. School classes, school sections, madrassa categories, and madrassa subcategories already have server-side `PATCH` endpoints with validation and active-enrollment protections. The missing piece is an operator-facing UI that lets admins correct setup records and deactivate records that should no longer be used for new admissions or enrollment moves.

## Goals

- Add edit actions for school classes, school sections, madrassa categories, and madrassa subcategories.
- Add quick deactivate/reactivate actions directly on each record.
- Require confirmation dialogs for deactivate/reactivate actions.
- Preserve historical records by never deleting academic setup entities.
- Keep inactive records visible with clear `Inactive` badges.
- Reuse existing backend validation and enrollment protection behavior.

## Non-Goals

- No hard delete support.
- No new academic setup schema changes.
- No new global academic settings page.
- No fees integration in this step.

## Recommended Approach

Add edit and quick active-state actions to the existing setup pages:

- `src/routes/_authenticated/school/classes.tsx`
- `src/routes/_authenticated/madrassa/categories.tsx`

This keeps the workflow close to where admins already create setup records. The current backend routes already map cleanly to these actions, so implementation can stay narrow and avoid new server contracts.

## UI Behavior

Each editable record will expose:

- `Edit`: opens a `ResponsiveDialog` with a form matching the existing create form fields.
- `Deactivate`: opens a confirmation dialog before sending `active: false`.
- `Reactivate`: opens a confirmation dialog before sending `active: true`.

Deactivate confirmation copy should explain that the record will stop being used for new admissions and enrollment moves while historical student data remains unchanged. Reactivate confirmation copy can be shorter but should still confirm intent.

Inactive records remain visible and receive an `Inactive` badge. Buttons and layout should stay consistent with existing shadcn/Radix UI patterns.

## Data Flow

The UI will call existing endpoints:

- `PATCH /api/academic/school/classes/:id`
- `PATCH /api/academic/school/classes/:id/sections/:sectionId`
- `PATCH /api/academic/madrassa/categories/:id`
- `PATCH /api/academic/madrassa/categories/:id/subcategories/:subcategoryId`

After a successful mutation, the page refreshes academic setup data and preserves the selected class/category when possible. Failed mutations surface the server message in a toast.

## Error Handling

If the backend blocks deactivation because active enrollments exist, the UI should show the existing server error without masking it. Validation errors should follow the same toast behavior used by current create flows.

## Verification

Run:

- `bunx tsc --noEmit --pretty false`
- `bun run lint`
- `bun run build`

Do not start the dev server for this task.
