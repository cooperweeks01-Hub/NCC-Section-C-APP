import { isUsable } from "../domain/ncc-value.ts";
import type {
  LargeIsolatedDetail,
  LargeIsolatedPathway,
  PathwayEvaluation,
} from "../domain/result.ts";
import { complianceResult, insufficientInput, snapshotFor } from "./result-helpers.ts";
import type { RuleFn } from "./types.ts";

/**
 * WS-2 · Large isolated buildings (C3D4 + C3D5) — TWO INDEPENDENT PATHWAYS.
 *
 * The building qualifies if EITHER pathway is met (brief §6.4). Crucially, the
 * 18,000 m² / 108,000 m³ caps bound ONLY pathway A — pathway B has no size limit,
 * which is exactly what lets a large building qualify.
 *
 *  - **Pathway A — open space, C3D5(1):** Class 7 or 8, ≤ 2 storeys (rise in
 *    storeys), floor area ≤ cap AND volume ≤ cap, AND open space ≥ 18 m around
 *    the building.
 *  - **Pathway B — sprinklers + perimeter access, C3D5(2):** sprinklered
 *    throughout to Specification 17 AND continuous ≥ 6 m vehicle access whose far
 *    side is ≤ 18 m from the building. NO size cap; any in-scope class.
 *
 * This is where the C3D4 sprinkler question is asked. Result:
 *   either pathway satisfied ⇒ `complies`; a needed answer missing ⇒
 *   `insufficient-input` (no DRAFT — the data is verified, the input isn't there);
 *   all answered and neither met ⇒ `fails` (subdivide).
 */
