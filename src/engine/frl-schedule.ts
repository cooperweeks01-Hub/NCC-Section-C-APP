import type { FrlScheduleDetail } from "../domain/result.ts";
import { insufficientInput, snapshotFor } from "./result-helpers.ts";
import type { RuleFn } from "./types.ts";

/**
 * WS-4 · FRL schedule (Specification 5).
 *
 * SIGNATURE-LOCKED STUB — awaiting its own commit. Phase B implements: for the
 * determined Type and the building's FrlClassGroup, emit one cited line per
 * `spec5Schedule` element, "–" (null criterion) distinct from a numeric FRL.
 * Until then it degrades to `insufficient-input`.
 */
export const assessFrlSchedule: RuleFn<FrlScheduleDetail> = (ctx) => {
  const detail: FrlScheduleDetail = {
    type: ctx.requiredType ?? null,
    lines: [],
  };
  return insufficientInput({
    check: "FrlSchedule",
    clauseRef: "Spec 5",
    detail,
    summary: "FRL schedule pending implementation (WS-4).",
    inputSnapshot: snapshotFor(ctx.input, "buildingClass", "riseInStoreys"),
  });
};
