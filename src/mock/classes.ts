import type { SchoolClass } from "@/types";

export const alQasimSchoolClasses: SchoolClass[] = [
  {
    id: "aq-c1",
    institutionId: "al_qasim_academy",
    name: "Class 1",
    nameUrdu: "جماعت اول",
    level: "primary",
    govtEquivalent: null,
    gender: "male",
    sections: [
      { id: "aq-c1-a", name: "A", active: true, enrollmentCount: 0 },
      { id: "aq-c1-b", name: "B", active: true, enrollmentCount: 0 },
    ],
  },
  {
    id: "aq-c2",
    institutionId: "al_qasim_academy",
    name: "Class 2",
    nameUrdu: "جماعت دوم",
    level: "primary",
    govtEquivalent: null,
    gender: "male",
    sections: [
      { id: "aq-c2-a", name: "A", active: true, enrollmentCount: 0 },
      { id: "aq-c2-b", name: "B", active: true, enrollmentCount: 0 },
    ],
  },
];

export const zainabSchoolClasses: SchoolClass[] = [
  {
    id: "zainab-c1",
    institutionId: "jamia_zainab_banat",
    name: "Class 1",
    nameUrdu: "جماعت اول",
    level: "primary",
    govtEquivalent: null,
    gender: "female",
    sections: [
      { id: "zainab-c1-a", name: "A", active: true, enrollmentCount: 0 },
      { id: "zainab-c1-b", name: "B", active: true, enrollmentCount: 0 },
    ],
  },
  {
    id: "zainab-c2",
    institutionId: "jamia_zainab_banat",
    name: "Class 2",
    nameUrdu: "جماعت دوم",
    level: "primary",
    govtEquivalent: null,
    gender: "female",
    sections: [
      { id: "zainab-c2-a", name: "A", active: true, enrollmentCount: 0 },
      { id: "zainab-c2-b", name: "B", active: true, enrollmentCount: 0 },
    ],
  },
];

export const schoolClasses: SchoolClass[] = [...alQasimSchoolClasses, ...zainabSchoolClasses];
