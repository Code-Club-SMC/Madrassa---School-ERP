import { createFileRoute } from "@tanstack/react-router";
import {
  guardianAccountListQuerySchema,
  listGuardianAccounts,
} from "@/lib/server/guardians/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/parents/admin/guardian-accounts")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const query = guardianAccountListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!query.success) return json({ error: "Invalid query", issues: query.error.issues }, 400);

        try {
          return json(await listGuardianAccounts(request, query.data));
        } catch (error) {
          return errorResponse(error, "Could not load guardian accounts");
        }
      },
    },
  },
});
