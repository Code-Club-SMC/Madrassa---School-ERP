export class HttpError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function errorResponse(error: unknown, fallback = "Request failed") {
  if (error instanceof HttpError) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.status,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: error instanceof Error ? error.message : fallback }), {
    status: 500,
    headers: { "content-type": "application/json" },
  });
}
