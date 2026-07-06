/**
 * ╔════════════════════════════════════════════════════════════════════════╗
 * ║  SYNTHETIC TEST DATA — NOT NCC VALUES.                                  ║
 * ║  Do NOT copy any number in this file into the real data layer.         ║
 * ╚════════════════════════════════════════════════════════════════════════╝
 *
 * A fully-`verified: true` `NccDataLayer` of invented, deliberately-round numbers
 * for exercising engine BRANCH LOGIC (plan §5.2). No relationship to the licensed
 * NCC. Its KEY role now that the real layer is verified: it carries verified
 * C3D4 caps / C3D5 geometry / Spec 17 — which the REAL layer deliberately lacks —
 * so the large-isolated concession's branches can be tested. It also fixes a
 * controlled C2D2 ladder (1–2→C, 3–4→B, 5+→A) for the type-of-construction tests.
 */
import { verified } from "../../domain/ncc-value.ts";
import type { FRL } from "../../domain/building.ts";
import type {
  C2D2Table,
  C3D3Table,
  C3D4Caps,
  C3D5OpenSpace,
  C4D4Table,
  NccDataLayer,
  Spec5ExtWallElement,
  Spec5ExtWallTable,
  Spec5ScheduleLine,
  Spec5ScheduleTable,
  Spec17Conditions,
} from "../schema.ts";

const SRC = "SYNTHETIC FIXTURE — not an NCC value";
const OVER = 999;
const _ = null;
const f = (s: number | null, i: number | null, n: number | null): FRL => ({
  structural: s,
  integrity: i,
  insulation: n,
});

// C2D2 — controlled ladder so a rise-6 building steps A→B→C on re-lookup.
const c2d2: C2D2Table = verified(
  [
    { minRiseInStoreys: 1, maxRiseInStoreys: 2, requiredType: "C" as const },
    { minRiseInStoreys: 3, maxRiseInStoreys: 4, requiredType: "B" as const },
    { minRiseInStoreys: 5, maxRiseInStoreys: OVER, requiredType: "A" as const },
  ],
  `${SRC} — C2D2`,
);

// C3D3 — two synthetic groups; Type C limits low enough to exceed in tests.
const cell = (area: number, volume: number) => ({
  maxFloorAreaM2: verified(area, `${SRC} — C3D3 area`),
  maxVolumeM3: verified(volume, `${SRC} — C3D3 volume`),
});
const c3d3: C3D3Table = {
  "5": { A: cell(8000, 48000), B: cell(5500, 33000), C: cell(3000, 18000) },
  "7a_7b_8": { A: cell(5000, 30000), B: cell(3500, 21000), C: cell(2000, 12000) },
};

// C3D4 / C3D5 / Spec 17 — VERIFIED here (the real layer leaves these null).
// Caps chosen distinct from the brief's 18,000/108,000 headline.
const c3d4Caps: C3D4Caps = {
  maxFloorAreaM2: verified(20000, `${SRC} — C3D4 area cap`),
  maxVolumeM3: verified(120000, `${SRC} — C3D4 volume cap`),
};
const c3d5OpenSpace: C3D5OpenSpace = {
  minWidthM: verified(15, `${SRC} — C3D5(1) open-space width`),
};
const spec17: Spec17Conditions = {
  compliesDefinition: verified(
    "SYNTHETIC: a sprinkler system is treated as complying for fixture tests.",
    `${SRC} — Spec 17`,
  ),
};

// C4D4 — a couple of synthetic angle bands including a Nil band.
const c4d4: C4D4Table = {
  bands: verified(
    [
      { minAngleDeg: 0, maxAngleDeg: 0, minInclusive: true, maxInclusive: true, minSeparationM: 6, description: "0°" },
      { minAngleDeg: 0, maxAngleDeg: 90, minInclusive: false, maxInclusive: true, minSeparationM: 4, description: "> 0° to 90°" },
      { minAngleDeg: 90, maxAngleDeg: 180, minInclusive: false, maxInclusive: false, minSeparationM: 2, description: "> 90° to < 180°" },
      { minAngleDeg: 180, maxAngleDeg: 360, minInclusive: true, maxInclusive: true, minSeparationM: null, description: "≥ 180° (Nil)" },
    ],
    `${SRC} — C4D4`,
  ),
  exemptionClauseRef: "C4D5",
};

// Spec 5 external wall — minimal but complete (Type × group), distance-banded.
const extEl = (
  kind: Spec5ExtWallElement["kind"],
  label: string,
  clauseRef: string,
  near: FRL,
  far: FRL,
): Spec5ExtWallElement => ({
  kind,
  label,
  clauseRef,
  bands: [
    { minDistanceM: 0, maxDistanceM: 3, frl: near },
    { minDistanceM: 3, maxDistanceM: OVER, frl: far },
  ],
});
const extAB = () => [
  extEl("loadbearing", "Loadbearing external wall", "SYN-a", f(90, 90, 90), f(60, 30, _)),
  extEl("nonLoadbearing", "Non-loadbearing external wall", "SYN-b", f(_, 90, 90), f(_, _, _)),
];
const extC = () => [extEl("any", "Parts of external walls", "SYN-c", f(60, 60, 60), f(_, _, _))];
const spec5ExtWall: Spec5ExtWallTable = {
  A: { "5_7a": verified(extAB(), `${SRC} — extwall A 5/7a`), "7b_8": verified(extAB(), `${SRC} — extwall A 7b/8`) },
  B: { "5_7a": verified(extAB(), `${SRC} — extwall B 5/7a`), "7b_8": verified(extAB(), `${SRC} — extwall B 7b/8`) },
  C: { "5_7a": verified(extC(), `${SRC} — extwall C 5/7a`), "7b_8": verified(extC(), `${SRC} — extwall C 7b/8`) },
};

// Spec 5 fixed schedule — a few synthetic lines per Type × group, incl. a null "–".
const line = (label: string, frl: FRL): Spec5ScheduleLine => ({
  label,
  clauseRef: "SYN-sched",
  frl: verified(frl, `${SRC} — schedule ${label}`),
});
const sched = (wall: FRL, floor: FRL, roof: FRL) => [
  line("Common walls and fire walls", wall),
  line("Floors", floor),
  line("Roofs", roof),
];
const spec5Schedule: Spec5ScheduleTable = {
  A: { "5_7a": sched(f(90, 90, 90), f(90, 90, 90), f(90, 60, 30)), "7b_8": sched(f(120, 120, 120), f(120, 120, 120), f(120, 90, 60)) },
  B: { "5_7a": sched(f(90, 90, 90), f(60, 60, 60), f(_, _, _)), "7b_8": sched(f(120, 120, 120), f(90, 90, 90), f(_, _, _)) },
  C: { "5_7a": sched(f(60, 60, 60), f(_, _, _), f(_, _, _)), "7b_8": sched(f(60, 60, 60), f(_, _, _), f(_, _, _)) },
};

/**
 * The frozen synthetic data layer. Import ONLY from test files. Every value is
 * `verified: true`, so the engine computes real branches against it.
 */
export const syntheticDataLayer: NccDataLayer = {
  c2d2,
  c3d3,
  c3d4Caps,
  c3d5OpenSpace,
  c4d4,
  spec5ExtWall,
  spec5Schedule,
  spec17,
  meta: {
    edition: "SYNTHETIC FIXTURE — NOT NCC 2022 Volume One",
    note: "Invented test values. Not for any real compliance decision.",
  },
};
