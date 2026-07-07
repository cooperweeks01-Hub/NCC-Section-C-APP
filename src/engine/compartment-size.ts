import { isInScope } from "../domain/building.ts";
import type { ConstructionType, FRL, InScopeClass } from "../domain/building.ts";
import { isUsable } from "../domain/ncc-value.ts";
import { c3d3GroupFor, frlGroupFor } from "../data/schema.ts";
import type { NccDataLayer } from "../data/schema.ts";
import type { CompartmentSizeDetail, SubdivideOption } from "../domain/result.ts";
import { complianceResult, insufficientInput, snapshotFor } from "./result-helpers.ts";
import type { RuleFn } from "./types.ts";

/**
 * WS-2 · Compartment size (Table C3D3).
 *
 * Compares a compartment's floor area + volume against Table C3D3 for
 * (C3D3 class group, required Type). Behaviour (brief §6.4, verified extract):
 *  - **Carve-out first** (note 2): a sprinklered/open-deck carpark or open
 *    spectator stand is NOT size-checked — the C3D3 limit is skipped, not
 *    applied. Reported `complies` with the exemption cited.
 *  - Within both limits ⇒ `complies`, numbers shown.
 *  - Exceeds either ⇒ `fails`, with a computed subdivide option AND a flag to
 *    route into the C3D4 large-isolated assessment (run separately).
 *
 * Requires `ctx.compartment` and `ctx.requiredType`. Degrades safely if the Type
 * is undetermined or C3D3 is unverified.
 */

/** Pull the "Common walls and fire walls" FRL (Spec 5) for the subdivide option. */
function fireWallFrl(
  data: NccDataLayer,
  type: ConstructionType,
  cls: InScopeClass,
): FRL | null {
  const line = data.spec5Schedule[type][frlGroupFor(cls)].find((l) =>
    l.label.startsWith("Common walls and fire walls"),
  );
  return line && isUsable(line.frl) ? line.frl.value : null;
}

