import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { StudentsTable } from "@/components/students/students-table";
import { useSystem } from "@/components/system-context";

export const Route = createFileRoute("/_authenticated/school/students")({
  component: () => {
    const { gender } = useSystem();
    const institutionId = gender === "male" ? "al_qasim_academy" : "jamia_zainab_banat";
    return (
      <>
        <PageHeader
          title="School Students"
          titleUrdu="اسکول کے طلبہ"
          description="Manage all enrolled students across KG to Class 5."
        />
        <StudentsTable system="school" institutionId={institutionId} />
      </>
    );
  },
});
