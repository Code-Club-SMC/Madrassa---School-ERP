import { HttpError } from "@/lib/server/http";

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

  const httpError = error instanceof HttpError ? error : null;
  if (httpError) {
    return new Response(JSON.stringify({ error: httpError.message }), {
      status: httpError.status,
      headers: { "content-type": "application/json" },
    });
  }

  const databaseInfo = admissionDatabaseErrorInfo(error);
  if (databaseInfo) {
    return new Response(JSON.stringify({ error: databaseInfo.message }), {
      status: databaseInfo.status,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: fallback }), {
    status: 500,
    headers: { "content-type": "application/json" },
  });
}

function admissionDatabaseErrorInfo(error: unknown): { message: string; status: number } | null {
  const pgError = findPostgresError(error);
  if (!pgError) return null;

  if (pgError.code === "23505") {
    if (
      pgError.constraint === "admission_applications_ref_no_unique" ||
      pgError.constraint === "student_enrollments_admission_no_idx" ||
      pgError.constraint === "student_enrollments_roll_no_idx"
    ) {
      return { message: "داخلہ نمبر بنانے میں مسئلہ ہوا، دوبارہ کوشش کریں", status: 409 };
    }

    if (pgError.constraint === "guardians_cnic_unique_idx") {
      return { message: "اس شناختی کارڈ کے سرپرست کا ریکارڈ پہلے سے موجود ہے", status: 409 };
    }

    return { message: "یہ ریکارڈ پہلے سے موجود ہے", status: 409 };
  }

  if (pgError.code === "23503") {
    if (pgError.constraint?.includes("madrassa_subcategory")) {
      return { message: "منتخب کردہ مدرسہ درجہ موجود نہیں، درجات کی ترتیب دوبارہ لوڈ کریں", status: 400 };
    }

    if (pgError.constraint?.includes("school_class")) {
      return { message: "منتخب کردہ اسکول کلاس موجود نہیں، کلاسز دوبارہ لوڈ کریں", status: 400 };
    }

    if (pgError.constraint?.includes("academic_year")) {
      return { message: "فعال تعلیمی سال موجود نہیں، برائے مہربانی پہلے تعلیمی سال شامل کریں", status: 400 };
    }

    if (pgError.constraint?.includes("institution")) {
      return { message: "منتخب کردہ ادارہ موجود نہیں", status: 400 };
    }

    if (pgError.constraint?.includes("program")) {
      return { message: "منتخب کردہ تعلیمی شعبہ موجود نہیں", status: 400 };
    }

    return { message: "داخلہ کے لیے منتخب کردہ متعلقہ ریکارڈ موجود نہیں", status: 400 };
  }

  if (pgError.code === "23502") {
    return { message: "تمام ضروری معلومات درج کرنا لازمی ہیں", status: 400 };
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
