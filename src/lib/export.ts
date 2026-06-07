/**
 * Lightweight CSV + print helpers for report pages.
 * No external deps — works as a true client-side download.
 */

export type CsvValue = string | number | boolean | null | undefined;

function escapeCell(v: CsvValue): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(headers: string[], rows: CsvValue[][]): string {
  const head = headers.map(escapeCell).join(",");
  const body = rows.map((r) => r.map(escapeCell).join(",")).join("\n");
  // BOM ensures Urdu / non-ASCII renders correctly in Excel
  return "\uFEFF" + head + "\n" + body;
}

export function downloadCsv(filename: string, headers: string[], rows: CsvValue[][]) {
  const csv = rowsToCsv(headers, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

/** Opens a print-friendly window with the given HTML body. */
export function printHtml(title: string, bodyHtml: string) {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) {
    window.print();
    return;
  }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body{font-family:ui-sans-serif,system-ui,sans-serif;color:#111;padding:24px;}
      h1{font-size:20px;margin:0 0 4px;}
      .urdu{font-family:'Noto Nastaliq Urdu',serif;direction:rtl;font-size:18px;color:#555;}
      table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px;}
      th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;}
      th{background:#f3f4f6;}
      .kpi{display:inline-block;margin:6px 16px 6px 0;padding:8px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;}
      .meta{color:#6b7280;font-size:11px;margin-top:8px;}
    </style></head><body>${bodyHtml}<script>window.onload=()=>{setTimeout(()=>window.print(),250)}</script></body></html>`);
  w.document.close();
}

export function tableHtml(headers: string[], rows: CsvValue[][]): string {
  const thead = headers.map((h) => `<th>${h}</th>`).join("");
  const tbody = rows
    .map((r) => `<tr>${r.map((c) => `<td>${c ?? ""}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
}

export function kpiHtml(items: { label: string; value: string | number }[]): string {
  return items.map((k) => `<div class="kpi"><strong>${k.value}</strong> · ${k.label}</div>`).join("");
}