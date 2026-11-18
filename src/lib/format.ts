export function formatPKR(amount?: number | null): string {
  const val = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatNumber(n?: number | null): string {
  const val = typeof n === "number" && !isNaN(n) ? n : 0;
  return new Intl.NumberFormat("en-PK").format(val);
}

export function formatDate(d?: string | Date | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!d) return "—";
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-GB", opts ?? { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

export function relativeTime(d?: string | Date | null, lang: "ur" | "en" = "en"): string {
  if (!d) return "—";
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    if (isNaN(date.getTime())) return "—";
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const isUrdu = lang === "ur";
    if (mins < 1) return isUrdu ? "ابھی" : "just now";
    if (mins < 60) return isUrdu ? `${mins} منٹ پہلے` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return isUrdu ? `${hours} گھنٹے پہلے` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return isUrdu ? `${days} دن پہلے` : `${days}d ago`;
    return formatDate(date);
  } catch {
    return "—";
  }
}