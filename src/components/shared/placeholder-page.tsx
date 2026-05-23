import { Construction, type LucideIcon } from "lucide-react";
import { PageHeader } from "./page-header";
import { EmptyState } from "./empty-state";

type Props = {
  title: string;
  titleUrdu: string;
  icon?: LucideIcon;
  description?: string;
};

export function PlaceholderPage({ title, titleUrdu, icon = Construction, description }: Props) {
  return (
    <div>
      <PageHeader title={title} titleUrdu={titleUrdu} description={description} />
      <div className="rounded-2xl border border-dashed border-border bg-card/50">
        <EmptyState
          icon={icon}
          heading="Coming soon in this build"
          headingUrdu="یہ صفحہ جلد دستیاب ہوگا"
          description="This module is part of the upcoming phase. The shell, design system, and navigation are ready."
        />
      </div>
    </div>
  );
}