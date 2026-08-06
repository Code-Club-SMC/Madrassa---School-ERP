import { createFileRoute } from "@tanstack/react-router";
import { examReportQuerySchema, getExamReport } from "@/lib/server/exams/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/exams/reports/summary")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const query = examReportQuerySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!query.success) return json({ error: "Invalid query", issues: query.error.issues }, 400);

        try {
          return json(await getExamReport(request, query.data));
        } catch (error) {
          return errorResponse(error, "Could not load exam report");
        }
      },
    },
  },
});
