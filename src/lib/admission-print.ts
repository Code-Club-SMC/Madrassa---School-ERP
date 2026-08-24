import type { AdmissionVariant } from "@/lib/admission-variants";
import { getMadrassaGradeById } from "@/lib/madrassa-grade-catalog";

type Field = {
  urdu: string;
  english: string;
  key: string;
  span?: 1 | 2 | 3;
  ltr?: boolean;
};

type Section = {
  urdu: string;
  english: string;
  fields: Field[];
};

type PrintOptions = {
  photoDataUrl?: string | null;
};

const schoolSections: Section[] = [
  {
    urdu: "طالب علم کی معلومات",
    english: "Student Information",
    fields: [
      { urdu: "نام", english: "Name", key: "name" },
      { urdu: "ولدیت", english: "Father Name", key: "father" },
      { urdu: "تاریخ پیدائش (ہندسوں میں)", english: "Date of Birth", key: "dob_digits", ltr: true },
      { urdu: "تاریخ پیدائش (لفظوں میں)", english: "Date of Birth in Words", key: "dob_words" },
      { urdu: "پتہ", english: "Address", key: "address", span: 2 },
      { urdu: "پیشہ", english: "Occupation", key: "occupation" },
      { urdu: "مذہب", english: "Religion", key: "religion" },
      { urdu: "سابقہ سکول کا نام و پتہ", english: "Previous School", key: "prev_school", span: 2 },
      {
        urdu: "سرٹیفیکیٹ / فائل نمبر",
        english: "Certificate / File No.",
        key: "cert_no",
        ltr: true,
      },
      { urdu: "داخلہ کلاس", english: "Admitted Class", key: "class" },
    ],
  },
  {
    urdu: "سرپرست کی معلومات",
    english: "Guardian Information",
    fields: [
      { urdu: "سرپرست کا نام", english: "Guardian Name", key: "guardian_name" },
      {
        urdu: "کیا مدرسہ میں داخل ہونا چاہتے ہیں؟",
        english: "Also Madrassa?",
        key: "also_madrassa",
      },
      { urdu: "کس شعبہ میں", english: "Madrassa Section", key: "madrassa_section" },
    ],
  },
];

const madrassaShortSections: Section[] = [
  {
    urdu: "کوائف طالب علم",
    english: "Student Details",
    fields: [
      { urdu: "نام", english: "Name", key: "name" },
      { urdu: "ولدیت", english: "Father Name", key: "father" },
      { urdu: "تاریخ پیدائش", english: "Date of Birth", key: "dob", ltr: true },
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
      { urdu: "رابطہ نمبر", english: "Contact No.", key: "guardian_phone", ltr: true },
    ],
  },
];

