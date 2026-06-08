import { MODULE_REGISTRY, type ModuleKey, type PermissionAction, type UserPermissions } from "./module-registry";

export function can(
  permissions: UserPermissions | undefined,
  module: ModuleKey,
  action: PermissionAction,
): boolean {
  if (!permissions) return false;
  return permissions[module]?.[action] === true;
}

export function canView(permissions: UserPermissions | undefined, module: ModuleKey): boolean {
  return can(permissions, module, "view");
}

export function getAccessibleModules(permissions: UserPermissions): ModuleKey[] {
  return MODULE_REGISTRY.filter((mod) => can(permissions, mod.key, "view")).map((mod) => mod.key);
}

export function countCustomizations(current: UserPermissions, defaults: UserPermissions): number {
  let diff = 0;
  const keys = new Set<string>([...Object.keys(current), ...Object.keys(defaults)]);
  for (const k of keys) {
    const cur = current[k as ModuleKey] ?? {};
    const def = defaults[k as ModuleKey] ?? {};
    const actions = new Set<string>([...Object.keys(cur), ...Object.keys(def)]);
    for (const a of actions) {
      const cv = (cur as Record<string, boolean | undefined>)[a] === true;
      const dv = (def as Record<string, boolean | undefined>)[a] === true;
      if (cv !== dv) diff++;
    }
  }
  return diff;
}

export function totalGrantedActions(perms: UserPermissions): number {
  let n = 0;
  for (const mod of Object.values(perms)) {
    if (!mod) continue;
    for (const v of Object.values(mod)) if (v === true) n++;
  }
  return n;
}