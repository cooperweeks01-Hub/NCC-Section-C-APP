import type {
  BuildingElement,
  BuildingInput,
  ConstructionType,
  FRL,
} from "./building.ts";

/**
 * ComplianceResult and the per-check detail types — the frozen output contract
 * (brief §4 "Traceability is structural", scaffold §6).
 *
 * Every deterministic rule returns a `ComplianceResult` carrying its clause
 * reference, the input snapshot it was computed from, and whether any unverified
 * NCC value was involved. The PDF and UI are pure renderings of these objects —
 * no number renders without a citation attached.
 *
 * IMPORTANT (brief §11 guardrail): `ComplianceResult<T>` is generic, but every
 * rule returns a NAMED, CONCRETE detail type below — never `unknown`. Phase B
 * subagents import these; they do not invent their own detail shapes.
 */

/** Which check produced a result. */
export type CheckName =
  | "TypeOfConstruction"
  | "CompartmentSize"
  | "LargeIsolated"
  | "SetbackSeparation"
  | "FrlSchedule"
  | "KnockOnFlag"
  | "Advisory";

/**
 * Result status.
 *
 * - `complies` / `fails` — a genuine pass/fail check that compares an input
 *   against an NCC limit (e.g. compartment size vs Table C3D3).
 * - `determined` — a pure LOOKUP/DETERMINATION that has no pass/fail because the
 *   tool takes no user value to test against (e.g. type of construction resolves
 *   the *required* Type from Table C2D2). Reporting it as `complies` would imply
 *   a verdict that was never performed; `advisory` would collide with the §6.8
 *   cross-reference family below. This is its own neutral state.
 * - `advisory` — a §6.8 cross-reference / guidance result (`AdvisoryDetail`).
 * - `flag` — a §6.9 knock-on flag (`FlagDetail`).
 * - `insufficient-input` — the safe-degradation state: a required input is
 *   missing OR a required NCC value is unverified/null. The engine must return
 *   this rather than guessing or defaulting (brief §9).
 */
export type ResultStatus =
  | "complies"
  | "fails"
  | "determined"
  | "advisory"
  | "flag"
  | "insufficient-input";

/** A single lever in the "less-onerous Type achievable?" analysis (brief §6.3). */
export interface TypeLever {
  /** What the designer would change, e.g. "Reduce rise in storeys to 2". */
  lever: string;
  /** The clause that authorises this lever, e.g. "C2D2" or "C2D5". */
  clauseRef: string;
  /** The Type achieved if the lever is applied; null if unverified/unknown. */
  resultingType: ConstructionType | null;
  /** Optional explanatory note. */
  note?: string;
}

/** Detail for the Type-of-construction check (Table C2D2). */
export interface TypeOfConstructionDetail {
  /** Minimum required Type from Table C2D2 for (Class, rise). Null if unverified. */
  requiredType: ConstructionType | null;
  riseInStoreys: number;
  /**
   * The less-onerous analysis — each real lever, its clause, and its effect.
   * Derived only from Table C2D2 re-lookups and real concessions; never an
   * ad-hoc C→B→A brute force (brief §6.3 correctness directive).
   */
  levers: TypeLever[];
}

/** A computed subdivision option when a compartment exceeds Table C3D3. */
export interface SubdivideOption {
  /** Authorising clauses for fire-wall subdivision. */
  clauseRef: string;
  /** Number of sub-compartments needed to comply; null if unverified. */
  targetCompartmentCount: number | null;
  /** Max floor area per sub-compartment to comply (m²); null if unverified. */
  targetMaxFloorAreaM2: number | null;
  /** Fire-wall FRL required for the subdivision (Spec 5); null if unverified. */
  requiredFireWallFrl: FRL | null;
  /** Clause for opening protection in the new fire wall. */
  openingProtectionClauseRef: string;
  note: string;
}

/** One of the two C3D4 large-isolated pathways. */
export type LargeIsolatedPathway = "openSpace" | "sprinklerPerimeter";

/** Evaluation of a single large-isolated pathway (C3D5(1) or C3D5(2)). */
export interface PathwayEvaluation {
  pathway: LargeIsolatedPathway;
  clauseRef: string;
  /** Whether inputs satisfy the pathway; null if inputs/values insufficient. */
  satisfied: boolean | null;
  /** Human-readable requirement, e.g. "≥ 18 m open space around the building". */
  requirement: string;
  /** What is missing if not satisfied; null if satisfied or indeterminate. */
  missing: string | null;
}

