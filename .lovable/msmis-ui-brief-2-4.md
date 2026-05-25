# MSMIS — Frontend UI Implementation Brief
### Agent-Executable UI Specification · All Phases · Lovable

**Document Type:** Frontend-only implementation mandate for an AI coding agent.  
**Scope:** All UI screens, layouts, components, interactions, and states across every module of the Madrassa & School Management Information System.  
**Backend:** All data is mocked. No API calls, no server functions, no database access. The agent builds the complete visual and interactive layer only.  
**Handoff:** When the backend is ready, mock data objects are replaced with TanStack Query hooks. The component structure must not need to change.

---

## 1. Agent Mandate

Read this document completely before writing a single component. The document is ordered by priority — global constraints in sections 1–6 override any local decision made in sections 7–13. When a specification is ambiguous, the agent defaults to the most visually refined, production-appropriate interpretation, not the simplest one.

The final product must be indistinguishable from a SaaS dashboard designed by a senior product designer at a world-class technology company. That is not a suggestion — it is the acceptance criterion for every screen in every phase.

---

## 2. Tech Stack & Package Manifest

All packages are installed at their latest stable version. The agent does not pin to specific version numbers unless a breaking incompatibility requires it.

```json
{
  "dependencies": {
    "@fontsource-variable/geist": "latest",
    "@fontsource-variable/inter": "latest",
    "@fontsource/noto-nastaliq-urdu": "latest",
    "@tanstack/react-form": "latest",
    "@tanstack/react-query": "latest",
    "@tanstack/react-router": "latest",
    "date-fns": "latest",
    "lucide-react": "latest",
    "recharts": "latest",
    "tw-animate-css": "latest",
    "zod": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "cmdk": "latest",
    "embla-carousel-react": "latest",
    "react-day-picker": "latest",
    "vaul": "latest"
  },
  "devDependencies": {
    "tailwindcss": "latest",
    "@tailwindcss/vite": "latest"
  }
}
```

**shadcn/ui** is already initialised. Do not re-run `shadcn init`. Install components individually using `bunx shadcn@latest add <component>` as needed. The `components.json` already has `"rtl": true`.

---

## 3. Design System Reference

The following CSS is already present in the project's stylesheet. The agent must not redefine these variables. All components must consume these tokens — no raw colour values in component files.

```css
/* Primary (teal-green): oklch(0.511 0.096 186.391) */
/* Use for: CTAs, active states, brand accents, sidebar highlights */

/* Chart palette (green spectrum): chart-1 → chart-5 */
/* oklch: 0.845→0.432, all in the 163–166 hue range */
/* Use for: all data visualisations — recharts, donut charts, bar charts */

/* Radius scale built on --radius: 0.45rem */
/* sm=0.27rem, md=0.36rem, lg=0.45rem, xl=0.63rem, 2xl=0.81rem, 3xl=0.99rem, 4xl=1.17rem */

/* Sidebar tokens are separate from main surface tokens */
/* Always use --sidebar-* variables inside sidebar components */
```

**Font usage:**
- Body text, labels, inputs, table cells, badges → `font-sans` (Inter Variable)
- Page titles, section headings, card headings, modal titles → `font-heading` (Geist Variable)
- All Urdu text anywhere in the app → `font-urdu` class (see Section 4)

**Colour semantic map:**
- Brand actions (primary buttons, active nav, selected states) → `bg-primary text-primary-foreground`
- Destructive actions (delete, reject, deactivate) → `text-destructive` / `bg-destructive`
- Muted labels, sublabels, secondary metadata → `text-muted-foreground`
- Card surfaces → `bg-card` with `border border-border`
- Sidebar surface → `bg-sidebar` with `border-sidebar-border`

---

## 4. Urdu & Bilingual Typography

### Font Setup

Add the Urdu font to the stylesheet after the existing imports:
```css
@import "@fontsource/noto-nastaliq-urdu/400.css";
@import "@fontsource/noto-nastaliq-urdu/700.css";
```

Add to the `@theme inline` block:
```css
--font-urdu: 'Noto Nastaliq Urdu', serif;
```

Add to the `@layer base` block:
```css
.font-urdu {
  font-family: var(--font-urdu);
  font-size: 1.15em;
  line-height: 2;
  letter-spacing: 0;
}
```

### Bilingual Label Pattern

Every form field, KPI card, and navigation item uses a bilingual pattern. The agent applies this pattern consistently:

**Form fields:**
```tsx
<div className="flex flex-col gap-1">
  <Label className="font-urdu text-base text-foreground">طالب علم کا نام</Label>
  <span className="text-xs text-muted-foreground font-sans -mt-1">Student Name</span>
  <Input placeholder="Student Name" />
</div>
```

**KPI cards:**
```tsx
<div>
  <p className="text-2xl font-bold font-heading">1,248</p>
  <p className="text-sm font-medium text-foreground">Total Students</p>
  <p className="text-xs font-urdu text-muted-foreground">کل طلبہ</p>
</div>
```

**Navigation items:**
```tsx
<div className="flex flex-col">
  <span className="text-sm font-medium font-urdu">طلبہ</span>
  <span className="text-[10px] text-muted-foreground">Students</span>
</div>
```

**Page titles:**
```tsx
<div>
  <h1 className="text-2xl font-bold font-heading tracking-tight">Student Admission</h1>
  <p className="font-urdu text-lg text-muted-foreground mt-0.5">داخلہ فارم</p>
</div>
```

### RTL Rules

The application shell uses `dir="rtl"` on the HTML element. The agent must:
- Use only logical CSS properties in all Tailwind classes: `ms-` not `ml-`, `me-` not `mr-`, `ps-` not `pl-`, `pe-` not `pr-`, `start-` not `left-`, `end-` not `right-`.
- Verify every flex layout renders correctly in RTL by checking icon positions (icons appear on the trailing/outer edge of nav items in RTL — visually on the right side).
- Use `flex-row-reverse` or `rtl:flex-row-reverse` where needed to correct icon ordering in components that do not respond to logical properties automatically.

---

## 5. Mock Data Architecture

All data is static for this implementation. Mock data lives in `src/mock/` with one file per domain:

```
src/mock/
  students.ts         # Student records, enrollments
  categories.ts       # Madrassa categories and subcategories
  classes.ts          # School classes and sections
  users.ts            # System users and roles
  attendance.ts       # Attendance records
  fees.ts             # Fee collection records
  exams.ts            # Exam series, schedules, results
  inventory.ts        # Inventory items, purchases, donations
  finance.ts          # Income and expense records
  applications.ts     # Online admission applications (queue)
  teachers.ts         # Teacher profiles
  announcements.ts    # Notices and announcements
```

Each mock file exports typed arrays. Types are defined in `src/types/` with one file per domain. All types use `type` — no `interface` declarations anywhere in the project.

Mock data must be realistic: Urdu names, Pakistani addresses, PKR amounts, Pakistani phone numbers in `03XX-XXXXXXX` format, CNIC in `XXXXX-XXXXXXX-X` format, dates within the last 2 years.

---

## 6. Global UI/UX Rules

### ❌ Prohibited Patterns

The following are explicitly banned. Any occurrence is a build failure:

- An unstyled or default-themed shadcn `Card` without adjusted padding, border treatment, or visual hierarchy.
- Any `<p>No data found.</p>` or equivalent empty state with no icon, no heading, no action.
- A loading state that is only `<Spinner />` centred in a white box — every skeleton must match the loaded content's shape.
- Raw colour values (hex, rgb, oklch literals) in any component file — only CSS variable tokens via Tailwind classes.
- `margin-left`, `margin-right`, `padding-left`, `padding-right`, `left:`, `right:` as CSS-in-JS or inline styles — only logical properties.
- `interface` declarations — use `type` exclusively.
- Placeholder toasts that say "Success!" or "Error occurred" with no specificity.
- Glassmorphism, heavy drop shadows, gradient backgrounds on surfaces.
- Tables without a defined header background treatment, row hover, and at least one status-driven visual differentiation.

### ✅ Required Patterns

**Every async component** renders three distinct states:
1. Skeleton — shaped like the loaded content, animating with `animate-pulse`.
2. Error — icon + heading + description + retry action, styled with `text-destructive`.
3. Loaded — the actual content.

**Every table** has:
- A `bg-muted/40` header row with `text-muted-foreground text-xs uppercase tracking-wide` column labels.
- `hover:bg-muted/30` on data rows.
- At least one column with a status badge (`Badge` component with variant driven by status value).
- A contextual action column (three-dot `DropdownMenu` or inline icon buttons).

**Every form** has:
- The bilingual label pattern (Urdu primary, English sublabel).
- Inline validation error below each field using `text-destructive text-xs`.
- A submit button that shows a `Loader2` spinner and is disabled while submitting.
- A form-level error area above the submit button for server errors.

**Every dialog/sheet** has:
- A `DialogHeader` with a Geist heading and a bilingual Urdu subtitle.
- Clear visual separation between header, content, and footer.
- A clearly labelled cancel action alongside the primary action.

**Spacing discipline:** Use only the Tailwind spacing scale (multiples of 4px). No arbitrary values like `p-[13px]` or `mt-[7px]`.

### Status Badge System

Define a reusable `StatusBadge` component used across all tables. The variant map:

```ts
const STATUS_VARIANTS = {
  active:      { label: 'Active',      urdu: 'فعال',      className: 'bg-chart-1/15 text-chart-3 border-chart-2/30' },
  inactive:    { label: 'Inactive',    urdu: 'غیر فعال',   className: 'bg-muted text-muted-foreground border-border' },
  pending:     { label: 'Pending',     urdu: 'زیر غور',    className: 'bg-amber-500/10 text-amber-700 border-amber-300/40 dark:text-amber-400' },
  accepted:    { label: 'Accepted',    urdu: 'منظور',      className: 'bg-chart-1/15 text-chart-3 border-chart-2/30' },
  rejected:    { label: 'Rejected',    urdu: 'مسترد',      className: 'bg-destructive/10 text-destructive border-destructive/25' },
  graduated:   { label: 'Graduated',  urdu: 'فارغ التحصیل', className: 'bg-primary/10 text-primary border-primary/25' },
  dropout:     { label: 'Dropout',    urdu: 'تارک',        className: 'bg-orange-500/10 text-orange-700 border-orange-300/40 dark:text-orange-400' },
  transferred: { label: 'Transferred',urdu: 'منتقل',       className: 'bg-blue-500/10 text-blue-700 border-blue-300/40 dark:text-blue-400' },
  super_admin: { label: 'Super Admin',urdu: 'سپر ایڈمن',  className: 'bg-purple-500/10 text-purple-700 border-purple-300/40 dark:text-purple-400' },
  admin:       { label: 'Admin',      urdu: 'ایڈمن',      className: 'bg-primary/10 text-primary border-primary/25' },
  teacher:     { label: 'Teacher',    urdu: 'استاد',      className: 'bg-amber-500/10 text-amber-700 border-amber-300/40 dark:text-amber-400' },
  parent:      { label: 'Parent',     urdu: 'والدین',     className: 'bg-teal-500/10 text-teal-700 border-teal-300/40 dark:text-teal-400' },
} as const
```

The `StatusBadge` renders both the English label and the Urdu label (smaller, below or inline).

---

## 7. Route Map

All routes are defined using TanStack Router's file-based routing. The complete route tree:

```
/                                   → Redirect to /dashboard
/login                              → LoginPage (unauthenticated)
/apply                              → PublicApplicationForm (unauthenticated)
/change-password                    → ChangePasswordPage

/_authenticated                     → AppShell layout wrapper
  /dashboard                        → GlobalDashboard
  /admission                        → AdmissionHub
  /admission/new                    → NewAdmissionForm
  /admission/queue                  → ApplicationQueue

  /madrassa                         → Redirect to /madrassa/students
  /madrassa/students                → MadrassaStudentList
  /madrassa/students/$id            → MadrassaStudentProfile
  /madrassa/attendance              → MadrassaAttendance
  /madrassa/fees                    → MadrassaFees
  /madrassa/categories              → MadrassaCategories

  /school                           → Redirect to /school/students
  /school/students                  → SchoolStudentList
  /school/students/$id              → SchoolStudentProfile
  /school/attendance                → SchoolAttendance
  /school/fees                      → SchoolFees
  /school/exams                     → SchoolExams
  /school/exams/$id                 → ExamDetail
  /school/exams/$id/seating         → SeatingArrangement
  /school/exams/$id/results         → ExamResults

  /teachers                         → TeacherList
  /teachers/$id                     → TeacherProfile
  /id-cards                         → IDCardGenerator

  /reports                          → ReportsHub
  /reports/attendance               → AttendanceReport
  /reports/category                 → CategoryReport
  /reports/results                  → ResultsReport
  /reports/monthly                  → MonthlyReport
  /reports/annual                   → AnnualReport

  /inventory                        → InventoryList
  /finance                          → FinanceDashboard

  /parents                          → ParentsPortal (separate auth surface)
  /users                            → UserManagement (super_admin only)
  /settings                         → Settings

/website                            → PublicWebsite layout
  /                                 → WebsiteHome
  /about-madrassa                   → AboutMadrassa
  /about-school                     → AboutSchool
  /gallery                          → Gallery
  /notices                          → Notices
  /contact                          → Contact
  /apply                            → AdmissionApplicationForm
```

---

## 8. Global Layout Components

### 8.1 AppShell

The root authenticated layout. Renders the sidebar and the main content area side by side, with the topbar spanning the content area.

```
┌─────────────────────────────────────────────────────┐
│  Topbar (56px, fixed, full width of content area)   │
├─────────┬───────────────────────────────────────────┤
│         │                                           │
│ Sidebar │          Page Content (scrollable)        │
│ (240px) │                                           │
│ fixed   │                                           │
└─────────┴───────────────────────────────────────────┘
```

In RTL the sidebar appears on the right. The sidebar uses `border-e border-sidebar-border` (logical property — border on the inner/end edge).

### 8.2 Sidebar

**Structure (top to bottom):**

1. **Logo zone** (64px height, non-scrolling): Institution logo placeholder (40×40, `rounded-xl bg-primary/10 border border-primary/20` with a mosque icon in primary colour), app title "MSMIS" in `font-heading font-bold text-sm`, subtitle "Management System" in `text-[10px] text-muted-foreground`.

2. **Global nav section**: Section label `text-[10px] uppercase tracking-widest text-muted-foreground font-medium px-3 mb-1` reading "GLOBAL". Nav items: Dashboard, Admission.

3. **System Tab Switcher**: Two full-width tabs inside a `bg-muted rounded-lg p-1 mx-3` pill container. Left tab "اسکول 🏫" and right tab "🕌 مدرسہ" (in RTL, Madrassa appears on the right/start side). Active tab: `bg-background shadow-sm text-foreground`. Inactive: `text-muted-foreground hover:text-foreground`. Switching tabs animates the active indicator with a 150ms ease transition.

4. **System nav section**: Section label reads "مدرسہ" or "اسکول" based on active system. Items animate in with a 150ms opacity fade when the system switches.

5. **Admin nav section** (pinned to bottom, separator above): Items: Users (super_admin only), Settings.

6. **User footer** (non-scrolling, bottom): Avatar + name + role badge on the left, a `LogOut` icon button on the right. The entire footer has `border-t border-sidebar-border`.

**Nav item anatomy:**
```
[Icon 16px]  [Text column]            [Optional badge]
              Urdu label (font-urdu text-sm)
              English sublabel (text-[10px] text-muted-foreground)
```

Active item: `bg-sidebar-accent text-sidebar-accent-foreground` with a 2px `bg-sidebar-primary` bar on the start (inner) edge.

### 8.3 Topbar

Height 56px. `bg-background border-b border-border`.

Left side (start in RTL): Breadcrumb using shadcn `Breadcrumb`. Current page name in Urdu.  
Right side (end in RTL): System indicator pill (`bg-primary/10 text-primary text-xs font-medium rounded-full px-3 py-1` reading "مدرسہ" or "اسکول"), dark mode toggle (`Sun`/`Moon` icon button), user avatar that opens a `DropdownMenu` with Profile and Sign Out options.

### 8.4 PageHeader

Used at the top of every page, inside `<main>`:

```tsx
<div className="flex items-start justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold font-heading tracking-tight">{titleEnglish}</h1>
    <p className="font-urdu text-base text-muted-foreground mt-0.5">{titleUrdu}</p>
    {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
  </div>
  <div className="flex items-center gap-2">{actions}</div>
</div>
```

### 8.5 Empty State Component

```tsx
<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
    <Icon className="w-6 h-6 text-muted-foreground" />
  </div>
  <h3 className="font-heading font-semibold text-base mb-1">{heading}</h3>
  <p className="font-urdu text-muted-foreground text-sm mb-1">{headingUrdu}</p>
  <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>
  {action && <Button size="sm" onClick={action.onClick}>{action.label}</Button>}
</div>
```

### 8.6 Data Table Wrapper

All tables use a consistent wrapper:

```tsx
<div className="rounded-xl border border-border overflow-hidden">
  <Table>
    <TableHeader>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          {column}
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow className="hover:bg-muted/30 border-border/60">
        ...
      </TableRow>
    </TableBody>
  </Table>
</div>
```

---

## 9. Phase 1 — Authentication Screens

### 9.1 Login Page (`/login`)

**Layout:** Full viewport, two-column (`grid grid-cols-1 lg:grid-cols-2 h-screen`).

**Left panel** (hidden on mobile, `hidden lg:flex`):
- Background: `bg-primary` (teal-green).
- Centred content: large mosque icon (`w-16 h-16 text-primary-foreground opacity-80`) at top, institution name in Urdu (`font-urdu text-4xl font-bold text-primary-foreground text-center leading-loose mt-6`), a one-line motto in smaller Urdu text (`font-urdu text-sm text-primary-foreground/70 text-center mt-4`), and "MSMIS v1.0" wordmark at the very bottom (`text-xs text-primary-foreground/50 font-heading`).

**Right panel** (`flex flex-col items-center justify-center p-8 bg-background`):
- Logo placeholder (40×40, same as sidebar logo).
- Heading: "Welcome Back" (`font-heading text-2xl font-bold`) + Urdu subtitle (`font-urdu text-base text-muted-foreground`).
- Form card: `w-full max-w-sm` with no visible card border — just the form fields floating on the background.
- Fields: Email + Password, each using the bilingual label pattern.
- Submit button: `w-full` brand primary, Urdu label "داخل ہوں" with English sublabel.
- Form-level error: `Alert` with `AlertCircle` icon and `variant="destructive"` below the form, visible only when an error exists.
- Note at the bottom: `text-xs text-muted-foreground text-center` reading "Contact your administrator to reset your password / پاس ورڈ بھولنے پر ایڈمن سے رابطہ کریں".

### 9.2 Change Password Page (`/change-password`)

Centred card layout (`max-w-md mx-auto mt-24`). `Card` with `CardHeader` (lock icon + title "Set New Password" + Urdu subtitle), `CardContent` (two fields: New Password, Confirm Password, both bilingual), `CardFooter` (submit button full width). A `Progress` bar shows password strength as the user types (0–100, coloured `bg-destructive` → `bg-amber-500` → `bg-chart-1`).

### 9.3 User Management Page (`/users`)

**PageHeader:** "User Management" / "صارف انتظام" + "نیا صارف بنائیں" button (with `UserPlus` icon) in the actions slot.

**Stats row** (3 cards): Total Users, Active Users, Inactive Users — each a compact `Card` with a count and trend icon.

**Table columns:** Name, Email, Role (`StatusBadge`), Status (`StatusBadge`), Created By, Created At, Actions.

**Actions column:** `DropdownMenu` with items: Reset Password (`KeyRound` icon), Deactivate/Activate (`ShieldOff`/`ShieldCheck`), separator, Delete (`Trash2`, destructive colour).

**Create User Dialog:**
- `DialogHeader`: "Create New User" + Urdu subtitle.
- Fields: Full Name (bilingual), Email Address (bilingual), Role (bilingual `Select` — options: Admin, Teacher, Parent).
- Generated password section: a `rounded-lg bg-muted p-3` block showing the auto-generated password in `font-mono text-sm`. A `Copy` icon button beside it. A `text-xs text-amber-600` warning in Urdu: "یہ پاس ورڈ صرف ایک بار دکھایا جائے گا".
- Footer: Cancel + "Create User" buttons.

**Credentials Card** (shown after successful creation): A full-screen overlay (`fixed inset-0 bg-background/80 backdrop-blur-sm`) with a centred card. The card has a `CheckCircle2` icon in `text-chart-1`, heading "User Created Successfully", a `rounded-xl bg-muted p-4` block showing name, email, and password in clearly readable format. A `Copy All` button and a `Close` button.

---

## 10. Phase 2 — Shell & Navigation

The AppShell, Sidebar, Topbar, and System Tab Switcher are already fully specified in Section 8. The placeholder routes render `PageHeader` + an `EmptyState` component with a `Construction` icon and appropriate bilingual text for each route. No placeholder route shows a "Coming Soon" message in English — all copy is contextually Urdu.

**Dark mode toggle:** A `Button variant="ghost" size="icon"` in the topbar that toggles the `dark` class on the `<html>` element. The icon swaps between `Sun` and `Moon` with a 150ms opacity transition.

---

## 11. Phase 3 — Student Admission

### 11.1 Admission Hub (`/admission`)

Two large action cards side by side (`grid grid-cols-1 md:grid-cols-2 gap-4`), each occupying half the content width:

**New Admission card:** `Card` with `p-8`. Top: `UserPlus` icon (32px, `text-primary`). Heading: "New Admission" (`font-heading text-xl font-semibold`). Urdu: "نیا داخلہ" (`font-urdu`). Description sentence in English. Large primary `Button` at the bottom: "Start Admission →".

