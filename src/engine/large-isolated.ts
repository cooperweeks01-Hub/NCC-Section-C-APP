import type {
  LargeIsolatedDetail,
  PathwayEvaluation,
} from "../domain/result.ts";
import { insufficientInput, snapshotFor } from "./result-helpers.ts";
import type { RuleFn } from "./types.ts";

/**
 * WS-2 · Large isolated buildings (C3D4 + C3D5).
 *
 * SIGNATURE-LOCKED STUB (Phase A). Phase B implements the C3D4 concession: it
 * applies ONLY while floor area ≤ cap AND volume ≤ cap. THIS is where the tool
 * asks whether the building is/can be sprinklered to Spec 17 (brief §6.4). It
 * evaluates the two pathways — A: open space per C3D5(1); B: Spec 17 sprinklers +
 * perimeter vehicular access per C3D5(2) — reports which the inputs satisfy and
 * what is missing, and flags the boundary/hydrant coupling.
 *
 * Until the C3D4 caps and C3D5 geometry are verified, degrades to
 * `insufficient-input` (never compute a concession against an untrusted cap).
 */
export const assessLargeIsolated: RuleFn<LargeIsolatedDetail> = (ctx) => {
  const c = ctx.compartment;
  const pathwayA: PathwayEvaluation = {
    pathway: "openSpace",
    clauseRef: "C3D5(1)",
    satisfied: null,
    requirement: "Open space of the required width around the building.",
    missing: null,
  };
  const pathwayB: PathwayEvaluation = {
    pathway: "sprinklerPerimeter",
    clauseRef: "C3D5(2)",
    satisfied: null,
    requirement:
      "Sprinkler system complying with Specification 17 plus perimeter vehicular access.",
    missing: null,
  };
  const detail: LargeIsolatedDetail = {
    clauseRef: "C3D4",
    eligible: null,
    areaCapM2: null,
    volumeCapM3: null,
    floorAreaM2: c?.floorAreaM2 ?? 0,
    volumeM3: c?.volumeM3 ?? 0,
    pathwayA,
    pathwayB,
    satisfiedPathway: null,
  };
  return insufficientInput({
    check: "LargeIsolated",
    clauseRef: "C3D4",
    detail,
    summary:
      "Large-isolated concession cannot be assessed: C3D4 caps / C3D5 geometry are unverified.",
    inputSnapshot: snapshotFor(
      ctx.input,
      "sprinkleredToSpec17",
      "openSpaceAroundBuildingM",
      "perimeterVehicularAccess",
    ),
    ...(c ? { compartmentId: c.id } : {}),
  });
};
