import { createFileRoute } from "@tanstack/react-router";
import { getComprehensiveReportTransactions } from "@/lib/server/finance/reports-service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/finance/reports")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const transactions = await getComprehensiveReportTransactions();
          return json({ transactions });
        } catch (error) {
          return errorResponse(error, "Could not load comprehensive finance reports");
        }
      },
    },
  },
});

