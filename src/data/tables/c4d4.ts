import { verified } from "../../domain/ncc-value.ts";
import type { C4D4AngleBand, C4D4Table } from "../schema.ts";

/**
 * Table C4D4 — separation between openings of adjacent compartments, by the ANGLE
 * between the walls.
 *
 * VERIFIED (Class 5, 7a, 7b, 8) from docs/ncc-section-c-data-verified.md §3.
 * Boundary convention (do NOT reuse the distance-band predicate):
 *  - a 0° singleton (walls opposite) ⇒ 6 m;
 *  - open bands `(lower, upper]` for 0–45 / 45–90 / 90–135;
 *  - `>135 to <180` (both open) ⇒ 2 m;
 *  - `≥180` ⇒ Nil (null — no requirement).
 */
const ANGLE_MAX = 360;

export const c4d4: C4D4Table = {
  bands: verified<C4D4AngleBand[]>(
    [
      { minAngleDeg: 0, maxAngleDeg: 0, minInclusive: true, maxInclusive: true, minSeparationM: 6, description: "0° (walls opposite)" },
      { minAngleDeg: 0, maxAngleDeg: 45, minInclusive: false, maxInclusive: true, minSeparationM: 5, description: "> 0° to 45°" },
      { minAngleDeg: 45, maxAngleDeg: 90, minInclusive: false, maxInclusive: true, minSeparationM: 4, description: "> 45° to 90°" },
      { minAngleDeg: 90, maxAngleDeg: 135, minInclusive: false, maxInclusive: true, minSeparationM: 3, description: "> 90° to 135°" },
      { minAngleDeg: 135, maxAngleDeg: 180, minInclusive: false, maxInclusive: false, minSeparationM: 2, description: "> 135° to < 180°" },
      { minAngleDeg: 180, maxAngleDeg: ANGLE_MAX, minInclusive: true, maxInclusive: true, minSeparationM: null, description: "≥ 180° (Nil)" },
    ],
    "Table C4D4, NCC 2022 Vol One — verified",
  ),
  // C4D5 exemption clause is a fact; its FRL threshold is NOT in the extract.
  exemptionClauseRef: "C4D5",
};