const madrassaLongSections: Section[] = [
  {
    urdu: "کوائف نامہ",
    english: "Personal Particulars",
    fields: [
      { urdu: "نام", english: "Name", key: "name" },
      { urdu: "ولدیت", english: "Father Name", key: "father" },
      { urdu: "تاریخ پیدائش / عمر", english: "Date of Birth / Age", key: "dob_age", ltr: true },
      { urdu: "موجودہ گاؤں / محلہ", english: "Current Village / Locality", key: "curr_village" },
      { urdu: "ڈاکخانہ / علاقہ", english: "Post Office / Area", key: "curr_po" },
      { urdu: "تحصیل", english: "Tehsil", key: "curr_tehsil" },
      { urdu: "ضلع", english: "District", key: "curr_district" },
      { urdu: "فون", english: "Phone", key: "curr_phone", ltr: true },
      { urdu: "مستقل گاؤں / محلہ", english: "Permanent Village / Locality", key: "perm_village" },
      { urdu: "ڈاکخانہ / علاقہ", english: "Post Office / Area", key: "perm_po" },
      { urdu: "تحصیل", english: "Tehsil", key: "perm_tehsil" },
      { urdu: "ضلع", english: "District", key: "perm_district" },
      { urdu: "فون", english: "Phone", key: "perm_phone", ltr: true },
    ],
  },
  {
    urdu: "جدید طلباء / طالبات کے لیے",
    english: "For New Students",
    fields: [
      {
        urdu: "درس نظامی کا آخری پاس کردہ درجہ",
        english: "Last Dars-e-Nizami Grade",
        key: "dn_last",
      },
      { urdu: "حاصل کردہ نمبرات", english: "Marks Obtained", key: "dn_marks", ltr: true },
      { urdu: "تقدیر", english: "Grade", key: "dn_grade" },
      {
        urdu: "نام مدرسہ / جامعہ مع مکمل پتہ",
        english: "Madrassa / Jamia Name & Address",
        key: "dn_school",
        span: 3,
      },
      { urdu: "وفاق کا آخری پاس کردہ درجہ", english: "Last Wafaq Grade", key: "wf_last" },
      { urdu: "حاصل کردہ نمبرات", english: "Marks Obtained", key: "wf_marks", ltr: true },
      { urdu: "تقدیر", english: "Grade", key: "wf_grade" },
      {
        urdu: "وفاق مدرسہ مع مکمل پتہ",
        english: "Wafaq Madrassa Name & Address",
        key: "wf_school",
        span: 3,
      },
      { urdu: "سابقہ مدارس", english: "Previous Madaris", key: "prev_madaris", span: 2 },
      { urdu: "عصری علوم", english: "Modern Education", key: "modern_edu" },
      { urdu: "اضافی قابلیت", english: "Additional Qualification", key: "extra_qual" },
    ],
  },
  {
    urdu: "سرپرست",
    english: "Guardian",
    fields: [
      { urdu: "شناختی کارڈ", english: "CNIC", key: "cnic", ltr: true },
      { urdu: "سرپرست کا نام", english: "Guardian Name", key: "guardian_name" },
      { urdu: "ولدیت سرپرست", english: "Guardian Father Name", key: "guardian_father" },
      { urdu: "موجودہ پتہ", english: "Address", key: "guardian_address", span: 2 },
      { urdu: "فون (رہائش)", english: "Phone Home", key: "guardian_phone_home", ltr: true },
      {
        urdu: "فون (دکان / دفتر)",
        english: "Phone Shop / Office",
        key: "guardian_phone_office",
        ltr: true,
      },
      { urdu: "رشتہ", english: "Relation", key: "guardian_relation" },
      { urdu: "زر تعاون", english: "Support Amount", key: "support_amount", ltr: true },
      { urdu: "ماہانہ / سالانہ", english: "Monthly / Annual", key: "support_freq" },
      { urdu: "یک مشت / قسط وار", english: "Lump Sum / Installments", key: "support_mode" },
    ],
  },
];

const shortPledge =
  "میں جامعہ میں داخل ہونا چاہتا/چاہتی ہوں اور اقرار کرتا/کرتی ہوں کہ جامعہ کے جملہ قوانین و ضوابط کا پابند رہوں گا/گی، اساتذہ کرام کا احترام کروں گا/گی، علمی مشاغل میں مصروف رہوں گا/گی، اور انتظامیہ کی ہدایات پر عمل کروں گا/گی۔";

const ahdRules = [
  "نام، کام، شہر اور جامعہ کے قواعد کی پابندی کی جائے گی۔",
  "پنج وقتہ نماز باجماعت، اذکار، تلاوت اور حسن اخلاق کا اہتمام کیا جائے گا۔",
  "کسی بھی سیاسی یا غیر سیاسی تنظیم سے وابستگی نہیں رکھی جائے گی۔",
  "اساتذہ کرام، انتظامیہ، مہمانان جامعہ اور ارکان شوریٰ کا احترام کیا جائے گا۔",
  "جامعہ کے اوقات، اسباق، تکرار، مطالعہ اور حاضری کی پابندی کی جائے گی۔",
  "جامعہ کے اندر یا باہر کسی قسم کا جھگڑا، بدزبانی، شور یا غیر مناسب رویہ اختیار نہیں کیا جائے گا۔",
  "جامعہ کی اجازت کے بغیر چھٹی، سفر، یا سالانہ امتحان سے پہلے رخصت اختیار نہیں کی جائے گی۔",
  "موبائل فون، غیر ضروری آلات، ممنوعہ مواد، یا انتظامیہ کی منع کردہ اشیاء استعمال نہیں کی جائیں گی۔",
  "اگر تعلیمی جائزوں کے بعد استعداد ناکافی قرار دی گئی تو انتظامیہ کے فیصلے کے مطابق درجہ تبدیل کیا جا سکے گا۔",
  "جامعہ کے مالی، رہائشی، تعلیمی اور انتظامی ضوابط کی پابندی لازم ہو گی۔",
];

