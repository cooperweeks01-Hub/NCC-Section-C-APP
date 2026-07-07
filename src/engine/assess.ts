import { isInScope } from "../domain/building.ts";
import type {
  BuildingClass,
  BuildingInput,
  Compartment,
  ConstructionType,
} from "../domain/building.ts";
import { isUsable } from "../domain/ncc-value.ts";
import { c3d3GroupFor } from "../data/schema.ts";
import type { NccDataLayer } from "../data/schema.ts";
import type {
  AdvisoryDetail,
  AnyComplianceResult,
  ComplianceResult,
  FlagDetail,
  TypeOfConstructionDetail,
  TypeTrial,
} from "../domain/result.ts";
import { complianceResult } from "./result-helpers.ts";
import { assessTypeOfConstruction } from "./type-of-construction.ts";
import { assessCompartmentSize } from "./compartment-size.ts";
import { assessLargeIsolated } from "./large-isolated.ts";
import { assessSetbackSeparation } from "./setback-separation.ts";
import { assessFrlSchedule } from "./frl-schedule.ts";

/**
 * Phase C · the assessment orchestrator — the single compliance entry point.
 *
 * Sequences the pure rules into a full traceable result set (brief §6):
 *   scope gate → type of construction → per compartment { size → (only if it
 *   exceeds) large-isolated → setback } → building-level FRL schedule →
 *   knock-on flags (§6.9) → advisory cross-references (§6.8).
 *
 * KEY UX rule (brief §6.2/§6.4): the C3D4 sprinkler question is asked ONLY at the
 * decision point — so `assessLargeIsolated` runs solely for compartments whose
 * size check set `routedToLargeIsolated`. A size-compliant compartment produces
 * no LargeIsolated result at all.
 *
 * Building-level results (type, FRL schedule, flags, advisories) carry no
 * `compartmentId`; per-compartment results do — so the set filters cleanly per
 * compartment for the multi-compartment roll-up.
 */
export interface Assessment {
  inScope: boolean;
  /** The C2D2 minimum required Type (from rise in storeys). */
  requiredType: ConstructionType | null;
  /** The Type the building is actually assessed at (≥ requiredType; upgrades apply). */
  effectiveType: ConstructionType | null;
  results: AnyComplianceResult[];
}

/** Onerousness rank: Type A (most fire-resistant) > B > C. */
const ONEROUSNESS: Record<ConstructionType, number> = { A: 3, B: 2, C: 1 };
/** Types in ascending onerousness. */
const TYPES_ASC: ConstructionType[] = ["C", "B", "A"];

/**
 * Does a compartment fit its C3D3 limit at `type`, against ITS OWN class? Exempt
 * (C3D2(1)) ⇒ always; out-of-scope class or unverified limit ⇒ null (unknown).
 */
function compartmentFitsAt(
  data: NccDataLayer,
  type: ConstructionType,
  c: Compartment,
  buildingClass: BuildingClass,
): boolean | null {
  const cls = c.buildingClass ?? buildingClass;
  if (!isInScope(cls)) return null;
  if (c.sizeExemption != null) return true;
  const cell = data.c3d3[c3d3GroupFor(cls)][type];
  if (!isUsable(cell.maxFloorAreaM2) || !isUsable(cell.maxVolumeM3)) return null;
  return c.floorAreaM2 <= cell.maxFloorAreaM2.value && c.volumeM3 <= cell.maxVolumeM3.value;
}

/** Do ALL compartments fit their (own-class) C3D3 limit at `type`? */
function allFitAt(data: NccDataLayer, type: ConstructionType, comps: Compartment[], buildingClass: BuildingClass): boolean {
  return comps.every((c) => compartmentFitsAt(data, type, c, buildingClass) === true);
}

