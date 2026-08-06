# Admission Print and Madrassa Grade Catalog Design

## Goal

Replace scan-backed admission printing with clean generated A4 print pages, and add the actual boys/girls madrassa grade catalogs provided by the madrassa.

## Print Direction

The scanned admission forms in `public/` are references only. The system must generate clean HTML/CSS print pages that visually follow the official forms: Urdu headings, borders, dotted input lines, field grouping, declaration/rules sections, and blank signature/stamp areas. The final print output must not depend on scanned form backgrounds for the front page.

All typed admission fields should print into the generated form. Backend-generated values must also be merged before printing after save, including application reference, admission number, roll number, admission date, selected class/darja, and guardian details. Signature, stamp, approval, and manual office-signature fields must remain blank on print.

## Back Pages

Madrassa Dars-e-Nizami admission forms need duplex print support:

- Boys use `public/AuhadNama-Jamia-Qasmia.pdf` as the visual/text reference.
- Girls use `public/Auhad-Nama-Jamia-Zanib-lil-Banat.pdf` as the visual/text reference.

Both files are scanned-only PDFs. Their text must be recreated as typed Urdu HTML, but unclear words must be flagged for human review rather than guessed. The back page should include fillable typed guardian/student fields where the original page has form lines, while signatures remain empty.

## Madrassa Grade Catalog

The handwritten grade sheet introduces separate catalogs for:

- `baneen`: boys madrassa grades.
- `banat`: girls madrassa grades.

The catalog must be structured and reusable by admissions, enrollments, promotion rules, exams, attendance filters, teacher assignments, and reports. Admission UI should use select/dropdown controls for grade/darja choices instead of free text where practical.

Known transcript risk: the attached handwritten sheet includes some ambiguous Urdu labels. The first implementation should encode the clearly readable labels and isolate the catalog so labels can be corrected in one file after review.

## Architecture

Create a small print domain under `src/lib/admission-print/` with variant metadata, grade catalog helpers, typed page renderers, and print HTML assembly. Keep UI components focused on collecting data and invoking print. Avoid adding a PDF-generation dependency; browser print HTML is enough for this phase.

## Verification

Run focused pure tests for grade catalog and print payload merging. Run `bun run lint` and `bun run build`. Do not start the dev server unless explicitly requested.