function metaFields(variant: AdmissionVariant): Field[] {
  const base: Field[] = [
    { urdu: "داخلہ نمبر", english: "Admission No.", key: "adm_no", ltr: true },
    { urdu: "رول نمبر", english: "Roll No.", key: "roll_no", ltr: true },
    { urdu: "تاریخ داخلہ", english: "Admission Date", key: "adm_date", ltr: true },
  ];

  if (variant.layout === "madrassa-long") {
    return [
      ...base,
      { urdu: "مطلوبہ درجہ", english: "Requested Darja", key: "req_darja" },
      { urdu: "امتحان داخلہ نمبرات", english: "Entry-Test Marks", key: "entry_marks", ltr: true },
      { urdu: "تعلیمی سال", english: "Academic Year", key: "acad_year", ltr: true },
      { urdu: "بمطابق", english: "Corresponding", key: "bmutabiq" },
    ];
  }

  if (variant.layout === "madrassa-short") {
    return [
      ...base,
      { urdu: "بمطابق", english: "Corresponding", key: "bmutabiq" },
    ];
  }

  return base;
}

function sectionsFor(variant: AdmissionVariant) {
  if (variant.layout === "school") return schoolSections;
  if (variant.layout === "madrassa-short") return madrassaShortSections;
  return madrassaLongSections;
}

const esc = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function valueFor(form: Record<string, string>, key: string) {
  if (
    (key === "req_darja" ||
      key === "shoba") &&
    form[key]
  ) {
    return getMadrassaGradeById(form[key])?.nameUrdu ?? form[key];
  }
  return form[key] ?? "";
}

function renderField(field: Field, form: Record<string, string>) {
  const value = valueFor(form, field.key).trim();
  const classes = ["field-card", `span-${field.span ?? 1}`, field.ltr ? "ltr" : ""]
    .filter(Boolean)
    .join(" ");

  return `<div class="${classes}">
    <div class="field-label">
      <span class="urdu">${esc(field.urdu)}</span>
      <span class="english">${esc(field.english)}</span>
    </div>
    <div class="field-value">${value ? esc(value) : "&nbsp;"}</div>
  </div>`;
}

function renderSection(section: Section, form: Record<string, string>) {
  return `<section class="form-section">
    <div class="section-title">
      <span class="urdu">${esc(section.urdu)}</span>
      <span class="english">${esc(section.english)}</span>
    </div>
    <div class="field-grid">${section.fields.map((field) => renderField(field, form)).join("")}</div>
  </section>`;
}

function renderPhoto(variant: AdmissionVariant, options: PrintOptions) {
  if (!variant.allowPhoto) return "";
  return `<div class="photo-box">${
    options.photoDataUrl
      ? `<img src="${esc(options.photoDataUrl)}" alt="" />`
      : `<span>تصویر<br />Photo</span>`
  }</div>`;
}

function renderFrontPage(
  variant: AdmissionVariant,
  form: Record<string, string>,
  institutionUrdu: string,
  options: PrintOptions,
) {
  const sections = sectionsFor(variant)
    .map((section) => renderSection(section, form))
    .join("");
  const intro =
    variant.layout === "madrassa-short" ? `<div class="intro urdu">${esc(shortPledge)}</div>` : "";

  return `<article class="page front-page">
    ${renderFormNumberBox(valueFor(form, "form_no"))}
    <header class="letterhead">
      <div class="side-space">${renderPhoto(variant, options)}</div>
      <div class="title-block">
        <div class="institution urdu">${esc(institutionUrdu)}</div>
        <h1 class="urdu">${esc(variant.titleUrdu)}</h1>
        ${variant.subtitleUrdu ? `<div class="subtitle urdu">${esc(variant.subtitleUrdu)}</div>` : ""}
        <div class="english title-english">${esc(variant.titleEnglish)}</div>
        ${variant.addressUrdu ? `<div class="address urdu">${esc(variant.addressUrdu)}</div>` : ""}
      </div>
      <div class="side-space"></div>
    </header>
    <section class="meta-grid">${metaFields(variant)
      .map((field) => renderField(field, form))
      .join("")}</section>
    ${intro}
    ${sections}
    ${renderSignatureRow(signatureLabelsFor(variant))}
  </article>`;
}

