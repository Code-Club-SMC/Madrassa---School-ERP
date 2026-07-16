# Student Profile Operational Timeline Design

## Purpose

Student creation remains admission-driven only. The student profile becomes the operational place to understand and manage a student's lifecycle after admission. The Activity tab should show a production-ready timeline of every meaningful event that happened to the student, including admission, parent account creation, guardians, siblings, enrollment moves, status changes, and identity updates.

## Current Context

The backend already has `student_events` and `admission_events`. Student profile currently returns up to 50 raw student events plus the accepted admission application, but the UI renders them as basic cards. Existing event metadata often stores only IDs, which is not enough for a readable audit trail. Admission acceptance currently creates the parent Better Auth account before the student transaction, and parent account creation failure blocks admission acceptance.

## Recommended Approach

Use an operational timeline:

- Keep admissions as the only source of truth for creating students.
- Do not add any direct student creation entry point.
- Record durable, readable student events for all important student lifecycle changes.
- Treat parent account creation as best-effort during admission acceptance: the student admission succeeds even if Better Auth account creation fails.
- Show parent account failure as a visible warning event on the student timeline, with enough context for staff to retry later.
- Keep profile actions close to the timeline, but make them modify existing records only: status, enrollment, guardian, and sibling relationships.

## Event Contract

`student_events` remains the student timeline source. Use the existing columns where possible:

- `type`: stable machine-readable event name.
- `message`: human-readable summary.
- `metadata`: structured details used by the UI.
- `actorUserId`: staff user that initiated the action, when available.
- `createdAt`: event time.

Expected event types:

- `admission_accepted`
- `parent_account_created`
- `parent_account_failed`
- `student_updated`
- `status_changed`
- `guardian_linked`
- `guardian_updated`
- `sibling_linked`
- `sibling_removed`
- `enrollment_moved`

Metadata should prefer readable values over bare IDs. For example, `enrollment_moved` should include from/to institution, program, class/subcategory, section, darja, and reason. `status_changed` should include previous and next status. Guardian and sibling events should include names, relation, and roll number when available.

## Admission Acceptance Behavior

Acceptance should create the student, active enrollment, guardian link, sibling links, and student events inside one database transaction. Parent account creation should run in a controlled best-effort path:

- If account creation succeeds, link the Better Auth user to the guardian and create `parent_account_created`.
- If account creation fails, keep the accepted student and guardian link, create `parent_account_failed`, and return a warning in the API response.
- The API response should distinguish successful admission from account warning so the queue UI can show a warning toast instead of a failure toast.
- Existing hard validation still applies: if staff explicitly requests a parent account, a usable parent email is required before attempting acceptance.

## Timeline UI

The Activity tab should become a timeline, not a raw event list. It should group events by date, show newest first, and provide filters for `All`, `Admission`, `Academic`, `Guardian`, `Sibling`, `Account`, and `Status`.

```text
Today
│
├─ ●  Admission Accepted                         Success
│   Roll QA-0012 · Admission AD-0041
│   Accepted by Abdul Rehman · 10:14 AM
│   Al-Qasim Academy -> Class 4 -> Section A
│
├─ ▲  Parent Account Failed                      Warning
│   Parent login could not be created
│   Email: parent@example.com
│   Reason: A user account already exists for this email
│   [Retry Parent Account]
│
└─ ●  Guardian Linked                            Guardian
    Father: Muhammad Ahmed
    CNIC 35202-xxxxxxx-x · Phone 03xx-xxxxxxx
```

Each timeline row should include an icon, category badge, timestamp, actor label, concise message, and expandable details when metadata is large. Warning events should be visually distinct without blocking the page.

## Profile Actions

Student profile actions should update existing student records only:

- Change student status with required reason for non-active statuses.
- Move current enrollment with a required reason and target validation.
- Link or remove siblings.
- Link or update guardians.
- Retry parent account creation from an account warning event, if a guardian has no linked Better Auth user.

No action should bypass admissions to create a student.

## Permissions

Use existing student module permissions:

- School profile actions require `school_students`.
- Madrassa profile actions require `madrassa_students`.
- Admission acceptance remains under admission queue approval permissions.
- Account retry should require the same edit permission used for profile operations and must not expose generated passwords except in the existing one-time credentials overlay pattern.

## Institution Rules

The design must preserve the current institution model:

- Al-Qasim Academy is a standalone school system and may scale beyond the current classes.
- Jamia Zainab school support is a nested support program and must not exceed Class 5.
- Jamia Qasmia is the boys madrassa.
- Jamia Zainab is the girls madrassa.
- Sibling links can cross school and madrassa systems when the family relationship is valid.

## Error Handling

Admission acceptance should fail only for core admission failures: invalid target, duplicate numbering conflict, missing required data, permission failure, or database transaction failure. Parent account creation failure should not roll back the admission. The timeline should record the failure and the API should return a warning payload.

Timeline rendering should tolerate old sparse events. If metadata is missing, the UI should fall back to `message` and formatted `type`.

## Testing And Verification

Verify:

- Accepting an admission without parent account creation creates student, enrollment, guardian, sibling links, and `admission_accepted`.
- Accepting with successful parent account creation links the guardian user and logs `parent_account_created`.
- Accepting with failed parent account creation still accepts admission and logs `parent_account_failed`.
- Student profile timeline groups and filters event categories correctly.
- Existing sparse events still render safely.
- `bun run lint` passes.
- `bun run build` passes.

Do not start the dev server during implementation unless explicitly requested.
