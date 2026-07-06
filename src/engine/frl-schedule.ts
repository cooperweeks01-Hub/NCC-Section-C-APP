import { isInScope } from "../domain/building.ts";
import { isUsable } from "../domain/ncc-value.ts";
import { frlGroupFor } from "../data/schema.ts";
import type { FrlScheduleDetail, FrlScheduleLine } from "../domain/result.ts";
import { complianceResult, insufficientInput, snapshotFor } from "./result-helpers.ts";
import type { RuleFn } from "./types.ts";

/**
 * WS-4 · FRL schedule (Specification 5).
 *
 * For the determined Type and the building's Spec 5 class group ({5,7a} vs
 * {7b,8}), emit one cited line per fixed-schedule element (common/fire walls,
 * internal walls incl. sub-locations, columns, floors, roofs). A "–" in the
 * source is a null FRL criterion, distinct from a numeric value (brief §6.6).
 * External-wall FRLs are distance-dependent and live in the setback check, not
 * here.
 *
 * `requiredType` is `null` (upstream C2D2 undetermined) ⇒ never defaulted to a
 * Type (brief §9); the schedule cannot be produced ⇒ insufficient-input. Any
 * unverified line flags the overall result unverified.
 */
export const assessFrlSchedule: RuleFn<FrlScheduleDetail> = (ctx) => {
  const { input, requiredType } = ctx;
  const inputSnapshot = snapshotFor(input, "buildingClass", "riseInStoreys");

  if (!isInScope(input.buildingClass)) {
    return insufficientInput({
      check: "FrlSchedule",
      clauseRef: "Spec 5",
      detail: { type: null, lines: [] },
      summary: `Class ${input.buildingClass} is out of scope — FRL schedule not produced.`,
      inputSnapshot,
      usesUnverifiedData: false,
    });
  }

  if (requiredType == null) {
    return insufficientInput({
      check: "FrlSchedule",
      clauseRef: "Spec 5",
      detail: { type: null, lines: [] },
      summary: "FRL schedule cannot be produced: the required Type of construction is not yet determined.",
      inputSnapshot,
      usesUnverifiedData: false,
    });
  }

  const sourceLines = ctx.data.spec5Schedule[requiredType][frlGroupFor(input.buildingClass)];
  const lines: FrlScheduleLine[] = sourceLines.map((l) => {
    const usable = isUsable(l.frl);
    return {
      label: l.label,
      frl: usable ? l.frl.value : null,
      clauseRef: l.clauseRef,
      usesUnverifiedData: !usable,
    };
  });

  const anyUnverified = lines.some((l) => l.usesUnverifiedData);
  const detail: FrlScheduleDetail = { type: requiredType, lines };

  if (anyUnverified) {
    return insufficientInput({
      check: "FrlSchedule",
      clauseRef: "Spec 5",
      detail,
      summary: "FRL schedule cannot be finalised: some Specification 5 values are unverified.",
      inputSnapshot,
    });
  }

  return complianceResult<FrlScheduleDetail>({
    check: "FrlSchedule",
    status: "determined",
    detail,
    clauseRef: "Spec 5",
    summary: `Specification 5 FRL schedule for Type ${requiredType} (${lines.length} elements). External-wall FRLs are distance-dependent — see the setback result.`,
    inputSnapshot,
    usesUnverifiedData: false,
  });
};
