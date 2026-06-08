import { useMemo } from "react";
import { Lock, Eye, Plus, Pencil, Trash2, Download, CheckCircle, ClipboardEdit, Printer, Settings2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MODULE_REGISTRY,
  ACTION_META,
  PERMISSION_GROUPS,
  type ModuleKey,
  type PermissionAction,
  type UserPermissions,
} from "@/lib/permissions/module-registry";

const ACTION_ICONS: Record<PermissionAction, typeof Eye> = {
  view: Eye,
  create: Plus,
  edit: Pencil,
  delete: Trash2,
  export: Download,
  approve: CheckCircle,
  mark_entry: ClipboardEdit,
  print: Printer,
  manage: Settings2,
};

type Props = {
  value: UserPermissions;
  onChange?: (next: UserPermissions) => void;
  readOnly?: boolean;
};

export function PermissionMatrix({ value, onChange, readOnly }: Props) {
  const groups = useMemo(() => {
    return PERMISSION_GROUPS.map((g) => {
      const modules = MODULE_REGISTRY.filter((m) => m.group === g.key);
      const actions = Array.from(
        new Set(modules.flatMap((m) => m.availableActions)),
      ) as PermissionAction[];
      // canonical action order
      const order: PermissionAction[] = ["view", "create", "edit", "delete", "mark_entry", "approve", "export", "print", "manage"];
      actions.sort((a, b) => order.indexOf(a) - order.indexOf(b));
      return { ...g, modules, actions };
    }).filter((g) => g.modules.length > 0);
  }, []);

  function toggle(moduleKey: ModuleKey, action: PermissionAction, nextChecked: boolean) {
    if (!onChange || readOnly) return;
    const next: UserPermissions = { ...value };
    const current = { ...(next[moduleKey] ?? {}) };
    current[action] = nextChecked;
    // If view is being turned off, clear all other actions for that module
    if (action === "view" && !nextChecked) {
      for (const k of Object.keys(current)) current[k as PermissionAction] = false;
    }
    next[moduleKey] = current;
    onChange(next);
  }

  function toggleColumn(groupKey: string, action: PermissionAction, on: boolean) {
    if (!onChange || readOnly) return;
    const next: UserPermissions = { ...value };
    for (const mod of MODULE_REGISTRY) {
      if (mod.group !== groupKey) continue;
      if (mod.superAdminOnly) continue;
      if (!mod.availableActions.includes(action)) continue;
      const current = { ...(next[mod.key] ?? {}) };
      // require view to grant other actions
      if (action !== "view" && !current.view && on) current.view = true;
      current[action] = on;
      if (action === "view" && !on) {
        for (const k of Object.keys(current)) current[k as PermissionAction] = false;
      }
      next[mod.key] = current;
    }
    onChange(next);
  }

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <section key={g.key} id={`perm-group-${g.key}`}>
          <div className="flex items-end justify-between mb-3">
            <div>
              <h3 className="font-urdu text-lg font-bold leading-loose" dir="rtl" lang="ur">{g.urdu}</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">{g.key}</p>
            </div>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-start font-semibold px-3 py-2.5 w-[260px] sticky start-0 bg-muted/50">
                    <div className="font-urdu" dir="rtl" lang="ur">ماڈیول</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Module</div>
                  </th>
                  {g.actions.map((a) => {
                    const Icon = ACTION_ICONS[a];
                    return (
                      <th key={a} className="px-2 py-2.5 text-center min-w-[72px]">
                        <button
                          type="button"
                          disabled={readOnly}
                          onClick={() => toggleColumn(g.key, a, true)}
                          onDoubleClick={() => toggleColumn(g.key, a, false)}
                          title={`Single click: grant all · Double click: revoke all (${ACTION_META[a].labelEnglish})`}
                          className={cn(
                            "flex flex-col items-center gap-0.5 mx-auto",
                            !readOnly && "hover:text-primary cursor-pointer",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="font-urdu text-[11px]" dir="rtl" lang="ur">{ACTION_META[a].labelUrdu}</span>
                          <span className="text-[9px] text-muted-foreground uppercase">{ACTION_META[a].labelEnglish}</span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {g.modules.map((mod, idx) => {
                  const perms = value[mod.key] ?? {};
                  const lockedRow = mod.superAdminOnly;
                  const viewOn = perms.view === true;
                  return (
                    <tr key={mod.key} className={cn(idx % 2 === 1 && "bg-muted/20", lockedRow && "opacity-40")}>
                      <td className="px-3 py-2.5 sticky start-0 bg-inherit">
                        <div className="flex items-center gap-2">
                          {lockedRow && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                          <div>
                            <div className="font-urdu text-sm font-medium leading-tight" dir="rtl" lang="ur">{mod.nameUrdu}</div>
                            <div className="text-[11px] text-muted-foreground">{mod.nameEnglish}</div>
                          </div>
                        </div>
                      </td>
                      {g.actions.map((a) => {
                        const available = mod.availableActions.includes(a);
                        if (!available) {
                          return <td key={a} className="text-center text-muted-foreground/40 text-lg">—</td>;
                        }
                        const checked = perms[a] === true;
                        const disabled = readOnly || lockedRow || (a !== "view" && !viewOn);
                        return (
                          <td key={a} className="text-center px-2 py-2.5">
                            <Checkbox
                              checked={checked}
                              disabled={disabled}
                              onCheckedChange={(c) => toggle(mod.key, a, c === true)}
                              aria-label={`${ACTION_META[a].labelEnglish} for ${mod.nameEnglish}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </section>
      ))}
    </div>
  );
}

export function PermissionSummary({ value }: { value: UserPermissions }) {
  const accessible = MODULE_REGISTRY.filter((m) => value[m.key]?.view === true);
  if (accessible.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No module access granted · کوئی رسائی نہیں</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {accessible.map((m) => (
        <Badge key={m.key} variant="outline" className="font-normal">
          <span className="font-urdu" dir="rtl" lang="ur">{m.nameUrdu}</span>
        </Badge>
      ))}
    </div>
  );
}