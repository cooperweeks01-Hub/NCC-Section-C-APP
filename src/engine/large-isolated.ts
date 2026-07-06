import { isUsable } from "../domain/ncc-value.ts";
import type {
  LargeIsolatedDetail,
  LargeIsolatedPathway,
  PathwayEvaluation,
} from "../domain/result.ts";
import { complianceResult, insufficientInput, snapshotFor } from "./result-helpers.ts";
import type { RuleFn } from "./types.ts";

/**
 * WS-2 · Large isolated buildings (C3D4 + C3D5).
 *
 * The C3D4 concession applies ONLY while floor area ≤ cap AND volume ≤ cap. THIS
 * is where the tool asks whether the building is/can be sprinklered to Spec 17
 * (brief §6.4). Two pathways: A — open space per C3D5(1); B — Spec 17 sprinklers +
 * perimeter vehicular access per C3D5(2). Reports which the inputs satisfy and
 * what is missing.
 *
 * The C3D4 caps and C3D5 geometry are NOT in the verified extract, so against the
 * real layer this always degrades to `insufficient-input` (never compute a
 * concession against an untrusted cap — brief §9). The synthetic fixture carries
 * invented verified caps so the branch logic is still proven.
 */
export const assessLargeIsolated: RuleFn<LargeIsolatedDetail> = (ctx) => {
  const { input, data } = ctx;
  const c = ctx.compartment;
  const floorAreaM2 = c?.floorAreaM2 ?? 0;
  const volumeM3 = c?.volumeM3 ?? 0;
  const compartmentId = c?.id;
  const inputSnapshot = snapshotFor(
    input,
    "sprinkleredToSpec17",
    "openSpaceAroundBuildingM",
    "perimeterVehicularAccess",
  );

  const areaCap = data.c3d4Caps.maxFloorAreaM2;
  const volumeCap = data.c3d4Caps.maxVolumeM3;
  const openSpace = data.c3d5OpenSpace.minWidthM;

  // Base (unevaluated) pathway shapes, reused by the degradation path.
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
    requirement: "Sprinkler system complying with Specification 17 plus perimeter vehicular access.",
    missing: null,
  };

  const baseDetail: LargeIsolatedDetail = {
    clauseRef: "C3D4",
    eligible: null,
    areaCapM2: null,
    volumeCapM3: null,
    floorAreaM2,
    volumeM3,
    pathwayA,
    pathwayB,
    satisfiedPathway: null,
  };

  // Safe degradation: never assess a concession against unverified caps.
  if (!isUsable(areaCap) || !isUsable(volumeCap) || !isUsable(openSpace)) {
    return insufficientInput({
      check: "LargeIsolated",
      clauseRef: "C3D4",
      detail: baseDetail,
      summary:
        "Large-isolated concession cannot be assessed: C3D4 caps / C3D5 geometry are unverified.",
      inputSnapshot,
      ...(compartmentId ? { compartmentId } : {}),
    });
  }

  const areaCapM2 = areaCap.value;
  const volumeCapM3 = volumeCap.value;
  const eligible = floorAreaM2 <= areaCapM2 && volumeM3 <= volumeCapM3;

  // Pathway A — open space ≥ the required width around the building (C3D5(1)).
  const minWidth = openSpace.value;
  pathwayA.requirement = `Open space ≥ ${minWidth} m around the building (C3D5(1)).`;
  if (input.openSpaceAroundBuildingM == null) {
    pathwayA.satisfied = null;
    pathwayA.missing = "Open-space width not provided.";
  } else if (input.openSpaceAroundBuildingM >= minWidth) {
    pathwayA.satisfied = true;
  } else {
    pathwayA.satisfied = false;
    pathwayA.missing = `Open space is ${input.openSpaceAroundBuildingM} m; needs ≥ ${minWidth} m.`;
  }

  // Pathway B — Spec 17 sprinklers + perimeter vehicular access (C3D5(2)).
  if (input.sprinkleredToSpec17 == null || input.perimeterVehicularAccess == null) {
    pathwayB.satisfied = null;
    pathwayB.missing = "Sprinkler status and/or perimeter vehicular access not yet answered.";
  } else if (input.sprinkleredToSpec17 && input.perimeterVehicularAccess) {
    pathwayB.satisfied = true;
  } else {
    pathwayB.satisfied = false;
    const miss: string[] = [];
    if (!input.sprinkleredToSpec17) miss.push("a sprinkler system complying with Specification 17");
    if (!input.perimeterVehicularAccess) miss.push("perimeter vehicular access");
    pathwayB.missing = `Requires ${miss.join(" and ")}.`;
  }

  const satisfiedPathway: LargeIsolatedPathway | null =
    pathwayA.satisfied ? "openSpace" : pathwayB.satisfied ? "sprinklerPerimeter" : null;

  const detail: LargeIsolatedDetail = {
    ...baseDetail,
    eligible,
    areaCapM2,
    volumeCapM3,
    satisfiedPathway,
  };

  if (!eligible) {
    const overs: string[] = [];
    if (floorAreaM2 > areaCapM2) overs.push(`area ${floorAreaM2} m² > ${areaCapM2} m² cap`);
    if (volumeM3 > volumeCapM3) overs.push(`volume ${volumeM3} m³ > ${volumeCapM3} m³ cap`);
    return complianceResult<LargeIsolatedDetail>({
      check: "LargeIsolated",
      status: "fails",
      detail,
      clauseRef: "C3D4",
      summary: `Not eligible for the C3D4 large-isolated concession (${overs.join("; ")}). Subdivision is required.`,
      inputSnapshot,
      usesUnverifiedData: false,
      ...(compartmentId ? { compartmentId } : {}),
    });
  }

  if (satisfiedPathway) {
    const path = satisfiedPathway === "openSpace" ? "open space (C3D5(1))" : "sprinklers + perimeter access (C3D5(2))";
    return complianceResult<LargeIsolatedDetail>({
      check: "LargeIsolated",
      status: "complies",
      detail,
      clauseRef: "C3D4",
      pathway: `C3D4 large-isolated, ${path}`,
      summary: `Eligible for the C3D4 concession and satisfies the ${path} pathway.`,
      inputSnapshot,
      usesUnverifiedData: false,
      ...(compartmentId ? { compartmentId } : {}),
    });
  }

  // Eligible but neither pathway satisfied/answered yet.
  const anyIndeterminate = pathwayA.satisfied === null || pathwayB.satisfied === null;
  return complianceResult<LargeIsolatedDetail>({
    check: "LargeIsolated",
    status: anyIndeterminate ? "insufficient-input" : "fails",
    detail,
    clauseRef: "C3D4",
    summary: anyIndeterminate
      ? "Eligible for the C3D4 concession, but a pathway input (open space, sprinklers, or perimeter access) is still needed."
      : "Eligible for the C3D4 concession, but neither the open-space nor the sprinkler+perimeter pathway is satisfied.",
    inputSnapshot,
    usesUnverifiedData: false,
    ...(compartmentId ? { compartmentId } : {}),
  });
};
