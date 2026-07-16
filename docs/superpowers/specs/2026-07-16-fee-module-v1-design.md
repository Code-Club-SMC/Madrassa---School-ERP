# Fee Module V1 Design

## Context

The current school and madrassa fee pages are mock-driven UI screens. The database has real students, guardians, institutions, programs, and enrollment records, but no persistent finance schema. Admissions and academic movement now make `student_enrollments` the placement source of truth, so fees must attach to the student and the active enrollment that produced the charge.

## Goals

- Build a production-ready on-demand fee ledger.
- Support manual charge creation for active students.
- Support full and partial payments with printable receipts.
- Track outstanding balances without auto-generating monthly fees.
- Support reversals and refunds without deleting financial history.
- Add detailed finance reports for collection, outstanding dues, student ledgers, institution summaries, and reversal/refund audits.
- Write student timeline events for meaningful fee actions.

## Non-Goals

- No automatic monthly bulk generation in V1.
- No parent online payment portal in V1.
- No bank reconciliation workflow in V1.
- No hard deletion of charges, payments, receipts, reversals, or refunds.
- No generalized accounting suite beyond student fee operations and required reports.

## Core Ledger Model

Amounts are stored as integer paisa. The ledger should include:

- `fee_charges`: payable items such as monthly fee, admission fee, exam fee, transport, or custom charge. Each charge references `studentId`, `enrollmentId`, institution, program, optional class/section or madrassa subcategory, amount, due date, status, and metadata.
- `fee_payments`: money received from a guardian/student. Each payment has receipt number, received amount, method, received date, received-by user, payer details, status, and notes.
- `fee_payment_allocations`: links payments to one or more charges. This supports partial payments and multi-charge receipts.
- `fee_adjustments`: concessions, waivers, corrections, charge reversals, payment reversals, and refunds. Adjustments preserve audit history instead of mutating old records destructively.

Charge status should be derived from charge amount minus allocated payments and applicable adjustments: unpaid, partial, paid, waived, reversed, or refunded where applicable.

## Workflows

### Create Charge

An admin selects an active student, enters charge type, amount, due date, and notes, then saves. The system snapshots the current active enrollment and writes a student event.

### Charge + Collect Now

For common cash desk use, the operator can create a charge and collect payment in one flow. The backend still creates a charge, payment, allocation, receipt number, and student event atomically.

### Collect Payment

An operator selects outstanding charges, enters amount and payment method, and records payment. Partial payments are allowed. Overpayment is not allowed in V1. A receipt is generated after successful payment.

### Reversal

Mistaken charges or payments are reversed through a confirmation dialog with a required reason. The original record remains visible and is marked reversed through adjustment records. Reversals write student events and appear in audit reports.

### Refund

Refunds record money returned to the payer. A refund requires the original payment, amount, method, reason, and confirmation. Refund amount cannot exceed refundable paid balance. Refunds write student events and appear in reports.

## Pages

Reuse existing routes:

- `/school/fees`: school fee operations for Al-Qasim Academy students.
- `/madrassa/fees`: madrassa fee operations for Jamia Qasmia and Jamia Zainab students.

Each page should provide:

- Search by roll number, student name, Urdu name, guardian phone, and admission number.
- Filters by institution, program, class/section, madrassa category/darja, status, and date range.
- Student fee summary with outstanding, paid, reversed, refunded, and net collected totals.
- Outstanding charge list.
- Receipt history.
- Actions: create charge, charge and collect now, collect payment, print receipt, reverse, refund.

Student profile fees tab can be added after the fee pages are functional, using the same ledger APIs.

## Reports

V1 includes these reports:

- Daily Collection Report: date range, cashier/user, payment method, receipt list, gross collected, reversals, refunds, and net collected.
- Outstanding Dues Report: filters by institution/program/class/darja with student-wise balances and aging buckets: current, 30+, 60+, and 90+.
- Student Ledger Report: all charges, payments, allocations, concessions, reversals, and refunds for one student.
- Institution Summary: Jamia Qasmia, Jamia Zainab, and Al-Qasim totals for charges, collected, reversed, refunded, and outstanding.
- Reversal/Refund Audit Report: original receipt or charge, actor, reason, amount, method, and timestamp.

Reports should be server-computed from ledger tables, not from frontend-only calculations.

## Permissions and Audit

Use existing permission modules:

- `school_fees` for school fee actions.
- `madrassa_fees` for madrassa fee actions.
- `finance` for cross-institution reports.

Create, payment, reversal, refund, export, and print operations should respect existing action permissions. Reversal and refund actions require confirmation dialogs and mandatory reason text.

## Error Handling

- Reject operations for inactive or missing active enrollment unless explicitly viewing history.
- Reject overpayments in V1.
- Reject refund amounts above refundable balance.
- Reject reversal/refund attempts without a reason.
- Return clear API errors and surface them directly in the UI.
- Financial write operations should be transactional.

## Verification

Implementation should verify:

- Drizzle schema and migration generation.
- TypeScript build.
- Lint.
- Production build.
- Ledger calculations for partial payments, reversals, refunds, and outstanding balances.
- Receipt number uniqueness.
- Permission checks for school, madrassa, and finance reports.

Do not start the dev server unless explicitly requested.
