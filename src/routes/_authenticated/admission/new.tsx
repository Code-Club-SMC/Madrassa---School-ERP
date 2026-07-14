import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PageHeader } from "@/components/shared/page-header";
import { AdmissionWizard } from "@/components/admission/admission-wizard";
import { PdfFormRenderer } from "@/components/admission/pdf-form-renderer";
import { getVariant } from "@/lib/admission-variants";

const searchSchema = z.object({ variant: z.string().optional() });

export const Route = createFileRoute("/_authenticated/admission/new")({
  validateSearch: searchSchema,
  component: NewAdmissionRoute,
});

function NewAdmissionRoute() {
  const { variant: variantKey } = Route.useSearch();
  const variant = getVariant(variantKey);

  if (variant) {
    return (
      <>
        <PageHeader
          title="New Admission"
          titleUrdu="نیا داخلہ"
          description={variant.titleEnglish}
        />
        <PdfFormRenderer variant={variant} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="New Admission" titleUrdu="نیا داخلہ" description="Complete the five-step admission form to enroll a new student." />
      <AdmissionWizard />
    </>
  );
}