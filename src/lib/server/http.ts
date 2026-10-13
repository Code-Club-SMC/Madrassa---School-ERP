export class HttpError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function isDatabaseOrInternalError(raw: string): boolean {
  if (!raw || typeof raw !== "string") return false;
  const lower = raw.toLowerCase();
  return (
    lower.includes("failed query") ||
    lower.includes("syntax error") ||
    lower.includes("violates") ||
    lower.includes('select "') ||
    lower.includes('column "') ||
    lower.includes('relation "') ||
    lower.includes('table "') ||
    lower.includes("insert into") ||
    lower.includes('update "') ||
    lower.includes("delete from") ||
    lower.includes("params:") ||
    lower.includes("neondberror") ||
    lower.includes("drizzlequeryerror") ||
    lower.includes("postgreserror") ||
    lower.includes("pg_") ||
    lower.includes("search_path") ||
    lower.includes("foreign key") ||
    lower.includes("unique constraint") ||
    lower.includes("duplicate key") ||
    lower.includes("not-null") ||
    lower.includes("connection terminated") ||
    lower.includes("socket closed")
  );
}

export function errorResponse(error: unknown, fallback = "Request failed") {
  if (error instanceof HttpError) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.status,
      headers: { "content-type": "application/json" },
    });
  }

  console.error("[api-error]", error);

  let message = fallback;
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as any).message)
        : "";

  if (raw) {
    if (isDatabaseOrInternalError(raw)) {
      if (
        raw.includes("23505") ||
        raw.toLowerCase().includes("unique constraint") ||
        raw.toLowerCase().includes("duplicate key")
      ) {
        message = "یہ ریکارڈ پہلے سے موجود ہے · This record already exists.";
      } else if (raw.includes("23503") || raw.toLowerCase().includes("foreign key")) {
        message = "متعلقہ ریکارڈ موجود نہیں ہے · Related record not found.";
      } else if (raw.includes("23502") || raw.toLowerCase().includes("not-null")) {
        message = "تمام ضروری معلومات درج کرنا لازمی ہیں · Required fields are missing.";
      } else if (fallback && fallback !== "Request failed") {
        message = fallback;
      } else {
        message =
          "درخواست پر کارروائی نہیں ہو سکی، براہ کرم دوبارہ کوشش کریں · Request could not be processed, please try again.";
      }
    } else {
      message = raw;
    }
  }

  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { "content-type": "application/json" },
  });
}
