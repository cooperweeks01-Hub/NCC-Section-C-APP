import type { SetbackDetail } from "../domain/result.ts";
import { insufficientInput, snapshotFor } from "./result-helpers.ts";
import type { RuleFn } from "./types.ts";

/**
 * WS-3 · Setback / separation + external-wall FRL (Spec 5 + C4D4).
 *
 * SIGNATURE-LOCKED STUB (Phase A). Phase B implements: for each external wall,
 * compute the required external-wall FRL from the distance to the fire-source
 * feature (Spec 5); for openings in adjacent compartments separated by a fire
 * wall, compute the required separation (Table C4D4) with the ≥60/60/60 +
 * protected-openings (C4D5) exemption. Recompute and re-cite on setback change
 * (brief §6.5).
 *
 * Requires `ctx.compartment` and `ctx.requiredType`. Until Spec 5 / C4D4 are
 * verified, degrades to `insufficient-input`.
 */
export const assessSetbackSeparation: RuleFn<SetbackDetail> = (ctx) => {
  const c = ctx.compartment;
  // Emit one (unverified) line per wall so the report shows what will be computed.
  const detail: SetbackDetail = {
    walls: (c?.externalWalls ?? []).map((w) => ({
      wallId: w.id,
      wallName: w.name,
      distanceToFireSourceFeatureM: w.distanceToFireSourceFeatureM,
      requiredExtWallFrl: null,
      clauseRef: "Spec 5",
    })),
  };
  return insufficientInput({
    check: "SetbackSeparation",
    clauseRef: "Spec 5",
    tableRef: "Table C4D4",
    detail,
    summary:
      "Setback / external-wall FRL cannot be assessed: Spec 5 and Table C4D4 values are unverified.",
    inputSnapshot: snapshotFor(ctx.input, "compartments"),
    ...(c ? { compartmentId: c.id } : {}),
  });
};
