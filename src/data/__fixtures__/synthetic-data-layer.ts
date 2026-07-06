/**
 * ╔════════════════════════════════════════════════════════════════════════╗
 * ║  SYNTHETIC TEST DATA — NOT NCC VALUES.                                  ║
 * ║  Do NOT copy any number in this file into the real data layer.         ║
 * ╚════════════════════════════════════════════════════════════════════════╝
 *
 * This is a small, fully-`verified: true` `NccDataLayer` built ENTIRELY from
 * invented, deliberately-round numbers. It exists for ONE reason (plan §5.2):
 * to exercise the engine's BRANCH LOGIC (does a value over the limit route to
 * C3D4? does a reduced rise re-look-up C2D2 to a less-onerous Type?) before any
 * real NCC value has been transcribed.
 *
 * These numbers have NO relationship to the licensed NCC 2022 Volume One. They
 * are chosen to be obviously synthetic (round, self-consistent, distinct from
 * the brief's headline figures) so nobody mistakes them for source data. The
 * real data layer (`src/data/index.ts`) stays all-null until a competent person
 * transcribes it — see `docs/verification-checklist.md`.
 *
 * FROZEN CONTRACT (Phase B): every rule's fixture-backed logic test injects this
 * layer via `RuleContext.data`. Like the Phase A types, it is a shared contract —
 * extend it centrally here, never fork a half-fixture per rule.
 */
import {
  BUILDING_CLASSES,
  BUILDING_ELEMENTS,
  CONSTRUCTION_TYPES,
} from "../../domain/building.ts";
import type {
  BuildingClass,
  BuildingElement,
  ConstructionType,
  FRL,
} from "../../domain/building.ts";
import { verified } from "../../domain/ncc-value.ts";
import type { NccValue } from "../../domain/ncc-value.ts";
import type {
  C2D2Band,
  C2D2Table,
  C3D3Cell,
  C3D3Table,
  C3D4Caps,
  C3D5OpenSpace,
  C4D4Band,
  C4D4Table,
  NccDataLayer,
  Spec5ExtWallBand,
  Spec5ExtWallTable,
  Spec5FrlTable,
  Spec17Conditions,
} from "../schema.ts";

const SRC = "SYNTHETIC FIXTURE — not an NCC value";

/** A large sentinel for the "and over" open-ended top band. */
const OVER = 999;

// ─────────────────────────────────────────────────────────────────────────────
// C2D2 — synthetic rise→Type bands (uniform across classes for the fixture).
// Ladder: rise 1–2 ⇒ Type C, 3–4 ⇒ Type B, 5+ ⇒ Type A. This lets a test at
// rise 6 (Type A) re-look-up the table at reduced rise and step A→B→C, proving
// the less-onerous analysis is a real C2D2 re-lookup, not a C→B→A brute force.
// ─────────────────────────────────────────────────────────────────────────────
const SYNTHETIC_C2D2_BANDS: C2D2Band[] = [
  { minRiseInStoreys: 1, maxRiseInStoreys: 2, requiredType: "C" },
  { minRiseInStoreys: 3, maxRiseInStoreys: 4, requiredType: "B" },
  { minRiseInStoreys: 5, maxRiseInStoreys: OVER, requiredType: "A" },
];

const c2d2: C2D2Table = Object.fromEntries(
  BUILDING_CLASSES.map((cls): [BuildingClass, NccValue<C2D2Band[]>] => [
    cls,
    verified<C2D2Band[]>(SYNTHETIC_C2D2_BANDS, `${SRC} — C2D2 Class ${cls}`),
  ]),
) as C2D2Table;

// ─────────────────────────────────────────────────────────────────────────────
// C3D3 — synthetic max compartment size by Type (uniform across classes). More
// onerous Type ⇒ larger permitted compartment, so a mid-size compartment can be
// within-limit for Type A but over-limit for Type C (exercises the routing).
// ─────────────────────────────────────────────────────────────────────────────
const SYNTHETIC_C3D3_BY_TYPE: Record<
  ConstructionType,
  { area: number; volume: number }
> = {
  A: { area: 8000, volume: 48000 },
  B: { area: 5500, volume: 33000 },
  C: { area: 3000, volume: 18000 },
};

function c3d3Cell(cls: BuildingClass, type: ConstructionType): C3D3Cell {
  const { area, volume } = SYNTHETIC_C3D3_BY_TYPE[type];
  const where = `${SRC} — C3D3 Class ${cls} Type ${type}`;
  return {
    maxFloorAreaM2: verified<number>(area, `${where} area`),
    maxVolumeM3: verified<number>(volume, `${where} volume`),
  };
}

const c3d3: C3D3Table = Object.fromEntries(
  BUILDING_CLASSES.map((cls) => [
    cls,
    Object.fromEntries(
      CONSTRUCTION_TYPES.map((type) => [type, c3d3Cell(cls, type)]),
    ) as Record<ConstructionType, C3D3Cell>,
  ]),
) as C3D3Table;

