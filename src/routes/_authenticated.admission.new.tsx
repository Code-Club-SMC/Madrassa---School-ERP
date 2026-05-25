import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { AdmissionWizard } from "@/components/admission/admission-wizard";

export const Route = createFileRoute("/_authenticated/admission/new")({
  component: () => (
    <>
      <PageHeader title="New Admission" titleUrdu="نیا داخلہ" description="Complete the five-step admission form to enroll a new student." />
      <AdmissionWizard />
    </>
  ),
});