export const assessCompartmentSize: RuleFn<CompartmentSizeDetail> = (ctx) => {
  const { input, requiredType } = ctx;
  const c = ctx.compartment;
  const inputSnapshot = snapshotFor(input, "buildingClass", "compartments");
  const compartmentId = c?.id;

  const baseDetail: CompartmentSizeDetail = {
    compartmentId: c?.id ?? "",
    floorAreaM2: c?.floorAreaM2 ?? 0,
    volumeM3: c?.volumeM3 ?? 0,
    maxFloorAreaM2: null,
    maxVolumeM3: null,
    areaWithinLimit: null,
    volumeWithinLimit: null,
    routedToLargeIsolated: false,
  };

  // The class to assess against — the compartment's own class in a multi-class
  // building, else the building class.
  const assessClass = c?.buildingClass ?? ctx.assessClass ?? input.buildingClass;

  // Missing compartment / out-of-scope class ⇒ cannot assess (not a data problem).
  if (!c || !isInScope(assessClass)) {
    return insufficientInput({
      check: "CompartmentSize",
      clauseRef: "C3D3",
      tableRef: "Table C3D3",
      detail: baseDetail,
      summary: !c
        ? "Compartment size cannot be assessed: no compartment supplied."
        : `Class ${assessClass} is out of scope — compartment size not assessed.`,
      inputSnapshot,
      usesUnverifiedData: false,
      ...(compartmentId ? { compartmentId } : {}),
    });
  }
  const cls = assessClass; // narrowed to InScopeClass by isInScope

  // Carve-out (note 2): size check does not apply — skip C3D3 entirely.
  if (c.sizeExemption !== null) {
    const label: Record<typeof c.sizeExemption, string> = {
      sprinkleredCarpark: "sprinklered carpark",
      openDeckCarpark: "open-deck carpark",
      openSpectatorStand: "open spectator stand",
    };
    return complianceResult<CompartmentSizeDetail>({
      check: "CompartmentSize",
      status: "complies",
      detail: { ...baseDetail, sizeExemption: c.sizeExemption },
      // C3D2(1) "Application of Part" — C3D3/C3D4/C3D5 do not apply to a sprinklered
      // carpark (Spec 17, not FPAA101D/H), an open-deck carpark, or an open
      // spectator stand.
      clauseRef: "C3D2(1)",
      tableRef: "Table C3D3",
      summary: `Compartment "${c.name}" is exempt from the C3D3 size limit under C3D2(1) (${label[c.sizeExemption]}) — size check not applicable.`,
      inputSnapshot,
      usesUnverifiedData: false,
      ...(compartmentId ? { compartmentId } : {}),
    });
  }

  // Need the determined Type to look up the right C3D3 row.
  if (requiredType == null) {
    return insufficientInput({
      check: "CompartmentSize",
      clauseRef: "C3D3",
      tableRef: "Table C3D3",
      detail: baseDetail,
      summary:
        "Compartment size cannot be assessed: the required Type of construction is not yet determined.",
      inputSnapshot,
      usesUnverifiedData: false,
      ...(compartmentId ? { compartmentId } : {}),
    });
  }

  const cell = ctx.data.c3d3[c3d3GroupFor(cls)][requiredType];
  // Unverified limit ⇒ never compute against it (brief §9).
  if (!isUsable(cell.maxFloorAreaM2) || !isUsable(cell.maxVolumeM3)) {
    return insufficientInput({
      check: "CompartmentSize",
      clauseRef: "C3D3",
      tableRef: "Table C3D3",
      detail: baseDetail,
      summary: "Compartment size cannot be assessed: Table C3D3 limits are unverified.",
      inputSnapshot,
      ...(compartmentId ? { compartmentId } : {}),
    });
  }

  const maxArea = cell.maxFloorAreaM2.value;
  const maxVolume = cell.maxVolumeM3.value;
  const areaWithinLimit = c.floorAreaM2 <= maxArea;
  const volumeWithinLimit = c.volumeM3 <= maxVolume;
  const within = areaWithinLimit && volumeWithinLimit;

  const detail: CompartmentSizeDetail = {
    ...baseDetail,
    maxFloorAreaM2: maxArea,
    maxVolumeM3: maxVolume,
    areaWithinLimit,
    volumeWithinLimit,
    routedToLargeIsolated: !within,
  };

  if (within) {
    return complianceResult<CompartmentSizeDetail>({
      check: "CompartmentSize",
      status: "complies",
      detail,
      clauseRef: "C3D3",
      tableRef: "Table C3D3",
      summary: `Compartment "${c.name}" ${c.floorAreaM2} m² / ${c.volumeM3} m³ is within the Type ${requiredType} limits (${maxArea} m² / ${maxVolume} m³).`,
      inputSnapshot,
      usesUnverifiedData: false,
      ...(compartmentId ? { compartmentId } : {}),
    });
  }

  // Exceedance: compute a subdivide option and route to the C3D4 assessment.
  const count = Math.max(
    Math.ceil(c.floorAreaM2 / maxArea),
    Math.ceil(c.volumeM3 / maxVolume),
  );
  const subdivide: SubdivideOption = {
    clauseRef: "C3D8",
    targetCompartmentCount: count,
    targetMaxFloorAreaM2: maxArea,
    requiredFireWallFrl: fireWallFrl(ctx.data, requiredType, cls),
    openingProtectionClauseRef: "C4D6",
    note: `Subdivide into at least ${count} fire compartments (each ≤ ${maxArea} m² / ${maxVolume} m³) with fire walls, or qualify under the C3D4 large-isolated concession.`,
  };
  detail.subdivide = subdivide;

  const overs: string[] = [];
  if (!areaWithinLimit) overs.push(`area ${c.floorAreaM2} m² > ${maxArea} m²`);
  if (!volumeWithinLimit) overs.push(`volume ${c.volumeM3} m³ > ${maxVolume} m³`);

  return complianceResult<CompartmentSizeDetail>({
    check: "CompartmentSize",
    status: "fails",
    detail,
    clauseRef: "C3D3",
    tableRef: "Table C3D3",
    summary: `Compartment "${c.name}" exceeds the Type ${requiredType} C3D3 limit (${overs.join("; ")}). Subdivide or assess the C3D4 large-isolated concession.`,
    inputSnapshot,
    usesUnverifiedData: false,
    ...(compartmentId ? { compartmentId } : {}),
  });
};
