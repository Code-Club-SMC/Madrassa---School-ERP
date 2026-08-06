import { createFileRoute } from "@tanstack/react-router";
import { getStudentFeeLedger, studentLedgerQuerySchema } from "@/lib/server/finance/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/fees/students/$id/ledger")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const url = new URL(request.url);
        const query = studentLedgerQuerySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!query.success) return json({ error: "Invalid query", issues: query.error.issues }, 400);

        try {
          return json(await getStudentFeeLedger(request, params.id, query.data));
        } catch (error) {
          return errorResponse(error, "Could not load student fee ledger");
        }
      },
    },
  },
});
