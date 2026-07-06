import { BUILDING_ELEMENTS } from "../domain/building.ts";
import type { FrlScheduleDetail, FrlScheduleLine } from "../domain/result.ts";
import { insufficientInput, snapshotFor } from "./result-helpers.ts";
import type { RuleFn } from "./types.ts";

/**
 * WS-4 · FRL schedule (Specification 5).
 *
 * SIGNATURE-LOCKED STUB (Phase A). Phase B implements: for the determined Type,
 * emit the FRL per building element from Spec 5, each line citing its Spec 5
 * clause/table. "–" (no requirement) is represented as a null FRL criterion,
 * distinct from a numeric value (brief §6.6).
 *
 * Requires `ctx.requiredType`. Until Spec 5 is verified, every line is flagged
 * unverified and the overall result is `insufficient-input`.
 */
export const assessFrlSchedule: RuleFn<FrlScheduleDetail> = (ctx) => {
  // `requiredType` may be absent/null (upstream C2D2 unverified) — normalize to
  // the null sentinel rather than defaulting to a Type (brief §9); still
  // enumerate the element list so the schedule's shape is visible, FRLs null.
  const type = ctx.requiredType ?? null;
  const lines: FrlScheduleLine[] = BUILDING_ELEMENTS.map((element) => ({
    element,
    frl: null,
    clauseRef: "Spec 5",
    usesUnverifiedData: true,
  }));
  const detail: FrlScheduleDetail = { type, lines };
  return insufficientInput({
    check: "FrlSchedule",
    clauseRef: "Spec 5",
    detail,
    summary: "FRL schedule cannot be produced: Specification 5 values are unverified.",
    inputSnapshot: snapshotFor(ctx.input, "buildingClass", "riseInStoreys"),
  });
};