function renderFormNumberBox(formNo: string) {
  return `<div class="form-number-box">
    <span class="urdu">فارم نمبر</span>
    <b class="ltr">${formNo ? esc(formNo) : "خودکار"}</b>
  </div>`;
}

function renderSignatureRow(labels: string[]) {
  return `<footer class="signature-row">${labels
    .map(
      (label) => `<div class="signature">
        <div class="signature-line"></div>
        <div class="signature-label urdu">${esc(label)}</div>
      </div>`,
    )
    .join("")}</footer>`;
}

function signatureLabelsFor(variant: AdmissionVariant) {
  if (variant.layout === "school") {
    return ["دستخط سرپرست", "دستخط و مہر پرنسپل"];
  }
  if (variant.layout === "madrassa-short") {
    return ["دستخط سرپرست", "دستخط ناظم", "دستخط مہتمم"];
  }
  return ["دستخط طالب علم / طالبہ", "دستخط سرپرست", "دستخط ناظم تعلیمات", "دستخط و مہر مہتمم"];
}

function renderAhdNamaPage(variant: AdmissionVariant, form: Record<string, string>) {
  const isGirls = variant.category === "female";
  const studentLabel = isGirls ? "طالبہ" : "طالب علم";
  const title = isGirls
    ? "عہد نامہ از طالبہ جامعہ زینب للبنات ٹل"
    : "عہد نامہ از طالب علم جامعہ قاسمیہ ٹل";

  return `<article class="page ahd-page">
    <div class="dashed-frame">
      <h2 class="urdu">${esc(title)}</h2>
      <div class="rules" data-review="needs-urdu-review">${ahdRules
        .map(
          (rule, index) =>
            `<p class="urdu"><span>${toUrduNumber(index + 1)}۔</span> ${esc(rule)}</p>`,
        )
        .join("")}</div>
      <div class="line-grid compact">
        ${lineField(`${studentLabel} کا نام`, valueFor(form, "name"))}
        ${lineField("ولدیت", valueFor(form, "father"))}
      </div>
      <div class="manual-signatures">
        ${blankLine(`دستخط ${studentLabel}`)}
        ${blankLine("تاریخ")}
      </div>
      <h3 class="urdu">برائے سرپرست</h3>
      <p class="urdu pledge-copy">میں نے مندرجہ بالا قواعد و ضوابط کو سمجھ لیا ہے۔ میں ان پر کار بند رہنے کا عہد کرتا/کرتی ہوں اور طالب علم / طالبہ کو ان قواعد کا پابند رکھنے کی ذمہ داری قبول کرتا/کرتی ہوں۔</p>
      <div class="line-grid">
        ${lineField("سرپرست کا نام", valueFor(form, "guardian_name"))}
        ${lineField("ولدیت", valueFor(form, "guardian_father"))}
        ${lineField("رشتہ", valueFor(form, "guardian_relation") || valueFor(form, "guardian_rel"))}
        ${lineField("درخواست کردہ درجہ", valueFor(form, "req_darja"))}
        ${lineField("فون رہائش", valueFor(form, "guardian_phone_home") || valueFor(form, "guardian_phone"))}
        ${lineField("فون دکان / دفتر", valueFor(form, "guardian_phone_office"))}
      </div>
      <div class="cnic-wrap">
        <span class="urdu">شناختی کارڈ نمبر</span>
        ${renderCnicBoxes(valueFor(form, "cnic"))}
      </div>
      ${blankLine("دستخط سرپرست")}
      <h3 class="urdu office-heading">دفتری کاروائی</h3>
      ${blankLine("مہتمم کی رائے")}
      <div class="line-grid compact">
        ${blankLine("دستخط ناظم تعلیمات")}
        ${blankLine("دستخط مہتمم")}
      </div>
      ${blankLine("مہر مدرسہ")}
    </div>
  </article>`;
}

