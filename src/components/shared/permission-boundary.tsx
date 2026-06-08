import type { ReactNode } from "react";
import { ShieldX } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import type { ModuleKey } from "@/lib/permissions/module-registry";

type Props = { module: ModuleKey; children: ReactNode };

export function PermissionBoundary({ module, children }: Props) {
  const { canView, isSuperAdmin } = usePermissions();
  if (isSuperAdmin || canView(module)) return <>{children}</>;
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <ShieldX className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="font-urdu text-2xl font-bold leading-loose" dir="rtl" lang="ur">
        رسائی محدود ہے
      </h2>
      <p className="text-sm text-muted-foreground mt-0.5">You don't have permission to view this page</p>
      <p className="text-xs text-muted-foreground mt-4 max-w-sm">
        Contact your Super Admin to request access to this module.
      </p>
      <Button asChild variant="outline" size="sm" className="mt-6">
        <Link to="/dashboard">
          <span className="font-urdu">ڈیش بورڈ پر جائیں</span>
          <span className="ms-2 text-xs text-muted-foreground">Go to Dashboard</span>
        </Link>
      </Button>
    </div>
  );
}