// ─────────────────────────────────────────────────────────────────────────────
// C3D4 caps — synthetic large-isolated caps. Deliberately DIFFERENT from the
// brief's 18,000/108,000 headline (20,000/120,000) so they read as fixtures.
// ─────────────────────────────────────────────────────────────────────────────
const c3d4Caps: C3D4Caps = {
  maxFloorAreaM2: verified<number>(20000, `${SRC} — C3D4 area cap`),
  maxVolumeM3: verified<number>(120000, `${SRC} — C3D4 volume cap`),
};

// ─────────────────────────────────────────────────────────────────────────────
// C3D5(1) — synthetic open-space width.
// ─────────────────────────────────────────────────────────────────────────────
const c3d5OpenSpace: C3D5OpenSpace = {
  minWidthM: verified<number>(15, `${SRC} — C3D5(1) min open-space width`),
};

// ─────────────────────────────────────────────────────────────────────────────
// C4D4 — synthetic opening-separation bands + 60/60/60 exemption threshold.
// ─────────────────────────────────────────────────────────────────────────────
const c4d4: C4D4Table = {
  bands: verified<C4D4Band[]>(
    [
      { description: "openings in adjacent compartments < 3 m apart", requiredSeparationM: 3 },
      { description: "openings in adjacent compartments 3–6 m apart", requiredSeparationM: 1.5 },
    ],
    `${SRC} — C4D4 separation bands`,
  ),
  exemptionFrlThreshold: verified<FRL>(
    { structural: 60, integrity: 60, insulation: 60 },
    `${SRC} — C4D4/C4D5 exemption threshold`,
  ),
  exemptionClauseRef: "C4D5",
};

// ─────────────────────────────────────────────────────────────────────────────
// Spec 5 FRL schedule — synthetic FRL per Type (uniform across most elements).
// `roof` is all-null to exercise the "–" (no requirement) rendering path,
// which must stay distinct from a numeric 0.
// ─────────────────────────────────────────────────────────────────────────────
const SYNTHETIC_FRL_BY_TYPE: Record<ConstructionType, FRL> = {
  A: { structural: 90, integrity: 90, insulation: 90 },
  B: { structural: 60, integrity: 60, insulation: 60 },
  C: { structural: 30, integrity: 30, insulation: 30 },
};
const NO_REQUIREMENT: FRL = { structural: null, integrity: null, insulation: null };

function frlRow(type: ConstructionType): Record<BuildingElement, NccValue<FRL>> {
  return Object.fromEntries(
    BUILDING_ELEMENTS.map((el) => [
      el,
      verified<FRL>(
        el === "roof" ? NO_REQUIREMENT : SYNTHETIC_FRL_BY_TYPE[type],
        `${SRC} — Spec 5 Type ${type} ${el}`,
      ),
    ]),
  ) as Record<BuildingElement, NccValue<FRL>>;
}

const spec5Frl: Spec5FrlTable = Object.fromEntries(
  CONSTRUCTION_TYPES.map((type) => [type, frlRow(type)]),
) as Spec5FrlTable;

// ─────────────────────────────────────────────────────────────────────────────
// Spec 5 external-wall FRL by distance-to-fire-source-feature (synthetic bands,
// uniform across Types for the fixture).
// ─────────────────────────────────────────────────────────────────────────────
const SYNTHETIC_EXTWALL_BANDS: Spec5ExtWallBand[] = [
  {
    minDistanceM: 0,
    maxDistanceM: 1.5,
    frl: { structural: 90, integrity: 90, insulation: 90 },
    openingTreatment: "openings not permitted (synthetic)",
  },
  {
    minDistanceM: 1.5,
    maxDistanceM: 3,
    frl: { structural: 60, integrity: 60, insulation: 60 },
    openingTreatment: "openings protected (synthetic)",
  },
  {
    minDistanceM: 3,
    maxDistanceM: OVER,
    frl: { structural: null, integrity: null, insulation: null },
    openingTreatment: "no special treatment (synthetic)",
  },
];

const spec5ExtWall: Spec5ExtWallTable = Object.fromEntries(
  CONSTRUCTION_TYPES.map((type) => [
    type,
    verified<Spec5ExtWallBand[]>(
      SYNTHETIC_EXTWALL_BANDS,
      `${SRC} — Spec 5 ext-wall Type ${type}`,
    ),
  ]),
) as Spec5ExtWallTable;

// ─────────────────────────────────────────────────────────────────────────────
// Spec 17 — synthetic complying-system definition (string, for the concession).
// ─────────────────────────────────────────────────────────────────────────────
const spec17: Spec17Conditions = {
  compliesDefinition: verified<string>(
    "SYNTHETIC: a sprinkler system is treated as complying for fixture tests (excludes FPAA101D/H).",
    `${SRC} — Spec 17 complying definition`,
  ),
};

/**
 * The frozen synthetic data layer. Import this ONLY from test files. Every value
 * is `verified: true` so `isUsable()` returns true and the engine computes real
 * pass/fail branches against it — proving the logic before real data lands.
 */
export const syntheticDataLayer: NccDataLayer = {
  c2d2,
  c3d3,
  c3d4Caps,
  c3d5OpenSpace,
  c4d4,
  spec5Frl,
  spec5ExtWall,
  spec17,
  meta: {
    edition: "SYNTHETIC FIXTURE — NOT NCC 2022 Volume One",
    note: "Invented test values. Not for any real compliance decision.",
  },
};
