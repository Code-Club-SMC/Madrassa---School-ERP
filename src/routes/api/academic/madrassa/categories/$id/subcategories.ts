import { createFileRoute } from "@tanstack/react-router";
import {
  createMadrassaSubcategory,
  madrassaSubcategoryInputSchema,
} from "@/lib/server/academic/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/madrassa/categories/$id/subcategories")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await parseJsonBody(request, madrassaSubcategoryInputSchema);
        if (!body.ok) return body.response;

        try {
          return json({ subcategory: await createMadrassaSubcategory(request, params.id, body.data) }, 201);
        } catch (error) {
          return errorResponse(error, "Could not create madrassa subcategory");
        }
      },
    },
  },
});
