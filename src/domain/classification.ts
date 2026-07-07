/**
 * "Not sure — help me classify" questionnaire logic (NCC Part A6, indicative).
 *
 * Pure and React-free: maps a short set of questionnaire answers to a building
 * class, whether that class is in this tool's scope, and a plain-language
 * rationale. This is an INDICATIVE aid only — Part A6 classification is the
 * certifier's call; the tool never treats this as a verified determination.
 *
 * The Part A6 use → class associations encoded here (in-scope classes only):
 *   Class 5  — professional / commercial offices.
 *   Class 7a — carpark.
 *   Class 7b — storage / warehouse / wholesale.
 *   Class 8  — factory / manufacturing / processing / laboratory (producing,
 *              altering, processing, assembling or packing goods).
 * Out-of-scope uses are named where known (shop/retail/café → Class 6;
 * health/assembly/aged-care → Class 9; residential → Class 1–4) but are never
 * assessed.
 *
 * Dominant/ancillary rule (Part A6): a building with more than one use is
 * classified by its MAJOR (dominant) use; a minor use that is ancillary to
 * (serves) the major use takes the major use's class. Only uses genuinely
 * separated by a fire wall into separate compartments are classified
 * separately.
 */

import type { BuildingClass } from "./building.ts";
import { isInScope } from "./building.ts";

/** A single use the questionnaire can offer as a primary or secondary use. */
export type ClassifyUse =
  | "storage"
  | "office"
  | "manufacturing"
  | "processing"
  | "carpark"
  | "shop"
  | "health"
  | "residential"
  | "other";

/** The answers the questionnaire collects. */
export interface ClassifyAnswers {
  /** The building's primary (or only) use. */
  primaryUse: ClassifyUse;
  /** A second, distinct use, or `null` when the building has a single use. */
  secondaryUse: ClassifyUse | null;
  /**
   * When two uses are present: are they separated by a fire-rated wall into
   * separate compartments? `null` = not yet answered.
   */
  separatedByFireWall: boolean | null;
  /**
   * When two uses are present and NOT fire-separated: which is the major
   * (dominant) use? `null` = let the tool infer (or ask).
   */
  dominantUse: "primary" | "secondary" | null;
}

/** The indicative classification result. */
export interface ClassifyResult {
  /** The class the answers point to, or `null` when it can't be determined. */
  buildingClass: BuildingClass | null;
  /** Whether that class is one this tool assesses (Class 5, 7a, 7b, 8). */
  inScope: boolean;
  /** Plain-language explanation of how the class was reached. */
  rationale: string;
  /**
   * Two distinct uses that ARE fire-wall separated — the caller should preload
   * them as separate compartments (a follow-up task). `buildingClass` then holds
   * the dominant/primary compartment's class for the class field.
   */
  separateCompartments: boolean;
}

interface UseInfo {
  /** The representable NCC 5–9 class for this use, or `null` if not representable. */
  cls: BuildingClass | null;
  /** Rationale phrase, e.g. "storage, warehousing or wholesale display of goods". */
  phrase: string;
  /** When `cls` is `null`: is the class family known (out of scope) or genuinely undetermined? */
  knownOutOfScope: boolean;
  /** When `cls` is `null` and `knownOutOfScope`: how to name the class family in prose. */
  outOfScopeLabel: string;
}

const USE_INFO: Record<ClassifyUse, UseInfo> = {
  storage: { cls: "7b", phrase: "storage, warehousing or wholesale display of goods", knownOutOfScope: false, outOfScopeLabel: "" },
  office: { cls: "5", phrase: "professional or commercial offices", knownOutOfScope: false, outOfScopeLabel: "" },
  manufacturing: { cls: "8", phrase: "a factory — manufacturing goods", knownOutOfScope: false, outOfScopeLabel: "" },
  processing: { cls: "8", phrase: "processing, assembling, altering, repairing or packing goods (or a laboratory)", knownOutOfScope: false, outOfScopeLabel: "" },
  carpark: { cls: "7a", phrase: "a carpark", knownOutOfScope: false, outOfScopeLabel: "" },
  shop: { cls: "6", phrase: "a shop, retail sale or café", knownOutOfScope: false, outOfScopeLabel: "" },
  health: { cls: null, phrase: "health-care, public assembly or aged-care", knownOutOfScope: true, outOfScopeLabel: "a Class 9 building" },
  residential: { cls: null, phrase: "residential accommodation", knownOutOfScope: true, outOfScopeLabel: "a residential class (Class 1–4)" },
  other: { cls: null, phrase: "a use that isn’t listed", knownOutOfScope: false, outOfScopeLabel: "" },
};

