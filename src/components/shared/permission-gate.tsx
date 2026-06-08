import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import type { ModuleKey, PermissionAction } from "@/lib/permissions/module-registry";

type Props = {
  module: ModuleKey;
  action: PermissionAction;
  children: ReactNode;
  fallback?: ReactNode;
};

export function PermissionGate({ module, action, children, fallback = null }: Props) {
  const { can } = usePermissions();
  return <>{can(module, action) ? children : fallback}</>;
}