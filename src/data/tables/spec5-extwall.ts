import { verified } from "../../domain/ncc-value.ts";
import type { FRL } from "../../domain/building.ts";
import type {
  Spec5ExtWallBand,
  Spec5ExtWallElement,
  Spec5ExtWallTable,
} from "../schema.ts";

/**
 * Specification 5 — external-wall FRL as a function of distance to the fire-source
 * feature. Drives the setback check (WS-3, §6.5).
 *
 * VERIFIED (Class 5, 7a, 7b, 8) from docs/ncc-section-c-data-verified.md §§4–6.
 * Keyed Type × FrlClassGroup (Spec 5 groups {5,7a} vs {7b,8}). Type A/B split
 * loadbearing (S5C_a) vs non-loadbearing (S5C_b); Type C is a single "parts of
 * external walls" table (S5C24a, kind "any"). Distance bands are `[min, max)`
 * (matches the source "X to < Y"); `DIST_OVER` is the "and over" sentinel.
 *
 * External COLUMNS (S5C_c / S5C24b) are NOT here — they are not matched against a
 * wall input; they appear as informational lines in the fixed FRL schedule.
 */
const DIST_OVER = 9999;

/** FRL constructor; use `null` (or the `_` alias) for a "–" no-requirement cell. */
const _ = null;
function f(structural: number | null, integrity: number | null, insulation: number | null): FRL {
  return { structural, integrity, insulation };
}
function band(minDistanceM: number, maxDistanceM: number, frl: FRL): Spec5ExtWallBand {
  return { minDistanceM, maxDistanceM, frl };
}

function element(
  kind: Spec5ExtWallElement["kind"],
  label: string,
  clauseRef: string,
  bands: Spec5ExtWallBand[],
): Spec5ExtWallElement {
  return { kind, label, clauseRef, bands };
}

const src = (clause: string) => `Specification 5 ${clause}, NCC 2022 Vol One — verified`;

export const spec5ExtWall: Spec5ExtWallTable = {
  // ── Type A — S5C11a (loadbearing) / S5C11b (non-loadbearing) ──────────────
  A: {
    "5_7a": verified<Spec5ExtWallElement[]>(
      [
        element("loadbearing", "Loadbearing parts of external walls", "S5C11a", [
          band(0, 1.5, f(120, 120, 120)),
          band(1.5, 3, f(120, 90, 90)),
          band(3, DIST_OVER, f(120, 60, 30)),
        ]),
        element("nonLoadbearing", "Non-loadbearing parts of external walls", "S5C11b", [
          band(0, 1.5, f(_, 120, 120)),
          band(1.5, 3, f(_, 90, 90)),
          band(3, DIST_OVER, f(_, _, _)),
        ]),
      ],
      src("S5C11a/b, Class 5/7a"),
    ),
    "7b_8": verified<Spec5ExtWallElement[]>(
      [
        element("loadbearing", "Loadbearing parts of external walls", "S5C11a", [
          band(0, 1.5, f(240, 240, 240)),
          band(1.5, 3, f(240, 240, 180)),
          band(3, DIST_OVER, f(240, 180, 90)),
        ]),
        element("nonLoadbearing", "Non-loadbearing parts of external walls", "S5C11b", [
          band(0, 1.5, f(_, 240, 240)),
          band(1.5, 3, f(_, 240, 180)),
          band(3, DIST_OVER, f(_, _, _)),
        ]),
      ],
      src("S5C11a/b, Class 7b/8"),
    ),
  },
  // ── Type B — S5C21a (loadbearing) / S5C21b (non-loadbearing) ──────────────
  B: {
    "5_7a": verified<Spec5ExtWallElement[]>(
      [
        element("loadbearing", "Loadbearing parts of external walls", "S5C21a", [
          band(0, 1.5, f(120, 120, 120)),
          band(1.5, 3, f(120, 90, 60)),
          band(3, 9, f(120, 30, 30)),
          band(9, 18, f(120, 30, _)),
          band(18, DIST_OVER, f(_, _, _)),
        ]),
        element("nonLoadbearing", "Non-loadbearing parts of external walls", "S5C21b", [
          band(0, 1.5, f(_, 120, 120)),
          band(1.5, 3, f(_, 90, 60)),
          band(3, DIST_OVER, f(_, _, _)),
        ]),
      ],
      src("S5C21a/b, Class 5/7a"),
    ),
    "7b_8": verified<Spec5ExtWallElement[]>(
      [
        element("loadbearing", "Loadbearing parts of external walls", "S5C21a", [
          band(0, 1.5, f(240, 240, 240)),
          band(1.5, 3, f(240, 180, 120)),
          band(3, 9, f(240, 90, 60)),
          band(9, 18, f(240, 60, _)),
          band(18, DIST_OVER, f(_, _, _)),
        ]),
        element("nonLoadbearing", "Non-loadbearing parts of external walls", "S5C21b", [
          band(0, 1.5, f(_, 240, 240)),
          band(1.5, 3, f(_, 180, 120)),
          band(3, DIST_OVER, f(_, _, _)),
        ]),
      ],
      src("S5C21a/b, Class 7b/8"),
    ),
  },
  // ── Type C — S5C24a (single "parts of external walls", same both groups) ──
  C: {
    "5_7a": verified<Spec5ExtWallElement[]>(
      [
        element("any", "Parts of external walls", "S5C24a", [
          band(0, 1.5, f(90, 90, 90)),
          band(1.5, 3, f(60, 60, 60)),
          band(3, DIST_OVER, f(_, _, _)),
        ]),
      ],
      src("S5C24a, Class 5/7a"),
    ),
    "7b_8": verified<Spec5ExtWallElement[]>(
      [
        element("any", "Parts of external walls", "S5C24a", [
          band(0, 1.5, f(90, 90, 90)),
          band(1.5, 3, f(60, 60, 60)),
          band(3, DIST_OVER, f(_, _, _)),
        ]),
      ],
      src("S5C24a, Class 7b/8"),
    ),
  },
};
