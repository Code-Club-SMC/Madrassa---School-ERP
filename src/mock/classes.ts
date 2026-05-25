import type { SchoolClass } from "@/types";

// Pakistani school grade structure per §42.1
export const schoolClasses: SchoolClass[] = [
  {
    id: "nursery",
    name: "Nursery",
    nameUrdu: "نرسری",
    level: "pre_primary",
    sections: [{ id: "nursery-A", name: "A" }],
  },
  {
    id: "kg",
    name: "KG",
    nameUrdu: "کے جی",
    level: "pre_primary",
    sections: [{ id: "kg-A", name: "A" }, { id: "kg-B", name: "B" }],
  },
  {
    id: "c1",
    name: "Class 1",
    nameUrdu: "جماعت اول",
    level: "primary",
    sections: [{ id: "c1-A", name: "A" }, { id: "c1-B", name: "B" }],
  },
  {
    id: "c2",
    name: "Class 2",
    nameUrdu: "جماعت دوم",
    level: "primary",
    sections: [{ id: "c2-A", name: "A" }, { id: "c2-B", name: "B" }],
  },
  {
    id: "c3",
    name: "Class 3",
    nameUrdu: "جماعت سوم",
    level: "primary",
    sections: [{ id: "c3-A", name: "A" }, { id: "c3-B", name: "B" }],
  },
  {
    id: "c4",
    name: "Class 4",
    nameUrdu: "جماعت چہارم",
    level: "primary",
    sections: [{ id: "c4-A", name: "A" }, { id: "c4-B", name: "B" }],
  },
  {
    id: "c5",
    name: "Class 5",
    nameUrdu: "جماعت پنجم",
    level: "primary",
    sections: [{ id: "c5-A", name: "A" }, { id: "c5-B", name: "B" }],
  },
  {
    id: "c6",
    name: "Class 6",
    nameUrdu: "جماعت ششم",
    level: "middle",
    sections: [{ id: "c6-A", name: "A" }, { id: "c6-B", name: "B" }],
  },
  {
    id: "c7",
    name: "Class 7",
    nameUrdu: "جماعت ہفتم",
    level: "middle",
    sections: [{ id: "c7-A", name: "A" }, { id: "c7-B", name: "B" }],
  },
  {
    id: "c8",
    name: "Class 8",
    nameUrdu: "جماعت ہشتم",
    level: "middle",
    sections: [{ id: "c8-A", name: "A" }, { id: "c8-B", name: "B" }],
  },
  {
    id: "c9",
    name: "Class 9 (SSC-I)",
    nameUrdu: "جماعت نہم (میٹرک حصہ اول)",
    level: "secondary",
    govtEquivalent: "SSC Part I",
    sections: [
      { id: "c9-sci", name: "Science", group: "science" },
      { id: "c9-arts", name: "Arts", group: "arts" },
    ],
  },
  {
    id: "c10",
    name: "Class 10 (SSC-II)",
    nameUrdu: "جماعت دہم (میٹرک حصہ دوم)",
    level: "secondary",
    govtEquivalent: "SSC Part II",
    sections: [
      { id: "c10-sci", name: "Science", group: "science" },
      { id: "c10-arts", name: "Arts", group: "arts" },
    ],
  },
  {
    id: "c11",
    name: "Class 11 (HSSC-I)",
    nameUrdu: "جماعت یازدہم (انٹر حصہ اول)",
    level: "higher_secondary",
    govtEquivalent: "HSSC Part I",
    sections: [
      { id: "c11-pre-eng", name: "Pre-Engineering", group: "science" },
      { id: "c11-pre-med", name: "Pre-Medical", group: "science" },
      { id: "c11-com", name: "Commerce", group: "commerce" },
      { id: "c11-arts", name: "Humanities", group: "arts" },
    ],
  },
  {
    id: "c12",
    name: "Class 12 (HSSC-II)",
    nameUrdu: "جماعت دوازدہم (انٹر حصہ دوم)",
    level: "higher_secondary",
    govtEquivalent: "HSSC Part II",
    sections: [
      { id: "c12-pre-eng", name: "Pre-Engineering", group: "science" },
      { id: "c12-pre-med", name: "Pre-Medical", group: "science" },
      { id: "c12-com", name: "Commerce", group: "commerce" },
      { id: "c12-arts", name: "Humanities", group: "arts" },
    ],
  },
];

export const schoolClassesById = Object.fromEntries(schoolClasses.map((c) => [c.id, c]));