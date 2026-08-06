import { createFileRoute } from "@tanstack/react-router";
import { getStudentLedgerReport, reportQuerySchema } from "@/lib/server/finance/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/fees/reports/student-ledger")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const query = reportQuerySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!query.success) return json({ error: "Invalid query", issues: query.error.issues }, 400);

        try {
          return json(await getStudentLedgerReport(request, query.data));
        } catch (error) {
          return errorResponse(error, "Could not load student ledger report");
        }
      },
    },
  },
});