**Online Queue card:** Same structure, icon `Inbox`, heading "Application Queue", Urdu "آن لائن درخواستیں". Shows a `Badge` count of pending applications (e.g., `bg-amber-500 text-white`) overlaid on the icon corner. Button: "Review Queue →".

### 11.2 Admission Stepper

A fixed horizontal stepper rendered above the form, inside a `sticky top-0 z-10 bg-background border-b border-border py-4 px-6` container.

Five steps. In RTL, step 1 is on the right, step 5 on the left.

Each step:
- **Completed:** `w-8 h-8 rounded-full bg-primary flex items-center justify-center` with a white `Check` icon (16px).
- **Current:** `w-8 h-8 rounded-full bg-primary ring-4 ring-primary/20 flex items-center justify-center text-primary-foreground text-sm font-bold`.
- **Upcoming:** `w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-muted-foreground text-sm`.

Connector line between steps: `flex-1 h-[2px]`. Completed segment: `bg-primary`. Upcoming segment: `bg-border`.

Below each circle: step label in Urdu (`font-urdu text-xs`), coloured `text-primary` for current and completed, `text-muted-foreground` for upcoming.

Step labels: ذاتی معلومات · نظام · تفصیلات · ولی · جائزہ

### 11.3 Step Components

**Step 1 — Personal Info:**

Two-column grid (`grid grid-cols-1 md:grid-cols-2 gap-4`):
- Urdu Name (full width, bilingual label, `font-urdu` placeholder "طالب علم کا نام")
- English Name (optional tag `text-xs text-muted-foreground`)
- Date of Birth (shadcn `DatePicker`, bilingual)
- Gender (shadcn `RadioGroup` displayed as two cards: بنین/Male | بنات/Female — each card `border rounded-xl p-4 cursor-pointer`. Selected card: `border-primary bg-primary/5`)
- Address (full-width `Textarea`, bilingual)
- Photo Upload (full-width): A dashed `border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer`. Shows `ImagePlus` icon + Urdu instruction. After selection, swaps to show the photo thumbnail (`w-20 h-20 rounded-xl object-cover`) alongside the filename and a remove button.

**Step 2 — System Selection:**

Three large radio cards arranged in a row (`grid grid-cols-1 sm:grid-cols-3 gap-4`). Each card is `border-2 rounded-2xl p-6 cursor-pointer transition-all`. Selected: `border-primary bg-primary/5 shadow-sm`. Unselected: `border-border hover:border-primary/40`.

Card content: large emoji icon (🕌 / 🏫 / 🏛️), Urdu label (`font-urdu text-lg font-semibold`), English label (`text-sm text-muted-foreground`), one-line description (`text-xs text-muted-foreground mt-2`).

Options: مدرسہ (Madrassa — دینی تعلیم) · اسکول (School — عصری تعلیم) · دونوں (Both — دینی اور عصری تعلیم)

**Step 3 — Category/Class:**

If Madrassa: Category `Select` (bilingual label) followed by Subcategory `Select` (disabled until category is selected, label shows "پہلے قسم منتخب کریں" while disabled).

If School: Class `Select` followed by Section `Select` (optional, placeholder "Section (Optional)").

If Both: A `Separator` with "Madrassa Details" label on one side and "School Details" on the other, with both sets of fields stacked.

Each `Select` shows a loading skeleton (`Skeleton className="h-10 w-full rounded-md"`) while mock data loads, and an error state with retry if data is unavailable.

**Step 4 — Guardian Info:**

Fields: Guardian Name (bilingual), CNIC (bilingual, formatted input with dash insertion), Phone Number (bilingual, Pakistani format hint).

**Sibling Search:** Below the main fields, a `Separator` then a `relative` search input with `Search` icon prefix. Below the input, results render in a `rounded-xl border border-border overflow-hidden divide-y divide-border` list. Each result row: avatar placeholder + student name (`font-urdu`) + roll number (`text-xs text-muted-foreground`) + `Plus` button. Selected siblings render as removable chips (`bg-primary/10 text-primary rounded-full px-3 py-1 text-xs flex items-center gap-1` with `X` button).

No-results state: `text-sm text-muted-foreground text-center py-4` with Urdu message.

**Step 5 — Review:**

Full read-only summary in four `Card` sections (Personal, System, Category/Class, Guardian). Each section has a `CardHeader` with a section title + "Edit" (`Pencil` icon, `size="sm" variant="ghost"`) button that navigates back to that step.

Field display: `flex justify-between items-start py-2 border-b border-border/50 last:border-0`. Urdu label on the start side (`font-urdu text-sm text-muted-foreground`), value on the end side (`text-sm font-medium`).

At the bottom: a `Checkbox` + Urdu declaration label (`font-urdu text-sm`). Below the checkbox: a full-width primary `Button` "داخلہ مکمل کریں" (disabled until checkbox is checked). While submitting: `Loader2` spinner + button disabled.

**Success State** (replaces the form): Centred card with `CheckCircle2` icon (`w-16 h-16 text-chart-1`), "Admission Successful" heading, Urdu subtitle, a `rounded-xl bg-muted p-4` block showing roll number(s) in large `font-heading font-bold text-primary` text, and a "New Admission" button to reset.

### 11.4 Application Queue (`/admission/queue`)

**Filter tabs** at the top: shadcn `Tabs` with values: all, pending, accepted, rejected. Each tab label is bilingual (English primary + Urdu count badge).

**Table columns:** Ref No, Name (Urdu, `font-urdu`), System (`Badge`), Category/Class, Phone, Submitted, Status, Actions.

**Actions for pending rows:** Two inline `Button` elements: "منظور کریں" (`size="sm"`, primary) and "مسترد کریں" (`size="sm" variant="destructive"`). Accepted/rejected rows show no action buttons.

**Accept Dialog:** `Dialog` with read-only applicant summary (same as Step 5 review layout) + an optional Monthly Fee `Input` (bilingual, defaults to "0") + "داخلہ منظور کریں" button.

**Reject Dialog:** `Dialog` with a required `Textarea` (bilingual label "مسترد کرنے کی وجہ", `min-h-[100px]`) + "مسترد کریں" destructive button.

**Post-accept success state within dialog:** The dialog content replaces with `CheckCircle2` icon + "Admission Confirmed" + generated roll number in large primary text.

### 11.5 Public Application Form (`/apply`)

Standalone page — no AppShell. Custom layout:

- `sticky top-0` header bar: `bg-background border-b border-border`, institution logo + name + "Online Admission / آن لائن داخلہ" title.
- Same five-step stepper and step components as the admin form, with Step 4 excluding the sibling search section.
- `bg-muted/30` full-page background.
- Form card: `bg-background rounded-2xl shadow-sm border border-border max-w-2xl mx-auto my-8 p-6`.
- Success state: the card transforms to show a reference number (`APP-XXXX` in large `font-heading font-bold text-primary`) + Urdu confirmation message + note to await contact.
- Footer: institution name + "Powered by MSMIS" (`text-xs text-muted-foreground`).

---

## 12. Phase 4 — Madrassa Module

### 12.1 Student List (`/madrassa/students`)

**PageHeader:** "Students — Madrassa" / "مدرسہ — طلبہ" + two actions: "Export" (`Download` icon, `variant="outline"`) + "Add Student" (routes to `/admission/new`).

**Filter bar** below the header: `flex items-center gap-3 mb-4`. Contains:
- `Input` with `Search` icon prefix (`placeholder="Search students... / طالب علم تلاش کریں"`).
- Category `Select` filter (All Categories / by category name in Urdu).
- Subcategory `Select` filter (disabled until category selected).
- Gender `Select` filter (All / بنین / بنات).
- `Button variant="ghost" size="sm"` "Clear Filters" (visible only when any filter is active).

**Table columns:** Roll No (`font-mono text-xs`), Name (`font-urdu font-medium`), Category, Subcategory, Gender (`Badge`), Monthly Fee (PKR formatted, `text-right`), Status (`StatusBadge`), Actions.

**Row actions** (`DropdownMenu`): View Profile, Edit Enrollment, Promote, Demote (with icon), separator, Mark Exit (destructive).

**Student count summary** bar between filter and table: `text-sm text-muted-foreground` showing "Showing X of Y students / X طلبہ دکھائے جا رہے ہیں".

**Empty state** (when filters produce no results): `Filter` icon, "No students found", "کوئی طالب علم نہیں ملا", "Try adjusting your filters" + "Clear Filters" button.

### 12.2 Student Profile (`/madrassa/students/$id`)

**Breadcrumb:** Madrassa → Students → [Student Name in Urdu]

**Profile header card:** `Card` with `p-6`. Flex row: avatar (64×64, `rounded-2xl`, initials fallback with `bg-primary/10 text-primary font-bold`) on the start side, then student info (Urdu name in `font-urdu font-heading text-2xl`, English name in `text-sm text-muted-foreground`, roll number as `Badge variant="outline"`, status `StatusBadge`). On the end side: action buttons (Edit, Print ID Card, Mark Exit).

**Tab navigation** below the header: shadcn `Tabs` with: Overview, Attendance, Fees, History.

**Overview tab:** Two-column grid of info cards:
- Personal Details card: DOB, Gender, Address, Guardian info — each as a `flex justify-between` row.
- Enrollment Details card: Category, Subcategory, Roll No, Monthly Fee, Admission Date, Admission Source.

**Attendance tab:** A monthly calendar heatmap (custom grid, not shadcn Calendar) showing each day colour-coded: `bg-chart-1/80` for present, `bg-destructive/20` for absent, `bg-muted` for future/non-school days. Below the calendar: a `flex gap-4` summary row showing Present count, Absent count, Attendance % as KPI mini-cards.

**Fees tab:** Monthly fee collection table. Columns: Month, Due Amount (PKR), Paid Amount, Paid On, Receipt, Status (`StatusBadge`: Paid / Overdue / Partial). Below the table: total outstanding amount in `text-destructive font-bold`.

**History tab:** Vertical timeline (`relative pl-6 border-s border-border`) of all events — admission, promotions, demotions, fee adjustments, exit. Each event: a circle marker on the border, heading (English), Urdu detail, date in muted text.

### 12.3 Category Management (`/madrassa/categories`)

**Layout:** Two-panel side-by-side on desktop (`grid grid-cols-5 gap-6`), left panel (`col-span-2`) for categories list, right panel (`col-span-3`) for subcategories of selected category.

**Categories panel:**
- Panel heading "Categories / اقسام" + "Add Category" `Button size="sm"`.
- Drag-reorderable list (`GripVertical` handle icon, `font-urdu text-sm`, edit + delete actions per row).
- Selected category: `bg-primary/5 border-primary/30`.

**Subcategories panel:**
- Heading shows selected category name in Urdu + "Subcategories" + "Add Subcategory" button.
- Table: Subcategory Name (Urdu), Roll Prefix (`font-mono text-xs`), Student Count, Actions.
- If no category selected: EmptyState with "Select a category" message.

**Add Category Dialog:** Name (English), Name Urdu (`font-urdu` input), Save button.

**Add Subcategory Dialog:** Name (English), Name Urdu, Roll Prefix (with `font-mono` styling + tooltip explaining the format), Save button.

### 12.4 Attendance (`/madrassa/attendance`)

**Date selector** in the PageHeader actions slot: shadcn `DatePicker`, defaults to today.

**Quick stats row** (4 KPI cards): Total Enrolled, Present Today, Absent Today, Attendance Rate (%). Each card: count in `font-heading text-3xl font-bold`, label bilingual, a trend indicator (`TrendingUp`/`TrendingDown` in chart-1 or destructive).

**Attendance marking table:** Columns: Roll No, Student Name (`font-urdu`), Category/Subcategory, Attendance toggle (`Switch` component — on = Present, off = Absent, default on). Header row has a "Mark All Present" and "Mark All Absent" bulk action.

**Filter:** Category and subcategory selects in the filter bar above the table.

Below the table: `Button` "Save Attendance / حاضری محفوظ کریں" (primary, full available width or right-aligned).

### 12.5 Fees (`/madrassa/fees`)

**Month selector:** shadcn month picker in the PageHeader actions, defaults to current month.

**Summary cards row** (3): Total Due, Total Collected, Outstanding — with PKR formatting (`formatPKR` utility).

**Table:** Roll No, Name (`font-urdu`), Subcategory, Monthly Fee, Status, Paid On, Receipt action (`Printer` icon), Actions (`DropdownMenu`: Record Payment, Waive, View History).

**Record Payment Dialog:** Student info (read-only), Amount field (pre-filled with monthly fee, editable), Payment Date picker, Notes field, Submit button.

---

## 13. Phase 5 — School Module

### 13.1 Student List (`/school/students`)

Identical structure to Madrassa student list (`/madrassa/students`) with these differences:
- Filters: Class `Select` and Section `Select` instead of Category/Subcategory.
- Table columns: Class and Section instead of Category/Subcategory.
- PageHeader reads "Students — School" / "اسکول — طلبہ".

### 13.2 Exam Management (`/school/exams`)

**PageHeader:** "Examinations" / "امتحانات" + "New Exam Series" button.

**Exam series cards grid** (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`). Each exam series is a `Card`:
- Top: series name (`font-heading font-semibold`) + Urdu name (`font-urdu text-sm text-muted-foreground`) + status `Badge` (Upcoming / Active / Completed).
- Middle: subject count, scheduled date range.
- Bottom: three action buttons as `Button size="sm" variant="outline"`: Schedule, Seating, Results.

**New Exam Dialog:** Series name (English + Urdu), Type `Select` (Quarterly/سہ ماہی, Mid-year/نیم سالہ, Annual/سالانہ), Subject list builder (add subject rows: name + total marks + passing marks, `Plus` button to add rows, `Trash2` to remove).

### 13.3 Seating Arrangement (`/school/exams/$id/seating`)

**Controls bar:** Class multi-select (which classes to include), "Generate Seating" primary button.

**Seating plan display:** A `grid` matching the room configuration (e.g., 6 columns × N rows). Each cell is a small card showing seat number, student name (`font-urdu text-xs`), roll number (`text-[10px] font-mono text-muted-foreground`), and class badge. Students from the same class are never adjacent (shown with a subtle colour code per class: chart-1 through chart-5).

**Print button:** `Printer` icon + "Print Seating Plan" — triggers `window.print()`. Add a `@media print` CSS block in the component that hides the sidebar and topbar.

### 13.4 Exam Results & DMC (`/school/exams/$id/results`)

**Filter bar:** Class select, Section select, Subject select (All Subjects).

**Results table:** Roll No, Name (`font-urdu`), then one column per subject showing marks obtained / total marks. Final columns: Total, Percentage, Grade (`Badge`), Result (Pass/Fail `Badge`).

**Grade colour scheme:** A+ → `text-chart-1`, A → `text-chart-2`, B → `text-chart-3`, C → `text-muted-foreground`, F → `text-destructive`.

**Per-row action:** "View DMC" (`FileText` icon) — opens a `Dialog` or `Sheet` showing a print-ready DMC layout:
- Institution header (name, logo placeholder, address in Urdu).
- Student info (name, roll no, class, exam series name).
- Results table (subject | max marks | obtained | grade).
- Summary (total, percentage, result, grade).
- Signature lines at the bottom.
- "Print DMC" button triggers `window.print()`.

---

## 14. Phase 6 — Teachers & ID Cards

### 14.1 Teacher List (`/teachers`)

**PageHeader:** "Teachers" / "اساتذہ" + "Add Teacher" button.

**Teacher cards grid** (`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`). Each card:
- Top: avatar (48×48 with initials fallback) + name (`font-urdu font-semibold`) + designation (`text-sm text-muted-foreground`) + status `Badge`.
- Middle: `flex flex-wrap gap-2` of subject `Badge` tags.
- Bottom: phone number (`text-xs text-muted-foreground`) + three icon buttons: View Profile, ID Card, Mark Attendance.

### 14.2 Teacher Profile (`/teachers/$id`)

Same tab structure as student profile: Overview, Attendance, Salary.

**Attendance tab:** Table of daily attendance records. Columns: Date, Arrival Time, Departure Time, Duration (calculated), Status, Notes. Monthly summary KPI cards above.

### 14.3 ID Card Generator (`/id-cards`)

**Tab switcher** at top: "Student ID Cards" / "Teacher ID Cards".

**Controls panel** (`Card` left side): Target selector (Category/Class select for students, All/Individual for teachers), size/orientation toggle (portrait/landscape), "Generate Preview" button.

**Preview panel** (right side, `Card`): Shows a live-rendered ID card preview at scale. The ID card mockup:
```
┌─────────────────────────────┐
│  [Logo]  INSTITUTION NAME   │
│          [Urdu Name]        │
├─────────────────────────────┤
│  [Photo  │ Name (Urdu)      │
│  Placeholder]│ Roll Number  │
│           │ Category/Class  │
│           │ Session         │
└─────────────────────────────┘
```
Using `rounded-2xl border-2 border-primary/20 p-4 bg-card shadow-sm`. All text inside uses the actual design tokens.

**"Print All Cards" button:** Primary, bottom of controls panel.

---

## 15. Phase 7 — Reporting Module

### 15.1 Reports Hub (`/reports`)

Six report type cards in a grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`). Each is a `Card` with an icon (Lucide, 32px, `text-primary`), English title (`font-heading font-semibold`), Urdu title (`font-urdu text-sm text-muted-foreground`), short description, and a "Generate Report" `Button`.

Reports: Attendance · Category-wise · Exam Results · Monthly · Annual · Administrative

### 15.2 Attendance Report (`/reports/attendance`)

**Controls row:** Date range picker (start + end date), System toggle (Both/Madrassa/School), Category/Class filter, "Generate" button.

**Summary row:** 4 KPI cards — Total Students, Present, Absent, Rate %.

**Attendance heatmap:** 7×N grid showing each day of the selected range. Each cell coloured by attendance rate: `bg-chart-1` (90%+), `bg-chart-2` (75–90%), `bg-chart-3` (60–75%), `bg-destructive/40` (<60%), `bg-muted` (weekends/holidays). Legend below.

**Data table:** One row per student. Columns: Name (`font-urdu`), Roll No, Total Days, Present, Absent, Rate (%).

**Export bar:** `flex gap-2 justify-end mt-4`. "Export PDF" (`FileText` icon, `variant="outline"`) and "Export Excel" (`Sheet` icon, `variant="outline"`) buttons.

### 15.3 Category-wise Report (`/reports/category`)

**Table:** Category, Subcategory (or Class), Total Enrolled, Active, Graduated, Dropout, Transferred, Attendance Rate %, Fee Collection Rate %.

Below the table: a `recharts` `BarChart` showing enrollment per category (all categories on X-axis, count on Y-axis, bars coloured with chart-1 through chart-5 cycling).

---

## 16. Phase 8 — Inventory & Finance

### 16.1 Inventory (`/inventory`)

**PageHeader** + "Add Item" button (primary) + "Record Purchase" button (`variant="outline"`) + "Record Donation" button (`variant="outline"`).

**Summary row** (3 KPI cards): Total Items, Low Stock Alert count (with `AlertTriangle` icon in `text-amber-500`), Total Inventory Value (PKR).

**Items table:** Item Name, Category, Quantity, Unit, Type (`Badge`: Purchased/Donated/Gift), Value, Actions (Edit, Stock History, Delete).

**Low stock rows** highlighted: `bg-amber-50 dark:bg-amber-950/20` with an `AlertTriangle` icon in the quantity cell.

**Add Item Dialog:** bilingual fields for name, quantity, unit, category. Item type radio (Purchased/Donated).

### 16.2 Finance Dashboard (`/finance`)

**Date range filter** in PageHeader actions (month selector).

**KPI row** (4 cards): Total Income, Total Expenses, Net Balance (coloured `text-chart-1` if positive, `text-destructive` if negative), Fee Collection Rate %.

**Income vs Expense chart:** `recharts BarChart` with two bars per month (Income = `chart-1` colour, Expense = `chart-4` colour), last 12 months on X-axis, PKR amounts on Y-axis. `ResponsiveContainer` for full width.

**Income breakdown card** + **Expense breakdown card** side by side. Each uses a `recharts PieChart`/`DonutChart` with the chart colour palette + a legend listing each category with amount.

**Transactions table** below the charts: Date, Type (Income/Expense), Category, Description, Amount (green for income, red for expense), Source.

---

## 17. Phase 9 — Global Analytics Dashboard

### 17.1 Dashboard (`/dashboard`)

This is the first page users see after login. Every KPI and chart pulls from both Madrassa and School systems combined.

**Welcome banner:** `rounded-2xl bg-primary/5 border border-primary/10 p-6 mb-6`. Left: "Good morning, [Name]" in `font-heading font-bold text-xl` + date in `text-muted-foreground`. Right: institution name in `font-urdu text-lg`.

**KPI row** (5 cards, horizontal scroll on mobile):
1. Total Students — shows Madrassa + School split as `text-xs text-muted-foreground` below the number.
2. Today's Attendance — large percentage, trend arrow.
3. Monthly Fee Collection — PKR formatted, vs last month percentage.
4. Pending Arrears — `text-destructive` if above threshold.
5. Active Teachers.

Each KPI card: `Card p-5`. Icon in `rounded-xl bg-primary/10 p-2` on the start side. Value + labels on the end side. Small chart sparkline (7-day trend, `recharts AreaChart` tiny, no axes) at the bottom of the card.

**Enrollment trend chart** (full width): `recharts LineChart` with two lines — Madrassa (`chart-1`) and School (`chart-2`) — over the last 12 months. Tooltip shows both values.

**Two-column row** below the chart:
- Left: Attendance heatmap (7-day rolling, `grid grid-cols-7` of coloured cells).
- Right: Category distribution `recharts PieChart` (donut style) showing student count per Madrassa category, labelled with category names in Urdu.

