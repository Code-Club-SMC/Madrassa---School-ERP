type AdmissionApplicationPrintData = {
  id?: string | null;
  refNo?: string | null;
  formData?: Record<string, unknown> | null;
  submittedAt?: string | null;
  decidedAt?: string | null;
  madrassaSubcategoryId?: string | null;
};

type AdmissionStudentPrintData = {
  id?: string | null;
  rollNo?: string | null;
  admissionNo?: string | null;
};

export type AdmissionPrintResponse = {
  application?: AdmissionApplicationPrintData | null;
  student?: AdmissionStudentPrintData | null;
};

export function buildAdmissionPrintPayload(
  form: Record<string, string>,
  response?: AdmissionPrintResponse | null,
) {
  const formData = normalizeRecord(response?.application?.formData);
  const next = { ...formData, ...form };
  const refNo = response?.application?.refNo ?? response?.application?.id ?? "";
  const admissionNo = response?.student?.admissionNo ?? "";
  const rollNo = response?.student?.rollNo ?? "";
  const admissionDate =
    response?.application?.decidedAt ?? response?.application?.submittedAt ?? "";
  const subcategoryId = response?.application?.madrassaSubcategoryId ?? "";

  return {
    ...next,
    form_no: next.form_no || refNo,
    adm_no: admissionNo,
    roll_no: next.roll_no || rollNo,
    adm_date: next.adm_date || formatDateOnly(admissionDate),
    req_darja: next.req_darja || subcategoryId,
    shoba: next.shoba || subcategoryId,
  };
}

function normalizeRecord(value: Record<string, unknown> | null | undefined) {
  if (!value) return {};

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      typeof item === "string" ? item : item == null ? "" : String(item),
    ]),
  );
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}
