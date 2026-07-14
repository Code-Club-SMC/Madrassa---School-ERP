import type { AdmissionVariant } from "@/lib/admission-variants";

type F = { urdu: string; english: string; key: string; span?: 1 | 2 | 3 | 4 };
type Sec = { urdu: string; english: string; fields: F[] };

const meta = (v: AdmissionVariant): F[] => {
  const base: F[] = [
    { urdu: "فارم نمبر", english: "Form No.", key: "form_no" },
    { urdu: "داخلہ نمبر", english: "Admission No.", key: "adm_no" },
    { urdu: "تاریخ داخلہ", english: "Adm. Date", key: "adm_date" },
  ];
  if (v.layout !== "school") {
    base.push(
      { urdu: "پرانہ داخلہ نمبر", english: "Prev. Adm. No.", key: "prev_adm_no" },
      { urdu: "بمطابق", english: "Corresponding", key: "bmutabiq" },
      { urdu: "رجسٹریشن نمبر", english: "Reg. No.", key: "reg_no" },
    );
  }
  if (v.layout === "madrassa-long") {
    base.push(
      { urdu: "مطلوبہ درجہ", english: "Requested Darja", key: "req_darja" },
      { urdu: "امتحان داخلہ نمبرات", english: "Entry-Test Marks", key: "entry_marks" },
      { urdu: "تعلیمی سال", english: "Academic Year", key: "acad_year" },
    );
  }
  return base;
};

const schoolSections: Sec[] = [
  {
    urdu: "طالب علم کی معلومات",
    english: "Student Info",
    fields: [
      { urdu: "نام", english: "Name", key: "name" },
      { urdu: "ولدیت", english: "Father", key: "father" },
      { urdu: "تاریخ پیدائش (ہندسوں)", english: "DOB (Digits)", key: "dob_digits" },
      { urdu: "تاریخ پیدائش (لفظوں)", english: "DOB (In Words)", key: "dob_words" },
      { urdu: "پتہ", english: "Address", key: "address", span: 2 },
      { urdu: "پیشہ", english: "Occupation", key: "occupation" },
      { urdu: "مذہب", english: "Religion", key: "religion" },
      { urdu: "سابقہ سکول", english: "Previous School", key: "prev_school", span: 2 },
      { urdu: "سرٹیفیکیٹ / فائل نمبر", english: "Cert / File No.", key: "cert_no" },
      { urdu: "داخلہ کلاس", english: "Admitted Class", key: "class" },
    ],
  },
  {
    urdu: "سرپرست",
    english: "Guardian",
    fields: [
      { urdu: "سرپرست کا نام", english: "Guardian Name", key: "guardian_name" },
      { urdu: "مدرسہ داخلہ؟", english: "Also Madrassa?", key: "also_madrassa" },
      { urdu: "کس شعبہ میں", english: "Which Section", key: "madrassa_section" },
    ],
  },
];

const madrassaShortSections: Sec[] = [
  {
    urdu: "کوائف طالب علم",
    english: "Student Details",
    fields: [
      { urdu: "نام", english: "Name", key: "name" },
      { urdu: "ولدیت", english: "Father", key: "father" },
      { urdu: "تاریخ پیدائش", english: "DOB", key: "dob" },
      { urdu: "شعبہ", english: "Section", key: "shoba" },
      { urdu: "موجودہ پتہ", english: "Current Address", key: "curr_address", span: 2 },
      { urdu: "مستقل پتہ", english: "Permanent Address", key: "perm_address", span: 2 },
      { urdu: "سابقہ مدرسہ", english: "Previous Madrassa", key: "prev_madrassa", span: 2 },
    ],
  },
  {
    urdu: "سرپرست",
    english: "Guardian",
    fields: [
      { urdu: "سرپرست کا نام", english: "Guardian Name", key: "guardian_name" },
      { urdu: "رشتہ", english: "Relation", key: "guardian_rel" },
      { urdu: "رابطہ نمبر", english: "Contact", key: "guardian_phone" },
    ],
  },
];

