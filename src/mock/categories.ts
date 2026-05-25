import type { MadrassaCategory } from "@/types";

// Wifaq-aligned Madrassa category tree per §41.4.
// Five primary tracks:
//   1. Qaida & Nazira   2. Hifz   3. Tajweed
//   4. Dars-e-Nizami (8 darjat)   5. Takhassus (specialization)

export const madrassaCategories: MadrassaCategory[] = [
  {
    id: "qaida_nazira",
    name: "Qaida & Nazira",
    nameUrdu: "قاعدہ و ناظرہ",
    description: "Quranic reading foundation — Qaida primer through complete Nazira recitation.",
    descriptionUrdu: "قرآن مجید ناظرہ کی ابتدائی تعلیم — قاعدہ سے مکمل ناظرہ تک",
    subcategories: [
      { id: "qn-qaida", name: "Qaida (Baghdadi)", nameUrdu: "قاعدہ بغدادی", rollPrefix: "QD", count: 38 },
      { id: "qn-nazira-1", name: "Nazira — Para 1–10", nameUrdu: "ناظرہ — پارہ ۱ تا ۱۰", rollPrefix: "NZ1", count: 26 },
      { id: "qn-nazira-2", name: "Nazira — Para 11–20", nameUrdu: "ناظرہ — پارہ ۱۱ تا ۲۰", rollPrefix: "NZ2", count: 22 },
      { id: "qn-nazira-3", name: "Nazira — Para 21–30", nameUrdu: "ناظرہ — پارہ ۲۱ تا ۳۰", rollPrefix: "NZ3", count: 18 },
    ],
  },
  {
    id: "hifz",
    name: "Hifz-ul-Qur'an",
    nameUrdu: "حفظ القرآن",
    description: "Memorization of the Holy Quran — 30 Juz, tracked per Juz with revision logs.",
    descriptionUrdu: "قرآن مجید کا حفظ — ۳۰ پاروں پر مشتمل، فی پارہ پیش رفت اور مراجعہ کا اندراج",
    subcategories: [
      { id: "hifz-beginner", name: "Hifz Beginner (Para 1–10)", nameUrdu: "حفظ ابتدائی", rollPrefix: "HB", count: 24 },
      { id: "hifz-mid", name: "Hifz Intermediate (Para 11–20)", nameUrdu: "حفظ درمیانی", rollPrefix: "HI", count: 18 },
      { id: "hifz-advanced", name: "Hifz Advanced (Para 21–30)", nameUrdu: "حفظ منتہی", rollPrefix: "HA", count: 12 },
      { id: "hifz-revision", name: "Hifz Revision (Daur)", nameUrdu: "حفظ دور", rollPrefix: "HD", count: 8 },
    ],
  },
  {
    id: "tajweed",
    name: "Tajweed",
    nameUrdu: "تجوید",
    description: "Rules of Quranic recitation — Tartil, Tadweer, Hadr.",
    descriptionUrdu: "تجوید — تَرتیل، تَدویر، حَدر",
    subcategories: [
      { id: "taj-basic", name: "Tajweed Basics", nameUrdu: "تجوید ابتدائی", rollPrefix: "TJ1", count: 16 },
      { id: "taj-adv", name: "Tajweed Advanced (Saba Qira'at)", nameUrdu: "تجوید (سبع قراءات)", rollPrefix: "TJ2", count: 9 },
    ],
  },
  {
    id: "dars_nizami",
    name: "Dars-e-Nizami",
    nameUrdu: "درس نظامی",
    description: "Eight-darja Islamic scholar curriculum — Sarf, Nahw, Fiqh, Hadith and beyond.",
    descriptionUrdu: "درس نظامی — آٹھ درجات (اعدادیہ تا عالمیہ)",
    subcategories: [
      { id: "dn-idadiya", name: "I'dadiyah", nameUrdu: "اعدادیہ", rollPrefix: "DN0", count: 22, darja: "idadiya", govtEquivalent: "Grades 6–8", durationYears: 3 },
      { id: "dn-awwal", name: "Darja Awwal", nameUrdu: "درجہ اول", rollPrefix: "DN1", count: 18, darja: "awwal", durationYears: 1 },
      { id: "dn-daum", name: "Darja Daum", nameUrdu: "درجہ دوم", rollPrefix: "DN2", count: 15, darja: "daum", durationYears: 1 },
      { id: "dn-soyam", name: "Darja Soyam", nameUrdu: "درجہ سوم", rollPrefix: "DN3", count: 13, darja: "soyam", durationYears: 1 },
      { id: "dn-aamma", name: "Sanawiyya Aamma", nameUrdu: "ثانویہ عامہ", rollPrefix: "DN4", count: 11, darja: "sanawiyya_amma", govtEquivalent: "SSC / Matric", durationYears: 2 },
      { id: "dn-khasa", name: "Sanawiyya Khasa", nameUrdu: "ثانویہ خاصہ", rollPrefix: "DN5", count: 9, darja: "sanawiyya_khasa", govtEquivalent: "HSSC / Intermediate", durationYears: 2 },
      { id: "dn-aliya", name: "Aliyah", nameUrdu: "عالیہ", rollPrefix: "DN6", count: 7, darja: "aliyah", govtEquivalent: "BA / BSc", durationYears: 2 },
      { id: "dn-alimiyya", name: "Alimiyyah", nameUrdu: "عالمیہ (درجہ سادسہ)", rollPrefix: "DN7", count: 5, darja: "alimiyyah", govtEquivalent: "MA / MSc", durationYears: 1 },
    ],
  },
  {
    id: "takhassus",
    name: "Takhassus (Specialization)",
    nameUrdu: "تخصص",
    description: "Post-Alimiyyah specialization — Ifta, Tafseer, Hadith.",
    descriptionUrdu: "تخصص فی الفقہ، تفسیر، حدیث (عالمیہ کے بعد)",
    subcategories: [
      { id: "tk-ifta", name: "Takhassus fi al-Ifta", nameUrdu: "تخصص فی الافتاء", rollPrefix: "TI", count: 4 },
      { id: "tk-tafseer", name: "Takhassus fi al-Tafseer", nameUrdu: "تخصص فی التفسیر", rollPrefix: "TT", count: 3 },
      { id: "tk-hadith", name: "Takhassus fi al-Hadith", nameUrdu: "تخصص فی الحدیث", rollPrefix: "TH", count: 3 },
    ],
  },
];

export const allSubcategories = madrassaCategories.flatMap((c) =>
  c.subcategories.map((s) => ({ ...s, categoryId: c.id, categoryName: c.name, categoryNameUrdu: c.nameUrdu })),
);

export const categoryDistribution = allSubcategories.map((s) => ({
  name: s.nameUrdu,
  value: s.count,
}));