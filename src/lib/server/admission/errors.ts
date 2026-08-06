export class AdmissionError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "AdmissionError";
  }
}

export function admissionErrorResponse(error: unknown, fallback = "Admission request failed") {
  if (error instanceof AdmissionError) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.status,
      headers: { "content-type": "application/json" },
    });
  }

  const databaseMessage = admissionDatabaseErrorMessage(error);
  return new Response(JSON.stringify({ error: databaseMessage ?? fallback }), {
    status: 500,
    headers: { "content-type": "application/json" },
  });
}

function admissionDatabaseErrorMessage(error: unknown) {
  const pgError = findPostgresError(error);
  if (!pgError) return null;

  if (pgError.code === "23505") {
    if (
      pgError.constraint === "admission_applications_ref_no_unique" ||
      pgError.constraint === "student_enrollments_admission_no_idx" ||
      pgError.constraint === "student_enrollments_roll_no_idx"
    ) {
      return "داخلہ نمبر بنانے میں مسئلہ ہوا، دوبارہ کوشش کریں";
    }

    if (pgError.constraint === "guardians_cnic_unique_idx") {
      return "اس شناختی کارڈ کے سرپرست کا ریکارڈ پہلے سے موجود ہے";
    }

    return "یہ ریکارڈ پہلے سے موجود ہے";
  }

  if (pgError.code === "23503") {
    if (pgError.constraint?.includes("madrassa_subcategory")) {
      return "منتخب کردہ مدرسہ درجہ موجود نہیں، درجات کی ترتیب دوبارہ لوڈ کریں";
    }

    if (pgError.constraint?.includes("school_class")) {
      return "منتخب کردہ اسکول کلاس موجود نہیں، کلاسز دوبارہ لوڈ کریں";
    }

    if (pgError.constraint?.includes("academic_year")) {
      return "فعال تعلیمی سال موجود نہیں";
    }

    return "داخلہ کے لیے منتخب کردہ متعلقہ ریکارڈ موجود نہیں";
  }

  return null;
}

function findPostgresError(error: unknown): { code?: string; constraint?: string } | null {
  const visited = new Set<unknown>();
  let current = error;

  while (current && typeof current === "object" && !visited.has(current)) {
    visited.add(current);
    const item = current as { code?: unknown; constraint?: unknown; cause?: unknown };

    if (typeof item.code === "string") {
      return {
        code: item.code,
        constraint: typeof item.constraint === "string" ? item.constraint : undefined,
      };
    }

    current = item.cause;
  }

  return null;
}
