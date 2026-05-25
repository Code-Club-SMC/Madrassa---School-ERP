import type { Holiday } from "@/types";

export const holidays: Holiday[] = [
  { id: "h-01", date: "2025-03-23", nameEnglish: "Pakistan Day", nameUrdu: "یومِ پاکستان", type: "national", recurring: true },
  { id: "h-02", date: "2025-03-31", nameEnglish: "Eid-ul-Fitr (Day 1)", nameUrdu: "عید الفطر — پہلا دن", type: "religious", recurring: false },
  { id: "h-03", date: "2025-04-01", nameEnglish: "Eid-ul-Fitr (Day 2)", nameUrdu: "عید الفطر — دوسرا دن", type: "religious", recurring: false },
  { id: "h-04", date: "2025-04-02", nameEnglish: "Eid-ul-Fitr (Day 3)", nameUrdu: "عید الفطر — تیسرا دن", type: "religious", recurring: false },
  { id: "h-05", date: "2025-05-01", nameEnglish: "Labour Day", nameUrdu: "یومِ مزدور", type: "national", recurring: true },
  { id: "h-06", date: "2025-06-07", nameEnglish: "Eid-ul-Adha (Day 1)", nameUrdu: "عید الاضحیٰ — پہلا دن", type: "religious", recurring: false },
  { id: "h-07", date: "2025-06-08", nameEnglish: "Eid-ul-Adha (Day 2)", nameUrdu: "عید الاضحیٰ — دوسرا دن", type: "religious", recurring: false },
  { id: "h-08", date: "2025-06-09", nameEnglish: "Eid-ul-Adha (Day 3)", nameUrdu: "عید الاضحیٰ — تیسرا دن", type: "religious", recurring: false },
  { id: "h-09", date: "2025-07-06", nameEnglish: "9th Muharram", nameUrdu: "۹ محرم الحرام", type: "religious", recurring: false },
  { id: "h-10", date: "2025-07-07", nameEnglish: "10th Muharram (Ashura)", nameUrdu: "۱۰ محرم الحرام", type: "religious", recurring: false },
  { id: "h-11", date: "2025-08-14", nameEnglish: "Independence Day", nameUrdu: "یومِ آزادی", type: "national", recurring: true },
  { id: "h-12", date: "2025-09-05", nameEnglish: "Eid Milad-un-Nabi ﷺ", nameUrdu: "عید میلاد النبی ﷺ", type: "religious", recurring: false },
  { id: "h-13", date: "2025-11-09", nameEnglish: "Iqbal Day", nameUrdu: "یومِ اقبال", type: "national", recurring: true },
  { id: "h-14", date: "2025-12-25", nameEnglish: "Quaid-e-Azam Day", nameUrdu: "یومِ قائد", type: "national", recurring: true },
  { id: "h-15", date: "2025-12-26", nameEnglish: "Winter Break Begins", nameUrdu: "موسمِ سرما کی تعطیلات کا آغاز", type: "institutional", recurring: false },
];