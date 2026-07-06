import { verified } from "../../domain/ncc-value.ts";
import type { FRL } from "../../domain/building.ts";
import type { Spec5ScheduleLine, Spec5ScheduleTable } from "../schema.ts";

/**
 * Specification 5 — the FIXED (non-distance) FRL schedule per building element.
 * Drives the FRL schedule check (WS-4, §6.6).
 *
 * VERIFIED (Class 5, 7a, 7b, 8) from docs/ncc-section-c-data-verified.md §§4–6
 * (the S5C_c–g / S5C24b–e rows; external WALLS by distance live in spec5-extwall).
 * Keyed Type × FrlClassGroup ({5,7a} vs {7b,8}). Which lines exist is a structural
 * fact per Type; each FRL is a verified NccValue. `–` in the source ⇒ a null FRL
 * criterion (distinct from 0). Type C has no floors line (verified note 4).
 */
const _ = null;
function f(structural: number | null, integrity: number | null, insulation: number | null): FRL {
  return { structural, integrity, insulation };
}
/** One schedule line with a verified FRL and its Spec 5 clause. */
function L(
  label: string,
  clauseRef: string,
  structural: number | null,
  integrity: number | null,
  insulation: number | null,
): Spec5ScheduleLine {
  return { label, clauseRef, frl: verified<FRL>(f(structural, integrity, insulation), `Specification 5 ${clauseRef}, NCC 2022 Vol One — verified`) };
}

