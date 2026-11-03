import { createFileRoute } from "@tanstack/react-router";
import {
  recordFinanceTransaction,
  transactionInputSchema,
} from "@/lib/server/finance/transaction-service";
import { getFinanceOverview } from "@/lib/server/finance/overview";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/finance/transactions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const overview = await getFinanceOverview(request);
          return json({ transactions: overview.recentTransactions });
        } catch (error) {
          return errorResponse(error, "Could not load transactions");
        }
      },
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, transactionInputSchema);
        if (!body.ok) return body.response;

        try {
          const result = await recordFinanceTransaction(request, body.data);
          return json(result, 201);
        } catch (error) {
          return errorResponse(error, "Could not record financial transaction");
        }
      },
    },
  },
});

