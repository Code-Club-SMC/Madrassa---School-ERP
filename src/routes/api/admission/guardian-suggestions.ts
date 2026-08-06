import { createFileRoute } from "@tanstack/react-router";
import { guardianSuggestionsSchema, suggestGuardians } from "@/lib/server/admission/service";
import { admissionErrorResponse } from "@/lib/server/admission/errors";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/admission/guardian-suggestions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, guardianSuggestionsSchema);
        if (!body.ok) return body.response;

        try {
          const guardians = await suggestGuardians(request, body.data);
          return json({ guardians });
        } catch (error) {
          return admissionErrorResponse(error, "Could not load guardian suggestions");
        }
      },
    },
  },
});
