import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-context";

type Props = {
  icon: LucideIcon;
  heading: string;
  headingUrdu?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
};

export function EmptyState({ icon: Icon, heading, headingUrdu, description, action }: Props) {
  const { lang } = useLanguage();
  const isUrdu = lang === "ur";
  const displayHeading = isUrdu ? (headingUrdu || heading) : heading;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3
        dir={isUrdu ? "rtl" : "ltr"}
        lang={lang}
        className={isUrdu ? "font-urdu text-xl font-bold text-foreground leading-tight mb-1" : "text-lg font-bold text-foreground leading-tight mb-1"}
      >
        {displayHeading}
      </h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm mb-5">{description}</p>}
      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
