import { sql } from "drizzle-orm";
import { db } from "@/db";
import { numberSequences } from "@/db/schema/admission";

type AdmissionTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type NumberScope = {
  year?: number;
  type: "application" | "admission" | "roll";
  institutionId: string;
  programId?: string | null;
  schoolClassId?: string | null;
  madrassaSubcategoryId?: string | null;
  prefix: string;
};

type VisibleNumberTarget = {
  programId?: string | null;
  schoolClassId?: string | null;
  madrassaSubcategoryId?: string | null;
};

export function visibleNumberScopeCode(
  target: VisibleNumberTarget,
  rollPrefix: string | null | undefined,
) {
  const base = sanitizeNumberCode(rollPrefix) || sanitizeNumberCode(target.programId) || "GEN";
  const classCode = sanitizeNumberCode(target.schoolClassId);

  if (classCode) return `${base}-${classCode}`;
  return base;
}

export function visibleScopedNumberPrefix(
  prefix: string,
  target: VisibleNumberTarget,
  rollPrefix: string | null | undefined,
) {
  return `${prefix}-${visibleNumberScopeCode(target, rollPrefix)}`;
}

export async function nextScopedNumber(tx: AdmissionTx, scope: NumberScope) {
  const year = scope.year ?? new Date().getFullYear();
  const id = [
    year,
    scope.type,
    scope.institutionId,
    scope.programId ?? "program-none",
    scope.schoolClassId ?? "class-none",
    scope.madrassaSubcategoryId ?? "sub-none",
  ].join(":");

  const [row] = await tx
    .insert(numberSequences)
    .values({
      id,
      year,
      type: scope.type,
      institutionId: scope.institutionId,
      programId: scope.programId ?? null,
      schoolClassId: scope.schoolClassId ?? null,
      madrassaSubcategoryId: scope.madrassaSubcategoryId ?? null,
      prefix: scope.prefix,
      currentValue: 1,
    })
    .onConflictDoUpdate({
      target: numberSequences.id,
      set: {
        currentValue: sql`${numberSequences.currentValue} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning({ value: numberSequences.currentValue });

  const value = row?.value ?? 1;
  return `${scope.prefix}-${year}-${value.toString().padStart(4, "0")}`;
}

function sanitizeNumberCode(value: string | null | undefined) {
  return (
    value
      ?.replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toUpperCase() ?? ""
  );
}
