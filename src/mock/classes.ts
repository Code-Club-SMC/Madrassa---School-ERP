import type { SchoolClass } from "@/types";

const secondaryGroups = ["Science", "Arts"];
const higherSecondaryGroups = ["Pre-Engineering", "Pre-Medical", "Commerce", "Humanities"];

function buildClassArray(start: number, end: number, gender: "male" | "female", prefix: string, institutionId: string) {
  const classes: SchoolClass[] = [];
  for (let i = start; i <= end; i++) {
    const grade = i === 0 ? 0 : i === 1 ? 1 : i - 1;
    const id = i === 0 ? `${prefix}-nursery` : i === 1 ? `${prefix}-kg` : `${prefix}-c${grade}`;
    const name = i === 0 ? "Nursery" : i === 1 ? "KG" : `Class ${grade}`;
    const nameUrdu =
      i === 0 ? "نرسری" : i === 1 ? "کے جی" : `جماعت ${["اول", "دوم", "سوم", "چہارم", "پنجم", "ششم", "ہفتم", "ہشتم", "نہم", "دہم", "یازدہم", "دوازدہم"][grade - 1] || String(grade)}`;
    const level = i <= 1 ? "pre_primary" : grade <= 5 ? "primary" : grade <= 8 ? "middle" : grade <= 10 ? "secondary" : "higher_secondary";
    const govtEquivalent = grade === 9 ? "SSC Part I" : grade === 10 ? "SSC Part II" : grade === 11 ? "HSSC Part I" : grade === 12 ? "HSSC Part II" : undefined;
    classes.push({
      id,
      institutionId,
      name,
      nameUrdu,
      level,
      govtEquivalent,
      gender,
    });
  }
  return classes;
}

export const alQasimSchoolClasses: SchoolClass[] = buildClassArray(0, 13, "male", "aq", "al_qasim_academy");
export const zainabSchoolClasses: SchoolClass[] = buildClassArray(1, 6, "female", "zainab", "jamia_zainab_banat");

export const schoolClasses: SchoolClass[] = [...alQasimSchoolClasses, ...zainabSchoolClasses];
