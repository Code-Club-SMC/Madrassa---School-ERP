import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { StudentsTable } from "@/components/students/students-table";

export const Route = createFileRoute("/_authenticated/school/students")({
  component: () => (
    <>
      <PageHeader
        title="School Students"
        titleUrdu="اسکول کے طلبہ"
        description="Manage all enrolled students across KG to Class 5."
      />
      <StudentsTable system="school" />
    </>
  ),
});