/** Classify a building whose whole (or dominant) use is `use`. */
function singleUseResult(use: ClassifyUse): ClassifyResult {
  const info = USE_INFO[use];
  if (info.cls !== null) {
    const inScope = isInScope(info.cls);
    const rationale = inScope
      ? `Under NCC Part A6, a building used for ${info.phrase} is a Class ${info.cls} building.`
      : `Under NCC Part A6, a building used for ${info.phrase} is a Class ${info.cls} building — outside this tool’s scope (it assesses Class 5, 7a, 7b and 8 only).`;
    return { buildingClass: info.cls, inScope, rationale, separateCompartments: false };
  }
  if (info.knownOutOfScope) {
    return {
      buildingClass: null,
      inScope: false,
      rationale: `Under NCC Part A6, a building used for ${info.phrase} is ${info.outOfScopeLabel} — outside this tool’s scope. Choose the class manually above.`,
      separateCompartments: false,
    };
  }
  return {
    buildingClass: null,
    inScope: false,
    rationale: `That use doesn’t map to one of the classes this tool covers (Class 5, 7a, 7b or 8). Choose the class manually above, or check NCC Part A6.`,
    separateCompartments: false,
  };
}

const isProduction = (use: ClassifyUse): boolean => use === "manufacturing" || use === "processing";

/**
 * Resolve which of two uses is the major (dominant) use, or `null` when it can't
 * be decided without asking. An explicit `dominantUse` answer wins; otherwise the
 * two same-class shortcut applies, then the A6 inference that on-site
 * manufacturing/processing (Class 8) dominates storage that serves it.
 */
function resolveDominant(a: ClassifyAnswers): ClassifyUse | null {
  const { primaryUse, secondaryUse, dominantUse } = a;
  if (secondaryUse === null) return primaryUse;
  if (dominantUse === "primary") return primaryUse;
  if (dominantUse === "secondary") return secondaryUse;

  // Both uses land on the same class ⇒ dominance is moot.
  const pc = USE_INFO[primaryUse].cls;
  const sc = USE_INFO[secondaryUse].cls;
  if (pc !== null && pc === sc) return primaryUse;

  // Ancillary inference: storage that serves on-site production is ancillary to
  // the production use (the user's warehouse-feeds-manufacturing example ⇒ Class 8).
  if (isProduction(primaryUse) && secondaryUse === "storage") return primaryUse;
  if (isProduction(secondaryUse) && primaryUse === "storage") return secondaryUse;

  return null;
}

/** Map questionnaire answers to an indicative Part A6 classification. */
export function classifyFromAnswers(a: ClassifyAnswers): ClassifyResult {
  const { primaryUse, secondaryUse } = a;

  // One use (or the "second use" is the same use) ⇒ a straight single-use lookup.
  if (secondaryUse === null || secondaryUse === primaryUse) {
    return singleUseResult(primaryUse);
  }

  // Two distinct uses separated by a fire wall ⇒ classified separately (A6).
  // Report the dominant/primary compartment's class for the class field and flag
  // that both parts will be entered as separate compartments.
  if (a.separatedByFireWall === true) {
    const dominant = resolveDominant(a) ?? primaryUse;
    const other = dominant === primaryUse ? secondaryUse : primaryUse;
    const base = singleUseResult(dominant);
    return {
      buildingClass: base.buildingClass,
      inScope: base.inScope,
      rationale: `The two uses are separated by a fire-rated wall, so under NCC Part A6 each compartment is classified on its own. ${base.rationale} The ${USE_INFO[other].phrase} part will be entered as a separate compartment.`,
      separateCompartments: true,
    };
  }

  // Two uses, and we don't yet know whether a fire wall separates them.
  if (a.separatedByFireWall === null) {
    return {
      buildingClass: null,
      inScope: false,
      rationale: `You’ve given two uses (${USE_INFO[primaryUse].phrase} and ${USE_INFO[secondaryUse].phrase}). Say whether they’re separated by a fire-rated wall so the class can be worked out.`,
      separateCompartments: false,
    };
  }

  // Two uses NOT fire-separated ⇒ one classification by the major (dominant) use;
  // the minor use is ancillary and takes the dominant use's class (A6).
  const dominant = resolveDominant(a);
  if (dominant === null) {
    return {
      buildingClass: null,
      inScope: false,
      rationale: `The building has two uses that aren’t fire-separated, so under NCC Part A6 it’s classified by its major (dominant) use. Tell us which use is dominant, or choose the class manually above.`,
      separateCompartments: false,
    };
  }
  const ancillary = dominant === primaryUse ? secondaryUse : primaryUse;
  const base = singleUseResult(dominant);
  return {
    buildingClass: base.buildingClass,
    inScope: base.inScope,
    rationale: `${base.rationale} The ${USE_INFO[ancillary].phrase} use is ancillary to (serves) the dominant ${USE_INFO[dominant].phrase} use, so under NCC Part A6 it takes the dominant use’s class.`,
    separateCompartments: false,
  };
}
