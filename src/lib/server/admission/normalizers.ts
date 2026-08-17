import type { AdmissionVariantKey } from "@/lib/admission-variants";
import { AdmissionError } from "./errors";

export type NormalizedAdmissionForm = {
  name: string;
  nameUrdu: string;
  fatherName: string;
  fatherNameUrdu: string | null;
  gender: "male" | "female";
  dob: Date | null;
  cnicBForm: string | null;
  guardianName: string;
  guardianNameUrdu: string | null;
  guardianPhone: string | null;
  guardianCnic: string | null;
  guardianEmail: string | null;
  guardianRelation: string;
  address: string | null;
};

export function normalizeFormValues(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim()]),
  );
}

export function normalizeAdmissionForm(variantKey: AdmissionVariantKey, form: Record<string, string>): NormalizedAdmissionForm {
  const name = required(form.name, "Applicant name is required");
  const fatherName = required(form.father || form.father_name, "Father name is required");
  const guardianName = required(form.guardian_name || fatherName, "Guardian name is required");

  return {
    name,
    nameUrdu: name,
    fatherName,
    fatherNameUrdu: fatherName,
    gender: variantKey.startsWith("school-girls") || variantKey.startsWith("madrassa-girls") ? "female" : "male",
    dob: parseDate(form.dob_digits || form.dob || form.dob_age),
    cnicBForm: nullable(form.b_form || form.cnic_b_form || form.student_cnic),
    guardianName,
    guardianNameUrdu: guardianName,
    guardianPhone: nullable(form.guardian_phone || form.guardian_phone_home || form.curr_phone || form.phone),
    guardianCnic: nullable(form.guardian_cnic || form.cnic),
    guardianEmail: nullable(form.guardian_email || form.email)?.toLowerCase() ?? null,
    guardianRelation: nullable(form.guardian_rel || form.guardian_relation) ?? "father",
    address: nullable(form.address || form.curr_address || form.guardian_address),
  };
}

function required(value: string | undefined, message: string) {
  const trimmed = value?.trim();
  if (!trimmed) throw new AdmissionError(message, 400);
  return trimmed;
}

function nullable(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseDate(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;

  const date = new Date(`${trimmed}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}