**Recent Activity feed** (full width, bottom): `rounded-xl border border-border divide-y divide-border`. Each row: icon (`UserPlus`/`Banknote`/`BookOpen`) in a coloured pill, event description, date/time, a `ChevronRight` link icon. Limit to 8 items, "View All Activity" link at the bottom.

**Quick Actions row** between KPI cards and charts: `flex gap-3`. Three `Button variant="outline" size="sm"` items: "New Admission", "Mark Attendance", "Record Payment" — each with a relevant Lucide icon.

---

## 18. Phase 10 — Parents Portal

### 18.1 Layout

The Parents Portal is a completely separate visual surface. It uses a simpler layout — no sidebar, a top navigation bar only:

- `sticky top-0` nav: institution logo + name (`font-urdu text-lg`) + child switcher (if multiple children) + dark mode toggle + sign out button.
- `max-w-4xl mx-auto px-4 py-6` content container.
- `bg-muted/30` full-page background.

### 18.2 Parent Dashboard

**Child selector:** If more than one child is linked, a horizontal scrollable row of child cards at the top. Each: avatar + name (`font-urdu font-semibold`) + roll number. Selected child has `border-primary` border.

**Child summary card:** `Card p-6 rounded-2xl`. Photo (or initials avatar 64×64) + name (`font-urdu text-2xl font-bold`) + roll number + category/class + admission date. Status `Badge`.

**Info grid** (2×2): Attendance this month (%), Last Fee Status (`Badge`), Last Exam Result, Next Exam Date.

**Tab navigation:** Attendance · Fees · Results · Notices

**Attendance tab:** Monthly attendance calendar (same heatmap as student profile). Summary row below.

**Fees tab:** Fee history table (Month, Due, Paid, Status). Outstanding amount in `text-destructive`.

**Results tab:** Exam results table (Exam Series, Subject, Marks, Total, Grade). DMC download button per row.

**Notices tab:** Announcement cards (Date, Title, body text — both Urdu + English where available).

### 18.3 Parent Login Page

Same two-column structure as the main login page. Left panel in `bg-primary`. Right panel has: heading "Parent Portal" + Urdu subtitle, Roll Number input (bilingual, with `font-urdu` placeholder), Password input, submit button "لاگ ان کریں".

---

## 19. Phase 11 — Institutional Website

### 19.1 Public Website Layout

The website uses a dedicated layout component (no AppShell). A persistent top navigation bar and a footer.

**Navbar:** `sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-50`. Logo + institution name (`font-urdu font-heading text-lg`) + nav links (Home, Madrassa, School, Gallery, Notices, Contact) + "Online Admission" CTA button (primary).

**Footer:** `bg-card border-t border-border`. Three columns: institution info + Urdu name + address, quick links, contact details. Bottom bar: copyright line.

### 19.2 Home Page (`/website`)

**Hero section:** Full-width, `min-h-[70vh]` with a textured/patterned `bg-primary/5` background (geometric Islamic pattern using CSS or SVG — no gradients). Centred content: mosque icon (64×64), institution name in Urdu (`font-urdu text-5xl font-bold`), tagline in Urdu below, two CTA buttons ("Online Admission" primary + "Learn More" outline).

**Stats bar:** `bg-primary text-primary-foreground py-6`. Four stats: Total Students, Years Established, Teachers, Graduates — each centred with large number + label.

**Highlights section:** Three `Card` components — About Madrassa, About School, Online Admission. Each with icon, heading, description, and "Learn More" link.

**Latest Notices section:** Three announcement preview cards. "View All" link.

**Gallery preview:** `grid grid-cols-2 md:grid-cols-4 gap-2`. Eight photo placeholder cards (`bg-muted rounded-xl aspect-square`) with `ImageIcon` centred. "View Full Gallery" link below.

### 19.3 Gallery Page (`/website/gallery`)

**Filter tabs:** All, Photos, Videos.

**Masonry-style grid** (`columns-2 md:columns-3 lg:columns-4 gap-4`). Each item: `rounded-2xl overflow-hidden bg-muted break-inside-avoid mb-4`. Photo placeholder shows `ImageIcon`. Video placeholder shows `Play` icon overlay + thumbnail background.

### 19.4 Contact Page (`/website/contact`)

Two-column layout: contact information card on the start side (address in Urdu + English, phone, email, map placeholder with `MapPin` icon) and a contact form on the end side (Name bilingual, Phone bilingual, Message `Textarea` bilingual, Submit button).

---

## 20. Settings Page (`/settings`)

**Tab navigation:** General · Appearance · Roll Number Config · Categories (shortcut link) · About

**General tab:** Institution Name (English + Urdu), Address, Phone, Email, Logo Upload.

**Appearance tab:** Dark/Light mode toggle (large visual toggle cards, not just a switch), Font size preference.

**Roll Number Config tab:** For each subcategory/class, a table row showing current prefix + an editable `Input`. "Save Changes" button at the bottom.

---

## 21. Component Checklist for the Agent

The agent installs the following shadcn components. Run RTL migration after every batch install:

```bash
bunx shadcn@latest add button input label textarea select checkbox radio-group switch
bunx shadcn@latest add card badge avatar separator dialog sheet
bunx shadcn@latest add table dropdown-menu context-menu
bunx shadcn@latest add tabs breadcrumb pagination
bunx shadcn@latest add form
bunx shadcn@latest add calendar date-picker
bunx shadcn@latest add alert alert-dialog toast
bunx shadcn@latest add progress skeleton
bunx shadcn@latest add sidebar navigation-menu
bunx shadcn@latest add command popover
bunx shadcn@latest add scroll-area collapsible
bunx shadcn@latest add tooltip
bunx shadcn@latest migrate rtl
```

After all installs, run the RTL migration one final time and manually verify the Sidebar component's border direction.

---

## 22. Acceptance Criteria — Per Phase

### Phase 1
- Login page matches the two-column specification with the Urdu left panel.
- Submitting the form shows the loading state. On success, redirects to `/dashboard` (mocked).
- User management table renders with all columns, status badges, and the three-dot action menu.
- Create User dialog shows the auto-generated password section and copy button.
- Credentials card overlay renders post-creation.

### Phase 2
- Sidebar renders correctly in RTL — icons on the outer (right/start in LTR, right/start in RTL) edge.
- System tab switcher switches nav items with a visible animation.
- Active nav item is visually distinct at all times.
- Topbar breadcrumb updates with the current route.
- Dark mode toggle switches the theme and persists via localStorage.

### Phase 3
- Stepper shows correct step ordering in RTL (step 1 on the right).
- Step 2 renders three card-style radio options.
- Step 3 cascades correctly (subcategory select populates after category).
- Step 4 sibling search shows results and allows adding/removing siblings.
- Step 5 shows full read-only summary. Submit disabled until checkbox checked.
- Success state shows a roll number in large primary-coloured text.
- Queue table shows pending/accepted/rejected rows with filter tabs.
- Public form renders without the sidebar, with its own header/footer.

### Phase 4–5 (Madrassa & School)
- Filter bar correctly filters the mock data table.
- Student profile tabs all render without errors.
- Attendance heatmap shows colour-coded cells per day.
- Fee table shows status badges and the Record Payment dialog.
- Exam seating plan renders a grid with class colour coding.
- Results table shows per-subject columns.
- DMC dialog renders a print-ready layout.

### Phase 6–8 (Teachers, ID Cards, Reports, Inventory, Finance)
- Teacher card grid renders all mock teachers.
- ID card generator shows a live preview panel.
- Report pages render chart and table correctly using recharts.
- Finance charts use the correct colour palette (chart-1 through chart-5).
- Income vs expense bar chart correctly groups bars by month.

### Phase 9 (Dashboard)
- All 5 KPI cards render with sparkline charts.
- Enrollment trend line chart renders both Madrassa and School lines.
- Recent activity feed renders 8 mock events.
- Quick action buttons are visible and correctly labelled.

### Phase 10–11 (Parents Portal & Website)
- Parent portal renders without the admin sidebar.
- Child switcher appears when mock data has multiple children.
- Public website home page renders the hero, stats bar, and gallery grid.
- Navbar is sticky and has the Online Admission CTA.

---

*End of MSMIS Frontend UI Implementation Brief.*  
*This document covers all phases. Replace mock data with TanStack Query hooks when the backend is ready — component structure requires no changes.*


---

## 23. Phase 5 — School Module (Extended)

### 13.3 School Student Profile (`/school/students/$id`)

Identical tab structure to the Madrassa student profile with these differences:

**Profile header card additions:** Class badge + Section badge shown alongside the roll number.

**Enrollment Details card:** Class, Section, Roll No, Monthly Fee, Scholarship status (if fee is PKR 0, show a `Badge` reading "Full Scholarship / مکمل وظیفہ" in `text-chart-1`), Admission Date.

**Exams tab** (replaces History in the school profile): A list of all exam series the student has participated in. Each series is a collapsible `Collapsible` card showing: series name + date + overall result `Badge` (Pass/Fail) in the header. Expanded view: per-subject results table (Subject, Max Marks, Obtained, Grade). DMC download button at the bottom of each expanded section.

**Promotion / Demotion Dialog** (accessible from row actions + profile header):
- `Dialog` with two tabs: Promote and Demote.
- Promote tab: target class/section `Select` (pre-filtered to classes above current), effective date `DatePicker`, notes `Textarea` (optional), "Promote Student / ترقی دیں" button.
- Demote tab: target class/section `Select`, reason `Textarea` (required, `min-h-[80px]`), "Demote Student / تنزلی دیں" button in `variant="destructive"`.
- Both tabs show a preview of the change: current → new with an arrow (`ArrowRight` icon in `text-primary`).

**Mark Exit Dialog** (accessible from row actions + profile header):
- `Dialog` with a `RadioGroup` of four exit types rendered as cards: Graduation (🎓), Dropout (🚪), Transfer (🔄), Expulsion (❌).
- Selected type shows additional fields: Graduation → certificate date + ceremony date; Dropout → reason required; Transfer → destination institution + transfer certificate date; Expulsion → reason required + approval reference.
- Warning banner: `Alert` with `AlertTriangle` icon in `text-amber-500`, message "This action cannot be undone. The student record will be permanently archived. / یہ عمل ناقابل واپسی ہے".
- Confirm button is `variant="destructive"` and disabled until the type is selected and required fields are filled.

### 13.5 Class & Section Management

Accessible from Settings → Classes or from a "Manage Classes" link in the School student list filter bar.

Same two-panel layout as Madrassa Categories:
- Left panel: class list with drag-reorder (`GripVertical` handle), class name + Urdu name + roll prefix (`font-mono text-xs`) per row.
- Right panel: sections for the selected class — section name, student count, actions.
- Add Class Dialog: Name (e.g. "Grade 5"), Name Urdu (e.g. "پانچویں جماعت"), Roll Prefix (`font-mono` input).
- Add Section Dialog: Section name (A, B, C…).

---

## 24. Interactions & Animation Guide

Lovable must implement the following interaction patterns consistently. These are not optional polish — they are part of the acceptance criteria.

### Transition Primitives

All transitions use the `tw-animate-css` classes available through the import. The agent uses these utility classes:

```
animate-in / animate-out       → entrance / exit base
fade-in / fade-out             → opacity transitions
slide-in-from-top-2            → dropdown / menu enter
slide-in-from-bottom-4         → sheet / drawer enter
zoom-in-95 / zoom-out-95       → dialog enter / exit
duration-150 / duration-200    → timing for micro-interactions
duration-300                   → timing for larger layout changes
```

### Specific Interaction Specs

**Sidebar system tab switch:**
- Nav items fade out (`opacity-0 duration-100`) then fade in (`opacity-100 duration-150`) with a 50ms delay between the two — creating a clean swap feel.
- The active tab indicator slides with `transition-all duration-200 ease-out`.

**Dialog open/close:**
- Enter: `animate-in fade-in-0 zoom-in-95 duration-200`.
- Exit: `animate-out fade-out-0 zoom-out-95 duration-150`.
- Overlay: `animate-in fade-in-0 duration-200`.

**Sheet (drawer) open/close — used for mobile sidebars and detail panels:**
- Enter: `animate-in slide-in-from-end duration-300` (RTL — slides from the start side).
- Exit: `animate-out slide-out-to-end duration-200`.

**Toast notifications:**
- Enter: `animate-in slide-in-from-bottom-4 fade-in duration-300`.
- Auto-dismiss after 4 seconds.
- All toasts are specific. Examples:
  - Admission success: "Admission confirmed — Roll No. QAD-001 assigned. / داخلہ مکمل ہوا".
  - Fee recorded: "Payment of PKR 1,500 recorded for [Name]. / ادائیگی محفوظ".
  - User created: "New teacher account created. Share credentials. / اکاؤنٹ بن گیا".

**Table row actions:**
- `DropdownMenu` opens with `slide-in-from-top-2 duration-150`.
- Destructive items (Delete, Deactivate, Mark Exit) have `text-destructive` colour and a `Separator` above them.

**Form field focus:**
- All `Input`, `Textarea`, `Select` have `ring-2 ring-primary/30` on focus — already handled by the CSS token system.
- Validation error fields get `border-destructive` and a `shake` animation: add a `data-error` attribute and the CSS `[data-error] { animation: shake 0.3s ease; }` keyframe.

**Button loading state:**
```tsx
<Button disabled={isSubmitting}>
  {isSubmitting ? (
    <><Loader2 className="w-4 h-4 animate-spin me-2" /> جمع ہو رہا ہے...</>
  ) : (
    'داخلہ مکمل کریں'
  )}
</Button>
```

**Skeleton loading — shape rules:**
- Text line → `Skeleton className="h-4 w-[X%] rounded"` where X varies per line to look natural (not all the same width).
- Avatar → `Skeleton className="w-10 h-10 rounded-xl"`.
- KPI card → `Skeleton className="h-8 w-24 rounded"` for the number + `Skeleton className="h-3 w-16 rounded mt-2"` for the label.
- Table row → use `TableRow` containing `TableCell` with `Skeleton` inside, matching column widths proportionally.

**Page transition:**
- Each route renders its content with `animate-in fade-in duration-200`. Apply `animate-in` class to the `<main>` element's direct child wrapper, not the entire layout.

---

## 25. Mock Data Samples

The agent populates these files with at minimum 15–20 realistic records each. Samples below show the required shape.

### `src/mock/students.ts`

```ts
export type Student = {
  id: string
  nameUrdu: string
  nameEnglish: string
  dateOfBirth: string        // ISO date
  gender: 'male' | 'female'
  system: 'madrassa' | 'school' | 'both'
  address: string
  photoUrl: string | null
  guardianName: string
  guardianCnic: string
  guardianPhone: string
  siblingIds: string[]
  status: 'active' | 'graduated' | 'dropout' | 'transferred' | 'expelled'
  admissionSource: 'admin' | 'online'
  createdAt: string
}

export type MadrassaEnrollment = {
  id: string
  studentId: string
  categoryId: string
  subcategoryId: string
  rollNumber: string
  monthlyFeePaysa: number    // PKR × 100 to avoid float
  admissionDate: string
  status: 'active' | 'promoted' | 'demoted' | 'exited'
}

// Sample:
export const mockStudents: Student[] = [
  {
    id: 'stu-001',
    nameUrdu: 'محمد عبداللہ',
    nameEnglish: 'Muhammad Abdullah',
    dateOfBirth: '2008-03-15',
    gender: 'male',
    system: 'madrassa',
    address: 'گلی نمبر 5، محلہ شاہ فیصل، کراچی',
    photoUrl: null,
    guardianName: 'محمد اکرم',
    guardianCnic: '42201-1234567-1',
    guardianPhone: '0312-3456789',
    siblingIds: [],
    status: 'active',
    admissionSource: 'admin',
    createdAt: '2024-02-10T09:00:00Z',
  },
  // ... 19 more records
]
```

### `src/mock/categories.ts`

```ts
export type Category = {
  id: string
  name: string
  nameUrdu: string
  sortOrder: number
}

export type Subcategory = {
  id: string
  categoryId: string
  name: string
  nameUrdu: string
  rollPrefix: string
  sortOrder: number
}

export const mockCategories: Category[] = [
  { id: 'cat-001', name: 'Qaida', nameUrdu: 'قاعدہ', sortOrder: 1 },
  { id: 'cat-002', name: 'Nazira', nameUrdu: 'ناظرہ', sortOrder: 2 },
  { id: 'cat-003', name: 'Hifz', nameUrdu: 'حفظ', sortOrder: 3 },
  { id: 'cat-004', name: 'Ilm', nameUrdu: 'علم', sortOrder: 4 },
]

export const mockSubcategories: Subcategory[] = [
  { id: 'sub-001', categoryId: 'cat-001', name: 'Level 1', nameUrdu: 'درجہ اول', rollPrefix: 'QAD1', sortOrder: 1 },
  { id: 'sub-002', categoryId: 'cat-001', name: 'Level 2', nameUrdu: 'درجہ دوم', rollPrefix: 'QAD2', sortOrder: 2 },
  { id: 'sub-003', categoryId: 'cat-002', name: 'Level 1', nameUrdu: 'درجہ اول', rollPrefix: 'NAZ1', sortOrder: 1 },
  { id: 'sub-004', categoryId: 'cat-003', name: 'Hizb 1', nameUrdu: 'حزب اول', rollPrefix: 'HFZ1', sortOrder: 1 },
  { id: 'sub-005', categoryId: 'cat-004', name: 'Darjah 1', nameUrdu: 'درجہ اول', rollPrefix: 'ILM1', sortOrder: 1 },
  { id: 'sub-006', categoryId: 'cat-004', name: 'Darjah 2', nameUrdu: 'درجہ دوم', rollPrefix: 'ILM2', sortOrder: 2 },
]
```

### `src/mock/classes.ts`

```ts
export type SchoolClass = {
  id: string
  name: string
  nameUrdu: string
  rollPrefix: string
  sortOrder: number
}

export type Section = {
  id: string
  classId: string
  name: string
  sortOrder: number
}

export const mockClasses: SchoolClass[] = [
  { id: 'cls-001', name: 'Grade 1', nameUrdu: 'پہلی جماعت', rollPrefix: 'G1', sortOrder: 1 },
  { id: 'cls-002', name: 'Grade 2', nameUrdu: 'دوسری جماعت', rollPrefix: 'G2', sortOrder: 2 },
  { id: 'cls-003', name: 'Grade 3', nameUrdu: 'تیسری جماعت', rollPrefix: 'G3', sortOrder: 3 },
  { id: 'cls-004', name: 'Grade 4', nameUrdu: 'چوتھی جماعت', rollPrefix: 'G4', sortOrder: 4 },
  { id: 'cls-005', name: 'Grade 5', nameUrdu: 'پانچویں جماعت', rollPrefix: 'G5', sortOrder: 5 },
]

export const mockSections: Section[] = [
  { id: 'sec-001', classId: 'cls-001', name: 'A', sortOrder: 1 },
  { id: 'sec-002', classId: 'cls-001', name: 'B', sortOrder: 2 },
  { id: 'sec-003', classId: 'cls-002', name: 'A', sortOrder: 1 },
  { id: 'sec-004', classId: 'cls-003', name: 'A', sortOrder: 1 },
  { id: 'sec-005', classId: 'cls-003', name: 'B', sortOrder: 2 },
]
```

### `src/mock/finance.ts`

```ts
export type FinanceRecord = {
  id: string
  date: string
  type: 'income' | 'expense'
  category: 'fees' | 'donation' | 'charity' | 'inventory' | 'salary' | 'miscellaneous'
  categoryUrdu: string
  description: string
  amountPaysa: number    // PKR × 100
  source: string
}

// Sample income record:
// { id: 'fin-001', date: '2025-04-01', type: 'income', category: 'fees',
//   categoryUrdu: 'فیس', description: 'Monthly fee collection — Madrassa',
//   amountPaysa: 4500000, source: 'Fee Module' }
```

### `src/mock/users.ts`

```ts
export type SystemUser = {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'admin' | 'teacher' | 'parent'
  isActive: boolean
  mustChangePassword: boolean
  createdBy: string | null
  createdAt: string
}

export const mockCurrentUser: SystemUser = {
  id: 'usr-000',
  name: 'Abdul Rahman',
  email: 'admin@msmis.pk',
  role: 'super_admin',
  isActive: true,
  mustChangePassword: false,
  createdBy: null,
  createdAt: '2024-01-01T00:00:00Z',
}

export const mockUsers: SystemUser[] = [
  {
    id: 'usr-001', name: 'Maulana Tariq', email: 'tariq@msmis.pk',
    role: 'admin', isActive: true, mustChangePassword: false,
    createdBy: 'usr-000', createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'usr-002', name: 'Ustad Bilal', email: 'bilal@msmis.pk',
    role: 'teacher', isActive: true, mustChangePassword: true,
    createdBy: 'usr-001', createdAt: '2024-02-01T09:00:00Z',
  },
  // ... more records
]
```

### `src/mock/attendance.ts`

```ts
export type AttendanceRecord = {
  id: string
  studentId: string
  date: string          // ISO date
  status: 'present' | 'absent' | 'late'
  markedAt: string
  markedBy: string      // user id
}

// Attendance heatmap helper — generate 90 days of mock data:
export function generateMockAttendance(studentId: string): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  const today = new Date()
  for (let i = 90; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dow = date.getDay()
    if (dow === 0) continue   // Skip Sundays
    const rand = Math.random()
    records.push({
      id: `att-${studentId}-${i}`,
      studentId,
      date: date.toISOString().split('T')[0],
      status: rand > 0.12 ? 'present' : rand > 0.06 ? 'late' : 'absent',
      markedAt: date.toISOString(),
      markedBy: 'usr-001',
    })
  }
  return records
}
```

### `src/mock/exams.ts`

