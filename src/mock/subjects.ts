import type { Subject } from "@/types";

// Pakistan-authentic subject lists per §42.3 (school) and §41.2 (Dars-e-Nizami)
export const subjects: Subject[] = [
  // ---------- School — primary & middle ----------
  { id: "sub-urdu", name: "Urdu", nameUrdu: "اردو", system: "school", totalMarks: 100, passingMarks: 33, classIds: ["c1","c2","c3","c4","c5","c6","c7","c8","c9","c10","c11","c12"] },
  { id: "sub-english", name: "English", nameUrdu: "انگریزی", system: "school", totalMarks: 100, passingMarks: 33, classIds: ["c1","c2","c3","c4","c5","c6","c7","c8","c9","c10","c11","c12"] },
  { id: "sub-math", name: "Mathematics", nameUrdu: "ریاضی", system: "school", totalMarks: 100, passingMarks: 33, classIds: ["c1","c2","c3","c4","c5","c6","c7","c8","c9","c10","c11","c12"] },
  { id: "sub-islamiat", name: "Islamiat", nameUrdu: "اسلامیات", system: "school", totalMarks: 100, passingMarks: 33, classIds: ["c1","c2","c3","c4","c5","c6","c7","c8","c9","c10","c11","c12"] },
  { id: "sub-quran", name: "Nazira-e-Quran", nameUrdu: "ناظرہ قرآن", system: "school", totalMarks: 50, passingMarks: 20, classIds: ["c1","c2","c3","c4","c5","c6","c7","c8"] },
  { id: "sub-sst", name: "Social Studies", nameUrdu: "مطالعہ پاکستان", system: "school", totalMarks: 100, passingMarks: 33, classIds: ["c3","c4","c5","c6","c7","c8"] },
  { id: "sub-gs", name: "General Science", nameUrdu: "جنرل سائنس", system: "school", totalMarks: 100, passingMarks: 33, classIds: ["c3","c4","c5","c6","c7","c8"] },
  { id: "sub-ps", name: "Pakistan Studies", nameUrdu: "مطالعہ پاکستان", system: "school", totalMarks: 75, passingMarks: 25, classIds: ["c9","c10","c11","c12"] },
  { id: "sub-comp", name: "Computer Science", nameUrdu: "کمپیوٹر سائنس", system: "school", totalMarks: 75, passingMarks: 25, classIds: ["c6","c7","c8","c9","c10"] },
  // ---------- School — SSC science group ----------
  { id: "sub-physics", name: "Physics", nameUrdu: "طبیعیات", system: "school", totalMarks: 75, passingMarks: 25, classIds: ["c9","c10","c11","c12"] },
  { id: "sub-chem", name: "Chemistry", nameUrdu: "کیمیا", system: "school", totalMarks: 75, passingMarks: 25, classIds: ["c9","c10","c11","c12"] },
  { id: "sub-bio", name: "Biology", nameUrdu: "حیاتیات", system: "school", totalMarks: 75, passingMarks: 25, classIds: ["c9","c10","c11","c12"] },
  // ---------- School — HSSC commerce ----------
  { id: "sub-acc", name: "Accounting", nameUrdu: "اکاؤنٹنگ", system: "school", totalMarks: 100, passingMarks: 33, classIds: ["c11","c12"] },
  { id: "sub-eco", name: "Economics", nameUrdu: "معاشیات", system: "school", totalMarks: 100, passingMarks: 33, classIds: ["c11","c12"] },
  // ---------- Madrassa — Dars-e-Nizami subjects ----------
  { id: "sub-sarf", name: "Sarf (Arabic Morphology)", nameUrdu: "صرف", system: "madrassa", totalMarks: 100, passingMarks: 40, darjat: ["idadiya","awwal","daum"] },
  { id: "sub-nahw", name: "Nahw (Arabic Syntax)", nameUrdu: "نحو", system: "madrassa", totalMarks: 100, passingMarks: 40, darjat: ["awwal","daum","soyam","sanawiyya_amma"] },
  { id: "sub-balaghat", name: "Balaghat (Rhetoric)", nameUrdu: "بلاغت", system: "madrassa", totalMarks: 100, passingMarks: 40, darjat: ["sanawiyya_khasa","aliyah"] },
  { id: "sub-mantiq", name: "Mantiq (Logic)", nameUrdu: "منطق", system: "madrassa", totalMarks: 100, passingMarks: 40, darjat: ["sanawiyya_amma","sanawiyya_khasa"] },
  { id: "sub-falsafa", name: "Falsafa (Philosophy)", nameUrdu: "فلسفہ", system: "madrassa", totalMarks: 100, passingMarks: 40, darjat: ["sanawiyya_khasa","aliyah"] },
  { id: "sub-kalam", name: "Kalam (Theology)", nameUrdu: "کلام", system: "madrassa", totalMarks: 100, passingMarks: 40, darjat: ["aliyah","alimiyyah"] },
  { id: "sub-fiqh", name: "Fiqh (Jurisprudence)", nameUrdu: "فقہ", system: "madrassa", totalMarks: 100, passingMarks: 40, darjat: ["awwal","daum","soyam","sanawiyya_amma","sanawiyya_khasa","aliyah","alimiyyah"] },
  { id: "sub-usul-fiqh", name: "Usul al-Fiqh", nameUrdu: "اصول فقہ", system: "madrassa", totalMarks: 100, passingMarks: 40, darjat: ["sanawiyya_amma","sanawiyya_khasa","aliyah"] },
  { id: "sub-tafseer", name: "Tafseer", nameUrdu: "تفسیر", system: "madrassa", totalMarks: 100, passingMarks: 40, darjat: ["aliyah","alimiyyah"] },
  { id: "sub-hadith", name: "Hadith", nameUrdu: "حدیث", system: "madrassa", totalMarks: 100, passingMarks: 40, darjat: ["sanawiyya_khasa","aliyah","alimiyyah"] },
  { id: "sub-tajweed", name: "Tajweed", nameUrdu: "تجوید", system: "madrassa", totalMarks: 100, passingMarks: 40, darjat: ["idadiya","awwal","daum"] },
  { id: "sub-sirah", name: "Sirah (Prophet's Biography)", nameUrdu: "سیرت النبیﷺ", system: "madrassa", totalMarks: 100, passingMarks: 40, darjat: ["idadiya","awwal","daum","soyam"] },
  { id: "sub-tarikh", name: "Tarikh-e-Islam", nameUrdu: "تاریخ اسلام", system: "madrassa", totalMarks: 100, passingMarks: 40, darjat: ["awwal","daum","soyam","sanawiyya_amma"] },
  { id: "sub-adab", name: "Arabic Literature", nameUrdu: "ادب عربی", system: "madrassa", totalMarks: 100, passingMarks: 40, darjat: ["sanawiyya_amma","sanawiyya_khasa","aliyah"] },
];

export const subjectsById = Object.fromEntries(subjects.map((s) => [s.id, s]));