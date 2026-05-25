// MSMIS formatters. All money values flow through these helpers.
// Storage convention: integer PAISA (1 PKR = 100 paisa).

const PKR = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

const PKR_DECIMAL = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format paisa as Pakistani Rupee currency (rounded to whole rupees). */
export function formatPKR(paisa: number): string {
  return PKR.format(Math.round(paisa / 100));
}

/** Format paisa with decimals (for receipts). */
export function formatPKRDecimal(paisa: number): string {
  return PKR_DECIMAL.format(paisa / 100);
}

/** Convert rupees (user input) to paisa for storage. */
export function rupeesToPaisa(rupees: number | string): number {
  const n = typeof rupees === "string" ? parseFloat(rupees) : rupees;
  return Math.round((Number.isFinite(n) ? n : 0) * 100);
}

/** Convert paisa to rupees (for displays/forms). */
export function paisaToRupees(paisa: number): number {
  return paisa / 100;
}

const ARABIC_INDIC: Record<string, string> = {
  "0": "۰",
  "1": "۱",
  "2": "۲",
  "3": "۳",
  "4": "۴",
  "5": "۵",
  "6": "۶",
  "7": "۷",
  "8": "۸",
  "9": "۹",
};

/** Convert Western numerals to Arabic-Indic (Urdu) digits. */
export function toArabicIndic(input: number | string): string {
  return String(input).replace(/[0-9]/g, (d) => ARABIC_INDIC[d] ?? d);
}

/** Format a number with English thousand separators. */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-PK").format(n);
}

/** Format a date like "21 March 2025". */
export function formatDate(d: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", opts ?? { day: "2-digit", month: "short", year: "numeric" });
}

const URDU_MONTHS = [
  "جنوری",
  "فروری",
  "مارچ",
  "اپریل",
  "مئی",
  "جون",
  "جولائی",
  "اگست",
  "ستمبر",
  "اکتوبر",
  "نومبر",
  "دسمبر",
];

/** Format a date in Urdu: "۲۱ مارچ ۲۰۲۵". */
export function formatUrduDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${toArabicIndic(date.getDate())} ${URDU_MONTHS[date.getMonth()]} ${toArabicIndic(date.getFullYear())}`;
}

/** Relative time: "12m ago", "3d ago". */
export function relativeTime(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

/** Format a percentage to 1 decimal. */
export function formatPercent(pct: number): string {
  return `${pct.toFixed(1)}%`;
}

/** Zero-pad a roll number. */
export function formatRoll(prefix: string, n: number, width = 3): string {
  return `${prefix}-${String(n).padStart(width, "0")}`;
}

/** Pakistani CNIC mask: 12345-1234567-1 */
export function formatCNIC(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

/** Pakistani phone mask: 0300-1234567 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}