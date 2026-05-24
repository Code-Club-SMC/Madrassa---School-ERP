import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { StudentsTable } from "@/components/students/students-table";

export const Route = createFileRoute("/_authenticated/madrassa/students")({
  component: () => (
    <>
      <PageHeader
        title="Madrassa Students"
        titleUrdu="مدرسہ کے طلبہ"
        description="Manage all enrolled students across Hifz, Nazira, and Alimiyat programs."
      />
      <StudentsTable system="madrassa" />
    </>
  ),
});
