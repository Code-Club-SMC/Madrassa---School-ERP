import { useLanguage } from "@/components/language-context";
import type { ReactNode } from "react";

type Props = {
  title: string;
  titleUrdu: string;
  description?: string;
  descriptionUrdu?: string;
  actions?: ReactNode;
};

export function PageHeader({
  title: _title,
  titleUrdu,
  description,
  descriptionUrdu,
  actions,
}: Props) {
  const { lang } = useLanguage();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
      <div className="min-w-0">
        <h1
          dir={lang === "ur" ? "rtl" : "ltr"}
          lang={lang}
          className={
            lang === "ur"
              ? "font-urdu text-[28px] sm:text-[32px] font-bold leading-tight text-foreground"
              : "text-[28px] sm:text-[32px] font-bold leading-tight text-foreground"
          }
        >
          {lang === "ur" ? titleUrdu : _title}
        </h1>
        {description && (
          <p
            dir={lang === "ur" ? "rtl" : "ltr"}
            lang={lang}
            className={
              lang === "ur"
                ? "font-urdu text-sm text-muted-foreground mt-2 max-w-2xl"
                : "text-sm text-muted-foreground mt-2 max-w-2xl"
            }
          >
            {lang === "ur" ? (descriptionUrdu ?? description) : description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