function lineField(label: string, value: string) {
  return `<div class="manual-line">
    <span class="urdu">${esc(label)}</span>
    <b>${value ? esc(value) : "&nbsp;"}</b>
  </div>`;
}

function blankLine(label: string) {
  return lineField(label, "");
}

function renderCnicBoxes(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 13).split("");
  return `<div class="cnic-boxes" dir="ltr">${Array.from({ length: 13 })
    .map((_, index) => `<span>${digits[index] ? esc(digits[index]) : "&nbsp;"}</span>`)
    .join("")}</div>`;
}

function toUrduNumber(value: number) {
  return value.toString().replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

function buildPrintHtml(
  variant: AdmissionVariant,
  form: Record<string, string>,
  institutionUrdu: string,
  options: PrintOptions,
) {
  const pages = [renderFrontPage(variant, form, institutionUrdu, options)];
  if (variant.layout === "madrassa-long") pages.push(renderAhdNamaPage(variant, form));

  const printedAt = new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  }).format(new Date());

  return `<!doctype html><html lang="ur" dir="rtl"><head><meta charset="utf-8">
  <title>${esc(variant.titleEnglish)}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; color: #111; background: #f3f4f6; }
    body { font-family: "Noto Nastaliq Urdu", "Noto Naskh Arabic", "Urdu Typesetting", Georgia, serif; }
    .english, .ltr { direction: ltr; font-family: Georgia, "Times New Roman", serif; }
    .urdu { direction: rtl; font-family: "Noto Nastaliq Urdu", "Noto Naskh Arabic", "Urdu Typesetting", Georgia, serif; }
    .page {
      width: 210mm;
      min-height: 297mm;
      page-break-after: always;
      background: #fff;
      padding: 9mm 10mm;
      position: relative;
      overflow: hidden;
    }
    .page::after {
      content: "Printed ${esc(printedAt)} · MSMIS";
      position: absolute;
      bottom: 4mm;
      left: 10mm;
      right: 10mm;
      text-align: center;
      font: 7pt Georgia, "Times New Roman", serif;
      color: #555;
      direction: ltr;
    }
    .letterhead {
      border: 1.4pt solid #111;
      min-height: 28mm;
      padding: 4mm;
      display: grid;
      grid-template-columns: 28mm 1fr 28mm;
      align-items: center;
      gap: 4mm;
    }
    .form-number-box {
      position: absolute;
      top: 11mm;
      left: 12mm;
      width: 31mm;
      min-height: 10mm;
      border: 1pt solid #111;
      background: #fff;
      padding: 1.2mm 2mm;
      text-align: center;
      z-index: 2;
    }
    .form-number-box span {
      display: block;
      font-size: 7pt;
      line-height: 1.7;
      font-weight: 700;
    }
    .form-number-box b {
      display: block;
      font-size: 8pt;
      line-height: 1.4;
    }
    .title-block { text-align: center; }
    .institution { font-size: 10pt; line-height: 1.8; }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 18pt; line-height: 1.8; font-weight: 700; }
    .subtitle { font-size: 12pt; line-height: 1.7; }
    .title-english { font-size: 7.5pt; text-transform: uppercase; color: #333; }
    .address { font-size: 8.5pt; color: #333; line-height: 1.7; }
    .photo-box {
      width: 24mm;
      height: 30mm;
      border: 1pt solid #111;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #555;
      font-size: 8pt;
      line-height: 1.6;
      overflow: hidden;
    }
    .photo-box img { width: 100%; height: 100%; object-fit: cover; }
    .meta-grid, .field-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1.8mm;
    }
    .meta-grid { margin-top: 3mm; padding: 2mm; border: 1pt solid #111; }
    .form-section { margin-top: 3mm; border: 1pt solid #111; break-inside: avoid; }
    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 3mm;
      border-bottom: 1pt solid #111;
      background: #f4f4f0;
      padding: 1.5mm 2.5mm;
    }
    .section-title .urdu { font-size: 11pt; font-weight: 700; }
    .section-title .english { font-size: 7pt; color: #333; text-transform: uppercase; }
    .field-grid { padding: 2mm; }
    .field-card {
      border: 0.8pt solid #777;
      min-height: 16mm;
      padding: 1.5mm 2mm;
      overflow: hidden;
    }
    .span-2 { grid-column: span 2; }
    .span-3 { grid-column: span 3; }
    .field-label {
      border-bottom: 0.6pt dotted #777;
      display: flex;
      justify-content: space-between;
      gap: 2mm;
      padding-bottom: 0.6mm;
      color: #333;
    }
    .field-label .urdu { font-size: 8pt; font-weight: 700; }
    .field-label .english { font-size: 6.6pt; text-transform: uppercase; }
    .field-value {
      min-height: 8mm;
      padding-top: 1.2mm;
      font-size: 10pt;
      line-height: 1.65;
      word-break: break-word;
      white-space: pre-wrap;
    }
    .ltr .field-value { direction: ltr; text-align: left; font-family: Georgia, "Times New Roman", serif; line-height: 1.35; }
    .intro {
      border: 1pt solid #111;
      margin-top: 3mm;
      padding: 2.5mm 3mm;
      font-size: 9pt;
      line-height: 2.1;
      text-align: right;
    }
    .signature-row {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 5mm;
      margin-top: 8mm;
      align-items: end;
    }
    .signature-line { height: 14mm; border-bottom: 1pt solid #111; }
    .signature-label { text-align: center; font-size: 8pt; line-height: 1.8; }
    .dashed-frame {
      min-height: 276mm;
      border: 1.4pt dashed #111;
      padding: 7mm 9mm;
    }
    .ahd-page h2 {
      text-align: center;
      font-size: 17pt;
      line-height: 2;
      margin-bottom: 4mm;
    }
    .ahd-page h3 {
      text-align: center;
      font-size: 13pt;
      line-height: 2;
      margin: 5mm 0 2mm;
    }
    .rules {
      column-count: 2;
      column-gap: 7mm;
      margin-bottom: 5mm;
    }
    .rules p, .pledge-copy {
      font-size: 8.2pt;
      line-height: 2.15;
      text-align: right;
      break-inside: avoid;
    }
    .line-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 3mm 6mm;
      margin-top: 3mm;
    }
    .line-grid.compact { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .manual-line {
      display: grid;
      grid-template-columns: max-content 1fr;
      align-items: end;
      gap: 2mm;
      min-height: 11mm;
    }
    .manual-line span { font-size: 8pt; white-space: nowrap; }
    .manual-line b {
      display: block;
      min-height: 8mm;
      border-bottom: 1pt dashed #111;
      font-size: 9.5pt;
      line-height: 1.8;
      text-align: center;
      font-weight: 700;
    }
    .manual-signatures {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18mm;
      margin-top: 4mm;
    }
    .cnic-wrap {
      margin-top: 3mm;
      display: flex;
      align-items: center;
      gap: 3mm;
      justify-content: flex-end;
    }
    .cnic-wrap > span { font-size: 8pt; font-weight: 700; }
    .cnic-boxes { display: flex; gap: 0; direction: ltr; }
    .cnic-boxes span {
      width: 6.5mm;
      height: 8mm;
      border: 0.9pt solid #111;
      border-left-width: 0;
      text-align: center;
      line-height: 8mm;
      font: 8pt Georgia, "Times New Roman", serif;
    }
    .cnic-boxes span:first-child { border-left-width: 0.9pt; }
    .office-heading { margin-top: 8mm; }
    @media screen {
      body { min-height: 100dvh; display: grid; justify-content: center; gap: 12px; padding: 16px; }
      .page { box-shadow: 0 16px 60px rgb(0 0 0 / 18%); }
    }
    @media print {
      html, body { width: 210mm; background: #fff; }
      body { display: block; padding: 0; }
      .page { box-shadow: none; }
      .page:last-child { page-break-after: auto; }
    }
  </style></head><body>
    ${pages.join("")}
    <script>window.onload=function(){setTimeout(function(){window.print();},300);}</script>
  </body></html>`;
}

export function printAdmissionForm(
  variant: AdmissionVariant,
  form: Record<string, string>,
  institutionUrdu: string,
  options: PrintOptions = {},
): boolean {
  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) return false;
  w.document.write(buildPrintHtml(variant, form, institutionUrdu, options));
  w.document.close();
  return true;
}
