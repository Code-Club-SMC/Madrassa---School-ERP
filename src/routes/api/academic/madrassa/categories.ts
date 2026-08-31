import { createFileRoute } from "@tanstack/react-router";
import {
  listMadrassaCategories,
} from "@/lib/server/academic/service";
import { errorResponse } from "@/lib/server/http";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/academic/madrassa/categories")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const academicYearId = url.searchParams.get("academicYearId") || undefined;
          const section = url.searchParams.get("section") || undefined;
          return json({ categories: await listMadrassaCategories(request, academicYearId, section) });
        } catch (error) {
          return errorResponse(error, "Could not load madrassa categories");
        }
      },
    },
  },
});
