import { createFileRoute } from "@tanstack/react-router";
import {
  deleteMadrassaCategory,
  getMadrassaCategory,
  madrassaCategoryUpdateSchema,
  updateMadrassaCategory,
} from "@/lib/server/academic/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/madrassa/categories/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          return json({ category: await getMadrassaCategory(request, params.id) });
        } catch (error) {
          return errorResponse(error, "Could not load madrassa category");
        }
      },
      PATCH: async ({ request, params }) => {
        const body = await parseJsonBody(request, madrassaCategoryUpdateSchema);
        if (!body.ok) return body.response;

        try {
          return json({ category: await updateMadrassaCategory(request, params.id, body.data) });
        } catch (error) {
          return errorResponse(error, "Could not update madrassa category");
        }
      },
      DELETE: async ({ request, params }) => {
        try {
          return json({ category: await deleteMadrassaCategory(request, params.id) });
        } catch (error) {
          return errorResponse(error, "Could not delete madrassa category");
        }
      },
    },
  },
});
