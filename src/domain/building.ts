/**
 * Building input model — the "lever set" (brief §6.2, scaffold §6).
 *
 * These are the typed inputs the deterministic engine reads. No NCC values live
 * here; this is the user's building, not the code. All NCC thresholds live in the
 * data layer as `NccValue`s.
 */

/** Building classes the NCC defines in the 5–9 range (a fact — safe to encode). */
export type BuildingClass = "5" | "6" | "7a" | "7b" | "8" | "9a" | "9b" | "9c";

/** All NCC 5–9 classes, for iteration / UI enumeration. */
export const BUILDING_CLASSES: readonly BuildingClass[] = [
  "5",
  "6",
  "7a",
  "7b",
  "8",
  "9a",
  "9b",
  "9c",
] as const;

/**
 * The classes this tool actually assesses in v1. The verified NCC data extract
 * covers only these; every other class returns "out of scope — not assessed"
 * (never a guessed result). See `docs/ncc-section-c-data-verified.md`.
 */
export type InScopeClass = "5" | "7a" | "7b" | "8";

export const IN_SCOPE_CLASSES: readonly InScopeClass[] = ["5", "7a", "7b", "8"] as const;

/** Type guard: narrows a `BuildingClass` to an `InScopeClass`. */
export function isInScope(cls: BuildingClass): cls is InScopeClass {
  return (IN_SCOPE_CLASSES as readonly string[]).includes(cls);
}

/** Type of construction determined by Table C2D2. */
export type ConstructionType = "A" | "B" | "C";

export const CONSTRUCTION_TYPES: readonly ConstructionType[] = ["A", "B", "C"] as const;

/**
 * Fire Resistance Level — structural adequacy / integrity / insulation, in minutes
 * (scaffold §4). A component that has no requirement is `null` for that criterion
 * and renders as "–"; this is deliberately distinct from a numeric 0 so "no
 * requirement" is never confused with "zero minutes".
 */
export interface FRL {
  /** Structural adequacy, minutes. `null` => "–" (no requirement). */
  structural: number | null;
  /** Integrity, minutes. `null` => "–". */
  integrity: number | null;
  /** Insulation, minutes. `null` => "–". */
  insulation: number | null;
}

/**
 * C3D3 size-check carve-out (verified extract, note 2): the C3D3 compartment-size
 * limit does NOT apply to a sprinklered carpark, an open-deck carpark, or an open
 * spectator stand (C3D5(1)). This is a BRANCH, not a value — the size check is
 * skipped, not computed against the Type C limit.
 */
export type CompartmentSizeExemption =
  | "sprinkleredCarpark"
  | "openDeckCarpark"
  | "openSpectatorStand";

/** An external wall and its distance to the nearest fire-source feature. */
export interface ExternalWall {
  id: string;
  /** Label for the report, e.g. "North wall (to Smith St boundary)". */
  name: string;
  /**
   * Distance in metres to the fire-source feature governing this wall. Drives the
   * external-wall FRL (Spec 5) and opening separation (C4D4). The precise
   * definition of "fire-source feature" is a Phase 0 verification item.
   */
  distanceToFireSourceFeatureM: number;
  /**
   * Loadbearing? Selects the loadbearing vs non-loadbearing external-wall band
   * set in Spec 5 (Type A/B). Type C has a single "parts of external walls" table
   * so this is not consulted there.
   */
  loadbearing: boolean;
  /** Whether the wall contains openings (affects C4D4 separation logic). */
  hasOpenings: boolean;
  /**
   * Angle (degrees) between this wall and the opening in the adjacent compartment
   * across a fire wall, for the C4D4 separation check. `null` when not applicable
   * / not supplied — the separation sub-check then degrades to insufficient-input
   * rather than guessing (there is no adjacency graph in v1).
   */
  angleToAdjacentOpeningDeg: number | null;
}

/**
 * A fire compartment — the unit assessed for size (Table C3D3). A project may have
 * more than one when a fire wall genuinely separates the building (brief §6.7).
 */
export interface Compartment {
  id: string;
  name: string;
  floorAreaM2: number;
  volumeM3: number;
  externalWalls: ExternalWall[];
  /**
   * C3D3 size-check carve-out, or `null` for a normal compartment. When set, the
   * compartment-size rule skips the C3D3 comparison entirely (verified extract,
   * note 2) — it never applies the Type C limit to an exempt carpark/stand.
   */
  sizeExemption: CompartmentSizeExemption | null;
}

/**
 * The full set of building inputs for one project.
 *
 * `sprinkleredToSpec17`, `openSpaceAroundBuildingM`, and the two
 * `perimeterAccess…` fields are nullable because they are asked at the C3D4
 * decision point, not upfront (brief §6.4). `null` means "not yet answered" — the
 * engine must treat that as `insufficient-input`, never as `false`.
 */
export interface BuildingInput {
  buildingClass: BuildingClass;
  /** Rise in storeys per the NCC counting method. Drives Table C2D2. */
  riseInStoreys: number;
  /**
   * Effective height in metres. Kept separate from rise in storeys. `> 25 m`
   * triggers the sprinkler flag (E1D5) — an advisory cross-reference, not a
   * Section C computation.
   */
  effectiveHeightM: number;
  /** Sprinklered throughout to Specification 17? C3D4 decision point (pathway B). */
  sprinkleredToSpec17: boolean | null;
  /** Open space width (m) available around the building, for C3D5(1) (pathway A). */
  openSpaceAroundBuildingM: number | null;
  /**
   * C3D5(2) pathway B, question 1: is there continuous, unobstructed,
   * not-built-upon vehicle access ≥ 6 m wide around the building? `null` = not
   * yet answered (treated as insufficient-input, never as `false`).
   */
  perimeterAccess6mWide: boolean | null;
  /**
   * C3D5(2) pathway B, question 2: is that access within 18 m of the building
   * (its far side ≤ 18 m from the building)? Only meaningful when the first is
   * yes; `null` = not yet answered.
   */
  perimeterAccessWithin18m: boolean | null;
  /** One or more fire compartments; length > 1 => multi-compartment. */
  compartments: Compartment[];
  /** Does a fire wall genuinely separate the building into >1 compartment? */
  fireWallsSeparateCompartments: boolean;
}