```ts
export type ExamSeries = {
  id: string
  name: string
  nameUrdu: string
  type: 'quarterly' | 'midyear' | 'annual'
  status: 'upcoming' | 'active' | 'completed'
  startDate: string
  endDate: string
  subjects: ExamSubject[]
}

export type ExamSubject = {
  id: string
  seriesId: string
  name: string
  nameUrdu: string
  totalMarks: number
  passingMarks: number
  examDate: string | null
  examTime: string | null
}

export type ExamResult = {
  id: string
  studentId: string
  subjectId: string
  marksObtained: number
  isAbsent: boolean
}

export const mockExamSeries: ExamSeries[] = [
  {
    id: 'exam-001',
    name: 'First Term Examination',
    nameUrdu: 'پہلا سہ ماہی امتحان',
    type: 'quarterly',
    status: 'completed',
    startDate: '2025-03-01',
    endDate: '2025-03-10',
    subjects: [
      { id: 'subj-001', seriesId: 'exam-001', name: 'Mathematics', nameUrdu: 'ریاضی', totalMarks: 100, passingMarks: 40, examDate: '2025-03-01', examTime: '09:00' },
      { id: 'subj-002', seriesId: 'exam-001', name: 'Urdu', nameUrdu: 'اردو', totalMarks: 100, passingMarks: 40, examDate: '2025-03-03', examTime: '09:00' },
      { id: 'subj-003', seriesId: 'exam-001', name: 'English', nameUrdu: 'انگریزی', totalMarks: 100, passingMarks: 40, examDate: '2025-03-05', examTime: '09:00' },
      { id: 'subj-004', seriesId: 'exam-001', name: 'Science', nameUrdu: 'سائنس', totalMarks: 75, passingMarks: 30, examDate: '2025-03-07', examTime: '09:00' },
      { id: 'subj-005', seriesId: 'exam-001', name: 'Islamiyat', nameUrdu: 'اسلامیات', totalMarks: 50, passingMarks: 20, examDate: '2025-03-10', examTime: '09:00' },
    ],
  },
]
```

### `src/mock/applications.ts`

```ts
export type Application = {
  id: string
  refNumber: string          // APP-XXXX format
  nameUrdu: string
  nameEnglish: string
  dateOfBirth: string
  gender: 'male' | 'female'
  system: 'madrassa' | 'school' | 'both'
  address: string
  subcategoryId: string | null
  classId: string | null
  guardianName: string
  guardianPhone: string
  status: 'pending' | 'accepted' | 'rejected'
  rejectionReason: string | null
  submittedAt: string
}

export const mockApplications: Application[] = [
  {
    id: 'app-001', refNumber: 'APP-0001',
    nameUrdu: 'زید احمد', nameEnglish: 'Zaid Ahmed',
    dateOfBirth: '2012-06-20', gender: 'male',
    system: 'madrassa', address: 'گلی 3، لیاقت آباد، کراچی',
    subcategoryId: 'sub-001', classId: null,
    guardianName: 'احمد علی', guardianPhone: '0333-1234567',
    status: 'pending', rejectionReason: null,
    submittedAt: '2025-05-10T14:30:00Z',
  },
  // ... more records with mix of pending/accepted/rejected
]
```

---

## 26. `formatPKR` Utility

This utility must be implemented in `src/lib/formatters.ts` and used everywhere a monetary value is displayed. Never format PKR amounts inline in components.

```ts
// Amounts are stored in paisa (PKR × 100) to avoid float errors.
export function formatPKR(amountPaysa: number): string {
  const isNegative = amountPaysa < 0
  const absAmount = Math.abs(amountPaysa)
  const rupees = absAmount / 100
  const formatted = new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees)
  return isNegative ? `−PKR ${formatted}` : `PKR ${formatted}`
}

// Usage: formatPKR(150000) → "PKR 1,500"
// Usage: formatPKR(-50000) → "−PKR 500"
// For display on cards, show without decimals (as above).
// For receipts and invoices, use toFixed(2) variant.

export function formatPKRDetailed(amountPaysa: number): string {
  const isNegative = amountPaysa < 0
  const absAmount = Math.abs(amountPaysa) / 100
  const formatted = absAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })
  return isNegative ? `−PKR ${formatted}` : `PKR ${formatted}`
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-PK', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(new Date(date))
}

export function formatUrduDate(date: string | Date): string {
  return new Intl.DateTimeFormat('ur-PK', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date(date))
}

export function generateRefNumber(index: number): string {
  return `APP-${String(index).padStart(4, '0')}`
}

export function gradeFromPercentage(pct: number): string {
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  return 'F'
}
```

---

## 27. Theming & Dark Mode

### Implementation

Dark mode is toggled by adding the `dark` class to the `<html>` element. Store the preference in `localStorage` under the key `msmis-theme`. On app initialisation, read from `localStorage` before the first render to avoid a flash of the wrong theme.

```ts
// src/lib/theme.ts
export type Theme = 'light' | 'dark' | 'system'

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export function getStoredTheme(): Theme {
  return (localStorage.getItem('msmis-theme') as Theme) ?? 'system'
}

export function setStoredTheme(theme: Theme): void {
  localStorage.setItem('msmis-theme', theme)
  applyTheme(theme)
}
```

Call `applyTheme(getStoredTheme())` at the very top of the app entry file, before any React render.

### Dark Mode Visual Checklist

The agent must verify the following render correctly in dark mode:

- Sidebar uses `bg-sidebar` (dark value: `oklch(0.21 0.006 285.885)`) — not `bg-card` or `bg-background`.
- KPI sparkline charts use `stroke-primary` in both modes.
- Table header uses `bg-muted/40` — in dark mode this resolves to a subtle dark tint, not a harsh block.
- Status badge colours — all use `/10` alpha backgrounds so they adapt to both light and dark modes automatically.
- The login page left panel uses `bg-primary` (teal) — verify the text contrast in both modes by checking `text-primary-foreground` renders legibly.
- Charts use the `--chart-*` token colours — these are defined identically in both modes (green spectrum) and require no dark-mode override.

---

## 28. Print Stylesheet

Three screens require print output: DMC, ID Cards, Seating Plan. Add the following to `globals.css`:

```css
@media print {
  /* Hide everything except the print target */
  body > * { display: none; }
  .print-target { display: block !important; }

  /* Reset backgrounds and borders for print */
  .print-target * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
  }

  /* DMC-specific */
  .dmc-card {
    width: 210mm;
    min-height: 148mm;
    padding: 12mm;
    font-family: var(--font-urdu);
    border: 1px solid #000;
  }

  /* ID Card — credit card size */
  .id-card-print {
    width: 85.6mm;
    height: 53.98mm;
    border: 1px solid #000;
    border-radius: 4mm;
    overflow: hidden;
  }

  /* Seating plan */
  .seating-grid-print {
    display: grid;
    gap: 4mm;
    page-break-inside: avoid;
  }
}
```

Each print-triggering `Button` wraps its target in a `div className="print-target hidden"` that becomes visible only in print media. The button calls `window.print()` on click.

---

*End of MSMIS Frontend UI Implementation Brief — Extended.*


---

## 29. Responsive Design Specification

### Breakpoint Strategy

The app uses Tailwind's default breakpoints. The agent applies these layout rules at each breakpoint:

| Breakpoint | Sidebar | Content | Tables | Grids |
|---|---|---|---|---|
| `< sm` (< 640px) | Hidden, bottom nav | Full width, px-4 | Horizontal scroll | 1 col |
| `sm` (640–768px) | Hidden, icon rail (48px) | Full width | Horizontal scroll | 1–2 col |
| `md` (768–1024px) | Collapsed (64px icons) | Adjusted | Full display | 2 col |
| `lg` (1024–1280px) | Full (240px) | Adjusted | Full display | 2–3 col |
| `xl` (1280px+) | Full (240px) | Max content width | Full display | 3–4 col |

### Mobile Bottom Navigation

On screens `< md`, the sidebar is replaced with a bottom navigation bar (`fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border`):

Five tabs (icon + Urdu label below): Dashboard (ڈیش بورڈ), Admission (داخلہ), System (active system icon — switches between 🕌 and 🏫), Reports (رپورٹ), Settings (ترتیبات).

The System tab opens a bottom sheet (`vaul` Drawer) that contains the full system tab switcher and the current system's nav items as a list.

### Table Responsiveness

Tables that cannot fit on small screens use `overflow-x-auto` wrapping with a `min-w-[600px]` on the `Table` element. Do not collapse table columns — horizontal scrolling is preferred over information loss.

For the student list on mobile, add a card-view alternative: a `flex flex-col gap-3` list of compact student cards, each showing name (`font-urdu`), roll number, subcategory, and status badge. Toggle between table and card view with a `LayoutGrid` / `List` icon button in the filter bar. Default to card view on `< md`.

### Form Responsiveness

All two-column form grids (`grid grid-cols-2`) collapse to single column on `< sm`:
```
grid grid-cols-1 sm:grid-cols-2
```

The admission stepper on mobile shows only the current step label and a `3 / 5` progress indicator (`text-xs text-muted-foreground`) instead of all five circles, to save horizontal space. Show the full stepper on `md` and above.

---

## 30. Madrassa Module — Extended Specs

### 30.1 Promotion & Demotion Dialog (Madrassa)

Accessible from: student list row actions + student profile header actions.

`Dialog` with two tabs rendered as a `Tabs` component inside the dialog content.

**Promote tab:**
- Current position display: `rounded-xl bg-muted p-3 flex items-center gap-3` showing Category badge + Subcategory badge + `ArrowRight` icon (`text-muted-foreground`) + "New Position" placeholder.
- Target Category `Select` (shows all categories).
- Target Subcategory `Select` (cascades from target category, populates on category select).
- After selection, the "New Position" placeholder updates with the selected target — the arrow animates `text-primary`.
- Effective Date `DatePicker` (defaults to today).
- Notes `Textarea` (optional, bilingual label).
- Submit: "ترقی دیں" button (primary).

**Demote tab:**
- Same current position display.
- Target Category + Subcategory selects (filters to same or lower categories).
- Reason `Textarea` (required, `min-h-[100px]`, bilingual label "تنزلی کی وجہ / Demotion Reason").
- Warning `Alert` in `text-amber-600`: "تنزلی کا یہ ریکارڈ طالب علم کی تاریخ میں ہمیشہ کے لیے محفوظ ہوگا".
- Submit: "تنزلی دیں" in `variant="destructive"`. Disabled until reason is filled.

### 30.2 Student Exit Dialog (Madrassa)

`Dialog` (`max-w-lg`).

**Step 1 — Exit Type selection:** Four large radio cards in a `grid grid-cols-2 gap-3`:
- 🎓 Graduation / فراغت
- 🚪 Dropout / ترک تعلیم
- 🔄 Transfer / انتقال
- ❌ Expulsion / اخراج

Each card: emoji (text-2xl), English label (`font-heading font-semibold text-sm`), Urdu label (`font-urdu text-xs text-muted-foreground`). Selected: `border-2 border-primary bg-primary/5`. Unselected: `border border-border hover:border-primary/30`.

**Step 2 — Type-specific fields** (renders below the cards after selection):

- **Graduation:** Graduation Date `DatePicker` (required), Certificate Number `Input` (optional), Ceremony Date `DatePicker` (optional).
- **Dropout:** Reason `Textarea` (required, `min-h-[80px]`), Last Attendance Date `DatePicker`.
- **Transfer:** Destination Institution `Input` (bilingual, required), Transfer Certificate No `Input` (optional), Transfer Date `DatePicker` (required).
- **Expulsion:** Reason `Textarea` (required, `min-h-[80px]`), Approval Reference `Input` (optional), Effective Date `DatePicker` (required).

**Warning banner** (always visible, below fields): `rounded-xl border border-amber-300/50 bg-amber-50 dark:bg-amber-950/30 p-3 flex gap-2` with `AlertTriangle` icon in `text-amber-600` and Urdu text: "یہ عمل ناقابل واپسی ہے — طالب علم کا ریکارڈ آرکائیو میں منتقل ہوگا".

**Footer:** Cancel (left) + "باہر کریں" in `variant="destructive"` (right). The destructive button is disabled until all required fields for the selected type are filled.

### 30.3 Fee Receipt Dialog

Triggered by the `Printer` icon in the fees table.

`Dialog` (`max-w-md`) showing a print-ready receipt layout within the dialog:

```
┌──────────────────────────────────┐
│  [Institution Logo]              │
│  ادارہ کا نام                    │
│  فیس کی رسید / Fee Receipt       │
├──────────────────────────────────┤
│  طالب علم: محمد عبداللہ          │
│  رول نمبر: QAD1-007              │
│  ماہ: اپریل ۲۰۲۵                 │
├──────────────────────────────────┤
│  واجب الادا:          PKR 1,500  │
│  ادا شدہ:             PKR 1,500  │
│  تاریخ ادائیگی:   01/04/2025    │
│  بقایا:                   PKR 0  │
├──────────────────────────────────┤
│  دستخط: _____________            │
└──────────────────────────────────┘
```

All text inside is `font-urdu`. All amounts use `formatPKR`. "Print Receipt / رسید پرنٹ کریں" button at the bottom of the dialog triggers `window.print()` with the `print-target` class.

---

## 31. School Module — Extended Specs

### 31.1 School Fee Management (`/school/fees`)

Identical layout to Madrassa fees page with:
- Scholarship filter: a `Switch` in the filter bar labelled "Show Scholarship Students Only" — filters to students with `monthlyFeePaysa === 0`.
- Scholarship students have their "Monthly Fee" cell show "وظیفہ / Scholarship" as a `Badge` in `text-chart-1` instead of PKR 0.
- "Set Fee" action in the row `DropdownMenu` opens a dialog to update the monthly fee (admin only).

### 31.2 Exam Schedule View

Inside the Exam Detail page (`/school/exams/$id`), a `Tabs` component with:

**Schedule tab:** A table with columns: Subject (Urdu + English), Date, Time, Duration (calculated from total marks × 1.5 min), Venue/Room (optional text field). An "Edit Schedule" icon button per row opens an inline edit form.

**Timetable view tab:** A 5-column weekly grid (Sat–Wed, matching Pakistani school calendar). Each day column shows the subjects scheduled that day as coloured cards (`bg-primary/10 border border-primary/20 rounded-lg p-2`). Days with no exam show `bg-muted/30` with a dash.

### 31.3 Results Entry

Inside `ExamResults` page (`/school/exams/$id/results`), a **Mark Entry mode** toggle button in the PageHeader actions: "Enter Marks / نمبر درج کریں" (pencil icon, `variant="outline"`).

When mark entry mode is active:
- The table cells for marks become `Input` fields (`type="number"`, `min="0"`, `max={subject.totalMarks}`, `className="w-16 h-8 text-center text-sm p-1"`).
- Invalid marks (exceeding total) get `border-destructive` immediately on input.
- A sticky "Save All Marks / تمام نمبر محفوظ کریں" bar appears at the bottom of the viewport (`fixed bottom-0 inset-x-0 bg-background border-t border-border p-4 flex justify-end gap-3`).
- Discard Changes + Save Marks buttons in the sticky bar.

**Grade calculation** is automatic: percentage = (total obtained / total possible) × 100, then `gradeFromPercentage()` from the formatters utility. Rendered in real time as marks are entered.

---

## 32. Reports Module — Extended Specs

### 32.1 Monthly Report (`/reports/monthly`)

**Month selector** in PageHeader actions: previous/next arrow buttons + current month display (`text-sm font-medium`).

**Report structure** (scrollable, print-ready layout):

1. **Header section** (for print): Institution name, logo, month + year, "ماہانہ رپورٹ" title in large `font-urdu`.

2. **Attendance summary card:** Total school days, average attendance %, best attendance day, worst attendance day.

3. **Fee collection card:** Total due, total collected, outstanding, collection rate as a `Progress` bar (`h-3 rounded-full`, filled with `bg-chart-1`).

4. **Enrollment changes card:** New admissions this month, exits this month (with type breakdown), net change (`+N` in `text-chart-1` or `-N` in `text-destructive`).

5. **Category-wise attendance table:** One row per subcategory/class showing present %, absent %, trend vs last month (arrow icon).

6. **Exam activity** (if any exams occurred this month): exam series names, pass rates.

**Export bar** (sticky at bottom on desktop): "Export PDF" + "Export Excel" buttons.

### 32.2 Annual Report (`/reports/annual`)

**Year selector** in PageHeader: a `Select` with available years.

Same structure as Monthly Report but with:
- 12-month attendance trend `recharts AreaChart` (full width).
- Year-over-year enrollment comparison `recharts BarChart` (current year vs previous year, two bars per month).
- Financial year summary with income/expense `recharts BarChart` (monthly breakdown).
- Top 10 students by attendance rate (table).
- Graduation list (table of all students who graduated during the year).

### 32.3 Administrative Report (`/reports/attendance` extended)

A dedicated section at the bottom of the attendance report page: **Staff Attendance Summary**.

Table: Teacher Name (`font-urdu`), Total Working Days, Present, Absent, Late, Attendance %, Salary Impact (if absent days exceed threshold, show `text-destructive` deduction amount).

---

## 33. Inventory Module — Extended Specs

### 33.1 Stock History Sheet

Triggered by the "Stock History" item in each row's `DropdownMenu`.

`Sheet` (right-side drawer, `side="end"`):
- Header: Item name (`font-urdu font-heading`) + current quantity badge.
- Timeline of all stock movements: each entry shows date, action type (Purchase / Donation / Gift Distribution / Manual Adjustment), quantity change (`+N` in `text-chart-1` or `-N` in `text-destructive`), balance after, note/source.
- Entries use the same vertical timeline style as the student history tab.

### 33.2 Graduation Gift Distribution

Accessible from a "Graduation Gifts" button in the Inventory PageHeader actions.

`Dialog` (`max-w-xl`):
1. Select graduating students: a searchable multi-select list of students with `graduated` status (or students being graduated this session).
2. Select gift items: for each item in inventory, a row with item name + available quantity + `Input` for quantity to give per student.
3. Preview section: calculates total deduction per item (quantity per student × number of students). Shows warning if any item's deduction exceeds available stock (`text-destructive` row highlight).
4. "Distribute Gifts / تحفے تقسیم کریں" button (disabled if any item is over-stock).

---

## 34. Finance Module — Extended Specs

### 34.1 Transaction Entry Dialogs

**Record Income Dialog:** Category `Select` (Fee Collection / Cash Donation / In-Kind Donation / Charity / Other), Amount `Input` (bilingual, formatted PKR), Date `DatePicker`, Description `Textarea`, Donor Name `Input` (shown when category is Donation). Submit "آمدنی درج کریں".

**Record Expense Dialog:** Category `Select` (Inventory / Teacher Salary / Staff Salary / Utilities / Maintenance / Other), Amount `Input`, Date `DatePicker`, Description `Textarea`, Reference/Invoice No `Input` (optional). Submit "خرچ درج کریں".

Both dialogs: the Amount `Input` accepts numeric input only and formats with thousand separators on blur. Displays PKR equivalent in a `text-sm text-muted-foreground` line below the input as the user types.

### 34.2 Financial Summary Cards

Below the main charts, two side-by-side summary tables:

**Income Sources table:** Category, This Month (PKR), This Year (PKR), % of Total. Row for each income category. Footer row shows totals in `font-bold`.

**Expense Breakdown table:** Same structure for expenses. If any category exceeds budget (mock threshold), the row gets `bg-destructive/5` background and a `TrendingUp` icon in `text-destructive`.

### 34.3 Balance Sheet View

A collapsible section at the bottom of the finance dashboard, triggered by "View Balance Sheet / بیلنس شیٹ دیکھیں":

```
ASSETS                          PKR
  Cash in Hand                1,25,000
  Fee Receivable               45,000
  Inventory Value             2,30,000
  ─────────────────────────────────
  Total Assets               4,00,000

LIABILITIES & EQUITY
  Pending Salaries             85,000
  Other Payables               20,000
  Surplus                     2,95,000
  ─────────────────────────────────
  Total                      4,00,000
```

Rendered as a clean two-column table, `font-heading font-semibold` for section headers, `font-mono text-sm` for amounts. No chart — purely tabular. Print button triggers `window.print()`.

---

## 35. Website CMS — Admin Panel

The admin panel includes a "Website" section in the Settings or a dedicated nav item (visible to super_admin and admin). This section allows managing all public website content without logging into a separate CMS.

### 35.1 Website Content Manager (`/settings/website` or `/website-admin`)

**Tab navigation:** Pages · Gallery · Notices · Contact Info

**Pages tab:** A list of editable pages (Home, About Madrassa, About School, Contact). Clicking a page opens a simple content editor:
- Institution Tagline (Urdu + English `Input`).
- About paragraphs: two `Textarea` fields (Urdu, English) with a character count.
- Key highlights: a repeatable field group (add/remove rows) each with an icon selector (`Select` from a curated list of Lucide icon names) + text (Urdu + English).
- "Save Page / صفحہ محفوظ کریں" button.

**Gallery tab:** Upload area (`border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer`) supporting drag-and-drop + click-to-select. Shows thumbnail grid of uploaded items. Each thumbnail has a hover overlay with Delete (`Trash2`) and Move (`GripVertical` for reorder) actions. A `Select` on each item chooses "Photos" or "Videos" category.

**Notices tab:** A list of all notices with: Title, Urdu Title, Date, Visibility toggle (`Switch`: Show on Website / Show in Parent Portal / Both). A "New Notice" button opens a `Dialog` with Title (English), Title Urdu, Body (English `Textarea`), Body Urdu (`Textarea font-urdu`), Date `DatePicker`, Visibility `CheckboxGroup`.

**Contact Info tab:** Form with Address (Urdu + English), Phone, Email, Google Maps Embed URL (optional, shown as a preview iframe at reduced scale).

---

## 36. Notification System

All toast notifications must follow this spec. The agent uses shadcn `Sonner` (or the shadcn Toast system, whichever is installed). Every toast has:

