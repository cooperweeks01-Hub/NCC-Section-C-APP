/**
 * Building input model — the "lever set" (brief §6.2, scaffold §6).
 *
 * These are the typed inputs the deterministic engine reads. No NCC values live
 * here; this is the user's building, not the code. All NCC thresholds live in the
 * data layer as `NccValue`s.
 */

/** Building classes in scope for the MVP: Class 5–9 only (brief "Do NOT build"). */
export type BuildingClass = "5" | "6" | "7a" | "7b" | "8" | "9a" | "9b" | "9c";

/** All in-scope classes, for iteration / UI enumeration. */
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
 * The building elements a Spec 5 FRL schedule is expressed per (scaffold §3, §7).
 * This is a fixed, NCC-derived list of element *names* (a fact — safe to encode);
 * the FRL *values* against each element remain `NccValue`s in the data layer.
 */
export type BuildingElement =
  | "externalWallLoadbearing"
  | "externalWallNonLoadbearing"
  | "commonOrFireWall"
  | "internalWallLoadbearing"
  | "internalWallNonLoadbearing"
  | "column"
  | "floor"
  | "roof"
  | "shaft";

export const BUILDING_ELEMENTS: readonly BuildingElement[] = [
  "externalWallLoadbearing",
  "externalWallNonLoadbearing",
  "commonOrFireWall",
  "internalWallLoadbearing",
  "internalWallNonLoadbearing",
  "column",
  "floor",
  "roof",
  "shaft",
] as const;

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
  /** Whether the wall contains openings (affects C4D4 separation logic). */
  hasOpenings: boolean;
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
}

/**
 * The full set of building inputs for one project.
 *
 * `sprinkleredToSpec17`, `openSpaceAroundBuildingM`, and `perimeterVehicularAccess`
 * are nullable because they are asked at the C3D4 decision point, not upfront
 * (brief §6.4). `null` means "not yet answered" — the engine must treat that as
 * `insufficient-input`, never as `false`.
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
  /** Sprinklered to Specification 17? Asked at the C3D4 decision point. */
  sprinkleredToSpec17: boolean | null;
  /** Open space width (m) available around the building, for C3D5(1). */
  openSpaceAroundBuildingM: number | null;
  /** Perimeter vehicular access available, for C3D5(2). */
  perimeterVehicularAccess: boolean | null;
  /** One or more fire compartments; length > 1 => multi-compartment. */
  compartments: Compartment[];
  /** Does a fire wall genuinely separate the building into >1 compartment? */
  fireWallsSeparateCompartments: boolean;
}
