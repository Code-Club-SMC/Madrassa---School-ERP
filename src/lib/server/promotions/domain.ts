import type { PromotionOutcome, PromotionSystem } from "@/db/schema/academic-years";
import type { StudentEventType } from "@/lib/server/students/events";

export type PromotionRuleCandidate = {
  id: string;
  system: PromotionSystem;
  outcome: PromotionOutcome;
  active?: boolean | null;
  sourceSchoolClassId?: string | null;
  sourceSchoolSectionId?: string | null;
  sourceMadrassaCategoryId?: string | null;
  sourceMadrassaSubcategoryId?: string | null;
  sourceDarja?: string | null;
  targetSchoolClassId?: string | null;
  targetSchoolSectionId?: string | null;
  targetMadrassaCategoryId?: string | null;
  targetMadrassaSubcategoryId?: string | null;
  targetDarja?: string | null;
};

export type PromotionEnrollmentCandidate = {
  schoolClassId: string | null;
  schoolSectionId: string | null;
  madrassaCategoryId?: string | null;
  madrassaSubcategoryId: string | null;
  darja?: string | null;
};

export type PromotionEvaluation = {
  outcome: PromotionOutcome;
  status: "ready" | "warning" | "blocked";
  target: {
    schoolClassId: string | null;
    schoolSectionId: string | null;
    madrassaCategoryId: string | null;
    madrassaSubcategoryId: string | null;
    darja: string | null;
  };
  warnings: string[];
  blockers: string[];
  ruleId: string | null;
};

export function evaluatePromotionCandidate(input: {
  system: PromotionSystem;
  enrollment: PromotionEnrollmentCandidate;
  rules: PromotionRuleCandidate[];
}): PromotionEvaluation {
  const rule = input.rules
    .filter((item) => item.active !== false)
    .find((item) => ruleMatchesEnrollment(input.system, input.enrollment, item));

  if (!rule) {
    return blockedEvaluation("No promotion rule found for current placement");
  }

  const target = targetForRule(input.enrollment, rule);
  const blockers = blockersForRule(input.system, rule, target);

  return {
    outcome: blockers.length > 0 ? "blocked" : rule.outcome,
    status: blockers.length > 0 ? "blocked" : "ready",
    target,
    warnings: [],
    blockers,
    ruleId: rule.id,
  };
}

export function studentEventTypeForPromotionOutcome(outcome: PromotionOutcome): StudentEventType {
  switch (outcome) {
    case "promote":
      return "promotion_applied";
    case "repeat":
      return "promotion_repeated";
    case "graduate":
      return "promotion_graduated";
    case "dropout":
      return "promotion_dropout";
    case "inactive":
      return "promotion_inactive";
    case "blocked":
      throw new Error("Blocked promotion outcomes do not produce student events");
  }
}

function ruleMatchesEnrollment(
  system: PromotionSystem,
  enrollment: PromotionEnrollmentCandidate,
  rule: PromotionRuleCandidate,
) {
  if (rule.system !== system) return false;
  if (rule.sourceSchoolClassId && rule.sourceSchoolClassId !== enrollment.schoolClassId)
    return false;
  if (rule.sourceSchoolSectionId && rule.sourceSchoolSectionId !== enrollment.schoolSectionId)
    return false;
  if (
    rule.sourceMadrassaCategoryId &&
    rule.sourceMadrassaCategoryId !== (enrollment.madrassaCategoryId ?? null)
  ) {
    return false;
  }
  if (
    rule.sourceMadrassaSubcategoryId &&
    rule.sourceMadrassaSubcategoryId !== enrollment.madrassaSubcategoryId
  ) {
    return false;
  }
  if (rule.sourceDarja && rule.sourceDarja !== (enrollment.darja ?? null)) return false;
  return true;
}

function targetForRule(
  enrollment: PromotionEnrollmentCandidate,
  rule: PromotionRuleCandidate,
): PromotionEvaluation["target"] {
  if (rule.outcome === "repeat") {
    return {
      schoolClassId: enrollment.schoolClassId,
      schoolSectionId: enrollment.schoolSectionId,
      madrassaCategoryId: enrollment.madrassaCategoryId ?? null,
      madrassaSubcategoryId: enrollment.madrassaSubcategoryId,
      darja: enrollment.darja ?? null,
    };
  }

  return {
    schoolClassId: rule.targetSchoolClassId ?? null,
    schoolSectionId: rule.targetSchoolSectionId ?? null,
    madrassaCategoryId: rule.targetMadrassaCategoryId ?? null,
    madrassaSubcategoryId: rule.targetMadrassaSubcategoryId ?? null,
    darja: rule.targetDarja ?? null,
  };
}

function blockersForRule(
  system: PromotionSystem,
  rule: PromotionRuleCandidate,
  target: PromotionEvaluation["target"],
) {
  if (rule.outcome === "graduate" || rule.outcome === "dropout" || rule.outcome === "inactive")
    return [];
  if (rule.outcome === "repeat") return [];
  if (system === "school" && !target.schoolClassId)
    return ["Promotion rule is missing target class"];
  if (system === "madrassa" && !target.madrassaSubcategoryId) {
    return ["Promotion rule is missing target madrassa subcategory"];
  }
  return [];
}

function blockedEvaluation(message: string): PromotionEvaluation {
  return {
    outcome: "blocked",
    status: "blocked",
    target: {
      schoolClassId: null,
      schoolSectionId: null,
      madrassaCategoryId: null,
      madrassaSubcategoryId: null,
      darja: null,
    },
    warnings: [],
    blockers: [message],
    ruleId: null,
  };
}
