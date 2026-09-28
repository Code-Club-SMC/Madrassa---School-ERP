import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { StudentsTable } from "@/components/students/students-table";
import { useSystem } from "@/components/system-context";

export const Route = createFileRoute("/_authenticated/madrassa/students")({
  component: () => {
    const { gender } = useSystem();
    const institutionId = gender === "male" ? "jamia_qasmia_baneen" : "jamia_zainab_banat";
    return (
      <>
        <PageHeader
          title="Madrassa Students"
          titleUrdu="مدرسہ کے طلبہ"
          description="Manage all enrolled students across Hifz, Nazira, and Alimiyat programs."
        />
        <StudentsTable system="madrassa" section={gender} institutionId={institutionId} />
      </>
    );
  },
});
