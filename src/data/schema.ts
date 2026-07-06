import type {
  ConstructionType,
  FRL,
  InScopeClass,
} from "../domain/building.ts";
import type { NccValue } from "../domain/ncc-value.ts";

/**
 * NCC data-layer schema — the typed lookup shapes the rules engine reads from
 * (scaffold §6, §7), revised to fit the VERIFIED extract
 * (`docs/ncc-section-c-data-verified.md`). Every leaf number/FRL is an
 * `NccValue`, so it carries its verification state and source.
 *
 * CRITICAL: class grouping is TABLE-DEPENDENT (verified extract, note 1). C3D3
 * groups `{5}` vs `{7a,7b,8}`; Spec 5 groups `{5,7a}` vs `{7b,8}`. Each table is
 * keyed on its OWN group via its OWN mapper below — never a shared enum, or 7a
 * pulls the wrong value from one of them.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Per-table class groupings + their mappers (note 1).
// ─────────────────────────────────────────────────────────────────────────────

/** C3D3 compartment-size grouping: Class 5 alone vs 7a/7b/8 together. */
export type C3D3ClassGroup = "5" | "7a_7b_8";

export function c3d3GroupFor(cls: InScopeClass): C3D3ClassGroup {
  return cls === "5" ? "5" : "7a_7b_8";
}

/** Specification 5 FRL grouping: {5,7a} vs {7b,8}. DIFFERENT bucket for 7a. */
export type FrlClassGroup = "5_7a" | "7b_8";

export function frlGroupFor(cls: InScopeClass): FrlClassGroup {
  return cls === "5" || cls === "7a" ? "5_7a" : "7b_8";
}

// ─────────────────────────────────────────────────────────────────────────────
// Table C2D2 — required Type by rise in storeys. Uniform across Class 5–8, so a
// single banded value (no class axis). Band table: boundaries are NCC content.
// ─────────────────────────────────────────────────────────────────────────────

/** One rise-in-storeys band mapping to a required Type. `[min, max]` inclusive. */
export interface C2D2Band {
  minRiseInStoreys: number;
  /** Inclusive upper bound; use a large sentinel for "and over". */
  maxRiseInStoreys: number;
  requiredType: ConstructionType;
}

export type C2D2Table = NccValue<C2D2Band[]>;

// ─────────────────────────────────────────────────────────────────────────────
// Table C3D3 — max fire-compartment size, keyed on the C3D3 grouping.
// ─────────────────────────────────────────────────────────────────────────────

export interface C3D3Cell {
  maxFloorAreaM2: NccValue<number>;
  maxVolumeM3: NccValue<number>;
}

export type C3D3Table = Record<C3D3ClassGroup, Record<ConstructionType, C3D3Cell>>;

// ─────────────────────────────────────────────────────────────────────────────
// C3D4 — large-isolated caps. NOT in the verified extract — stays unverified
// (never fabricate the 18,000/108,000 headline). Concession safely-degrades.
// ─────────────────────────────────────────────────────────────────────────────

export interface C3D4Caps {
  maxFloorAreaM2: NccValue<number>;
  maxVolumeM3: NccValue<number>;
}

/** C3D5(1) open-space geometry. Also not in the extract — stays unverified. */
export interface C3D5OpenSpace {
  minWidthM: NccValue<number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Table C4D4 — separation between openings of adjacent compartments, keyed by
// the ANGLE between the walls. Convention: `(minAngleDeg, maxAngleDeg]`, with a
// 0° singleton row and a `>135 to <180` row; `≥180 ⇒ Nil` (null). Do NOT reuse
// the distance-band predicate — the boundary convention is different.
// ─────────────────────────────────────────────────────────────────────────────

export interface C4D4AngleBand {
  /** Lower angle bound. */
  minAngleDeg: number;
  /** Upper angle bound. */
  maxAngleDeg: number;
  /** Whether the lower bound is inclusive (true only for the 0° singleton row). */
  minInclusive: boolean;
  /** Whether the upper bound is inclusive. */
  maxInclusive: boolean;
  /** Required min separation (m); `null` => "Nil" (no requirement). */
  minSeparationM: number | null;
  description: string;
}

export interface C4D4Table {
  bands: NccValue<C4D4AngleBand[]>;
  /**
   * The C4D5 exemption (≥60/60/60 walls + protected openings) clause is a fact,
   * but its FRL threshold is NOT in the verified extract — it stays unverified.
   */
  exemptionClauseRef: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Specification 5 — external-wall FRL by distance to fire-source feature.
// Distance bands: `[minDistanceM, maxDistanceM)` (matches the source's "X to <Y").
// Keyed by Type × FrlClassGroup; each element is loadbearing / non-loadbearing
// (Type A/B) or "any" (Type C's single "parts of external walls" table).
// This drives the SETBACK check (WS-3).
// ─────────────────────────────────────────────────────────────────────────────

export type Spec5ExtWallKind = "loadbearing" | "nonLoadbearing" | "any";

export interface Spec5ExtWallBand {
  /** Inclusive lower distance bound (m). */
  minDistanceM: number;
  /** Exclusive upper distance bound (m); large sentinel for "and over". */
  maxDistanceM: number;
  frl: FRL;
}

export interface Spec5ExtWallElement {
  kind: Spec5ExtWallKind;
  label: string;
  clauseRef: string;
  bands: Spec5ExtWallBand[];
}

export type Spec5ExtWallTable = Record<
  ConstructionType,
  Record<FrlClassGroup, NccValue<Spec5ExtWallElement[]>>
>;

// ─────────────────────────────────────────────────────────────────────────────
// Specification 5 — the FIXED (non-distance) FRL schedule: common/fire walls,
// internal walls (incl. sub-locations), external columns (informational), floors,
// roofs, other elements. Which lines exist is a structural fact per Type × group;
// each FRL is an NccValue. This drives the FRL SCHEDULE check (WS-4).
// ─────────────────────────────────────────────────────────────────────────────

export interface Spec5ScheduleLine {
  /** Source label, e.g. "Loadbearing internal wall — fire-resisting shafts". */
  label: string;
  /** The Spec 5 clause, e.g. "S5C11e". */
  clauseRef: string;
  frl: NccValue<FRL>;
}

export type Spec5ScheduleTable = Record<
  ConstructionType,
  Record<FrlClassGroup, Spec5ScheduleLine[]>
>;

// ─────────────────────────────────────────────────────────────────────────────
// Specification 17 — conditions under which a system "complies". Not in the
// extract — stays unverified (used only by the large-isolated concession).
// ─────────────────────────────────────────────────────────────────────────────

export interface Spec17Conditions {
  compliesDefinition: NccValue<string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// The aggregate data layer the engine reads.
// ─────────────────────────────────────────────────────────────────────────────

export interface NccDataLayer {
  c2d2: C2D2Table;
  c3d3: C3D3Table;
  c3d4Caps: C3D4Caps;
  c3d5OpenSpace: C3D5OpenSpace;
  c4d4: C4D4Table;
  spec5ExtWall: Spec5ExtWallTable;
  spec5Schedule: Spec5ScheduleTable;
  spec17: Spec17Conditions;
  meta: {
    /** Which NCC edition this layer transcribes. */
    edition: string;
    /** Free-text status note (e.g. state-variation caveats). */
    note: string;
  };
}