- An icon (Lucide, 16px, coloured by type).
- A primary English message (specific, not generic).
- An optional Urdu subtitle below in `font-urdu text-xs`.
- Auto-dismiss: 4 seconds for success/info, 6 seconds for errors (so the user can read them).

**Toast inventory (all toasts the app can produce):**

| Trigger | Icon | English Message | Urdu |
|---|---|---|---|
| Admission created | `CheckCircle2` (chart-1) | "Admission successful — Roll No. assigned" | "داخلہ مکمل" |
| Application accepted | `CheckCircle2` | "Application accepted — student record created" | "درخواست منظور" |
| Application rejected | `XCircle` (destructive) | "Application rejected" | "درخواست مسترد" |
| Fee recorded | `Banknote` (chart-1) | "Payment of PKR X recorded for [Name]" | "ادائیگی محفوظ" |
| User created | `UserCheck` (chart-1) | "New [Role] account created successfully" | "اکاؤنٹ بن گیا" |
| User deactivated | `UserX` (amber) | "[Name]'s account has been deactivated" | "اکاؤنٹ غیر فعال" |
| Attendance saved | `CalendarCheck` (chart-1) | "Attendance saved for [date]" | "حاضری محفوظ" |
| Student promoted | `ArrowUp` (chart-1) | "[Name] promoted to [Subcategory]" | "ترقی دی گئی" |
| Student demoted | `ArrowDown` (amber) | "[Name] demoted — record archived" | "تنزلی ریکارڈ" |
| Student exited | `LogOut` (amber) | "Student record archived ([Exit Type])" | "ریکارڈ آرکائیو" |
| Copy to clipboard | `Copy` (info) | "Copied to clipboard" | "کاپی ہو گیا" |
| Save failed | `AlertCircle` (destructive) | "Failed to save — please try again" | "محفوظ نہیں ہوا" |
| Form validation | `AlertCircle` (destructive) | "Please fix the errors before submitting" | "غلطیاں درست کریں" |

---

## 37. Accessibility Checklist

The agent verifies the following before marking any phase complete:

**Keyboard navigation:**
- All interactive elements (buttons, links, inputs, dropdowns) are reachable via `Tab` in logical order.
- `Escape` closes all open dialogs, sheets, dropdowns, and popovers.
- `Enter` and `Space` activate buttons and checkboxes.
- Arrow keys navigate within `RadioGroup`, `Select`, and `DropdownMenu`.
- The sidebar can be navigated entirely with keyboard (Tab through items, Enter to activate).

**Focus management:**
- When a `Dialog` opens, focus moves to the first interactive element inside it.
- When a `Dialog` closes, focus returns to the element that triggered it.
- The stepper's "Next" button receives focus after each step transition.

**ARIA:**
- All `Icon`-only buttons have `aria-label` in both English and Urdu (use English for the aria-label — screen readers handle translation).
- Status badges have `role="status"` and `aria-label` describing the status.
- The sidebar system tab switcher has `role="tablist"` with `role="tab"` on each button and `aria-selected`.
- Tables have `<caption>` with the table title in English.
- Form fields link `Label` to `Input` via `htmlFor` / `id` pairs. Never use placeholder as the only label.

**Colour contrast:**
- All text on coloured backgrounds must meet WCAG AA (4.5:1 for normal text, 3:1 for large text).
- The `text-muted-foreground` on `bg-background` passes in both light and dark modes with the provided tokens.
- Status badges using `/10` alpha backgrounds: verify contrast in both modes. If any badge fails, increase the alpha to `/15` or darken the text colour.

---

## 38. RTL Verification Checklist

The agent manually checks each of these in a browser before marking the RTL implementation complete:

**Layout:**
- [ ] Sidebar appears on the right side of the viewport.
- [ ] Main content area is to the left of the sidebar.
- [ ] Topbar breadcrumb reads right-to-left (current page on the right).
- [ ] Page header actions (buttons) are on the left side (end in RTL).
- [ ] Form labels are right-aligned, values right-aligned in review step.

**Navigation:**
- [ ] Active sidebar item has its accent bar on the right (inner) edge.
- [ ] Nav item icons appear to the right of the text.
- [ ] Breadcrumb separators (`/` or `ChevronRight`) point in the correct RTL direction — use `ChevronLeft` visually in RTL.
- [ ] The system tab switcher has Madrassa on the right (start) and School on the left (end) — matching reading order.

**Components:**
- [ ] `Select` dropdown opens below with the arrow on the left side.
- [ ] `DropdownMenu` opens to the left (end) of the trigger button.
- [ ] `Dialog` is centred and internally LTR for data tables, RTL for Urdu form content.
- [ ] `DatePicker` calendar navigation arrows are reversed (right arrow goes to previous month, left arrow goes to next month).
- [ ] `Checkbox` is to the right of its label text.
- [ ] `Switch` thumb slides right-to-left when turning on (or use logical `start`/`end` positioning).
- [ ] `Progress` bar fills from right to left.
- [ ] `Stepper` step 1 is rightmost, step 5 is leftmost.
- [ ] Table column order reads right-to-left (first data column on the right).
- [ ] `Badge` within a flex row is correctly spaced with `me-2` not `mr-2`.

**Typography:**
- [ ] All Urdu text uses `font-urdu` class and renders in Noto Nastaliq Urdu.
- [ ] Urdu text has sufficient line-height (at least `leading-loose` or `line-height: 2`).
- [ ] Mixed Urdu+English text (e.g., KPI sublabels) renders without ligature breaks.
- [ ] The login page left panel Urdu text is centred and not clipped.

---

## 39. File Structure Reference

Complete directory tree the agent creates:

```
src/
├── assets/
│   └── logo-placeholder.svg
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── SidebarNav.tsx
│   │   ├── NavItem.tsx
│   │   ├── SystemTabSwitcher.tsx
│   │   ├── Topbar.tsx
│   │   └── nav-config.ts
│   ├── shared/
│   │   ├── PageHeader.tsx
│   │   ├── EmptyState.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── DataTableWrapper.tsx
│   │   ├── Bilingual.tsx          # Helper for bilingual label pairs
│   │   ├── ConfirmDialog.tsx      # Generic confirm/cancel dialog
│   │   ├── LoadingRows.tsx        # Skeleton table rows
│   │   └── PrintButton.tsx        # Window.print() wrapper
│   └── ui/                        # shadcn auto-generated components
├── context/
│   └── system-context.tsx
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── ChangePasswordPage.tsx
│   │   └── schemas/
│   │       └── login.schema.ts
│   ├── users/
│   │   ├── components/
│   │   │   ├── UserTable.tsx
│   │   │   ├── CreateUserDialog.tsx
│   │   │   └── CredentialsCard.tsx
│   │   ├── schemas/
│   │   │   └── create-user.schema.ts
│   │   └── types.ts
│   ├── admission/
│   │   ├── components/
│   │   │   ├── AdmissionStepper.tsx
│   │   │   ├── AdmissionForm.tsx
│   │   │   ├── AdmissionHub.tsx
│   │   │   ├── AdmissionQueue.tsx
│   │   │   ├── QueueReviewDialog.tsx
│   │   │   ├── PublicApplicationForm.tsx
│   │   │   └── steps/
│   │   │       ├── Step1Personal.tsx
│   │   │       ├── Step2System.tsx
│   │   │       ├── Step3Madrassa.tsx
│   │   │       ├── Step3School.tsx
│   │   │       ├── Step3Both.tsx
│   │   │       ├── Step4Guardian.tsx
│   │   │       └── Step5Review.tsx
│   │   ├── schemas/
│   │   │   ├── admission.schema.ts
│   │   │   └── application.schema.ts
│   │   └── types.ts
│   ├── madrassa/
│   │   ├── components/
│   │   │   ├── StudentList.tsx
│   │   │   ├── StudentProfile.tsx
│   │   │   ├── StudentProfileTabs.tsx
│   │   │   ├── AttendanceMarking.tsx
│   │   │   ├── AttendanceHeatmap.tsx
│   │   │   ├── FeeTable.tsx
│   │   │   ├── FeeReceiptDialog.tsx
│   │   │   ├── RecordPaymentDialog.tsx
│   │   │   ├── CategoryManager.tsx
│   │   │   ├── PromotionDialog.tsx
│   │   │   ├── ExitDialog.tsx
│   │   │   └── StudentTimeline.tsx
│   │   └── types.ts
│   ├── school/
│   │   ├── components/
│   │   │   ├── StudentList.tsx
│   │   │   ├── StudentProfile.tsx
│   │   │   ├── ExamList.tsx
│   │   │   ├── ExamDetail.tsx
│   │   │   ├── ExamSchedule.tsx
│   │   │   ├── SeatingArrangement.tsx
│   │   │   ├── ResultsTable.tsx
│   │   │   ├── MarkEntryTable.tsx
│   │   │   ├── DMCDialog.tsx
│   │   │   ├── ClassManager.tsx
│   │   │   ├── PromotionDialog.tsx
│   │   │   └── ExitDialog.tsx
│   │   └── types.ts
│   ├── teachers/
│   │   ├── components/
│   │   │   ├── TeacherGrid.tsx
│   │   │   ├── TeacherProfile.tsx
│   │   │   ├── TeacherAttendance.tsx
│   │   │   └── TeacherCard.tsx
│   │   └── types.ts
│   ├── id-cards/
│   │   └── components/
│   │       ├── IDCardGenerator.tsx
│   │       ├── IDCardPreview.tsx
│   │       └── IDCardPrintLayout.tsx
│   ├── reports/
│   │   ├── components/
│   │   │   ├── ReportsHub.tsx
│   │   │   ├── AttendanceReport.tsx
│   │   │   ├── CategoryReport.tsx
│   │   │   ├── ResultsReport.tsx
│   │   │   ├── MonthlyReport.tsx
│   │   │   └── AnnualReport.tsx
│   │   └── types.ts
│   ├── inventory/
│   │   ├── components/
│   │   │   ├── InventoryTable.tsx
│   │   │   ├── StockHistorySheet.tsx
│   │   │   ├── AddItemDialog.tsx
│   │   │   └── GiftDistributionDialog.tsx
│   │   └── types.ts
│   ├── finance/
│   │   ├── components/
│   │   │   ├── FinanceDashboard.tsx
│   │   │   ├── IncomeExpenseChart.tsx
│   │   │   ├── TransactionTable.tsx
│   │   │   ├── RecordIncomeDialog.tsx
│   │   │   ├── RecordExpenseDialog.tsx
│   │   │   └── BalanceSheet.tsx
│   │   └── types.ts
│   ├── dashboard/
│   │   └── components/
│   │       ├── GlobalDashboard.tsx
│   │       ├── KPICard.tsx
│   │       ├── EnrollmentChart.tsx
│   │       ├── AttendanceHeatmap.tsx
│   │       ├── CategoryPieChart.tsx
│   │       └── ActivityFeed.tsx
│   ├── parents/
│   │   ├── components/
│   │   │   ├── ParentLogin.tsx
│   │   │   ├── ParentDashboard.tsx
│   │   │   ├── ChildSwitcher.tsx
│   │   │   └── ParentPortalLayout.tsx
│   │   └── types.ts
│   └── website/
│       ├── components/
│       │   ├── WebsiteLayout.tsx
│       │   ├── WebsiteNav.tsx
│       │   ├── WebsiteFooter.tsx
│       │   ├── HeroSection.tsx
│       │   ├── GalleryGrid.tsx
│       │   ├── NoticesList.tsx
│       │   └── ContactForm.tsx
│       └── types.ts
├── hooks/
│   ├── useSession.ts
│   ├── useSystem.ts
│   └── useTheme.ts
├── lib/
│   ├── auth-client.ts
│   ├── formatters.ts
│   ├── theme.ts
│   └── utils.ts
├── mock/
│   ├── students.ts
│   ├── categories.ts
│   ├── classes.ts
│   ├── users.ts
│   ├── attendance.ts
│   ├── fees.ts
│   ├── exams.ts
│   ├── inventory.ts
│   ├── finance.ts
│   ├── applications.ts
│   ├── teachers.ts
│   └── announcements.ts
├── routes/
│   ├── __root.tsx
│   ├── index.tsx                  # Redirect to /dashboard
│   ├── login.tsx
│   ├── apply.tsx
│   ├── change-password.tsx
│   ├── _authenticated.tsx
│   ├── _authenticated/
│   │   ├── dashboard.tsx
│   │   ├── admission.tsx
│   │   ├── admission/
│   │   │   ├── new.tsx
│   │   │   └── queue.tsx
│   │   ├── madrassa/
│   │   │   ├── students.tsx
│   │   │   ├── students.$id.tsx
│   │   │   ├── attendance.tsx
│   │   │   ├── fees.tsx
│   │   │   └── categories.tsx
│   │   ├── school/
│   │   │   ├── students.tsx
│   │   │   ├── students.$id.tsx
│   │   │   ├── attendance.tsx
│   │   │   ├── fees.tsx
│   │   │   ├── exams.tsx
│   │   │   ├── exams.$id.tsx
│   │   │   ├── exams.$id.seating.tsx
│   │   │   └── exams.$id.results.tsx
│   │   ├── teachers.tsx
│   │   ├── teachers.$id.tsx
│   │   ├── id-cards.tsx
│   │   ├── reports/
│   │   │   ├── index.tsx
│   │   │   ├── attendance.tsx
│   │   │   ├── category.tsx
│   │   │   ├── results.tsx
│   │   │   ├── monthly.tsx
│   │   │   └── annual.tsx
│   │   ├── inventory.tsx
│   │   ├── finance.tsx
│   │   ├── users.tsx
│   │   └── settings.tsx
│   └── website/
│       ├── index.tsx
│       ├── about-madrassa.tsx
│       ├── about-school.tsx
│       ├── gallery.tsx
│       ├── notices.tsx
│       ├── contact.tsx
│       └── apply.tsx
└── styles/
    └── globals.css
```

---

## 40. Final Agent Checklist

Before submitting the implementation, the agent verifies every item:

**Foundation:**
- [ ] `dir="rtl"` and `lang="ur"` on `<html>` element.
- [ ] `font-urdu` class applied to every Urdu text element.
- [ ] Noto Nastaliq Urdu font loads and renders (verify in browser DevTools → Fonts).
- [ ] Dark mode toggle works and persists on page refresh.
- [ ] No raw hex/oklch values in any component file — only Tailwind token classes.
- [ ] No `interface` declarations anywhere — all TypeScript types use `type`.
- [ ] No `margin-left`, `margin-right`, `padding-left`, `padding-right` in any component.
- [ ] `formatPKR()` used for every monetary value displayed.

**Per-screen:**
- [ ] Every screen with async-like data (mocked) has a skeleton loading state.
- [ ] Every table has the correct header background, row hover, and status badge.
- [ ] Every empty state has an icon, bilingual heading, description, and CTA.
- [ ] Every form has bilingual labels (Urdu primary, English sublabel).
- [ ] Every dialog has a bilingual header and clear cancel/confirm footer actions.
- [ ] Every submit button shows `Loader2` spinner in its loading state.

**Navigation:**
- [ ] System tab switch changes sidebar items with opacity animation.
- [ ] Active nav item is visually distinct at all times.
- [ ] Breadcrumbs update correctly on every route.
- [ ] Mobile bottom nav renders correctly and opens the system sheet.

**RTL:**
- [ ] Full RTL verification checklist from Section 38 completed.
- [ ] Print layouts render correctly (`window.print()` tested for DMC, ID card, receipt).

**Quality bar:**
- [ ] The UI looks like a product built by a senior product design team at a top-tier SaaS company.
- [ ] No screen looks like an unstyled shadcn demo or a generic admin template.
- [ ] Every state — loading, empty, error, success — is visually designed with intention.

---

*End of MSMIS Frontend UI Implementation Brief — Complete.*  
*Total coverage: Phase 0 foundation through Phase 11 institutional website.*  
*Replace all mock data imports with TanStack Query hooks when backend is ready.*


---

## 41. Pakistan Madrassa System — Deep Context & UI Implementation

> **Research basis:** Wifaq ul Madaris Al-Arabia Pakistan (established 1959, 10,000+ affiliated madaris), Tanzeem ul Madaris Ahle Sunnat, Nizam ul Madaris, Dars-e-Nizami curriculum academic literature, and official examination board data.

This section documents the real structure of the Pakistani Madrassa system and translates it into precise UI specifications. The agent reads this entire section before implementing any Madrassa module screen.

---

### 41.1 Madrassa Education Structure — What the App Must Model

A Pakistani Madrassa operates across three distinct educational tracks. Students may be enrolled in one or more simultaneously:

**Track 1 — Hifz ul Quran (حفظ القرآن)**

Quran memorization. Duration varies from 2 to 5 years depending on the student. Wifaq ul Madaris oversees Tahfeedul Quran and Tajweed ul Quran programs for both Baneen and Banat separately. Students in this track have no "Darja" number — they progress by Juz (para/پارہ) completion, not by academic year. The system tracks how many Juz are memorised. All 30 Juz = complete Hifz.

**Track 2 — Nazira & Tajweed (ناظرہ و تجوید)**

Quran reading with correct pronunciation. Those who complete elementary education are awarded certificates depending on their proficiency in Nazira (Reading of Holy Quran), Hifz (Memorization of Holy Quran), and Tajweed-o-Qiraat (Techniques for the Recitation of Holy Quran). This is typically the entry point for young children before they begin Dars-e-Nizami.

**Track 3 — Dars-e-Nizami (درس نظامی)**

The complete Islamic academic curriculum. Dars-e-Nizami is the sine qua non of a madrassah. Boys typically complete it in 8 years at Sunni madaris; girls complete a condensed curriculum in 6 years. Before the 8-year curriculum, students go through an initial preparatory phase known as "I'dadiyah" lasting 3 years, during which subjects from grades 6 to 8 — Urdu, Mathematics, Science, English, and basic Arabic and Persian books — are taught. Including these three years, total curriculum duration is eleven years.

---

### 41.2 Dars-e-Nizami — Complete Darja (Level) Structure

The Darja system is like classes/grades; students select their Darja to check their respective results. The complete Darja hierarchy, with their government equivalency and the subjects taught:

| Darja (درجہ) | Urdu Name | Level Name | Govt Equivalent | Duration |
|---|---|---|---|---|
| I'dadiyah | ابتدائیہ / اعدادیہ | Preparatory | Grades 6–8 | 3 years |
| Darja Awwal | درجہ اول | Year 1 of Nizami | — | 1 year |
| Darja Daum | درجہ دوم | Year 2 | — | 1 year |
| Darja Soyam | درجہ سوم | Year 3 | — | 1 year |
| Sanawiyya Amma | ثانویہ عامہ | Secondary General | SSC / Matric | 2 years |
| Sanawiyya Khasa | ثانویہ خاصہ | Secondary Special | HSSC / Intermediate | 2 years |
| Aliyah | عالیہ | Higher | BA / BSc | 2 years |
| Alimiyyah | عالمیہ | Scholar Degree | MA / MSc | 1 year |

Alimiyyah (Darja Sadesa) equals MA/MSc. Aliya equals BA/BSc. Khasa equals HSSC/Intermediate. Aamma equals SSC/Matric. This recognition allows graduates to apply for higher education, government jobs, and other professional opportunities.

**Subjects taught across Dars-e-Nizami darjat:**

The curriculum consists of about twenty subjects broadly divided into two categories: al-uloom an-naqliya (the transmitted sciences), and al-uloom al-aqliya (the rational sciences). Subject areas include grammar, rhetoric, prosody, logic, philosophy, Arabic literature, and dialectical theology. Specifically:

- **Sarf (صرف)** — Arabic Morphology (early darjat)
- **Nahw (نحو)** — Arabic Syntax / Grammar (throughout)
- **Balaghat (بلاغت)** — Arabic Rhetoric
- **Mantiq (منطق)** — Logic
- **Falsafa (فلسفہ)** — Philosophy
- **Kalam (کلام)** — Islamic Theology
- **Fiqh (فقہ)** — Islamic Jurisprudence (throughout)
- **Usul al-Fiqh (اصول فقہ)** — Principles of Jurisprudence
- **Tafsir (تفسیر)** — Quranic Exegesis (higher darjat)
- **Hadith (حدیث)** — Prophetic Traditions (Kutub in highest darjat)
- **Tajweed (تجوید)** — Recitation Rules
- **Sirah (سیرت)** — Prophet's Biography
- **Tarikh-e-Islam (تاریخ اسلام)** — Islamic History
- **Arabic Literature (ادب عربی)** — Arabic Prose and Poetry

---

### 41.3 Madrassa Examination Types

Pakistani madrassas run **two parallel examination tracks**:

**Internal (داخلی / Dakhli):**
Conducted by the madrassa itself. Types:
- **Sah Mahi (سہ ماہی)** — Quarterly test (after 3 months)
- **Nisfus Sana (نصف سال)** — Half-yearly / Mid-year exam
- **Salanah (سالانہ)** — Annual internal exam (end of academic year)

**External / Board (وفاقی / Wifaqi):**
Conducted by the affiliated Wifaq (federation) board. Wifaq ul Madaris Al-Arabia Pakistan is an autonomous Islamic educational board that supervises and regulates religious education in Pakistan, overseeing thousands of madrassas and ensuring a standardized curriculum and examination system.
- **Wifaqi Salanah (وفاقی سالانہ)** — Annual board examination
- **Zimni (ضمنی)** — Supplementary exam for students who failed the Wifaq ul Madaris Zimni Exams are the supply exams for students who could not clear the annual examinations.
- Students receive a **Wifaq Roll Number (وفاق رول نمبر)** and **Ilhaq Number (الحاق نمبر)** from the board

**Key gender distinction:** Both Baneen and Banat students appear under the same date sheet — male and female students are handled in separate institutions but examined on the same schedule. The system must track gender (بنین / بنات) at enrollment level.

---