/** Detail for the C3D4 large-isolated-building assessment. */
export interface LargeIsolatedDetail {
  clauseRef: string;
  /**
   * Eligible for the concession at all: floorArea ≤ cap AND volume ≤ cap.
   * Null while the caps are unverified (do not compute against untrusted caps).
   */
  eligible: boolean | null;
  /** Concession caps (C3D4); null until verified. Headline figures in `source`. */
  areaCapM2: number | null;
  volumeCapM3: number | null;
  floorAreaM2: number;
  volumeM3: number;
  /** Pathway A — open space, C3D5(1). */
  pathwayA: PathwayEvaluation;
  /** Pathway B — Spec 17 sprinklers + perimeter vehicular access, C3D5(2). */
  pathwayB: PathwayEvaluation;
  /** The pathway the inputs satisfy, if any. */
  satisfiedPathway: LargeIsolatedPathway | null;
}

/** Detail for the compartment-size check (Table C3D3). */
export interface CompartmentSizeDetail {
  compartmentId: string;
  floorAreaM2: number;
  volumeM3: number;
  /** Limits from Table C3D3 for (Class, Type); null until verified. */
  maxFloorAreaM2: number | null;
  maxVolumeM3: number | null;
  /** Per-criterion pass; null when the limit is unverified (cannot decide). */
  areaWithinLimit: boolean | null;
  volumeWithinLimit: boolean | null;
  /** Computed subdivision option, present when the compartment exceeds a limit. */
  subdivide?: SubdivideOption;
  /** True when this compartment routes into the C3D4 large-isolated assessment. */
  routedToLargeIsolated: boolean;
}

/** External-wall FRL required by distance to fire-source feature (Spec 5). */
export interface ExternalWallFrlResult {
  wallId: string;
  wallName: string;
  distanceToFireSourceFeatureM: number;
  /** Required external-wall FRL for the distance band; null until verified. */
  requiredExtWallFrl: FRL | null;
  clauseRef: string;
  /** Opening separation when this wall faces an adjacent compartment. */
  openingSeparation?: OpeningSeparationResult;
}

/** Opening separation between adjacent compartments across a fire wall (C4D4). */
export interface OpeningSeparationResult {
  clauseRef: string;
  tableRef: string;
  /** Required separation distance (m); null until Table C4D4 is verified. */
  requiredSeparationM: number | null;
  /** The ≥60/60/60 + protected-openings (C4D5) exemption; null if indeterminate. */
  exemptionApplies: boolean | null;
  note: string;
}

/** Detail for the setback / separation check (Spec 5 + C4D4). */
export interface SetbackDetail {
  walls: ExternalWallFrlResult[];
}

/** One line of the FRL schedule (Spec 5), per building element. */
export interface FrlScheduleLine {
  element: BuildingElement;
  /** FRL for this element and Type; null until Spec 5 is verified. */
  frl: FRL | null;
  clauseRef: string;
  usesUnverifiedData: boolean;
}

/** Detail for the FRL schedule (Spec 5). */
export interface FrlScheduleDetail {
  /** Null when upstream type of construction is unverified — never defaulted (brief §9). */
  type: ConstructionType | null;
  lines: FrlScheduleLine[];
}

/** Detail for a knock-on advisory flag (brief §6.9 — flag + cite, not computed). */
export interface FlagDetail {
  trigger: string;
  guidance: string;
  /** External standard/source, e.g. "AS 2419.1", "Part E1 / E1D5". */
  source: string;
}

/** Detail for an advisory cross-reference (brief §6.8 — guidance, not pass/fail). */
export interface AdvisoryDetail {
  topic: string;
  guidance: string;
  clauseRef: string;
}

/** Union of every concrete detail type a result may carry. */
export type ResultDetail =
  | TypeOfConstructionDetail
  | CompartmentSizeDetail
  | LargeIsolatedDetail
  | SetbackDetail
  | FrlScheduleDetail
  | FlagDetail
  | AdvisoryDetail;

/**
 * The traceable result object every rule returns. Generic over its concrete
 * detail type (defaults to the union for storage/rendering).
 */
export interface ComplianceResult<TDetail extends ResultDetail = ResultDetail> {
  check: CheckName;
  status: ResultStatus;
  /** Concrete, per-check detail. Never `unknown`. */
  detail: TDetail;
  /** The governing clause, e.g. "C2D2", "C3D4", "Spec 5". Always present. */
  clauseRef: string;
  /** Governing table, e.g. "Table C3D3", when the result comes from a table. */
  tableRef?: string;
  /** The DTS pathway chosen, e.g. "C3D4 large-isolated, sprinklered". */
  pathway?: string;
  /** One-line human summary for the clause panel and PDF. */
  summary: string;
  /** Snapshot of the inputs this result was computed from (traceability). */
  inputSnapshot: Partial<BuildingInput>;
  /**
   * True if any NCC value touched by this result is unverified. Drives the
   * DRAFT — unverified banner in the UI and PDF. When true, `status` should be
   * `insufficient-input` unless the result is purely advisory/flag.
   */
  usesUnverifiedData: boolean;
  /** Scopes the result to a compartment for multi-compartment roll-up. */
  compartmentId?: string;
}

/** Any result, regardless of detail — the storage/rendering shape. */
export type AnyComplianceResult = ComplianceResult<ResultDetail>;
