import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { saveDocState } from "@/lib/server/admission/interviews-service";
import { json, parseJsonBody } from "@/lib/server/super-admin";
import { errorResponse } from "@/lib/server/http";

const saveDocStateSchema = z.object({
  appId: z.string().min(1),
  docs: z.record(z.string(), z.boolean()),
});

export const Route = createFileRoute("/api/admission/interviews/docs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await parseJsonBody(request, saveDocStateSchema);
        if (!body.ok) return body.response;

        try {
          const docStates = await saveDocState(body.data.appId, body.data.docs);
          return json({ docStates });
        } catch (error) {
          return errorResponse(error, "Could not save document state");
        }
      },
    },
  },
});