### 41.4 Madrassa Category Selector — Revised UI Model

The current brief uses a generic "Category → Subcategory" model. This must now be updated to reflect the actual Pakistani Madrassa track/darja structure. The UI must support the following real category tree:

```
قاعدہ و ناظرہ (Qaida & Nazira)
  └── ابتدائی قاعدہ (Basic Qaida)
  └── ناظرہ قرآن (Nazira Quran)
  └── تجوید (Tajweed)

حفظ القرآن (Hifz ul Quran)
  └── جزء اول تا پانچ (Juz 1–5)
  └── جزء چھ تا پندرہ (Juz 6–15)
  └── جزء سولہ تا تیس (Juz 16–30)
  └── مکمل حفظ (Complete Hifz)

درس نظامی (Dars-e-Nizami)
  └── اعدادیہ (I'dadiyah — Preparatory)
  └── درجہ اول (Darja Awwal — Year 1)
  └── درجہ دوم (Darja Daum — Year 2)
  └── درجہ سوم (Darja Soyam — Year 3)
  └── ثانویہ عامہ (Sanawiyya Amma — Matric equiv.)
  └── ثانویہ خاصہ (Sanawiyya Khasa — Inter equiv.)
  └── عالیہ (Aliyah — BA equiv.)
  └── عالمیہ (Alimiyyah — MA equiv.)
```

All categories above are the **defaults** when the system is initialized. Admin can add custom categories but should not need to recreate these standard ones. The mock data in `src/mock/categories.ts` must populate these real categories with authentic Urdu names.

**Hifz special behavior:** When a student is enrolled in the Hifz track, their profile shows a **Juz Progress Tracker** instead of a standard attendance/promotion layout. This is a `grid grid-cols-6 gap-1` of 30 numbered cells (Juz 1–30). Each cell is either: incomplete (`bg-muted border border-border text-muted-foreground`), in-progress (`bg-amber-100 border border-amber-300 dark:bg-amber-950/30`), or memorised (`bg-chart-1/20 border border-chart-2 text-chart-3 font-bold`). Admin marks each Juz as memorised individually. The profile header shows "X / 30 Juz" as a `Progress` bar.

---

### 41.5 Madrassa Examination Module UI (`/madrassa/exams`) — NEW

This route does not exist in the current brief and must be added. Add it to:
- The route map (Section 7)
- The nav-config.ts madrassaNav array
- The file structure (Section 39)

**PageHeader:** "Examinations — Madrassa" / "مدرسہ — امتحانات" + "New Exam" button.

**Exam Type Tabs** at the top of the page:

```
[داخلی امتحانات]   [وفاقی امتحانات]   [ضمنی امتحانات]
 Internal Exams     Board Exams         Supplementary
```

---

#### Internal Exams Tab (داخلی امتحانات)

**New Internal Exam Dialog:**

Fields:
- Exam Title English + Exam Title Urdu (e.g. "First Quarter Exam" / "پہلا سہ ماہی امتحان")
- Exam Type `Select` with four options, each bilingual:
  - Quarterly / سہ ماہی
  - Half-Yearly / نصف سالہ
  - Annual / سالانہ
  - Special / خصوصی
- Target Scope: `RadioGroup` — Entire Madrassa / Specific Categories
- If "Specific Categories": multi-select checkboxes for category + darja combinations
- Start Date + End Date `DatePicker`
- "Generate Schedule" button (auto-creates one slot per subject per darja)

**Exam Schedule Builder:**

After creation, the exam detail page shows a schedule table. Each row is one subject-darja combination:

Columns: Darja (درجہ), Subject (مضمون), Exam Date, Exam Time, Total Marks (`Input`, default 100), Passing Marks (`Input`, default 40), Examiner (optional `Input`).

The admin fills in dates, times, and marks. "Lock Schedule / شیڈول مکمل کریں" button finalizes and prevents further edits.

**Mark Entry:**

After the exam date passes, a "Enter Marks / نمبر درج کریں" button appears on the exam card. This opens a full-page mark entry view:

- Left panel: Darja selector (list of all targeted darjat).
- Right panel: Table of students in the selected darja with one `Input` column per subject.
- Invalid marks (above total) show `border-destructive` immediately.
- "Absent" toggle per student-subject cell (marks `isAbsent: true`, disables the marks input).
- Sticky bottom bar: "Save Marks / نمبر محفوظ کریں".

**Results View:**

After marks are saved, the results page shows:

- Overall darja-wise pass/fail summary cards.
- Student results table: Roll No, Name (`font-urdu`), then one column per subject (obtained/total), Total %, Grade, Result (`Badge`: کامیاب / ناکام — Pass / Fail).
- Filter: by darja, by result (all/passed/failed).
- "Generate Result Cards / نتیجہ کارڈ بنائیں" button — creates printable result slips for all students.

**Result Card Print Layout:**

Each student result card (A5 size, `print-target`):
```
┌──────────────────────────────────┐
│  [Logo]    ادارہ کا نام           │
│            نتیجہ کارڈ             │
├──────────────────────────────────┤
│  نام: محمد عبداللہ               │
│  رول نمبر: ILM1-007              │
│  درجہ: درجہ اول                  │
│  امتحان: پہلا سہ ماہی           │
├──────────────────────────────────┤
│  مضمون     کل نمبر  حاصل نمبر   │
│  نحو          100      78         │
│  صرف          100      82         │
│  فقہ          100      91         │
│  تجوید         50      44         │
├──────────────────────────────────┤
│  کل:  350   حاصل: 295   %: 84.3  │
│  نتیجہ: کامیاب ★ درجہ اول        │
│  دستخط: _____________            │
└──────────────────────────────────┘
```

---

#### Board Exams Tab (وفاقی امتحانات)

This tab manages the external Wifaq board examination registration and tracking.

**Board Registration Form:**

- Wifaq Board `Select`: Wifaq ul Madaris Al-Arabia / Tanzeem ul Madaris / Nizam ul Madaris / Rabita ul Madaris / Other
- Academic Year `Input` (Hijri year e.g. "1447")
- Registration Deadline `DatePicker`
- Exam Date `DatePicker`
- "Register Students / طلبہ کا اندراج کریں" button

**Student Registration Table:**

