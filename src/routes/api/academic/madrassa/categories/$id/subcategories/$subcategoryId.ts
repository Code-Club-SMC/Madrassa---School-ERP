import { createFileRoute } from "@tanstack/react-router";
import {
  deleteMadrassaSubcategory,
  madrassaSubcategoryUpdateSchema,
  updateMadrassaSubcategory,
} from "@/lib/server/academic/service";
import { errorResponse } from "@/lib/server/http";
import { json, parseJsonBody } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/madrassa/categories/$id/subcategories/$subcategoryId")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = await parseJsonBody(request, madrassaSubcategoryUpdateSchema);
        if (!body.ok) return body.response;

        try {
          return json({
            subcategory: await updateMadrassaSubcategory(request, params.id, params.subcategoryId, body.data),
          });
        } catch (error) {
          return errorResponse(error, "Could not update madrassa subcategory");
        }
      },
      DELETE: async ({ request, params }) => {
        try {
          return json({ subcategory: await deleteMadrassaSubcategory(request, params.id, params.subcategoryId) });
        } catch (error) {
          return errorResponse(error, "Could not delete madrassa subcategory");
        }
      },
    },
  },
});
