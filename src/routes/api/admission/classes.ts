import { createFileRoute } from "@tanstack/react-router";
import { loadStoredSchoolClasses } from "@/lib/server/academic/service";
import { json } from "@/lib/server/super-admin";

export const Route = createFileRoute("/api/admission/classes")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const gender = url.searchParams.get("gender") as "male" | "female" | null;
          const institutionId = url.searchParams.get("institutionId");

          const allClasses = loadStoredSchoolClasses();
          let filtered = allClasses.filter((c: any) => c.active !== false);

          if (institutionId) {
            filtered = filtered.filter((c: any) => c.institutionId === institutionId);
          } else if (gender) {
            filtered = filtered.filter((c: any) => {
              const g = (c.gender || "").toLowerCase();
              return !g || g === "mixed" || g === "both" || g === "all" || g === gender;
            });
          }

          return json({ classes: filtered });
        } catch {
          return json({ classes: [] });
        }
      },
    },
  },
});
