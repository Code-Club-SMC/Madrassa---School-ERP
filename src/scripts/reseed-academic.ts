import { ensureAcademicSeeded } from "@/lib/server/academic/seed";

async function main() {
  await ensureAcademicSeeded(true);
  console.log("Academic catalog reseeded.");
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error("Failed to reseed academic catalog:", error);
    process.exit(1);
  },
);