const madrassaLongSections: Sec[] = [
  {
    urdu: "کوائف نامہ",
    english: "Personal Particulars",
    fields: [
      { urdu: "نام", english: "Name", key: "name" },
      { urdu: "ولدیت", english: "Father", key: "father" },
      { urdu: "تاریخ پیدائش / عمر", english: "DOB / Age", key: "dob_age" },
      { urdu: "موجودہ: گاؤں", english: "Curr. Village", key: "curr_village" },
      { urdu: "موجودہ: ڈاکخانہ", english: "Curr. P.O.", key: "curr_po" },
      { urdu: "موجودہ: تحصیل", english: "Curr. Tehsil", key: "curr_tehsil" },
      { urdu: "موجودہ: ضلع", english: "Curr. District", key: "curr_district" },
      { urdu: "موجودہ: فون", english: "Curr. Phone", key: "curr_phone" },
      { urdu: "مستقل: گاؤں", english: "Perm. Village", key: "perm_village" },
      { urdu: "مستقل: ڈاکخانہ", english: "Perm. P.O.", key: "perm_po" },
      { urdu: "مستقل: تحصیل", english: "Perm. Tehsil", key: "perm_tehsil" },
      { urdu: "مستقل: ضلع", english: "Perm. District", key: "perm_district" },
      { urdu: "مستقل: فون", english: "Perm. Phone", key: "perm_phone" },
    ],
  },
  {
    urdu: "تعلیمی معلومات",
    english: "Academic Info",
    fields: [
      { urdu: "درس نظامی آخری درجہ", english: "Last Dars-e-Nizami", key: "dn_last" },
      { urdu: "نمبرات", english: "Marks", key: "dn_marks" },
      { urdu: "تقدیر", english: "Grade", key: "dn_grade" },
      { urdu: "درس نظامی مدرسہ", english: "DN Madrassa", key: "dn_school", span: 3 },
      { urdu: "وفاق آخری درجہ", english: "Last Wafaq", key: "wf_last" },
      { urdu: "نمبرات", english: "Marks", key: "wf_marks" },
      { urdu: "تقدیر", english: "Grade", key: "wf_grade" },
      { urdu: "وفاق مدرسہ", english: "Wafaq Madrassa", key: "wf_school", span: 3 },
      { urdu: "سابقہ مدارس", english: "Previous Madaris", key: "prev_madaris", span: 2 },
      { urdu: "عصری علوم", english: "Modern Edu.", key: "modern_edu" },
      { urdu: "اضافی قابلیت", english: "Additional Qual.", key: "extra_qual" },
      { urdu: "گذشتہ رول نمبر", english: "Prev. Roll", key: "prev_roll" },
      { urdu: "درجہ", english: "Prev. Darja", key: "prev_darja" },
      { urdu: "گذشتہ نمبرات", english: "Prev. Marks", key: "prev_marks" },
      { urdu: "گذشتہ تقدیر", english: "Prev. Grade", key: "prev_grade" },
    ],
  },
  {
    urdu: "سرپرست",
    english: "Guardian",
    fields: [
      { urdu: "شناختی کارڈ", english: "CNIC", key: "cnic", span: 2 },
      { urdu: "سرپرست کا نام", english: "Guardian Name", key: "guardian_name" },
      { urdu: "ولدیت سرپرست", english: "G. Father", key: "guardian_father" },
      { urdu: "پتہ", english: "Address", key: "guardian_address", span: 2 },
      { urdu: "فون (گھر)", english: "Phone (Home)", key: "guardian_phone_home" },
      { urdu: "فون (دفتر)", english: "Phone (Office)", key: "guardian_phone_office" },
      { urdu: "رشتہ", english: "Relation", key: "guardian_relation" },
      { urdu: "زر تعاون", english: "Support Amt.", key: "support_amount" },
      { urdu: "ماہانہ/سالانہ", english: "M/A", key: "support_freq" },
      { urdu: "یک مشت/قسط", english: "Mode", key: "support_mode" },
    ],
  },
  {
    urdu: "دفتری کاروائی",
    english: "Office Action",
    fields: [
      { urdu: "مہتمم کی رائے", english: "Muhtamim Remarks", key: "muhtamim_remarks", span: 3 },
      { urdu: "مجوزہ درجہ", english: "Proposed Darja", key: "proposed_darja" },
    ],
  },
];

