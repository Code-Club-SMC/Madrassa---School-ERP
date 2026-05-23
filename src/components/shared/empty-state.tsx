import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  icon: LucideIcon;
  heading: string;
  headingUrdu: string;
  description?: string;
  action?: { label: string; onClick: () => void };
};

export function EmptyState({ icon: Icon, heading, headingUrdu, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="font-heading font-semibold text-base mb-1">{heading}</h3>
      <p className="font-urdu text-muted-foreground text-sm mb-1">{headingUrdu}</p>
      {description && <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>}
      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}