export function assessProject(input: BuildingInput, data: NccDataLayer): Assessment {
  const inScope = isInScope(input.buildingClass);
  const typeResult = assessTypeOfConstruction({ input, data });
  const requiredMin = typeResult.detail.requiredType;

  // Effective Type: the C2D2 minimum, or a voluntary upgrade if it is MORE onerous.
  const override = input.constructionTypeOverride ?? null;
  const effectiveType: ConstructionType | null =
    requiredMin !== null && override !== null && ONEROUSNESS[override] >= ONEROUSNESS[requiredMin]
      ? override
      : requiredMin;

  // Escalation trial (C→B→A) + upgrade suggestion — building-wide, needs all
  // compartments. The required Type is building-wide because Table C2D2 is uniform
  // across Class 5–8 (a class-specific C2D2 would need per-class Type handling here).
  let typeTrials: TypeTrial[] | undefined;
  let sizeUpgradeSuggestion: ConstructionType | null = null;
  if (inScope && requiredMin !== null) {
    const trialTypes = TYPES_ASC.filter((t) => ONEROUSNESS[t] >= ONEROUSNESS[requiredMin]);
    typeTrials = trialTypes.map((t) => {
      const fit = allFitAt(data, t, input.compartments, input.buildingClass);
      return {
        type: t,
        allCompartmentsFit: fit,
        note: fit
          ? `All compartments fit the Type ${t} C3D3 limit.`
          : `A compartment exceeds the Type ${t} C3D3 limit.`,
      };
    });
    if (effectiveType !== null && !allFitAt(data, effectiveType, input.compartments, input.buildingClass)) {
      sizeUpgradeSuggestion =
        trialTypes.find((t) => ONEROUSNESS[t] > ONEROUSNESS[effectiveType] && allFitAt(data, t, input.compartments, input.buildingClass)) ?? null;
    }
  }

  const overriddenTo =
    effectiveType !== null && requiredMin !== null && ONEROUSNESS[effectiveType] > ONEROUSNESS[requiredMin]
      ? effectiveType
      : null;

  const enrichedType: ComplianceResult<TypeOfConstructionDetail> = {
    ...typeResult,
    detail: {
      ...typeResult.detail,
      effectiveType,
      overriddenTo,
      sizeUpgradeSuggestion,
      ...(typeTrials ? { typeTrials } : {}),
    },
    ...(overriddenTo
      ? { summary: `${typeResult.summary} Assessed at Type ${effectiveType} (upgraded from the required minimum Type ${requiredMin}).` }
      : {}),
  };

  const results: AnyComplianceResult[] = [enrichedType];

  // Out of scope: the type result already says so; nothing else is assessed.
  if (!inScope) return { inScope, requiredType: requiredMin, effectiveType, results };

  // Downstream rules assess at the EFFECTIVE Type (so an upgrade recomputes everything).
  for (const compartment of input.compartments) {
    const size = assessCompartmentSize({ input, data, compartment, requiredType: effectiveType });
    results.push(size);
    // Ask the C3D4 sprinkler question ONLY when the compartment exceeds C3D3.
    if (size.detail.routedToLargeIsolated) {
      results.push(assessLargeIsolated({ input, data, compartment }));
    }
    results.push(assessSetbackSeparation({ input, data, compartment, requiredType: effectiveType }));
  }

  // FRL schedule — one per DISTINCT class present (fire-separated multi-class);
  // a single-class building yields exactly one, as before.
  const distinctClasses = [...new Set(input.compartments.map((c) => c.buildingClass ?? input.buildingClass))];
  for (const cls of distinctClasses.length > 0 ? distinctClasses : [input.buildingClass]) {
    results.push(assessFrlSchedule({ input, data, requiredType: effectiveType, assessClass: cls }));
  }

  results.push(...knockOnFlags(input));
  results.push(...advisories(input));

  // C3D4(c): if the concession is used in a multi-part building, flag (do NOT
  // compute) the "buildings < 6 m apart are one building" consideration.
  if (results.some((r) => r.check === "LargeIsolated") && (input.fireWallsSeparateCompartments || input.compartments.length > 1)) {
    results.push(c3d4cFlag(input));
  }

  return { inScope, requiredType: requiredMin, effectiveType, results };
}