export const spec5Schedule: Spec5ScheduleTable = {
  // ── Type A (S5C11c–g) ─────────────────────────────────────────────────────
  A: {
    "5_7a": [
      L("External columns (loadbearing)", "S5C11c", 120, _, _),
      L("External columns (non-loadbearing)", "S5C11c", _, _, _),
      L("Common walls and fire walls", "S5C11d", 120, 120, 120),
      L("Loadbearing internal wall — fire-resisting lift and stair shafts", "S5C11e", 120, 120, 120),
      L("Loadbearing internal wall — bounding public corridors/lobbies", "S5C11e", 120, _, _),
      L("Loadbearing internal wall — between/bounding sole-occupancy units", "S5C11e", 120, _, _),
      L("Loadbearing internal wall — ventilating/pipe/garbage shafts", "S5C11e", 120, 90, 90),
      L("Non-loadbearing internal wall — fire-resisting lift and stair shafts", "S5C11f", _, 120, 120),
      L("Non-loadbearing internal wall — bounding public corridors/lobbies", "S5C11f", _, _, _),
      L("Non-loadbearing internal wall — between/bounding sole-occupancy units", "S5C11f", _, _, _),
      L("Non-loadbearing internal wall — ventilating/pipe/garbage shafts", "S5C11f", _, 90, 90),
      L("Other loadbearing internal walls, beams, trusses and columns", "S5C11g", 120, _, _),
      L("Floors", "S5C11g", 120, 120, 120),
      L("Roofs", "S5C11g", 120, 60, 30),
    ],
    "7b_8": [
      L("External columns (loadbearing)", "S5C11c", 240, _, _),
      L("External columns (non-loadbearing)", "S5C11c", _, _, _),
      L("Common walls and fire walls", "S5C11d", 240, 240, 240),
      L("Loadbearing internal wall — fire-resisting lift and stair shafts", "S5C11e", 240, 120, 120),
      L("Loadbearing internal wall — bounding public corridors/lobbies", "S5C11e", 240, _, _),
      L("Loadbearing internal wall — between/bounding sole-occupancy units", "S5C11e", 240, _, _),
      L("Loadbearing internal wall — ventilating/pipe/garbage shafts", "S5C11e", 240, 120, 120),
      L("Non-loadbearing internal wall — fire-resisting lift and stair shafts", "S5C11f", _, 120, 120),
      L("Non-loadbearing internal wall — bounding public corridors/lobbies", "S5C11f", _, _, _),
      L("Non-loadbearing internal wall — between/bounding sole-occupancy units", "S5C11f", _, _, _),
      L("Non-loadbearing internal wall — ventilating/pipe/garbage shafts", "S5C11f", _, 120, 120),
      L("Other loadbearing internal walls, beams, trusses and columns", "S5C11g", 240, _, _),
      L("Floors", "S5C11g", 240, 240, 240),
      L("Roofs", "S5C11g", 240, 90, 60),
    ],
  },
  // ── Type B (S5C21c–g) — no separate floors line in the source ─────────────
  B: {
    "5_7a": [
      L("External loadbearing column — less than 18 m", "S5C21c", 120, _, _),
      L("External loadbearing column — 18 m or more", "S5C21c", _, _, _),
      L("External non-loadbearing column", "S5C21c", _, _, _),
      L("Common walls and fire walls", "S5C21d", 120, 120, 120),
      L("Loadbearing internal wall — fire-resisting lift and stair shafts", "S5C21e", 120, 120, 120),
      L("Loadbearing internal wall — bounding public corridors/lobbies", "S5C21e", 120, _, _),
      L("Loadbearing internal wall — between/bounding sole-occupancy units", "S5C21e", 120, _, _),
      L("Non-loadbearing internal wall — fire-resisting lift and stair shafts", "S5C21f", _, 120, 120),
      L("Non-loadbearing internal wall — bounding public corridors/lobbies", "S5C21f", _, _, _),
      L("Non-loadbearing internal wall — between/bounding sole-occupancy units", "S5C21f", _, _, _),
      L("Other loadbearing internal walls and columns", "S5C21g", 120, _, _),
      L("Roofs", "S5C21g", _, _, _),
    ],
    "7b_8": [
      L("External loadbearing column — less than 18 m", "S5C21c", 240, _, _),
      L("External loadbearing column — 18 m or more", "S5C21c", _, _, _),
      L("External non-loadbearing column", "S5C21c", _, _, _),
      L("Common walls and fire walls", "S5C21d", 240, 240, 240),
      L("Loadbearing internal wall — fire-resisting lift and stair shafts", "S5C21e", 240, 120, 120),
      L("Loadbearing internal wall — bounding public corridors/lobbies", "S5C21e", 240, _, _),
      L("Loadbearing internal wall — between/bounding sole-occupancy units", "S5C21e", 240, _, _),
      L("Non-loadbearing internal wall — fire-resisting lift and stair shafts", "S5C21f", _, 120, 120),
      L("Non-loadbearing internal wall — bounding public corridors/lobbies", "S5C21f", _, _, _),
      L("Non-loadbearing internal wall — between/bounding sole-occupancy units", "S5C21f", _, _, _),
      L("Other loadbearing internal walls and columns", "S5C21g", 240, _, _),
      L("Roofs", "S5C21g", _, _, _),
    ],
  },
  // ── Type C (S5C24b–e) — same values for both groups; no floors (note 4) ───
  C: {
    "5_7a": [
      L("External column — < 1.5 m from fire-source feature", "S5C24b", 90, _, _),
      L("External column — 1.5 to < 3 m from fire-source feature", "S5C24b", 60, _, _),
      L("External column — ≥ 3 m from fire-source feature", "S5C24b", _, _, _),
      L("Common walls and fire walls", "S5C24c", 90, 90, 90),
      L("Internal wall — bounding public corridors/lobbies", "S5C24d", _, _, _),
      L("Internal wall — between/bounding sole-occupancy units", "S5C24d", _, _, _),
      L("Internal wall — bounding a stair required to be rated", "S5C24d", 60, 60, 60),
      L("Roofs", "S5C24e", _, _, _),
    ],
    "7b_8": [
      L("External column — < 1.5 m from fire-source feature", "S5C24b", 90, _, _),
      L("External column — 1.5 to < 3 m from fire-source feature", "S5C24b", 60, _, _),
      L("External column — ≥ 3 m from fire-source feature", "S5C24b", _, _, _),
      L("Common walls and fire walls", "S5C24c", 90, 90, 90),
      L("Internal wall — bounding public corridors/lobbies", "S5C24d", _, _, _),
      L("Internal wall — between/bounding sole-occupancy units", "S5C24d", _, _, _),
      L("Internal wall — bounding a stair required to be rated", "S5C24d", 60, 60, 60),
      L("Roofs", "S5C24e", _, _, _),
    ],
  },
};
