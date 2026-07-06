import { isInScope } from "../domain/building.ts";
import type { ConstructionType, ExternalWall } from "../domain/building.ts";
import { isUsable } from "../domain/ncc-value.ts";
import { frlGroupFor } from "../data/schema.ts";
import type {
  C4D4AngleBand,
  Spec5ExtWallBand,
  Spec5ExtWallElement,
} from "../data/schema.ts";
import type {
  ExternalWallFrlResult,
  OpeningSeparationResult,
  SetbackDetail,
} from "../domain/result.ts";
import { complianceResult, insufficientInput, snapshotFor } from "./result-helpers.ts";
import type { RuleContext, RuleFn } from "./types.ts";

/**
 * WS-3 · Setback / separation + external-wall FRL (Spec 5 + C4D4).
 *
 * Primary output (fully verified): the required external-wall FRL as a function
 * of distance to the fire-source feature (Spec 5). For each wall it selects the
 * loadbearing / non-loadbearing element (Type A/B) or the single "parts of
 * external walls" element (Type C), then matches the distance band `[min, max)`.
 *
 * Secondary (timeboxed): C4D4 opening separation by the angle between adjacent
 * walls. Computed only when the wall has openings AND an angle is supplied; there
 * is no adjacency graph in v1, so a missing angle leaves that sub-result null with
 * a note rather than guessing. The C4D5 exemption threshold is not in the verified
 * extract, so `exemptionApplies` stays null (cite-and-verify).
 *
 * Status: like type-of-construction, this DETERMINES a requirement (there is no
 * as-built FRL to pass/fail against), so a successful result is `determined`.
 */

/** Select the Spec 5 external-wall element for a wall (kind depends on Type). */
function pickElement(
  elements: Spec5ExtWallElement[],
  type: ConstructionType,
  loadbearing: boolean,
): Spec5ExtWallElement | undefined {
  if (type === "C") return elements.find((e) => e.kind === "any");
  return elements.find((e) => e.kind === (loadbearing ? "loadbearing" : "nonLoadbearing"));
}

/** Distance band predicate: `[min, max)` (matches the source "X to < Y"). */
function matchDistanceBand(bands: Spec5ExtWallBand[], distanceM: number) {
  return bands.find((b) => distanceM >= b.minDistanceM && distanceM < b.maxDistanceM);
}

/** Angle band predicate honouring each band's own inclusivity flags (C4D4). */
function matchAngleBand(bands: C4D4AngleBand[], angleDeg: number) {
  return bands.find((b) => {
    const lowerOk = b.minInclusive ? angleDeg >= b.minAngleDeg : angleDeg > b.minAngleDeg;
    const upperOk = b.maxInclusive ? angleDeg <= b.maxAngleDeg : angleDeg < b.maxAngleDeg;
    return lowerOk && upperOk;
  });
}

/** Compute the C4D4 opening separation for a wall with openings, if possible. */
function openingSeparationFor(
  ctx: RuleContext,
  wall: ExternalWall,
): OpeningSeparationResult | undefined {
  if (!wall.hasOpenings) return undefined;
  const base: OpeningSeparationResult = {
    clauseRef: "C4D4",
    tableRef: "Table C4D4",
    requiredSeparationM: null,
    exemptionApplies: null, // C4D5 threshold not in the verified extract — verify.
    note: `C4D5 exemption (≥60/60/60 walls + protected openings) may remove this — verify against ${ctx.data.c4d4.exemptionClauseRef}.`,
  };
  if (wall.angleToAdjacentOpeningDeg == null) {
    return { ...base, note: "Angle to the adjacent compartment's opening not supplied — C4D4 separation not computed. " + base.note };
  }
  if (!isUsable(ctx.data.c4d4.bands)) return base;
  const band = matchAngleBand(ctx.data.c4d4.bands.value, wall.angleToAdjacentOpeningDeg);
  if (!band) return base;
  return {
    ...base,
    requiredSeparationM: band.minSeparationM, // null ⇒ "Nil" (no requirement)
    note: `Angle ${wall.angleToAdjacentOpeningDeg}° (${band.description}) ⇒ ${band.minSeparationM == null ? "Nil" : band.minSeparationM + " m"} min separation. ` + base.note,
  };
}

export const assessSetbackSeparation: RuleFn<SetbackDetail> = (ctx) => {
  const { input, requiredType } = ctx;
  const c = ctx.compartment;
  const inputSnapshot = snapshotFor(input, "compartments");
  const compartmentId = c?.id;
  const walls = c?.externalWalls ?? [];

  const stubWalls: ExternalWallFrlResult[] = walls.map((w) => ({
    wallId: w.id,
    wallName: w.name,
    distanceToFireSourceFeatureM: w.distanceToFireSourceFeatureM,
    requiredExtWallFrl: null,
    clauseRef: "Spec 5",
  }));

  if (!c || !isInScope(input.buildingClass)) {
    return insufficientInput({
      check: "SetbackSeparation",
      clauseRef: "Spec 5",
      tableRef: "Table C4D4",
      detail: { walls: stubWalls },
      summary: !c
        ? "Setback cannot be assessed: no compartment supplied."
        : `Class ${input.buildingClass} is out of scope — setback not assessed.`,
      inputSnapshot,
      usesUnverifiedData: false,
      ...(compartmentId ? { compartmentId } : {}),
    });
  }
  const cls = input.buildingClass; // InScopeClass

  if (requiredType == null) {
    return insufficientInput({
      check: "SetbackSeparation",
      clauseRef: "Spec 5",
      tableRef: "Table C4D4",
      detail: { walls: stubWalls },
      summary: "Setback cannot be assessed: the required Type of construction is not yet determined.",
      inputSnapshot,
      usesUnverifiedData: false,
      ...(compartmentId ? { compartmentId } : {}),
    });
  }

  const elementsValue = ctx.data.spec5ExtWall[requiredType][frlGroupFor(cls)];
  if (!isUsable(elementsValue)) {
    return insufficientInput({
      check: "SetbackSeparation",
      clauseRef: "Spec 5",
      tableRef: "Table C4D4",
      detail: { walls: stubWalls },
      summary: "Setback cannot be assessed: Specification 5 external-wall values are unverified.",
      inputSnapshot,
      ...(compartmentId ? { compartmentId } : {}),
    });
  }
  const elements = elementsValue.value;

  const wallResults: ExternalWallFrlResult[] = walls.map((w) => {
    const element = pickElement(elements, requiredType, w.loadbearing);
    const band = element ? matchDistanceBand(element.bands, w.distanceToFireSourceFeatureM) : undefined;
    const result: ExternalWallFrlResult = {
      wallId: w.id,
      wallName: w.name,
      distanceToFireSourceFeatureM: w.distanceToFireSourceFeatureM,
      requiredExtWallFrl: band ? band.frl : null,
      clauseRef: element ? element.clauseRef : "Spec 5",
    };
    const sep = openingSeparationFor(ctx, w);
    if (sep) result.openingSeparation = sep;
    return result;
  });

  return complianceResult<SetbackDetail>({
    check: "SetbackSeparation",
    status: "determined",
    detail: { walls: wallResults },
    clauseRef: "Spec 5",
    tableRef: "Table C4D4",
    summary: walls.length === 0
      ? "No external walls supplied for this compartment."
      : `Determined external-wall FRL for ${walls.length} wall${walls.length === 1 ? "" : "s"} (Type ${requiredType}, Spec 5, by distance to fire-source feature).`,
    inputSnapshot,
    usesUnverifiedData: false,
    ...(compartmentId ? { compartmentId } : {}),
  });
};