After selecting a board exam, shows all eligible students (those in board-examined darjat: Sanawiyya Amma and above). Columns:
- Student Name (`font-urdu`)
- Darja / درجہ
- Current Roll No
- Wifaq Roll No (`Input`, admin enters the Wifaq-assigned roll number)
- Ilhaq No (`Input` — madrassa's board affiliation number, same for all students, pre-filled)
- Registration Status (`Badge`: Pending / Registered / Appearing / Passed / Failed)

**Wifaq Result Entry:**

After board results are announced, admin enters results. A "Enter Board Results / وفاقی نتائج درج کریں" button opens the result entry table. Each row: student + per-subject marks (matching Wifaq's subject list for that darja) + overall result.

**Zimni (Supply) Exam tracking:**

Students who fail the annual exam appear automatically in the Zimni tab. The admin updates their Zimni result when it is announced.

---

### 41.6 Updated Madrassa Category Mock Data

Update `src/mock/categories.ts` to use the real Pakistani Madrassa category structure:

```ts
export const mockCategories: Category[] = [
  { id: 'cat-001', name: 'Qaida & Nazira', nameUrdu: 'قاعدہ و ناظرہ', sortOrder: 1 },
  { id: 'cat-002', name: 'Hifz ul Quran', nameUrdu: 'حفظ القرآن', sortOrder: 2 },
  { id: 'cat-003', name: 'Dars-e-Nizami', nameUrdu: 'درس نظامی', sortOrder: 3 },
]

export const mockSubcategories: Subcategory[] = [
  // Qaida & Nazira
  { id: 'sub-001', categoryId: 'cat-001', name: 'Basic Qaida', nameUrdu: 'ابتدائی قاعدہ', rollPrefix: 'QAD', sortOrder: 1 },
  { id: 'sub-002', categoryId: 'cat-001', name: 'Nazira Quran', nameUrdu: 'ناظرہ قرآن', rollPrefix: 'NAZ', sortOrder: 2 },
  { id: 'sub-003', categoryId: 'cat-001', name: 'Tajweed', nameUrdu: 'تجوید', rollPrefix: 'TJW', sortOrder: 3 },

  // Hifz ul Quran
  { id: 'sub-004', categoryId: 'cat-002', name: 'Juz 1-5', nameUrdu: 'جزء اول تا پنجم', rollPrefix: 'HFZ1', sortOrder: 1 },
  { id: 'sub-005', categoryId: 'cat-002', name: 'Juz 6-15', nameUrdu: 'جزء ششم تا پانزدہم', rollPrefix: 'HFZ2', sortOrder: 2 },
  { id: 'sub-006', categoryId: 'cat-002', name: 'Juz 16-30', nameUrdu: 'جزء شانزدہم تا سی', rollPrefix: 'HFZ3', sortOrder: 3 },
  { id: 'sub-007', categoryId: 'cat-002', name: 'Complete Hifz', nameUrdu: 'مکمل حفظ', rollPrefix: 'HFZM', sortOrder: 4 },

  // Dars-e-Nizami
  { id: 'sub-008', categoryId: 'cat-003', name: "I'dadiyah", nameUrdu: 'اعدادیہ', rollPrefix: 'IDD', sortOrder: 1 },
  { id: 'sub-009', categoryId: 'cat-003', name: 'Darja Awwal', nameUrdu: 'درجہ اول', rollPrefix: 'DN1', sortOrder: 2 },
  { id: 'sub-010', categoryId: 'cat-003', name: 'Darja Daum', nameUrdu: 'درجہ دوم', rollPrefix: 'DN2', sortOrder: 3 },
  { id: 'sub-011', categoryId: 'cat-003', name: 'Darja Soyam', nameUrdu: 'درجہ سوم', rollPrefix: 'DN3', sortOrder: 4 },
  { id: 'sub-012', categoryId: 'cat-003', name: 'Sanawiyya Amma', nameUrdu: 'ثانویہ عامہ', rollPrefix: 'SAM', sortOrder: 5 },
  { id: 'sub-013', categoryId: 'cat-003', name: 'Sanawiyya Khasa', nameUrdu: 'ثانویہ خاصہ', rollPrefix: 'SKH', sortOrder: 6 },
  { id: 'sub-014', categoryId: 'cat-003', name: 'Aliyah', nameUrdu: 'عالیہ', rollPrefix: 'ALY', sortOrder: 7 },
  { id: 'sub-015', categoryId: 'cat-003', name: 'Alimiyyah', nameUrdu: 'عالمیہ', rollPrefix: 'ALM', sortOrder: 8 },
]
```

---

### 41.7 Madrassa Student Profile — Dars-e-Nizami Tab

For students enrolled in the Dars-e-Nizami track, the profile Overview tab shows an additional "Academic Standing" card:

```
Academic Standing / علمی مقام
─────────────────────────────
Current Darja:    درجہ دوم (Year 2 of Dars-e-Nizami)
Govt Equivalent:  Equivalent to Grade 8 (Middle School)
Board Affiliation: Wifaq ul Madaris Al-Arabia
Wifaq Roll No:    [if registered]
Ilhaq No:         12345 (madrassa's board affiliation number)
Years in Current Darja: 1 year
```

**Subjects card** (specific to Dars-e-Nizami students): Shows the subject list for the student's current darja as a `flex flex-wrap gap-2` of `Badge variant="outline"` tags (e.g., نحو, صرف, فقہ, تجوید, سیرت).

---

### 41.8 Madrassa Promotion — Darja-Aware Logic

The Promotion Dialog for Madrassa students must now show the full Darja progression path clearly:

**Current path display** (for a Dars-e-Nizami student in Darja Daum):
```
درجہ اول → [درجہ دوم] → درجہ سوم → ثانویہ عامہ → ... → عالمیہ
                ↑ current
```

Render this as a horizontal stepper (smaller than the admission stepper) showing the full 8-step Dars-e-Nizami progression. Current darja highlighted. Completed darjat have a checkmark.

**Cross-track promotion** (e.g., student completes Hifz and wants to join Dars-e-Nizami): The promote dialog allows selecting a completely different category track, not just moving up within the current one. When cross-track is selected, the dialog shows a warning:
```
⚠️ This student will be enrolled in a new track.
Their Hifz record will be preserved but fees and attendance will be tracked under the new enrollment.
```

---

## 42. Pakistan School System — Deep Context & UI Implementation

> **Research basis:** BISE examination structure, Single National Curriculum (SNC/NCP 2021–2024), Pakistan Ministry of Federal Education data, provincial education department guidelines.

---

### 42.1 School Grade Structure — Complete Model

Preschool is for ages 3–5. Primary school is grades 1–5, followed by middle school grades 6–8. Secondary school is grades 9–10, and intermediate or higher secondary is grades 11–12, culminating in the SSC and HSSC certificates.

The complete grade structure the app must support:

| Level | Grades | Urdu Name | Age Range | Certificate |
|---|---|---|---|---|
| Pre-Primary | Play Group, Nursery, KG | قبل از پرائمری | 3–5 | — |
| Primary | Grade 1–5 | پرائمری | 5–10 | Primary Certificate |
| Middle | Grade 6–8 | مڈل | 10–13 | Middle Certificate |
| Secondary (Matric) | Grade 9–10 | ثانوی / میٹرک | 13–15 | SSC |
| Higher Secondary (Inter) | Grade 11–12 | اعلیٰ ثانوی / انٹر | 15–17 | HSSC |

---

### 42.2 School Examination System — Complete Model

Pakistani schools run the following examination types in sequence across the academic year:

**Internal Examinations (conducted by the school):**

| Exam | Urdu | Timing | Weight |
|---|---|---|---|
| Monthly Test | ماہانہ ٹیسٹ | Every month | Formative |
| First Quarterly | پہلا سہ ماہی | After 3 months | ~20% |
| Half-Yearly / Mid-Term | نصف سالہ | After 6 months | ~30% |
| Third Quarterly | تیسرا سہ ماہی | After 9 months | ~20% |
| Annual / Final | سالانہ امتحان | End of year | ~50–60% |

**External Board Examinations (Grade 9–12 only):**

After end of each of the school years, students are required to pass a national examination administered by a regional Board of Intermediate and Secondary Education (BISE). Upon completion of grade 9, students take standardised tests (SSC-I). They again take these tests at the end of grade 10 (SSC-II). Upon successful completion, they are awarded a Secondary School Certificate (SSC), locally termed 'matriculation certificate' or 'matric'.

| Board Exam | Grade | Urdu Name | Certificate |
|---|---|---|---|
| SSC Part I | Grade 9 | میٹرک حصہ اول | SSC-I |
| SSC Part II | Grade 10 | میٹرک حصہ دوم | SSC (Matric) |
| HSSC Part I | Grade 11 | انٹر حصہ اول | HSSC-I |
| HSSC Part II | Grade 12 | انٹر حصہ دوم | HSSC (Inter) |

---

### 42.3 School Subjects — Grade-Appropriate Lists

The curriculum usually includes a combination of eight courses including electives (such as Biology, Chemistry, Computer and Physics) as well as compulsory subjects (such as Mathematics, English, Urdu, Islamic studies and Pakistan Studies).

**Primary (Grade 1–5) compulsory subjects:**
- Urdu (اردو), English (انگریزی), Mathematics (ریاضی), General Knowledge / Science (سائنس), Islamiyat (اسلامیات), Nazira Quran (ناظرہ قرآن — mandatory under SNC)

**Middle (Grade 6–8) subjects:**
- Urdu, English, Mathematics, General Science (عمومی سائنس), Social Studies (معاشرتی علوم), Islamiyat, Pakistan Studies (مطالعہ پاکستان), Computer Science (کمپیوٹر سائنس — optional)

**Secondary Grade 9–10 — Science Group:**
- Urdu, English, Mathematics, Physics (طبیعیات), Chemistry (کیمیا), Biology (حیاتیات), Islamiyat, Pakistan Studies

**Secondary Grade 9–10 — Arts Group:**
- Urdu, English, Mathematics, General Science, History, Geography, Islamiyat, Pakistan Studies

**Higher Secondary Grade 11–12 streams:** There are many streams students can choose for grades 11 and 12, such as pre-medical, pre-engineering, humanities (social sciences) and commerce. Each stream consists of three electives as well as compulsory subjects of English, Urdu, Islamiyat (grade 11 only) and Pakistani Studies (grade 12 only).

---

### 42.4 School Class Management — Updated Spec (`/school/classes`) — NEW ROUTE

Add to route map, nav-config, and file structure.

**Two-panel layout** (same pattern as Madrassa categories):

**Left panel — Classes:**

Pre-populated with real Pakistani school grades from the mock data. Each class row shows: Grade name (English), Urdu name (`font-urdu`), Level badge (Primary/Middle/Secondary), Section count, Roll Prefix (`font-mono text-xs`). Admin can edit prefix and name; cannot delete classes that have enrolled students.

**Right panel — Sections & Subjects:**

When a class is selected, show two sub-sections:

*Sections sub-section:*
- Add Section (A, B, C…) button.
- Section list: name, student count, assigned class teacher (`Select` — from teachers list).

*Subjects sub-section:*
- Pre-populated with grade-appropriate subjects from the mock data.
- Each subject row: Subject name (English), Urdu name (`font-urdu`), Total Marks (`Input`, default 100), Passing Marks (`Input`, default 40), Subject Group badge (Compulsory/Elective), assigned teacher (`Select`).
- "Add Subject" button opens a mini dialog (name English + Urdu, marks).

**Updated `mockClasses.ts`** must include real Pakistani grade names:

```ts
export const mockClasses: SchoolClass[] = [
  // Pre-Primary
  { id: 'cls-000', name: 'KG / Prep', nameUrdu: 'کے جی / پری', rollPrefix: 'KG', level: 'pre_primary', sortOrder: 0 },
  // Primary
  { id: 'cls-001', name: 'Grade 1', nameUrdu: 'پہلی جماعت', rollPrefix: 'G1', level: 'primary', sortOrder: 1 },
  { id: 'cls-002', name: 'Grade 2', nameUrdu: 'دوسری جماعت', rollPrefix: 'G2', level: 'primary', sortOrder: 2 },
  { id: 'cls-003', name: 'Grade 3', nameUrdu: 'تیسری جماعت', rollPrefix: 'G3', level: 'primary', sortOrder: 3 },
  { id: 'cls-004', name: 'Grade 4', nameUrdu: 'چوتھی جماعت', rollPrefix: 'G4', level: 'primary', sortOrder: 4 },
  { id: 'cls-005', name: 'Grade 5', nameUrdu: 'پانچویں جماعت', rollPrefix: 'G5', level: 'primary', sortOrder: 5 },
  // Middle
  { id: 'cls-006', name: 'Grade 6', nameUrdu: 'چھٹی جماعت', rollPrefix: 'G6', level: 'middle', sortOrder: 6 },
  { id: 'cls-007', name: 'Grade 7', nameUrdu: 'ساتویں جماعت', rollPrefix: 'G7', level: 'middle', sortOrder: 7 },
  { id: 'cls-008', name: 'Grade 8', nameUrdu: 'آٹھویں جماعت', rollPrefix: 'G8', level: 'middle', sortOrder: 8 },
  // Secondary (Matric)
  { id: 'cls-009', name: 'Grade 9 (Matric I)', nameUrdu: 'نویں جماعت (میٹرک اول)', rollPrefix: 'M1', level: 'secondary', sortOrder: 9 },
  { id: 'cls-010', name: 'Grade 10 (Matric II)', nameUrdu: 'دسویں جماعت (میٹرک دوم)', rollPrefix: 'M2', level: 'secondary', sortOrder: 10 },
]

export type ClassLevel = 'pre_primary' | 'primary' | 'middle' | 'secondary' | 'higher_secondary'
```

---

### 42.5 School Examination Module — Updated Full Spec

The existing Exam module spec (Section 13) is extended with the following Pakistan-specific exam types and workflows.

**New Exam Series Dialog — updated fields:**

- Series Name (English) + Series Name Urdu
- Exam Type `Select` — now with five options:
  - Monthly Test / ماہانہ ٹیسٹ
  - Quarterly / سہ ماہی
  - Half-Yearly / نصف سالہ
  - Annual / سالانہ امتحان (includes full subject-wise scheduling)
  - Board Preparatory / بورڈ تیاری (mock board exam format)
- Target Classes: multi-select checkboxes grouped by level (Primary / Middle / Secondary)
- Date range

**Level-segregated exam scheduling:** When an exam targets multiple levels, the schedule builder groups subjects by class level. Primary subjects (Urdu, Math, Science, Islamiyat) and Middle/Secondary subjects are displayed in separate accordion sections.

**Subject assignment for new classes:** When creating a new exam, the system auto-suggests subjects based on the class's pre-configured subject list (from the Class Manager). Admin can deselect subjects not being examined.

**Board Exam Registration (`/school/exams/board`) — NEW TAB:**

Same structure as the Madrassa Board Exam tab. For Grade 9–12 students:
- BISE Board `Select`: BISE Karachi / BISE Lahore / BISE Rawalpindi / BISE Multan / FBISE / Other
- Exam type: SSC-I / SSC-II / HSSC-I / HSSC-II
- Registration number entry per student (BISE-assigned roll number)
- After board result: import results per student (marks per subject)

**Grade 9–10 Science/Arts group selection:**

On the student profile for Grade 9 students, a one-time "Assign Group" action appears. A `Dialog` lets admin assign: Science (Pre-Medical / Pre-Engineering) or Arts / Humanities. Once assigned, the student's subject list updates to match the group's compulsory and elective subjects.

---

### 42.6 School Exam Results — Pakistan-Specific Grading

Pakistani BISE grading scale used in result display:

| Percentage | Grade | Urdu Description |
|---|---|---|
| 80% and above | A1 / A+ | ممتاز |
| 70–79% | A | بہت اچھا |
| 60–69% | B | اچھا |
| 50–59% | C | اوسط |
| 40–49% | D | کم اوسط |
| 33–39% | E (Pass — Primary only) | پاس |
| Below 33% (Secondary) | F | ناکام |
| Below 40% (Primary) | F | ناکام |

**Distinction / Scholarship award:** Students scoring 80%+ in all subjects get a `Badge` reading "Distinction / امتیاز" in `text-chart-1 bg-chart-1/15 border-chart-2/30`. Show this prominently on the student profile header and in the results table.

**Subject-wise pass/fail:** A student can pass overall but fail an individual subject if below passing marks. Failed subjects appear with `text-destructive bg-destructive/5` cell background. "Supply Needed / ضمنی لازمی" badge appears on their result row.

---

### 42.7 School Student Profile — Updated Pakistani Context

**Profile header additions for secondary students:**
- Class Group badge: "Science — Pre-Medical" or "Arts" in a secondary badge alongside the class name.
- BISE Roll Number field (appears after board registration).
- Board Name (e.g., "BISE Karachi") in the enrollment details card.

**Matriculation tracking card** (for Grade 10 students):
```
Matriculation Status
─────────────────────────
SSC Part I (Grade 9):   Passed — 78% — Grade A
SSC Part II (Grade 10): [Appearing / Pending]
Expected Certificate:   SSC — Science Group
Board:                  BISE Karachi
```

---

## 43. Route Map — Additions

Add the following routes to Section 7:

```
/_authenticated
  /madrassa/exams                    → MadrassaExamList
  /madrassa/exams/$id                → MadrassaExamDetail
  /madrassa/exams/$id/marks          → MadrassaMarkEntry
  /madrassa/exams/$id/results        → MadrassaExamResults
  /madrassa/exams/board              → MadrassaBoardExams
  /school/classes                    → SchoolClassManager
  /school/exams/board                → SchoolBoardExams
```

---

## 44. nav-config.ts — Additions

Add to `madrassaNav`:
```ts
{ id: 'madrassa-exams', labelUrdu: 'امتحانات', labelEnglish: 'Examinations',
  icon: 'BookMarked', href: '/madrassa/exams', roles: ['super_admin', 'admin', 'teacher'] },
```

Add to `schoolNav`:
```ts
{ id: 'school-classes', labelUrdu: 'جماعتیں', labelEnglish: 'Classes',
  icon: 'LayoutList', href: '/school/classes', roles: ['super_admin', 'admin'] },
```

---

## 45. Updated Mock Data — Madrassa Exams

Add `src/mock/madrassa-exams.ts`:

```ts
export type MadrassaExam = {
  id: string
  title: string
  titleUrdu: string
  type: 'quarterly' | 'half_yearly' | 'annual' | 'special' | 'board_wifaqi' | 'zimni'
  targetDarjat: string[]     // subcategory ids
  startDate: string
  endDate: string
  status: 'scheduled' | 'ongoing' | 'marks_entry' | 'completed'
  wifaqBoard?: string        // for board type exams
  hijriYear?: string         // for board type exams e.g. "1447"
}

export type MadrassaExamSchedule = {
  id: string
  examId: string
  subcategoryId: string
  subject: string
  subjectUrdu: string
  examDate: string
  examTime: string
  totalMarks: number
  passingMarks: number
}

export type MadrassaExamResult = {
  id: string
  examId: string
  studentId: string
  subcategoryId: string
  subjectResults: {
    subject: string
    marksObtained: number
    isAbsent: boolean
  }[]
  totalMarks: number
  totalObtained: number
  percentage: number
  grade: string
  isPassed: boolean
  wifaqRollNumber?: string
}

export const mockMadrassaExams: MadrassaExam[] = [
  {
    id: 'mexam-001',
    title: 'First Quarter Examination',
    titleUrdu: 'پہلا سہ ماہی امتحان',
    type: 'quarterly',
    targetDarjat: ['sub-009', 'sub-010', 'sub-011'],  // DN1, DN2, DN3
    startDate: '2025-04-10',
    endDate: '2025-04-15',
    status: 'completed',
  },
  {
    id: 'mexam-002',
    title: 'Wifaq Annual Examination 1447 Hijri',
    titleUrdu: 'وفاقی سالانہ امتحان 1447 ہجری',
    type: 'board_wifaqi',
    targetDarjat: ['sub-012', 'sub-013'],  // Sanawiyya Amma & Khasa
    startDate: '2026-01-22',
    endDate: '2026-01-29',
    status: 'ongoing',
    wifaqBoard: 'Wifaq ul Madaris Al-Arabia',
    hijriYear: '1447',
  },
]
```

---

*End of Pakistan System Context & UI Specification additions.*  
*Sections 41–45 replace and supersede any conflicting specifications in Sections 12–13 of this document regarding Madrassa categories, classes, and examination workflows.*


---

## 46. Academic Year & Holiday Calendar System

Every exam date, attendance record, fee month, and report in this app is anchored to an academic year. This system must be configured before any other data is entered.

### 46.1 Academic Year Configuration (`/settings/academic-year`)

**Pakistani academic year context:** Government schools run August–May. Many private schools run April–March. Madrassas historically follow the Hijri calendar — starting after Ramadan (Shawwal) and running through Sha'ban. The app supports both Gregorian and Hijri year configurations simultaneously.

**Academic Year Settings Card:**

```
Current Academic Year
─────────────────────────────────
Gregorian:    2024–2025
Hijri:        1446–1447
Start Date:   01 August 2024
End Date:     31 May 2025
Status:       Active
```

Admin can create a new academic year and "Archive" the old one. Archived years are read-only — all their data is preserved but no new entries can be made.

**New Academic Year Dialog:**

- Gregorian Year Label (`Input`, e.g. "2025–2026")
- Hijri Year Label (`Input`, e.g. "1447–1448")
- Start Date `DatePicker`
- End Date `DatePicker`
- "Carry Forward Students" toggle (`Switch`): when enabled, all active students are automatically re-enrolled in the new year with the same darja/class. When disabled, admin manually re-enrolls each student.
- Warning if an active year already exists: `Alert` with `AlertTriangle` — "ایک سال پہلے سے فعال ہے" (An active year already exists).

### 46.2 Holiday & Vacation Calendar (`/settings/holidays`)

**Calendar view:** Full-month `grid grid-cols-7` calendar. Each day cell is 40×40px. Days with holidays get a coloured overlay. Clicking a day opens a popover to add/edit/remove a holiday entry.

**Holiday types** — each type has a distinct colour used across the calendar and the attendance module:

| Type | Urdu | Colour Token |
|---|---|---|
| Public Holiday | سرکاری چھٹی | `bg-chart-1/20` |
| Jumma (Friday) | جمعہ | `bg-muted` |
| Islamic Holiday | اسلامی تہوار | `bg-amber-100 dark:bg-amber-950/30` |
| Summer Vacation | گرمی کی چھٹیاں | `bg-blue-100 dark:bg-blue-950/30` |
| Winter Vacation | سردی کی چھٹیاں | `bg-indigo-100 dark:bg-indigo-950/30` |
| Exam Period | امتحانی دن | `bg-purple-100 dark:bg-purple-950/30` |
| Other | دیگر | `bg-secondary` |

**Pre-populated Pakistani holidays** in mock data:

```ts
export const mockHolidays = [
  { date: '2025-02-05', name: 'Kashmir Day', nameUrdu: 'یوم کشمیر', type: 'public_holiday' },
  { date: '2025-03-23', name: 'Pakistan Day', nameUrdu: 'یوم پاکستان', type: 'public_holiday' },
  { date: '2025-04-01', name: 'Eid ul Fitr (est.)', nameUrdu: 'عید الفطر', type: 'islamic_holiday' },
  { date: '2025-04-02', name: 'Eid ul Fitr Holiday', nameUrdu: 'عید الفطر چھٹی', type: 'islamic_holiday' },
  { date: '2025-04-03', name: 'Eid ul Fitr Holiday', nameUrdu: 'عید الفطر چھٹی', type: 'islamic_holiday' },
  { date: '2025-05-01', name: 'Labour Day', nameUrdu: 'یوم مزدور', type: 'public_holiday' },
  { date: '2025-06-07', name: 'Eid ul Adha (est.)', nameUrdu: 'عید الاضحٰی', type: 'islamic_holiday' },
  { date: '2025-08-14', name: 'Independence Day', nameUrdu: 'یوم آزادی', type: 'public_holiday' },
  { date: '2025-09-05', name: 'Defence Day', nameUrdu: 'یوم دفاع', type: 'public_holiday' },
  { date: '2025-11-09', name: 'Iqbal Day', nameUrdu: 'یوم اقبال', type: 'public_holiday' },
  { date: '2025-12-25', name: 'Quaid Day', nameUrdu: 'یوم قائد', type: 'public_holiday' },
]
```

**Impact on attendance:** The attendance marking page automatically skips holidays — students are not marked absent on holiday dates. The attendance heatmap shows holiday cells in their type colour with no absent/present state.

**Weekly off day setting:** A `CheckboxGroup` for selecting which days are weekly off (Saturday / Sunday / Both). Most Pakistani schools: Saturday off or half-day. Most madrassas: Friday off. This setting drives the attendance calendar — selected weekdays are rendered as non-school days.

---

## 47. Class Timetable / Schedule (`/school/timetable`) — NEW

Add to route map and nav-config under schoolNav.

### 47.1 Timetable Builder

**PageHeader:** "Class Timetable" / "جماعتی ٹائم ٹیبل" + "Print Timetable" button.

**Class selector** in the filter bar: Class `Select` → Section `Select`.

**Timetable grid:** `grid grid-cols-6` (6 school days: Monday–Saturday or Mon–Fri depending on settings). Rows represent periods (Period 1–8). Each cell is a period slot.

Period slot (empty): `rounded-lg border border-dashed border-border h-16 flex items-center justify-center cursor-pointer text-muted-foreground text-sm hover:bg-muted/30`.

Period slot (filled): `rounded-lg bg-primary/5 border border-primary/20 p-2`. Shows:
- Subject name (`font-urdu text-sm font-medium`)
- Teacher name (`text-xs text-muted-foreground`)
- A `MoreHorizontal` icon on hover for edit/clear.

**Add Period Dialog** (opens on empty slot click):
- Period number (pre-filled from the row clicked)
- Day (pre-filled from the column clicked)
- Subject `Select` (from the class's subject list)
- Teacher `Select` (filtered to teachers assigned to that subject)
- Start Time + End Time (`Input type="time"`)

**Conflict detection:** If the selected teacher already has a period at that day+time in another class, show an inline warning badge on the slot: `bg-amber-100 border-amber-300` with `⚠️` icon. Do not block saving — just warn.

**Print timetable:** Clicking "Print Timetable" triggers `window.print()`. The print layout renders the grid as a clean table with institution header, class name, and date of generation.

---

## 48. Madrassa Timetable & Dars Schedule

Madrassas operate on a lesson schedule called "Dars" (درس). Add `/madrassa/timetable` to the route map and madrassaNav.

**Dars Schedule grid:** Same grid structure as the school timetable but with:
- Rows representing Dars periods (Fajr Dars, Morning Dars 1, Morning Dars 2, Zuhr Break, Afternoon Dars 1, Afternoon Dars 2, Asr Dars, After Maghrib Dars)
- Column filter: Darja selector instead of class selector

**Period names in Urdu** (pre-populated in the grid row headers):
- فجر درس (Fajr Dars)
- صبح درس اول (Morning Dars 1)
- صبح درس دوم (Morning Dars 2)
- ظہر وقفہ (Zuhr Break — non-editable, always marked as break)
- دوپہر درس اول (Afternoon Dars 1)
- دوپہر درس دوم (Afternoon Dars 2)
- عصر درس (Asr Dars)
- مغرب بعد درس (Post-Maghrib Dars)

---

## 49. Fee Management — Pakistani Context & Extended Specs

### 49.1 Madrassa Fee Reality

The entire system has been traditionally supported by the community through trusts, endowments, charitable donations, and zakat contributions. Many students not only pay no tuition — they are provided free textbooks, board and lodging, and a modest stipend. This is why the Madrassa fee system must support PKR 0 as a completely valid and common fee value, not a special edge case.

**Fee categories in Madrassa context:**

| Fee Type | Urdu | Description |
|---|---|---|
| Monthly Tuition | ماہانہ فیس | 0 to unlimited |
| Admission Fee | داخلہ فیس | One-time on admission |
| Exam Fee | امتحانی فیس | Per internal exam |
| Wifaq Registration Fee | وفاقی اندراج فیس | Annual board registration |
| Books/Stationery | کتب و قرطاسیہ | One-time or annual |
| Boarding Fee | رہائش فیس | If student is a boarder |

**Stipend system:** Some students receive a monthly stipend (وظیفہ) from the madrassa. This is a negative fee — the madrassa pays the student. The fee module must handle this: when the monthly fee is set to a negative value OR when a separate stipend record is created, the student's fee status shows "Stipend / وظیفہ" rather than a balance due.

### 49.2 Fee Dashboard — Extended

**Fee summary cards** (updated to 4):
1. **Total Fee Due** — all students × monthly fee for selected month
2. **Total Collected** — sum of payments recorded
3. **Outstanding** — due minus collected, in `text-destructive`
4. **Scholarship Students** — count of students with PKR 0 fee, in `text-chart-1`

**Fee collection status bar** — between the summary cards and the table: a `recharts BarChart` showing daily collections for the current month (x = day of month, y = PKR collected). Helps identify which days fees are typically paid.

**Defaulter list shortcut:** A "Defaulters / بقایہ داران" quick-filter `Badge` button next to the month selector. Clicking it filters the table to show only students with outstanding amounts from 2+ consecutive months.

### 49.3 Fee Receipt — Pakistani Format

Pakistani fee receipts issued by educational institutions follow a standard triplicate format (3 copies: one for student, one for accounts, one for class register). The receipt dialog must have a "Print 3 Copies" option that prints the receipt three times on a single A4 sheet, each one-third page.

Each receipt copy has a small "STUDENT COPY / طالب علم کاپی", "ACCOUNTS COPY / اکاؤنٹس کاپی", or "REGISTER COPY / رجسٹر کاپی" watermark in small muted text at the top right.

### 49.4 Concession / Scholarship Management

A dedicated "Concessions / رعایت" section within the fee page (accessible via `Tabs` at the top: "Fee Collection" | "Concessions").

**Concession table:** Student Name (`font-urdu`), Class/Darja, Normal Fee, Concession % (`Badge`), Actual Fee, Reason, Approved By, Actions.

**Grant Concession Dialog:**
- Student search (search by name or roll number)
- Concession Type `Select`:
  - Full Scholarship / مکمل وظیفہ (100% — fee = 0)
  - Partial Discount / جزوی رعایت (enter % or fixed amount)
  - Sibling Discount / بہن بھائی رعایت (auto-applied if sibling is also enrolled)
  - Staff Ward / عملہ کا بچہ
  - Zakat / Charity Case / زکوٰة کیس
- Discount value (`Input` — percentage or PKR amount)
- Valid from date + Valid until date (or "Indefinite" toggle)
- Approval note `Textarea`

---

## 50. Madrassa Hifz Student — Full UI Specification

The Hifz track is fundamentally different from academic tracks. This section fully specifies the UI for Hifz students.

### 50.1 Hifz Student Profile

**Profile header:** Same structure as other students but with a `Badge` reading "حافظ القرآن" (once complete) or "طالب حفظ" (in progress) instead of a darja badge.

**Overview tab — Hifz-specific cards:**

*Hifz Progress Card* (replaces the standard enrollment details card):

```
Hifz Progress / حفظ پیش رفت
────────────────────────────
Juz Completed:    18 / 30
Juz in Progress:  19 (سورۃ الفرقان — Al-Furqan)
Started:          15 March 2023
Est. Completion:  August 2025
Teacher:          حافظ محمد سلیم
```

Below the card: a `Progress` bar showing `(18/30) × 100 = 60%` with label "۱۸ پارے مکمل — ۱۲ باقی" (`font-urdu text-sm`). Filled with `bg-chart-1`.

**Juz Grid** (the core Hifz UI component):

A `grid grid-cols-6 gap-2` of 30 cells. Each cell:

- **Not started:** `rounded-xl border border-border bg-muted/40 flex flex-col items-center justify-center h-14 cursor-not-allowed`
  - Juz number in Arabic-Indic numerals (١–٣٠) in `text-muted-foreground font-medium`
  - Small Surah name in `text-[10px] text-muted-foreground`

- **In progress:** `rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 flex flex-col items-center justify-center h-14 cursor-pointer animate-pulse`
  - Juz number in `text-amber-700 font-bold`
  - "جاری" badge in `text-[10px]`

- **Completed:** `rounded-xl border border-chart-2/50 bg-chart-1/10 flex flex-col items-center justify-center h-14 cursor-pointer`
  - `Check` icon (12px, `text-chart-1`) in top-right corner
  - Juz number in `text-chart-3 font-bold`
  - Completion date in `text-[10px] text-muted-foreground`

Clicking any cell opens a **Juz Detail Popover**:
- Juz number + first Surah name
- Status `RadioGroup`: Not Started / In Progress / Completed
- If Completed: Date Completed `DatePicker`
- If In Progress: Last revision date `DatePicker`
- Notes `Textarea` (optional — teacher notes on memorization quality)
- Save button

**Revision Tracking tab** (replaces Fees in Hifz profile — Hifz students often have no fees):

A monthly revision log. Table columns: Date, Juz Revised, Pages Revised, Quality (`Select`: ممتاز/اچھا/ٹھیک/کمزور), Teacher, Notes. "Record Revision / مراجعہ درج کریں" button opens a quick-entry dialog.

**Hifz Exam tab:**

Internal Hifz exams test how many Juz the student can recite without mistakes. Table: Exam Date, Juz Tested, Mistakes Count, Result (Pass/Fail), Examiner, Notes.

"External Wifaq Hifz Exam" section below: Wifaq annual Hifz exams are held simultaneously across Pakistan for all registered Hifz students. Shows Wifaq registration status + result when entered.

### 50.2 Hifz Completion Ceremony

When a student completes all 30 Juz and the admin marks the final Juz as complete, a **confetti animation** triggers (using CSS keyframe — no external library). The student's status automatically updates to "Complete Hifz" and a `Dialog` opens:

**"Hifz Completion" dialog:**
```
🎉 مبارک ہو!
[Student Name] نے حفظ القرآن مکمل کیا

Completion Date:     [Today's date]
Duration:            2 years, 4 months
Starting Juz:        1
Completing Juz:      30
Total Revisions:     847

□ Generate Hifz Certificate
□ Record in Graduation List
□ Assign Hifz Sanad Number

[Save & Mark as Hafiz]
```

The "Generate Hifz Certificate" checkbox triggers a printable certificate print layout when the dialog is saved.

---

## 51. Detailed Marks Card (DMC) — Pakistan-Specific Format

The DMC (Detailed Marks Card) is the official result document issued to students. Pakistani schools and madrassas have a standard format. This section replaces the generic DMC spec in Section 13.4.

### 51.1 School DMC Layout

Rendered as an A4 portrait print layout within the DMC `Dialog`:

```
╔══════════════════════════════════════════════╗
║  [LOGO]     ادارے کا نام                      ║
║             Institution Full Name             ║
║             Address, City, Phone             ║
╠══════════════════════════════════════════════╣
║         تفصیلی نمبر نامہ / DETAILED MARKS CARD║
╠══════════════════════════════════════════════╣
║  نام:  محمد عبداللہ        Roll No: M2-042   ║
║  جماعت: دسویں (میٹرک دوم)  Section: A         ║
║  امتحان: سالانہ امتحان 2025  Group: Science   ║
║  BISE Roll No: [if applicable]               ║
╠══════╦══════╦══════╦══════╦══════╦═══════════╣
║مضمون ║کل نمبر║گذشتہ نمبر║حاصل نمبر║فیصد  ║گریڈ ║
╠══════╬══════╬══════╬══════╬══════╬═══════════╣
║اردو  ║  100 ║  75  ║  82  ║ 82%  ║  A   ║
║انگریزی║ 100 ║  68  ║  74  ║ 74%  ║  B   ║
║ریاضی ║  100 ║  80  ║  88  ║ 88%  ║  A   ║
║طبیعیات║ 75  ║  60  ║  65  ║ 87%  ║  A   ║
║کیمیا ║  75  ║  58  ║  63  ║ 84%  ║  A   ║
║حیاتیات║ 75  ║  65  ║  70  ║ 93%  ║  A1  ║
║اسلامیات║ 50 ║  42  ║  45  ║ 90%  ║  A1  ║
║مطالعہ پاکستان║50║  35  ║  40  ║ 80%  ║  A   ║
╠══════╬══════╬══════╬══════╬══════╬═══════════╣
║مجموعہ║  625 ║  483 ║  527 ║ 84.3%║  A   ║
╠══════════════════════════════════════════════╣
║  نتیجہ: کامیاب  ★  امتیاز حاصل کیا          ║
║  Position in Class: 3rd                      ║
╠══════════════════════════════════════════════╣
║  Principal's Signature    Class Teacher's    ║
║  _________________        Signature:______   ║
╚══════════════════════════════════════════════╝
```

**DMC columns:** Subject (Urdu), Total Marks, Previous Year (optional column, visible if historical data exists), Obtained Marks, Percentage, Grade.

**Comparison column** (previous year): If the student has a result from the previous year for the same subject, show it in a faint `text-muted-foreground` column. This lets teachers and parents see progress year-over-year.

**Class position:** Calculated as rank among all students in the same class+section who appeared in this exam. "1st / اول", "2nd / دوم" etc.

### 51.2 Madrassa Result Card (نتیجہ کارڈ) Layout

Madrassa result cards follow a similar structure but with Dars-e-Nizami subjects:

```
╔══════════════════════════════════════════════╗
║  [Logo]    مدرسہ کا نام                       ║
║            بورڈ: وفاق المدارس العربیہ پاکستان ║
╠══════════════════════════════════════════════╣
║         نتیجہ کارڈ / RESULT CARD             ║
╠══════════════════════════════════════════════╣
║  نام: محمد عبداللہ        رول نمبر: DN2-007  ║
║  درجہ: درجہ دوم           سال: 1447 ہجری      ║
║  وفاق رول نمبر: [if Wifaq registered]        ║
╠══════╦══════╦══════╦══════╦══════╗            ║
║مضمون ║کل نمبر║حاصل نمبر║فیصد  ║نتیجہ║            ║
╠══════╬══════╬══════╬══════╬══════╣            ║
║نحو   ║  100 ║  78  ║ 78%  ║ اچھا ║            ║
║صرف   ║  100 ║  85  ║ 85%  ║ ممتاز║            ║
║فقہ   ║  100 ║  90  ║ 90%  ║ ممتاز║            ║
║تجوید ║   50 ║  44  ║ 88%  ║ ممتاز║            ║
║سیرت  ║   50 ║  40  ║ 80%  ║ اچھا ║            ║
╠══════╬══════╬══════╬══════╬══════╣            ║
║مجموعہ║  400 ║  337 ║ 84.3%║ممتاز ║            ║
╠══════════════════════════════════════════════╣
║  نتیجہ: کامیاب ★  اگلے درجے میں ترقی        ║
╚══════════════════════════════════════════════╝
```

**Urdu grading labels** for madrassa results:
- 80%+ → ممتاز (Mumtaz — Distinction)
- 65–79% → اچھا (Acha — Good)
- 50–64% → اوسط (Ausat — Average)
- 33–49% → کم اوسط (Kam Ausat — Below Average)
- Below 33% → ناکام (Nakam — Fail)

---

## 52. Student ID Card — Pakistan Standard Format

Pakistani school and madrassa ID cards follow a credit-card size format (85.6mm × 53.98mm). The design must reflect an actual Pakistani institution ID card, not a generic badge.

### 52.1 School ID Card

```
╔═══════════════════════════════════════╗
║ ██ [LOGO] ██   ادارے کا نام           ║  ← Green header band
║           School Name (English)       ║
╠═══════════════════════════════════════╣
║ ┌────┐  نام: محمد عبداللہ            ║
║ │    │  Name: Muhammad Abdullah       ║
║ │PHOTO│  Class: Grade 9 — Section A   ║
║ │    │  Roll No: M1-042               ║
║ └────┘  Session: 2024–2025            ║
╠═══════════════════════════════════════╣
║ Emergency: 0312-XXXXXXX  [Barcode]   ║  ← Green footer band
╚═══════════════════════════════════════╝
```

**Colours:** Header and footer bands use `bg-primary`. Photo placeholder uses `bg-muted rounded-sm`. All text inside uses design tokens.

**Barcode placeholder:** A `div` with horizontal lines (`bg-foreground/80`) simulating a barcode. This is a visual placeholder — actual barcode generation is out of scope for Phase 1.

### 52.2 Madrassa ID Card

```
╔═══════════════════════════════════════╗
║ ██ [LOGO] ██   مدرسے کا نام           ║  ← Gold/amber header
╠═══════════════════════════════════════╣
║ ┌────┐  نام: محمد عبداللہ            ║
║ │    │  رول نمبر: DN2-007             ║
║ │PHOTO│  درجہ: درجہ دوم              ║
║ │    │  سال: 2024–2025               ║
║ └────┘  قسم: درس نظامی              ║
╠═══════════════════════════════════════╣
║ ولی: محمد اکرم  ☎ 0333-XXXXXXX       ║
╚═══════════════════════════════════════╝
```

**Colours:** Header uses `bg-amber-600` (warm gold to distinguish from school cards visually).

---

## 53. Teacher Module — Pakistani Context & Extended Specs

### 53.1 Teacher Profile — Pakistani Fields

**Additional fields** specific to Pakistani institutions:

- CNIC (`Input`, Pakistani format `XXXXX-XXXXXXX-X`)
- Qualification (`Select`): BA/BSc, MA/MSc, BEd, MEd, Alim/Fadhil, Alima, PhD, Other
- Specialization (`Input`, bilingual — e.g. "Arabic Grammar / نحو")
- Appointment Type (`Select`): Permanent / Probationary / Contract / Part-time / Volunteer
- Joining Date `DatePicker`
- Salary (`Input`, PKR — links to finance module)
- Assigned Subjects + Classes/Darjat (multi-select)

### 53.2 Teacher Attendance — Extended

**Pakistani school schedule context:** Most teachers work 6 days a week (Mon–Sat) or 5 days. The attendance module respects the weekly off day setting from Section 46.2.

**Attendance record form:**

```
Date: [Today]
Teacher: Ustad Bilal Ahmed

○ Present (حاضر)
○ Absent — With Notice (غیر حاضر — اطلاع کے ساتھ)
○ Absent — Without Notice (غیر حاضر — بلا اطلاع)
○ Late (دیر سے حاضر)
○ Half Day (نصف دن)
○ On Leave (رخصت پر)

If Present:
  Arrival Time: [Time Input]
  Departure Time: [Time Input]

If Late:
  Arrival Time: [Time Input]
  Delay Reason: [Input]

If On Leave:
  Leave Type: Casual / Medical / Annual / Emergency
  Leave Document: [File Upload, optional]
```

**Monthly Attendance Summary card** on Teacher Profile:
```
April 2025 Summary
────────────────────────────────────
Working Days:        26
Present:             22
Absent (excused):     2
Absent (unexcused):   1
Late:                 1
Attendance Rate:   88.5%

Late deductions:    −PKR 500 (1 × PKR 500)
Absence deductions: −PKR 2,000 (1 unexcused × PKR 2,000)
Net Deduction:      −PKR 2,500
Final Salary:       PKR 22,500 (base PKR 25,000 − PKR 2,500)
```

### 53.3 Salary Management (`/teachers/$id` — Salary Tab)

**Monthly Salary card:**

- Base Salary (PKR)
- Allowances: House Rent Allowance (HRA), Medical Allowance, Transport Allowance — each a separate `Input` row in a small table
- Deductions: Late deductions (auto-calculated), Absence deductions (auto-calculated), Loan repayment (`Input` if applicable), Tax (`Input` optional)
- Net Salary = Base + Allowances − Deductions

**Salary slip generation:** "Generate Salary Slip / تنخواہ پرچی" button produces a print layout:

```
╔════════════════════════════════╗
║ ادارے کا نام — تنخواہ پرچی    ║
╠════════════════════════════════╣
║ استاد: محمد سلیم               ║
║ ماہ: اپریل 2025               ║
╠══════════════╦═════════════════╣
║ آمدنی        ║ PKR             ║
║ بنیادی تنخواہ║ 25,000          ║
║ مکان کرایہ  ║  5,000           ║
║ میڈیکل      ║  2,000           ║
╠══════════════╬═════════════════╣
║ مجموعہ آمدنی║ 32,000          ║
╠══════════════╬═════════════════╣
║ کٹوتیاں      ║ PKR             ║
║ غیر حاضری   ║ −2,000           ║
║ دیر سے آمد  ║   −500           ║
╠══════════════╬═════════════════╣
║ خالص تنخواہ  ║ 29,500          ║
╠════════════════════════════════╣
║ دستخط: ________________        ║
╚════════════════════════════════╝
```

---

## 54. Parents Portal — Pakistani Context & Extended Specs

### 54.1 Fee Payment Tracking in Portal

Pakistani parents frequently enquire about fee status before school events (result day, exam registration). The portal fee section must be clear and actionable:

**Fee Status card** (prominent, top of Fee tab):
```
ماہ اپریل 2025 کی فیس
─────────────────────────────
واجب الادا:     PKR 1,500
ادا شدہ:        PKR 1,500
تاریخ ادائیگی:  05/04/2025
رسید نمبر:      R-2025-042
کیفیت:          ✅ ادا شدہ

───────────────────────────
بقایہ (پچھلے ماہ):  PKR 0
───────────────────────────
```

If fee is unpaid: card background changes to `bg-destructive/5 border-destructive/20`. A `Alert` shows:
```
⚠️ فیس ادا نہیں ہوئی
ماہ اپریل 2025 کی فیس ابھی تک جمع نہیں ہوئی۔
براہ کرم ادارے سے رابطہ کریں۔
```

### 54.2 Attendance Communication

Pakistani parents want to know specifically *why* their child was absent, not just that they were marked absent. The attendance tab shows:

**Absence detail row** (expanded on click):
```
🔴 غیر حاضر — 15 اپریل 2025 (منگل)
   مضمون/درجہ: درجہ دوم
   [اطلاع دیں] button → opens a text input to send a note to admin
```

"اطلاع دیں" (Notify) button creates a record in the admin panel showing the parent's note about the absence reason (e.g., illness, family emergency).

### 54.3 Result & Academic Performance

**Performance trend card** (Parents Portal — Overview tab):

A small `recharts AreaChart` (height 80px, no axes, `stroke-primary`, `fill-primary/10`) showing the student's percentage trend across the last 4 exams. Below it: "بہتری / Progress: +6% since last exam" in `text-chart-1` or "کمی / Decline: −3%" in `text-destructive`.

**Subject performance breakdown** (Fees → Results cross-section):

A horizontal bar per subject: subject name (`font-urdu text-xs`), a `recharts BarChart` showing the last 3 exam results for that subject. Helps parents identify weak subjects.

---

## 55. Reports Module — Pakistan-Specific Additions

### 55.1 Monthly Progress Report (ماہانہ ترقی رپورٹ)

A report specifically designed to be printed and sent home to parents with the student's monthly fee receipt. One page per student.

**Layout (A5 size, designed to fold in half):**

```
╔══════════════════════════════════╗
║ [Logo] ادارے کا نام              ║
║ ماہانہ ترقی رپورٹ — اپریل 2025   ║
╠══════════════════════════════════╣
║ نام: محمد عبداللہ                ║
║ درجہ/جماعت: درجہ دوم             ║
╠══════════════╦═══════════════════╣
║ حاضری         ║ 22/26 (84.6%)    ║
║ فیس           ║ PKR 1,500 — ادا  ║
║ ماہانہ ٹیسٹ   ║ 78% — اچھا       ║
║ استاد کا نوٹ  ║ [Free text field]║
╠══════════════════════════════════╣
║ والدین کے دستخط: ______________   ║
╚══════════════════════════════════╝
```

"Print All Progress Reports" button in the Monthly Report page header generates one A5 card per student for the selected class/darja and month. Batch print using `window.print()` with `@media print` `page-break-after: always` between each card.

### 55.2 Annual Result Sheet (سالانہ نتیجہ شیٹ)

The Annual Result Sheet is a single A3 landscape document showing all students in a class/darja with their results in one consolidated view. Used by madrassa/school administration for record keeping and submitted to the Wifaq board.

Columns: Serial No, Roll No, Student Name (`font-urdu`), one column per subject (marks obtained), Total, Percentage, Grade, Result (Pass/Fail).

Footer: Total appeared, Total passed, Pass percentage, Date, Principal signature line.

This is generated from the Annual Report page via "Generate Annual Sheet / سالانہ نتیجہ شیٹ" button. Uses the `print-target` class.

---

## 56. Admin Audit Log

Every significant action in the app is logged for accountability. Pakistani educational institutions — particularly madrassas — are audited by both Wifaq boards and government bodies. An audit trail is a compliance requirement.

### 56.1 Audit Log Page (`/settings/audit`) — NEW

Add to route map under Settings, visible to `super_admin` only.

**Audit log table:**

| # | Action | Actor | Target | Before | After | Timestamp |
|---|---|---|---|---|---|---|

Each row: action in English, actor name (`font-urdu`) + role `Badge`, target (student name or system setting), before/after values in `font-mono text-xs`, timestamp.

**Action types logged:**
- Student admitted / Student exited
- Student promoted / demoted
- Fee recorded / waived / modified
- Exam result entered / modified
- User created / deactivated / password reset
- Attendance saved
- Any settings changed

**Filter bar:** Date range, Action Type `Select`, Actor `Select`.

**Export:** "Export Log / لاگ برآمد کریں" — Excel export of all audit records for the selected filter.

---

## 57. Subjects Mock Data

Add `src/mock/subjects.ts` to provide real Pakistani subject data:

```ts
export type Subject = {
  id: string
  name: string
  nameUrdu: string
  classIds: string[]       // which classes this subject belongs to
  subcategoryIds: string[] // which madrassa darjat this subject belongs to
  totalMarks: number
  passingMarks: number
  group: 'compulsory' | 'elective' | 'religious'
  type: 'school' | 'madrassa'
}

// School subjects
export const mockSubjects: Subject[] = [
  // Primary (Grade 1–5)
  { id: 'sbj-001', name: 'Urdu', nameUrdu: 'اردو', classIds: ['cls-001','cls-002','cls-003','cls-004','cls-005'], subcategoryIds: [], totalMarks: 100, passingMarks: 40, group: 'compulsory', type: 'school' },
  { id: 'sbj-002', name: 'English', nameUrdu: 'انگریزی', classIds: ['cls-001','cls-002','cls-003','cls-004','cls-005'], subcategoryIds: [], totalMarks: 100, passingMarks: 40, group: 'compulsory', type: 'school' },
  { id: 'sbj-003', name: 'Mathematics', nameUrdu: 'ریاضی', classIds: ['cls-001','cls-002','cls-003','cls-004','cls-005','cls-006','cls-007','cls-008'], subcategoryIds: [], totalMarks: 100, passingMarks: 40, group: 'compulsory', type: 'school' },
  { id: 'sbj-004', name: 'Islamiyat', nameUrdu: 'اسلامیات', classIds: ['cls-001','cls-002','cls-003','cls-004','cls-005','cls-006','cls-007','cls-008'], subcategoryIds: [], totalMarks: 50, passingMarks: 20, group: 'compulsory', type: 'school' },
  { id: 'sbj-005', name: 'General Science', nameUrdu: 'عمومی سائنس', classIds: ['cls-003','cls-004','cls-005','cls-006','cls-007','cls-008'], subcategoryIds: [], totalMarks: 75, passingMarks: 30, group: 'compulsory', type: 'school' },
  { id: 'sbj-006', name: 'Social Studies', nameUrdu: 'معاشرتی علوم', classIds: ['cls-006','cls-007','cls-008'], subcategoryIds: [], totalMarks: 75, passingMarks: 30, group: 'compulsory', type: 'school' },
  { id: 'sbj-007', name: 'Pakistan Studies', nameUrdu: 'مطالعہ پاکستان', classIds: ['cls-009','cls-010'], subcategoryIds: [], totalMarks: 50, passingMarks: 20, group: 'compulsory', type: 'school' },
  // Secondary Science Group
  { id: 'sbj-008', name: 'Physics', nameUrdu: 'طبیعیات', classIds: ['cls-009','cls-010'], subcategoryIds: [], totalMarks: 75, passingMarks: 30, group: 'elective', type: 'school' },
  { id: 'sbj-009', name: 'Chemistry', nameUrdu: 'کیمیا', classIds: ['cls-009','cls-010'], subcategoryIds: [], totalMarks: 75, passingMarks: 30, group: 'elective', type: 'school' },
  { id: 'sbj-010', name: 'Biology', nameUrdu: 'حیاتیات', classIds: ['cls-009','cls-010'], subcategoryIds: [], totalMarks: 75, passingMarks: 30, group: 'elective', type: 'school' },
  { id: 'sbj-011', name: 'Computer Science', nameUrdu: 'کمپیوٹر سائنس', classIds: ['cls-007','cls-008','cls-009','cls-010'], subcategoryIds: [], totalMarks: 75, passingMarks: 30, group: 'elective', type: 'school' },

  // Madrassa subjects — Dars-e-Nizami
  { id: 'sbj-101', name: 'Sarf', nameUrdu: 'صرف', classIds: [], subcategoryIds: ['sub-009','sub-010'], totalMarks: 100, passingMarks: 40, group: 'religious', type: 'madrassa' },
  { id: 'sbj-102', name: 'Nahw', nameUrdu: 'نحو', classIds: [], subcategoryIds: ['sub-009','sub-010','sub-011'], totalMarks: 100, passingMarks: 40, group: 'religious', type: 'madrassa' },
  { id: 'sbj-103', name: 'Fiqh', nameUrdu: 'فقہ', classIds: [], subcategoryIds: ['sub-009','sub-010','sub-011','sub-012'], totalMarks: 100, passingMarks: 40, group: 'religious', type: 'madrassa' },
  { id: 'sbj-104', name: 'Tajweed', nameUrdu: 'تجوید', classIds: [], subcategoryIds: ['sub-008','sub-009','sub-010'], totalMarks: 50, passingMarks: 20, group: 'religious', type: 'madrassa' },
  { id: 'sbj-105', name: 'Sirah', nameUrdu: 'سیرت', classIds: [], subcategoryIds: ['sub-009','sub-010','sub-011'], totalMarks: 50, passingMarks: 20, group: 'religious', type: 'madrassa' },
  { id: 'sbj-106', name: 'Tafsir', nameUrdu: 'تفسیر', classIds: [], subcategoryIds: ['sub-012','sub-013','sub-014'], totalMarks: 100, passingMarks: 40, group: 'religious', type: 'madrassa' },
  { id: 'sbj-107', name: 'Hadith', nameUrdu: 'حدیث', classIds: [], subcategoryIds: ['sub-013','sub-014','sub-015'], totalMarks: 100, passingMarks: 40, group: 'religious', type: 'madrassa' },
  { id: 'sbj-108', name: 'Usul al-Fiqh', nameUrdu: 'اصول فقہ', classIds: [], subcategoryIds: ['sub-012','sub-013'], totalMarks: 100, passingMarks: 40, group: 'religious', type: 'madrassa' },
  { id: 'sbj-109', name: 'Mantiq', nameUrdu: 'منطق', classIds: [], subcategoryIds: ['sub-011','sub-012'], totalMarks: 75, passingMarks: 30, group: 'religious', type: 'madrassa' },
  { id: 'sbj-110', name: 'Balaghat', nameUrdu: 'بلاغت', classIds: [], subcategoryIds: ['sub-012','sub-013'], totalMarks: 75, passingMarks: 30, group: 'religious', type: 'madrassa' },
  { id: 'sbj-111', name: 'Tarikh-e-Islam', nameUrdu: 'تاریخ اسلام', classIds: [], subcategoryIds: ['sub-009','sub-010','sub-011'], totalMarks: 50, passingMarks: 20, group: 'religious', type: 'madrassa' },
]
```

---

## 58. File Structure Additions (Sections 41–57)

Add the following to the file structure in Section 39:

```
src/
├── features/
│   ├── madrassa/
│   │   ├── components/
│   │   │   ├── HifzJuzGrid.tsx           # NEW — 30-cell Juz tracker
│   │   │   ├── HifzCompletionDialog.tsx  # NEW — Hifz celebration dialog
│   │   │   ├── HifzRevisionLog.tsx       # NEW — Revision tracking table
│   │   │   ├── MadrassaExamList.tsx      # NEW
│   │   │   ├── MadrassaExamDetail.tsx    # NEW
│   │   │   ├── MadrassaMarkEntry.tsx     # NEW
│   │   │   ├── MadrassaExamResults.tsx   # NEW
│   │   │   ├── MadrassaBoardExams.tsx    # NEW
│   │   │   ├── MadrassaResultCard.tsx    # NEW — print layout
│   │   │   └── WifaqRegistrationTable.tsx# NEW
│   ├── school/
│   │   ├── components/
│   │   │   ├── SchoolClassManager.tsx    # NEW
│   │   │   ├── SchoolTimetable.tsx       # NEW
│   │   │   ├── TimetablePeriodDialog.tsx # NEW
│   │   │   ├── SchoolBoardExams.tsx      # NEW
│   │   │   ├── GroupAssignDialog.tsx     # NEW — Science/Arts group
│   │   │   └── SubjectManager.tsx        # NEW
│   ├── teachers/
│   │   ├── components/
│   │   │   ├── SalarySlip.tsx            # NEW — print layout
│   │   │   ├── SalaryTab.tsx             # NEW
│   │   │   └── LeaveRecord.tsx           # NEW
│   ├── fees/
│   │   ├── components/
│   │   │   ├── ConcessionManager.tsx     # NEW
│   │   │   └── DefaulterList.tsx         # NEW
│   └── settings/
│       ├── components/
│           ├── AcademicYearManager.tsx   # NEW
│           ├── HolidayCalendar.tsx       # NEW
│           └── AuditLog.tsx              # NEW
├── mock/
│   ├── subjects.ts                       # NEW
│   ├── madrassa-exams.ts                 # NEW
│   ├── holidays.ts                       # NEW
│   └── audit-log.ts                      # NEW
└── routes/
    └── _authenticated/
        ├── madrassa/
        │   ├── exams.tsx                 # NEW
        │   ├── exams.$id.tsx             # NEW
        │   ├── exams.$id.marks.tsx       # NEW
        │   ├── exams.$id.results.tsx     # NEW
        │   └── exams.board.tsx           # NEW
        ├── school/
        │   ├── classes.tsx               # NEW
        │   ├── timetable.tsx             # NEW
        │   └── exams.board.tsx           # NEW
        └── settings/
            ├── academic-year.tsx         # NEW
            ├── holidays.tsx              # NEW
            └── audit.tsx                 # NEW
```

---

*End of continuation — Sections 46–58.*  
*The UI brief now fully covers: academic year management, holiday calendars, timetables, Hifz student lifecycle, Pakistani DMC format, Pakistani ID card format, teacher salary slips, fee concessions, Pakistan-authentic subject lists, and audit logging.*
