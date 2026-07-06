import type { TypeOfConstructionDetail } from "../domain/result.ts";
import { insufficientInput, snapshotFor } from "./result-helpers.ts";
import type { RuleFn } from "./types.ts";

/**
 * WS-1 · Type of construction (Table C2D2).
 *
 * SIGNATURE-LOCKED STUB (Phase A). Phase B implements: look up the required Type
 * from Table C2D2 for (Class, rise in storeys), then derive the "less-onerous
 * Type achievable?" analysis ONLY from real levers (reduce rise → re-lookup
 * C2D2; applicable concessions), each with its clause. It must NOT brute-force
 * C→B→A (brief §6.3).
 *
 * Until C2D2 is verified, every input degrades to `insufficient-input`.
 */
export const assessTypeOfConstruction: RuleFn<TypeOfConstructionDetail> = (ctx) => {
  // TODO(WS-1): read ctx.data.c2d2[input.buildingClass]; if usable, band-match
  // riseInStoreys → requiredType, then build the lever analysis. For now, the
  // placeholder layer is unverified ⇒ safe-degrade.
  const detail: TypeOfConstructionDetail = {
    requiredType: null,
    riseInStoreys: ctx.input.riseInStoreys,
    levers: [],
  };
  return insufficientInput({
    check: "TypeOfConstruction",
    clauseRef: "C2D2",
    tableRef: "Table C2D2",
    detail,
    summary:
      "Type of construction cannot be determined: Table C2D2 values are unverified.",
    inputSnapshot: snapshotFor(ctx.input, "buildingClass", "riseInStoreys"),
  });
};