export const assessLargeIsolated: RuleFn<LargeIsolatedDetail> = (ctx) => {
  const { input, data } = ctx;
  const c = ctx.compartment;
  const floorAreaM2 = c?.floorAreaM2 ?? 0;
  const volumeM3 = c?.volumeM3 ?? 0;
  const compartmentId = c?.id;
  const inputSnapshot = snapshotFor(
    input,
    "buildingClass",
    "riseInStoreys",
    "sprinkleredToSpec17",
    "openSpaceAroundBuildingM",
    "perimeterAccess6mWide",
    "perimeterAccessWithin18m",
  );

  const areaCap = data.c3d4Caps.maxFloorAreaM2;
  const volumeCap = data.c3d4Caps.maxVolumeM3;
  const openSpaceMinV = data.c3d5.openSpaceMinWidthM;
  const accessWidthV = data.c3d5.perimeterAccessMinWidthM;
  const accessDistV = data.c3d5.perimeterAccessMaxDistanceM;

  const pathwayA: PathwayEvaluation = {
    pathway: "openSpace",
    clauseRef: "C3D5(1)",
    satisfied: null,
    requirement: "Open space around the building (C3D5(1)).",
    missing: null,
  };
  const pathwayB: PathwayEvaluation = {
    pathway: "sprinklerPerimeter",
    clauseRef: "C3D5(2)",
    satisfied: null,
    requirement: "Sprinklers to Specification 17 + perimeter vehicular access (C3D5(2)).",
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

  // Safe degradation: never assess a concession against unverified thresholds.
  if (![areaCap, volumeCap, openSpaceMinV, accessWidthV, accessDistV].every(isUsable)) {
    return insufficientInput({
      check: "LargeIsolated",
      clauseRef: "C3D4",
      detail: baseDetail,
      summary: "Large-isolated concession cannot be assessed: C3D4 caps / C3D5 geometry are unverified.",
      inputSnapshot,
      ...(compartmentId ? { compartmentId } : {}),
    });
  }

  const areaCapM2 = areaCap.value as number;
  const volumeCapM3 = volumeCap.value as number;
  const openSpaceMin = openSpaceMinV.value as number;
  const accessWidth = accessWidthV.value as number;
  const accessDist = accessDistV.value as number;

  const withinCaps = floorAreaM2 <= areaCapM2 && volumeM3 <= volumeCapM3;
  const isClass7or8 = ["7a", "7b", "8"].includes(input.buildingClass);
  const storeysOk = input.riseInStoreys <= 2;

  // ── Pathway A — open space (C3D5(1)) ──────────────────────────────────────
  pathwayA.requirement = `Class 7/8, ≤ 2 storeys, ≤ ${areaCapM2} m² / ${volumeCapM3} m³, and open space ≥ ${openSpaceMin} m around the building.`;
  const aPreconditionFails: string[] = [];
  if (!isClass7or8) aPreconditionFails.push("building is not Class 7 or 8");
  if (!storeysOk) aPreconditionFails.push(`rise in storeys ${input.riseInStoreys} exceeds 2`);
  if (!withinCaps) aPreconditionFails.push(`exceeds the ${areaCapM2} m² / ${volumeCapM3} m³ caps`);
  if (aPreconditionFails.length > 0) {
    pathwayA.satisfied = false;
    pathwayA.missing = `Open-space pathway unavailable: ${aPreconditionFails.join("; ")}.`;
  } else if (input.openSpaceAroundBuildingM == null) {
    pathwayA.satisfied = null;
    pathwayA.missing = "Open-space width around the building not provided.";
  } else if (input.openSpaceAroundBuildingM >= openSpaceMin) {
    pathwayA.satisfied = true;
  } else {
    pathwayA.satisfied = false;
    pathwayA.missing = `Open space ${input.openSpaceAroundBuildingM} m is less than the required ${openSpaceMin} m.`;
  }

  // ── Pathway B — sprinklers + perimeter access (C3D5(2)), no size cap ───────
  pathwayB.requirement = `Sprinklered throughout to Specification 17, plus continuous ≥ ${accessWidth} m vehicle access whose far side is ≤ ${accessDist} m from the building (C3D5(2)). No size limit.`;
  const { sprinkleredToSpec17: sp, perimeterAccess6mWide: aw, perimeterAccessWithin18m: ad } = input;
  const bNeedsAnswer = sp == null || aw == null || (aw === true && ad == null);
  if (bNeedsAnswer) {
    pathwayB.satisfied = null;
    pathwayB.missing = "Answer the sprinkler and perimeter-access questions.";
  } else {
    const accessOk = aw === true && ad === true;
    pathwayB.satisfied = sp === true && accessOk;
    if (!pathwayB.satisfied) {
      const miss: string[] = [];
      if (!sp) miss.push("not sprinklered throughout to Specification 17");
      if (!aw) miss.push(`no continuous ≥ ${accessWidth} m access around the building`);
      else if (!ad) miss.push(`access is not within ${accessDist} m of the building`);
      pathwayB.missing = `Requires ${miss.join(" and ")}.`;
    }
  }

  const satisfiedPathway: LargeIsolatedPathway | null = pathwayA.satisfied
    ? "openSpace"
    : pathwayB.satisfied
    ? "sprinklerPerimeter"
    : null;

  const detail: LargeIsolatedDetail = {
    ...baseDetail,
    eligible: withinCaps,
    areaCapM2,
    volumeCapM3,
    satisfiedPathway,
  };

  if (satisfiedPathway) {
    const label = satisfiedPathway === "openSpace" ? "open space (C3D5(1))" : "sprinklers + perimeter access (C3D5(2))";
    return complianceResult<LargeIsolatedDetail>({
      check: "LargeIsolated",
      status: "complies",
      detail,
      clauseRef: "C3D4",
      pathway: `C3D4 large-isolated, ${label}`,
      summary: `Qualifies for the C3D4 large-isolated concession via the ${label} pathway.`,
      inputSnapshot,
      usesUnverifiedData: false,
      ...(compartmentId ? { compartmentId } : {}),
    });
  }

  // Neither satisfied. Still-open questions ⇒ insufficient-input; else fails.
  if (pathwayA.satisfied === null || pathwayB.satisfied === null) {
    return insufficientInput({
      check: "LargeIsolated",
      clauseRef: "C3D4",
      detail,
      summary: "C3D4 concession not yet resolved — answer the open-space and/or sprinkler + perimeter-access questions.",
      inputSnapshot,
      usesUnverifiedData: false,
      ...(compartmentId ? { compartmentId } : {}),
    });
  }

  return complianceResult<LargeIsolatedDetail>({
    check: "LargeIsolated",
    status: "fails",
    detail,
    clauseRef: "C3D4",
    summary: "Does not qualify for the C3D4 concession by either pathway — subdivision is required.",
    inputSnapshot,
    usesUnverifiedData: false,
    ...(compartmentId ? { compartmentId } : {}),
  });
};
