import type { ConstructionType } from "../domain/building.ts";
import { isUsable } from "../domain/ncc-value.ts";
import type { C2D2Band } from "../data/schema.ts";
import type {
  ComplianceResult,
  TypeLever,
  TypeOfConstructionDetail,
} from "../domain/result.ts";
import { insufficientInput, snapshotFor } from "./result-helpers.ts";
import type { RuleFn } from "./types.ts";

/**
 * WS-1 · Type of construction (Table C2D2).
 *
 * Determines the required minimum Type A/B/C from `(Class, rise in storeys)` via
 * Table C2D2, then derives the "less-onerous Type achievable?" analysis (brief
 * §6.3). The analysis is built ONLY from real levers:
 *  - **Reduce rise in storeys** — computed by RE-LOOKING-UP Table C2D2 at each
 *    lower rise. This is the correctness directive: never brute-force C→B→A;
 *    always ask the table what a reduced rise actually requires.
 *  - **Concessions C2D5/C2D6** — surfaced with their clause but NO computed
 *    effect: their applicability and effect are NCC content this tool has not
 *    verified, so `resultingType` stays null with a verify note (brief §9).
 *
 * Status note: type-of-construction is a DETERMINATION, not a pass/fail — the
 * tool takes no "as-built type" input to test against. A resolved determination
 * is reported with the neutral `determined` status (here is the required minimum
 * Type), never `complies` (which would imply a compliance verdict we did not
 * perform) nor `advisory` (reserved for the §6.8 cross-reference family).
 *
 * Until Table C2D2 is verified for the class, degrades to `insufficient-input`.
 */

/** Onerousness rank: Type A (most fire-resistant) is most onerous, Type C least. */
const ONEROUSNESS: Record<ConstructionType, number> = { A: 3, B: 2, C: 1 };

/** Least-onerous Type — no Type is less onerous than this, so no reduce-rise lever below it. */
const LEAST_ONEROUS: ConstructionType = "C";

/** Match a rise in storeys to its required Type from an ordered C2D2 band list. */
function matchType(bands: C2D2Band[], rise: number): ConstructionType | null {
  const band = bands.find(
    (b) => rise >= b.minRiseInStoreys && rise <= b.maxRiseInStoreys,
  );
  return band ? band.requiredType : null;
}

/**
 * Build the reduce-rise levers: for each distinct less-onerous Type reachable by
 * lowering the rise, record the SMALLEST reduction (highest rise) that reaches
 * it. Every candidate Type comes from a real C2D2 re-lookup — not an assumed
 * C→B→A ladder.
 */
function reduceRiseLevers(
  bands: C2D2Band[],
  rise: number,
  requiredType: ConstructionType,
): TypeLever[] {
  const levers: TypeLever[] = [];
  const captured = new Set<ConstructionType>();
  // Descend from one storey below the current rise; the first rise that yields a
  // given less-onerous Type is the least reduction needed to reach it.
  for (let r = rise - 1; r >= 1; r--) {
    const t = matchType(bands, r);
    if (t === null) continue;
    if (ONEROUSNESS[t] < ONEROUSNESS[requiredType] && !captured.has(t)) {
      captured.add(t);
      levers.push({
        lever: `Reduce rise in storeys to ${r}`,
        clauseRef: "C2D2",
        resultingType: t,
        note: `At rise ${r}, Table C2D2 requires Type ${t} (less onerous than Type ${requiredType}).`,
      });
    }
  }
  return levers;
}

/**
 * Surface the NCC concessions as levers WITHOUT computing their effect. Applies
 * only when the required Type is more onerous than the least (something to
 * reduce). Effect is unverified — `resultingType` is null with a verify note.
 */
function concessionLevers(requiredType: ConstructionType): TypeLever[] {
  if (ONEROUSNESS[requiredType] <= ONEROUSNESS[LEAST_ONEROUS]) return [];
  return (["C2D5", "C2D6"] as const).map((clause) => ({
    lever: `Assess concession ${clause}`,
    clauseRef: clause,
    resultingType: null,
    note: `Concession ${clause} may permit a less-onerous outcome for some classes; its applicability and effect are unverified NCC content — confirm against the licensed NCC 2022 Volume One.`,
  }));
}

export const assessTypeOfConstruction: RuleFn<TypeOfConstructionDetail> = (ctx) => {
  const { input } = ctx;
  const rise = input.riseInStoreys;
  const inputSnapshot = snapshotFor(input, "buildingClass", "riseInStoreys");
  const c2d2Value = ctx.data.c2d2[input.buildingClass];

  // Safe degradation: unverified/null C2D2 for this class ⇒ cannot determine Type.
  if (!isUsable(c2d2Value)) {
    return insufficientInput({
      check: "TypeOfConstruction",
      clauseRef: "C2D2",
      tableRef: "Table C2D2",
      detail: { requiredType: null, riseInStoreys: rise, levers: [] },
      summary:
        "Type of construction cannot be determined: Table C2D2 values are unverified.",
      inputSnapshot,
    });
  }

  const bands = c2d2Value.value;
  const requiredType = matchType(bands, rise);

  // Table IS verified but no band covers this rise ⇒ an out-of-range INPUT, not
  // unverified data. Still insufficient-input (cannot decide), but no unverified
  // value was touched, so it must not raise the DRAFT banner.
  if (requiredType === null) {
    return insufficientInput({
      check: "TypeOfConstruction",
      clauseRef: "C2D2",
      tableRef: "Table C2D2",
      detail: { requiredType: null, riseInStoreys: rise, levers: [] },
      summary: `Type of construction cannot be determined: rise in storeys ${rise} is outside every Table C2D2 band for Class ${input.buildingClass}.`,
      inputSnapshot,
      usesUnverifiedData: false,
    });
  }

  const levers: TypeLever[] = [
    ...reduceRiseLevers(bands, rise, requiredType),
    ...concessionLevers(requiredType),
  ];

  const detail: TypeOfConstructionDetail = {
    requiredType,
    riseInStoreys: rise,
    levers,
  };

  const result: ComplianceResult<TypeOfConstructionDetail> = {
    check: "TypeOfConstruction",
    status: "determined",
    detail,
    clauseRef: "C2D2",
    tableRef: "Table C2D2",
    summary: `Required minimum Type of construction: Type ${requiredType} (Table C2D2, Class ${input.buildingClass}, rise ${rise}).`,
    inputSnapshot,
    usesUnverifiedData: false,
  };
  return result;
};
