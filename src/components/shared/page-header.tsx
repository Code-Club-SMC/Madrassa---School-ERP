import type { ReactNode } from "react";

type Props = {
  title: string;
  titleUrdu: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ title: _title, titleUrdu, description, actions }: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
      <div className="min-w-0">
        <h1
          dir="rtl"
          lang="ur"
          className="font-urdu text-[28px] sm:text-[32px] font-bold leading-tight text-foreground"
        >
          {titleUrdu}
        </h1>
        {description && (
          <p dir="rtl" lang="ur" className="font-urdu text-sm text-muted-foreground mt-2 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
