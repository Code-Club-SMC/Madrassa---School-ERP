# Scoped Academic Years Design

## Goal

Admissions must stop depending on one global active academic year. The system needs separate active academic years for school and madrassa admissions.

## Requirements

- School academic years are scoped to `school`.
- Madrassa academic years are scoped to `madrassa`.
- Madrassa academic years use Hijri calendar identity: they start from Muharram and end at Dhu al-Hijjah.
- Database filtering still uses confirmed Gregorian `startDate` and `endDate`.
- The app must not invent Hijri-to-Gregorian dates; admins enter/confirm those dates.
- Admissions automatically select the active academic year for the target system.
- Only one active academic year is allowed per system.
- Backfill must only update missing active enrollments for the same system as the target academic year.

## Data Model

`academic_years` gains:

- `system`: `school` or `madrassa`
- `calendarType`: `gregorian` or `hijri`

The active-year uniqueness rule changes from one global active row to one active row per system.

## UI

The settings page becomes API-backed and shows separate School and Madrassa sections. Creating a madrassa year defaults to Hijri calendar labels; creating a school year defaults to Gregorian calendar labels.

## Error Handling

If a school admission has no active school year, the API returns an explicit setup error. If a madrassa admission has no active madrassa year, the API returns an explicit madrassa setup error.
