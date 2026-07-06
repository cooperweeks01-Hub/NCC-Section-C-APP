import { isInScope } from "../domain/building.ts";
import type { BuildingInput, ConstructionType } from "../domain/building.ts";
import type { NccDataLayer } from "../data/schema.ts";
import type {
  AdvisoryDetail,
  AnyComplianceResult,
  ComplianceResult,
  FlagDetail,
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
  requiredType: ConstructionType | null;
  results: AnyComplianceResult[];
}

export function assessProject(input: BuildingInput, data: NccDataLayer): Assessment {
  const inScope = isInScope(input.buildingClass);
  const typeResult = assessTypeOfConstruction({ input, data });
  const requiredType = typeResult.detail.requiredType;
  const results: AnyComplianceResult[] = [typeResult];

  // Out of scope: the type result already says so; nothing else is assessed.
  if (!inScope) return { inScope, requiredType, results };

  for (const compartment of input.compartments) {
    const size = assessCompartmentSize({ input, data, compartment, requiredType });
    results.push(size);
    // Ask the C3D4 sprinkler question ONLY when the compartment exceeds C3D3.
    if (size.detail.routedToLargeIsolated) {
      results.push(assessLargeIsolated({ input, data, compartment }));
    }
    results.push(assessSetbackSeparation({ input, data, compartment, requiredType }));
  }

  results.push(assessFrlSchedule({ input, data, requiredType }));
  results.push(...knockOnFlags(input));
  results.push(...advisories(input));

  return { inScope, requiredType, results };
}

/** §6.9 knock-on flags — flag + cite only, never computed. */
function knockOnFlags(input: BuildingInput): ComplianceResult<FlagDetail>[] {
  const snapshot = { effectiveHeightM: input.effectiveHeightM, perimeterVehicularAccess: input.perimeterVehicularAccess };
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

  if (input.perimeterVehicularAccess === true) {
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
