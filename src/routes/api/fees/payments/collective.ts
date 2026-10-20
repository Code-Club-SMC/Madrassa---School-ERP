import { createFileRoute } from "@tanstack/react-router";
import { collectCollectiveFeePayment, collectCollectiveFeeSchema } from "@/lib/server/finance/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/fees/payments/collective")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, collectCollectiveFeeSchema);
        if (!body.ok) return body.response;

        try {
          return json(await collectCollectiveFeePayment(request, body.data), 201);
        } catch (error) {
          return errorResponse(error, "Could not collect collective fee payment");
        }
      },
    },
  },
});

