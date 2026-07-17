# Teacher Management V1 Design

## Purpose

Teacher Management V1 gives admins a dedicated Teachers module while keeping authentication and permissions consistent. Teachers can be created from the Teachers screen, but the system must still create a Better Auth `user` with `role = "teacher"` internally. This avoids a split identity model while giving users a direct teacher-focused workflow.

## Scope

V1 includes:

- A separate `Add Teacher` form inside the Teachers module.
- Better Auth user creation behind that form with `role = "teacher"`.
- Teacher profile records linked one-to-one with auth users.
- Real teacher listing backed by database records, not mock data.
- Teacher profile view and edit flow.
- Activate/deactivate teacher profile with confirmation dialogs.
- Salary input fields for teacher compensation profile.
- Teacher assignment to school classes/sections, madrassa categories/subcategories, and exam subjects.
- Timetable periods for school and madrassa systems.
- Conflict checks so one teacher cannot be assigned to overlapping periods.
- Teacher self-service dashboard.
- Student attendance shortcuts for assigned classes/darja.

V1 excludes teacher/staff attendance, leave management, payroll processing, salary disbursement, payslip generation, performance reviews, and teacher messaging/SMS.

## Data Model

`user` remains the identity and login table. A new `teacher_profiles` table should reference `user.id` with a unique `user_id`, and store teacher-only operational fields:

- designation
- qualification
- joining date
- employment status
- gender
- address
- notes
- primary system scope
- base monthly salary
- bank name
- bank account or IBAN
- payment method
- salary effective date
- salary notes

Teaching assignments should be stored separately from the profile. Assignments must support:

- School: institution, program, class, section, subject, academic year.
- Madrassa: institution, program, category, subcategory/darja, subject, academic year.
- Active/inactive lifecycle.
- Effective from/to dates.

Timetable periods should reference the assigned teacher user/profile, academic placement, weekday, start time, end time, optional room/location, and optional subject.

## User Flow

The Teachers screen has an `Add Teacher` action. The form collects identity fields, account fields, teacher profile fields, and optional initial assignment fields. Submitting the form creates:

- a Better Auth user with `role = "teacher"`;
- a linked teacher profile;
- optional initial assignments;
- generated credentials shown once to the admin.

User Accounts still lists the teacher because the teacher is an auth user, but admins do not need to visit User Accounts to create one.

Selecting a teacher opens their profile, assignments, timetable, salary information, and account status. Profile edits do not create another identity.

## Rules

There must be no separate teacher auth table and no login path outside Better Auth. "Creating teacher identity outside User Accounts" means outside the User Accounts UI only.

Teacher deactivation should not delete users. It should mark the teacher profile and assignments inactive and disable login through the existing user account status/ban mechanism.

Assignments must respect existing institution/system boundaries:

- Jamia Qasmia is boys madrassa scope.
- Jamia Zainab is girls madrassa scope.
- Al-Qasim Academy is the standalone school scope.

Timetable conflicts must be rejected if the same teacher has overlapping active periods. Future checks can add room and class overlap protection.

Teachers may mark student attendance only for assigned classes/sections or madrassa darja/subcategories, and only when their permissions allow attendance marking. Teacher/staff attendance is not part of this V1.

## UI Design

Use existing route-folder patterns and keep route files thin. The main teacher workspace should include:

- Overview
- Assignments
- Timetable
- Salary Info
- Account

Confirmation dialogs are required for destructive or state-changing actions such as deactivate, remove assignment, and disable timetable period.

Use the existing reusable responsive dialog/sheet components for create/edit flows. Avoid direct inline forms that grow the page vertically.

The teacher self-service dashboard should show:

- today's timetable
- assigned classes/darja
- assigned subjects
- student attendance shortcuts for assigned groups
- exam/marks shortcuts where permissions allow
- basic profile/account information

## Integration Points

Attendance remains student-focused. Teacher actions write student attendance records with `markedByUserId` set to the teacher user id.

Exams can show assigned teachers for exam subjects and reports. Marks entry remains controlled by exam permissions and assignment checks where applicable.

Salary fields are input-only in this module. Full payroll, disbursement, payslips, and payroll reports remain future HR/payroll work.

## Testing and Verification

Backend tests should cover teacher creation, Better Auth user/profile transaction handling, role validation, assignment constraints, timetable overlap detection, deactivation behavior, and assigned-teacher attendance access. UI verification should cover Add Teacher, credential display, profile edit, assignment editing, timetable conflict errors, and self-service dashboard visibility.
