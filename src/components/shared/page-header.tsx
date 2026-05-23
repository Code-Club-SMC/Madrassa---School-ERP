import type { ReactNode } from "react";

type Props = {
  title: string;
  titleUrdu: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, titleUrdu, description, actions }: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
      <div className="min-w-0">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="font-urdu text-base text-muted-foreground mt-0.5">{titleUrdu}</p>
        {description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}