function sectionsFor(v: AdmissionVariant): Sec[] {
  if (v.layout === "school") return schoolSections;
  if (v.layout === "madrassa-short") return madrassaShortSections;
  return madrassaLongSections;
}

function signaturesFor(v: AdmissionVariant): { urdu: string; english: string }[] {
  if (v.layout === "school") {
    return [
      { urdu: "دستخط سرپرست", english: "Guardian Sign." },
      { urdu: "دستخط و مہر پرنسپل", english: "Principal Sign. & Stamp" },
    ];
  }
  if (v.layout === "madrassa-short") {
    return [
      { urdu: "دستخط سرپرست", english: "Guardian Sign." },
      { urdu: "دستخط ناظم", english: "Nazim Sign." },
      { urdu: "دستخط مہتمم", english: "Muhtamim Sign." },
    ];
  }
  return [
    { urdu: "دستخط طالب علم", english: "Student Sign." },
    { urdu: "دستخط سرپرست", english: "Guardian Sign." },
    { urdu: "دستخط ناظم تعلیمات", english: "Nazim-e-Taleemat" },
    { urdu: "دستخط و مہر مہتمم", english: "Muhtamim Sign. & Stamp" },
  ];
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function fieldCell(f: F, value: string): string {
  const span = f.span ?? 1;
  const v = value ? esc(value) : "&nbsp;";
  return `<td class="fld" colspan="${span}">
    <div class="lbl"><span class="u">${esc(f.urdu)}</span><span class="e">${esc(f.english)}</span></div>
    <div class="val">${v}</div>
  </td>`;
}

function renderSection(sec: Sec, form: Record<string, string>): string {
  // 4-col grid; wrap rows
  const cols = 4;
  const rows: string[] = [];
  let row: string[] = [];
  let used = 0;
  for (const f of sec.fields) {
    const span = f.span ?? 1;
    if (used + span > cols) {
      // pad
      if (used < cols) row.push(`<td class="pad" colspan="${cols - used}"></td>`);
      rows.push(`<tr>${row.join("")}</tr>`);
      row = [];
      used = 0;
    }
    row.push(fieldCell(f, form[f.key] ?? ""));
    used += span;
  }
  if (row.length) {
    if (used < cols) row.push(`<td class="pad" colspan="${cols - used}"></td>`);
    rows.push(`<tr>${row.join("")}</tr>`);
  }
  return `<div class="sec">
    <div class="sec-h"><span class="u">${esc(sec.urdu)}</span><span class="e">${esc(sec.english)}</span></div>
    <table class="grid">${rows.join("")}</table>
  </div>`;
}

export function printAdmissionForm(
  variant: AdmissionVariant,
  form: Record<string, string>,
  institutionUrdu: string,
) {
  const secs = sectionsFor(variant).map((s) => renderSection(s, form)).join("");
  const metaFields = meta(variant)
    .map((f) => fieldCell(f, form[f.key] ?? ""))
    .join("");
  const sigs = signaturesFor(variant)
    .map(
      (s) => `<div class="sig">
      <div class="sig-line"></div>
      <div class="sig-lbl"><span class="u">${esc(s.urdu)}</span><span class="e">${esc(s.english)}</span></div>
    </div>`,
    )
    .join("");

  const photoBox = variant.allowPhoto
    ? `<div class="photo"><span>Photo<br/>تصویر</span></div>`
    : "";

  const html = `<!doctype html><html lang="ur" dir="rtl"><head><meta charset="utf-8">
  <title>${esc(variant.titleEnglish)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 8mm 8mm 6mm 8mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; color: #000; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 9px; line-height: 1.25; }
    .u { font-family: 'Noto Nastaliq Urdu', serif; direction: rtl; }
    .header { display: flex; align-items: flex-start; gap: 8px; border: 1.5px solid #000; padding: 6px 8px; margin-bottom: 4px; }
    .header .title { flex: 1; text-align: center; }
    .header .title .inst { font-size: 10px; color: #333; }
    .header .title h1 { margin: 2px 0; font-size: 16px; font-family: 'Noto Nastaliq Urdu', serif; }
    .header .title .sub { font-size: 11px; font-family: 'Noto Nastaliq Urdu', serif; color: #333; }
    .header .title .en { font-size: 8px; letter-spacing: 1px; text-transform: uppercase; color: #555; margin-top: 2px; }
    .header .title .addr { font-size: 9px; font-family: 'Noto Nastaliq Urdu', serif; color: #555; }
    .photo { width: 70px; height: 84px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #666; text-align: center; }
    .meta { border: 1px solid #000; margin-bottom: 3px; }
    .sec { border: 1px solid #000; margin-bottom: 3px; }
    .sec-h { background: #f0f0f0; border-bottom: 1px solid #000; padding: 2px 6px; display: flex; justify-content: space-between; align-items: center; }
    .sec-h .u { font-size: 11px; font-weight: 600; }
    .sec-h .e { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: #555; }
    table.grid { width: 100%; border-collapse: collapse; }
    table.grid td.fld { border: 1px solid #999; padding: 2px 4px; vertical-align: top; width: 25%; }
    table.grid td.pad { border: 1px solid #999; background: repeating-linear-gradient(45deg,#fafafa,#fafafa 3px,#fff 3px,#fff 6px); }
    .lbl { display: flex; justify-content: space-between; gap: 4px; font-size: 7.5px; color: #444; border-bottom: 1px dotted #bbb; padding-bottom: 1px; }
    .lbl .u { font-size: 9px; color: #000; }
    .val { min-height: 14px; padding-top: 2px; font-size: 10px; font-family: 'Noto Nastaliq Urdu', serif; word-break: break-word; }
    .sig-row { display: flex; gap: 8px; margin-top: 6px; }
    .sig { flex: 1; text-align: center; }
    .sig-line { border-top: 1px solid #000; height: 28px; }
    .sig-lbl { font-size: 8px; padding-top: 2px; display: flex; flex-direction: column; }
    .sig-lbl .u { font-size: 10px; }
    .sig-lbl .e { color: #555; }
    .foot { text-align: center; font-size: 7px; color: #666; margin-top: 4px; }
    @media print { .noprint { display: none; } }
  </style></head><body>
  <div class="header">
    ${photoBox}
    <div class="title">
      <div class="inst u">${esc(institutionUrdu)}</div>
      <h1>${esc(variant.titleUrdu)}</h1>
      ${variant.subtitleUrdu ? `<div class="sub">${esc(variant.subtitleUrdu)}</div>` : ""}
      <div class="en">${esc(variant.titleEnglish)}</div>
      ${variant.addressUrdu ? `<div class="addr">${esc(variant.addressUrdu)}</div>` : ""}
    </div>
    <div style="width:70px"></div>
  </div>
  <div class="meta"><table class="grid"><tr>${metaFields}</tr></table></div>
  ${secs}
  <div class="sig-row">${sigs}</div>
  <div class="foot">Printed on ${new Date().toLocaleString()} · MSMIS</div>
  <script>window.onload=function(){setTimeout(function(){window.print();},350);}</script>
  </body></html>`;

  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}