/** C3D4(c) — flag + cite only; whether it applies is a building-vs-compartment judgement. */
function c3d4cFlag(input: BuildingInput): ComplianceResult<FlagDetail> {
  return complianceResult<FlagDetail>({
    check: "KnockOnFlag",
    status: "flag",
    clauseRef: "C3D4(c)",
    detail: {
      trigger: "Large-isolated concession used in a multi-part building",
      guidance:
        "Consider C3D4(c): where there is more than one building on the allotment and they are closer than 6 m, they are regarded as one building and must COLLECTIVELY satisfy the large-isolated limits and the C3D5 open-space / vehicular-access requirements. Whether genuinely fire-separated parts are 'separate buildings' is a classification judgement — verify with your building surveyor whether C3D4(c) applies and, if so, that the open space / perimeter access extends around the whole ≤ 6 m group (including any part under the size threshold).",
      source: "NCC C3D4(c) / C3D5",
    },
    summary: "C3D4(c) consideration: parts within 6 m may be one building — verify the open-space/access extends to the whole group.",
    inputSnapshot: { fireWallsSeparateCompartments: input.fireWallsSeparateCompartments },
    usesUnverifiedData: false,
  });
}

/** §6.9 knock-on flags — flag + cite only, never computed. */
function knockOnFlags(input: BuildingInput): ComplianceResult<FlagDetail>[] {
  const snapshot = { effectiveHeightM: input.effectiveHeightM, perimeterAccess6mWide: input.perimeterAccess6mWide };
  const flags: ComplianceResult<FlagDetail>[] = [];

  if (input.effectiveHeightM > 25) {
    flags.push(
      complianceResult<FlagDetail>({
        check: "KnockOnFlag",
        status: "flag",
        clauseRef: "E1D5",
        detail: {
          trigger: `Effective height ${input.effectiveHeightM} m exceeds 25 m`,
          guidance: "A sprinkler system is required at effective height > 25 m. Verify against Part E1 (E1D5) with your fire consultant.",
          source: "NCC Part E1 / E1D5",
        },
        summary: `Sprinkler trigger: effective height ${input.effectiveHeightM} m > 25 m (E1D5) — verify.`,
        inputSnapshot: snapshot,
        usesUnverifiedData: false,
      }),
    );
  }

  if (input.perimeterAccess6mWide === true) {
    flags.push(
      complianceResult<FlagDetail>({
        check: "KnockOnFlag",
        status: "flag",
        clauseRef: "C3D5(2)",
        detail: {
          trigger: "Perimeter vehicular access relied upon",
          guidance: "Perimeter vehicular access and boundary setback interact with fire-hydrant coverage and appliance access. Verify against AS 2419.1 and Part E1 with your hydraulic/fire consultants.",
          source: "AS 2419.1",
        },
        summary: "Perimeter access / setback may affect fire-hydrant coverage — verify (AS 2419.1).",
        inputSnapshot: snapshot,
        usesUnverifiedData: false,
      }),
    );
  }

  return flags;
}

/** §6.8 advisory cross-references — guidance for the chosen class/type, not pass/fail. */
function advisories(input: BuildingInput): ComplianceResult<AdvisoryDetail>[] {
  const snapshot = { buildingClass: input.buildingClass };
  const items: { topic: string; guidance: string; clauseRef: string }[] = [
    {
      topic: "Fire hazard properties",
      guidance: "Linings, materials and assemblies must meet the fire hazard property requirements. Consider as part of the design.",
      clauseRef: "C2D11 / Specification 7",
    },
    {
      topic: "Non-combustibility of building elements",
      guidance: "Type A/B construction requires certain elements to be non-combustible. Confirm materials.",
      clauseRef: "C2D10",
    },
    {
      topic: "Protection of openings",
      guidance: "Openings in fire-rated elements require protection (doors, windows, service penetrations). Detail per Part C4.",
      clauseRef: "Part C4",
    },
  ];
  return items.map((a) =>
    complianceResult<AdvisoryDetail>({
      check: "Advisory",
      status: "advisory",
      clauseRef: a.clauseRef,
      detail: a,
      summary: `${a.topic} — also consider (${a.clauseRef}).`,
      inputSnapshot: snapshot,
      usesUnverifiedData: false,
    }),
  );
}
