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
    lower.includes("socket closed") ||
    lower.includes("econnrefused") ||
    lower.includes("etimeout") ||
    lower.includes("etimedout") ||
    lower.includes("enotfound") ||
    lower.includes("ehostunreach") ||
    lower.includes("econnreset") ||
    lower.includes("getaddrinfo") ||
    lower.includes("password authentication failed")
  );
}

export function formatDatabaseError(
  error: unknown,
  fallback = "Database service is temporarily unavailable. Please try again in a few moments.",
): string {
  const parts: string[] = [];
  const visited = new Set<unknown>();
  let current: any = error;
  let depth = 0;

  while (current && depth < 6 && !visited.has(current)) {
    visited.add(current);
    if (typeof current.message === "string") parts.push(current.message);
    if (typeof current.code === "string") parts.push(current.code);
    if (typeof current.detail === "string") parts.push(current.detail);
    if (typeof current.syscall === "string") parts.push(current.syscall);
    if (typeof current.name === "string") parts.push(current.name);
    current = current.cause;
    depth++;
  }

  const combined = parts.join(" ").toLowerCase();

  // 1. Connection / Network / DNS / Host Unreachable / Timeout
  if (
    combined.includes("econnrefused") ||
    combined.includes("etimeout") ||
    combined.includes("etimedout") ||
    combined.includes("enotfound") ||
    combined.includes("ehostunreach") ||
    combined.includes("econnreset") ||
    combined.includes("getaddrinfo") ||
    combined.includes("connection terminated") ||
    combined.includes("connection closed") ||
    combined.includes("socket closed") ||
    combined.includes("connection refused") ||
    combined.includes("timeout") ||
    combined.includes("timed out")
  ) {
    return "Database connection unavailable. Please check your internet connection or verify the database service is running.";
  }

  // 2. SSL / Handshake issues
  if (combined.includes("ssl") || combined.includes("certificate") || combined.includes("handshake")) {
    return "Database connection SSL error. Please verify the database connection configuration.";
  }

  // 3. Database Credentials / Auth failure
  if (
    combined.includes("password authentication failed") ||
    combined.includes("pg_hba.conf") ||
    combined.includes("28p01")
  ) {
    return "Database authentication failed. Please verify database credentials in server configuration.";
  }

  // 4. Missing columns / tables (pending migrations)
  if (
    combined.includes("does not exist") ||
    combined.includes("undefined_table") ||
    combined.includes("undefined_column") ||
    combined.includes("42703") ||
    combined.includes("42p01")
  ) {
    return "Database schema update required. Please ensure database migrations have been applied.";
  }

  // 5. Connection pool limit / capacity
  if (
    combined.includes("remaining connection slots") ||
    combined.includes("too many clients") ||
    combined.includes("max_connections")
  ) {
    return "Database server is busy with maximum connections. Please wait a moment and try again.";
  }

  // 6. Constraint violations
  if (combined.includes("23505") || combined.includes("unique constraint") || combined.includes("duplicate key")) {
    return "This record already exists.";
  }
  if (combined.includes("23503") || combined.includes("foreign key")) {
    return "Related record not found.";
  }
  if (combined.includes("23502") || combined.includes("not-null")) {
    return "Required fields are missing.";
  }

  // If it contains any query syntax, failed query, or SQL leakage, NEVER leak raw query
  if (isDatabaseOrInternalError(combined)) {
    return fallback;
  }

  // If error has a simple clean user-facing message that is not a query
  if (error instanceof Error && error.message && !isDatabaseOrInternalError(error.message)) {
    return error.message;
  }

  return fallback;
}

export function errorResponse(error: unknown, fallback = "Request failed") {
  if (error instanceof HttpError) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.status,
      headers: { "content-type": "application/json" },
    });
  }

  console.error("[api-error]", error);

  const message = formatDatabaseError(
    error,
    fallback && fallback !== "Request failed"
      ? fallback
      : "درخواست پر کارروائی نہیں ہو سکی، براہ کرم دوبارہ کوشش کریں · Request could not be processed, please try again.",
  );

  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { "content-type": "application/json" },
  });
}
