import type {
  BuildingClass,
  BuildingElement,
  ConstructionType,
  FRL,
} from "../domain/building.ts";
import type { NccValue } from "../domain/ncc-value.ts";

/**
 * NCC data-layer schema — the typed lookup shapes the rules engine reads from
 * (scaffold §6, §7). Every leaf number/FRL is an `NccValue`, so it carries its
 * verification state and source. In the shipped placeholder layer every leaf is
 * `{ value: null, verified: false, source: "… TRANSCRIBE" }`.
 *
 * Two structural patterns, chosen per table (see plan §5 / advisor guidance):
 *  - GRID tables, where the axes are stated facts (Class × Type, Type × Element):
 *    pre-create every cell as an `NccValue` with a null value.
 *  - BAND tables, where the band boundaries are themselves NCC content
 *    (C2D2 rise bands, Spec 5 distance bands, C4D4): model the whole banded list
 *    as a single `NccValue<Row[]>` — the verifier fills the typed `Row[]`.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Table C2D2 — required Type of construction by (Class, rise in storeys)
// Band table: rise-in-storeys thresholds are NCC content.
// ─────────────────────────────────────────────────────────────────────────────

/** One rise-in-storeys band mapping to a required Type. */
export interface C2D2Band {
  /** Inclusive lower bound of rise in storeys. */
  minRiseInStoreys: number;
  /** Inclusive upper bound; use a large sentinel for "and over". */
  maxRiseInStoreys: number;
  requiredType: ConstructionType;
}

/** Per class, the ordered banded list (a single transcribed value). */
export type C2D2Table = Record<BuildingClass, NccValue<C2D2Band[]>>;

// ─────────────────────────────────────────────────────────────────────────────
// Table C3D3 — max fire-compartment size by (Class, Type)
// Grid table: axes are facts; cell values transcribed.
// ─────────────────────────────────────────────────────────────────────────────

export interface C3D3Cell {
  maxFloorAreaM2: NccValue<number>;
  maxVolumeM3: NccValue<number>;
}

export type C3D3Table = Record<BuildingClass, Record<ConstructionType, C3D3Cell>>;

// ─────────────────────────────────────────────────────────────────────────────
// C3D4 — large-isolated-building concession caps
// Headline figures (18,000 m² / 108,000 m³) are stated in the brief but must be
// TRANSCRIBED from source, not copied from prose — value stays null.
// ─────────────────────────────────────────────────────────────────────────────

export interface C3D4Caps {
  maxFloorAreaM2: NccValue<number>;
  maxVolumeM3: NccValue<number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// C3D5(1) — open-space geometry for the large-isolated open-space pathway
// ─────────────────────────────────────────────────────────────────────────────

export interface C3D5OpenSpace {
  /** Minimum open-space width around the building (headline ≥ 18 m for 7/8). */
  minWidthM: NccValue<number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Table C4D4 — separation between openings of adjacent compartments across a
// fire wall, plus the ≥60/60/60 + protected-openings (C4D5) exemption.
// ─────────────────────────────────────────────────────────────────────────────

export interface C4D4Band {
  /** What this row is keyed on (axes to be confirmed in verification). */
  description: string;
  requiredSeparationM: number;
}

export interface C4D4Table {
  bands: NccValue<C4D4Band[]>;
  /** FRL threshold that unlocks the exemption path (headline 60/60/60). */
  exemptionFrlThreshold: NccValue<FRL>;
  /** Fact: the clause governing acceptable opening protection. */
  exemptionClauseRef: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Specification 5 — FRL schedule by (Type, element)
// Grid table: axes are facts; FRLs transcribed.
// ─────────────────────────────────────────────────────────────────────────────

export type Spec5FrlTable = Record<
  ConstructionType,
  Record<BuildingElement, NccValue<FRL>>
>;

// ─────────────────────────────────────────────────────────────────────────────
// Specification 5 — external-wall FRL by distance-to-fire-source-feature band
// Band table per Type.
// ─────────────────────────────────────────────────────────────────────────────

export interface Spec5ExtWallBand {
  /** Inclusive lower distance bound (m). */
  minDistanceM: number;
  /** Exclusive upper distance bound (m); large sentinel for "and over". */
  maxDistanceM: number;
  frl: FRL;
  /** How openings must be treated in this band (transcribed text). */
  openingTreatment: string;
}

export type Spec5ExtWallTable = Record<
  ConstructionType,
  NccValue<Spec5ExtWallBand[]>
>;

// ─────────────────────────────────────────────────────────────────────────────
// Specification 17 — conditions under which a system "complies with Spec 17"
// Boolean logic, not numeric; still verified against source.
// ─────────────────────────────────────────────────────────────────────────────

export interface Spec17Conditions {
  /** Transcribed statement of the complying conditions + FPAA101D/H exclusions. */
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
  spec5Frl: Spec5FrlTable;
  spec5ExtWall: Spec5ExtWallTable;
  spec17: Spec17Conditions;
  meta: {
    /** Which NCC edition this layer transcribes. */
    edition: string;
    /** Free-text status note (e.g. state-variation caveats). */
    note: string;
  };
}
