import { describe, expect, it } from "vitest";
import type { BuildingInput } from "../domain/building.ts";
import { nccData } from "../data/index.ts";
import { syntheticDataLayer } from "../data/__fixtures__/synthetic-data-layer.ts";
import { assessTypeOfConstruction } from "./type-of-construction.ts";

/**
 * WS-1 · Type of construction (Table C2D2) — fixture-backed logic tests.
 *
 * Logic is proven against the SYNTHETIC verified fixture layer (plan §5.2), whose
 * C2D2 ladder is: rise 1–2 ⇒ C, 3–4 ⇒ B, 5+ ⇒ A. These are invented test values,
 * not NCC content. The safe-degradation path against the real null layer is
 * re-asserted here too, so this file states the rule's full contract.
 */

/** Minimal valid building input; per-test overrides set class + rise. */
function building(overrides: Partial<BuildingInput> = {}): BuildingInput {
  return {
    buildingClass: "8",
    riseInStoreys: 4,
    effectiveHeightM: 12,
    sprinkleredToSpec17: null,
    openSpaceAroundBuildingM: null,
    perimeterVehicularAccess: null,
    compartments: [],
    fireWallsSeparateCompartments: false,
    ...overrides,
  };
}

const data = syntheticDataLayer;

describe("WS-1 type of construction — determination against verified C2D2", () => {
  it("band-matches (Class, rise) to the required Type and cites C2D2", () => {
    const r = assessTypeOfConstruction({ input: building({ riseInStoreys: 4 }), data });
    expect(r.detail.requiredType).toBe("B");
    expect(r.clauseRef).toBe("C2D2");
    expect(r.tableRef).toBe("Table C2D2");
    // A determination (not a pass/fail): neutral `determined` status, not draft.
    expect(r.status).toBe("determined");
    expect(r.usesUnverifiedData).toBe(false);
  });

  it("returns the least onerous Type C at the bottom band with no reduce-rise levers", () => {
    const r = assessTypeOfConstruction({ input: building({ riseInStoreys: 1 }), data });
    expect(r.detail.requiredType).toBe("C");
    // Already least onerous: no reduce-rise levers and no concession levers.
    expect(r.detail.levers).toHaveLength(0);
  });
});

describe("WS-1 less-onerous analysis is a real C2D2 re-lookup (never C→B→A brute force)", () => {
  it("steps A→B→C by re-looking-up C2D2 at each reduced rise", () => {
    const r = assessTypeOfConstruction({
      input: building({ buildingClass: "5", riseInStoreys: 6 }),
      data,
    });
    expect(r.detail.requiredType).toBe("A");

    // The reduce-rise levers are exactly those citing C2D2.
    const reduceLevers = r.detail.levers.filter((l) => l.clauseRef === "C2D2");
    // Two distinct less-onerous Types reachable: B (at the top of its band, rise 4)
    // and C (at the top of its band, rise 2) — each the SMALLEST reduction needed.
    expect(reduceLevers.map((l) => l.resultingType)).toEqual(["B", "C"]);
    expect(reduceLevers.map((l) => l.lever)).toEqual([
      "Reduce rise in storeys to 4",
      "Reduce rise in storeys to 2",
    ]);
  });

  it("records the smallest reduction that reaches a less-onerous Type", () => {
    // Class 8, rise 4 ⇒ Type B; only Type C is less onerous, reached by dropping
    // to rise 2 (top of the C band), not rise 1.
    const r = assessTypeOfConstruction({ input: building({ riseInStoreys: 4 }), data });
    const reduceLevers = r.detail.levers.filter((l) => l.clauseRef === "C2D2");
    expect(reduceLevers).toHaveLength(1);
    expect(reduceLevers[0]?.resultingType).toBe("C");
    expect(reduceLevers[0]?.lever).toBe("Reduce rise in storeys to 2");
  });
});

describe("WS-1 concession levers are cited but never computed (no fabrication)", () => {
  it("surfaces C2D5/C2D6 with a null resulting Type when the Type is onerous", () => {
    const r = assessTypeOfConstruction({ input: building({ riseInStoreys: 4 }), data });
    const concessions = r.detail.levers.filter(
      (l) => l.clauseRef === "C2D5" || l.clauseRef === "C2D6",
    );
    expect(concessions.map((l) => l.clauseRef)).toEqual(["C2D5", "C2D6"]);
    // Effect is unverified NCC content — never a fabricated resulting Type.
    expect(concessions.every((l) => l.resultingType === null)).toBe(true);
    expect(concessions.every((l) => /unverified/i.test(l.note ?? ""))).toBe(true);
  });

  it("omits concession levers when the required Type is already the least onerous", () => {
    const r = assessTypeOfConstruction({ input: building({ riseInStoreys: 1 }), data });
    expect(r.detail.levers.some((l) => l.clauseRef.startsWith("C2D5"))).toBe(false);
    expect(r.detail.levers.some((l) => l.clauseRef.startsWith("C2D6"))).toBe(false);
  });
});

describe("WS-1 edge + safe-degradation paths", () => {
  it("an out-of-range rise on verified data is insufficient-input WITHOUT a draft flag", () => {
    const r = assessTypeOfConstruction({ input: building({ riseInStoreys: 0 }), data });
    expect(r.status).toBe("insufficient-input");
    expect(r.detail.requiredType).toBeNull();
    // Data is verified — the input is the problem, so no DRAFT banner.
    expect(r.usesUnverifiedData).toBe(false);
  });

  it("computes against the real VERIFIED C2D2 layer (Class 8, rise 4 → A)", () => {
    // Real Table C2D2: rise ≥ 4 → A, 3 → B, 1–2 → C (differs from the fixture
    // ladder, which is why fixture tests inject the fixture, not nccData).
    const r = assessTypeOfConstruction({ input: building({ riseInStoreys: 4 }), data: nccData });
    expect(r.status).toBe("determined");
    expect(r.usesUnverifiedData).toBe(false);
    expect(r.detail.requiredType).toBe("A");
    // rise 3 → B, rise 2 → C on the real bands.
    expect(assessTypeOfConstruction({ input: building({ riseInStoreys: 3 }), data: nccData }).detail.requiredType).toBe("B");
    expect(assessTypeOfConstruction({ input: building({ riseInStoreys: 2 }), data: nccData }).detail.requiredType).toBe("C");
  });
});
