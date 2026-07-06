import { describe, expect, it } from "vitest";
import type {
  BuildingInput,
  Compartment,
  ConstructionType,
  ExternalWall,
  FRL,
} from "../domain/building.ts";
import { nccData } from "../data/index.ts";
import { assessSetbackSeparation } from "./setback-separation.ts";

/**
 * WS-3 · Setback / external-wall FRL (Spec 5) + C4D4 separation — real verified
 * layer. Distance bands are `[min, max)`; C4D4 angle bands use per-band
 * inclusivity. Boundary cases are asserted explicitly (advisor).
 */
function wall(overrides: Partial<ExternalWall> = {}): ExternalWall {
  return {
    id: "w1",
    name: "Wall",
    distanceToFireSourceFeatureM: 6,
    loadbearing: true,
    hasOpenings: false,
    angleToAdjacentOpeningDeg: null,
    ...overrides,
  };
}
function inp(cls: BuildingInput["buildingClass"], walls: ExternalWall[]): { input: BuildingInput; compartment: Compartment } {
  const compartment: Compartment = {
    id: "c1",
    name: "Compartment 1",
    floorAreaM2: 1000,
    volumeM3: 5000,
    sizeExemption: null,
    externalWalls: walls,
  };
  const input: BuildingInput = {
    buildingClass: cls,
    riseInStoreys: 4,
    effectiveHeightM: 12,
    sprinkleredToSpec17: null,
    openSpaceAroundBuildingM: null,
    perimeterVehicularAccess: null,
    compartments: [compartment],
    fireWallsSeparateCompartments: false,
  };
  return { input, compartment };
}
/** Assess a single wall and return its computed FRL result. */
function oneWall(cls: BuildingInput["buildingClass"], type: ConstructionType, w: ExternalWall) {
  const { input, compartment } = inp(cls, [w]);
  const r = assessSetbackSeparation({ input, data: nccData, compartment, requiredType: type });
  return { r, wallResult: r.detail.walls[0]! };
}
const frl = (s: number | null, i: number | null, n: number | null): FRL => ({ structural: s, integrity: i, insulation: n });

describe("WS-3 external-wall FRL by distance (worked example + boundaries)", () => {
  it("WORKED EXAMPLE: Class 8 Type A loadbearing wall at 6 m ⇒ 240/180/90, cites S5C11a", () => {
    const { r, wallResult } = oneWall("8", "A", wall({ distanceToFireSourceFeatureM: 6, loadbearing: true }));
    expect(r.status).toBe("determined");
    expect(r.usesUnverifiedData).toBe(false);
    expect(wallResult.requiredExtWallFrl).toEqual(frl(240, 180, 90));
    expect(wallResult.clauseRef).toBe("S5C11a");
  });

  it("distance bands are [min, max): 1.0 / 1.5 / 3.0 land in the right band (Class 5 Type A loadbearing)", () => {
    // S5C11a Class 5/7a: <1.5 ⇒ 120/120/120; 1.5–<3 ⇒ 120/90/90; ≥3 ⇒ 120/60/30.
    expect(oneWall("5", "A", wall({ distanceToFireSourceFeatureM: 1.0 })).wallResult.requiredExtWallFrl).toEqual(frl(120, 120, 120));
    expect(oneWall("5", "A", wall({ distanceToFireSourceFeatureM: 1.5 })).wallResult.requiredExtWallFrl).toEqual(frl(120, 90, 90));
    expect(oneWall("5", "A", wall({ distanceToFireSourceFeatureM: 3.0 })).wallResult.requiredExtWallFrl).toEqual(frl(120, 60, 30));
  });

  it("loadbearing vs non-loadbearing select different Spec 5 elements (Type A)", () => {
    const lb = oneWall("5", "A", wall({ distanceToFireSourceFeatureM: 1.0, loadbearing: true }));
    const nlb = oneWall("5", "A", wall({ distanceToFireSourceFeatureM: 1.0, loadbearing: false }));
    expect(lb.wallResult.requiredExtWallFrl).toEqual(frl(120, 120, 120)); // S5C11a
    expect(lb.wallResult.clauseRef).toBe("S5C11a");
    expect(nlb.wallResult.requiredExtWallFrl).toEqual(frl(null, 120, 120)); // S5C11b, "–" structural
    expect(nlb.wallResult.clauseRef).toBe("S5C11b");
  });

  it("Type C uses the single 'parts of external walls' table regardless of loadbearing", () => {
    const w = oneWall("5", "C", wall({ distanceToFireSourceFeatureM: 1.0, loadbearing: false }));
    expect(w.wallResult.requiredExtWallFrl).toEqual(frl(90, 90, 90)); // S5C24a
    expect(w.wallResult.clauseRef).toBe("S5C24a");
  });
});

describe("WS-3 Spec 5 grouping: 7a groups with 5 (opposite of C3D3)", () => {
  it("Type A loadbearing wall at 1.0 m: Class 7a ⇒ 120/.., Class 7b ⇒ 240/..", () => {
    // Proves the per-table grouping: 7a is in {5,7a} for Spec 5 (not {7a,7b,8}).
    expect(oneWall("7a", "A", wall({ distanceToFireSourceFeatureM: 1.0 })).wallResult.requiredExtWallFrl).toEqual(frl(120, 120, 120));
    expect(oneWall("7b", "A", wall({ distanceToFireSourceFeatureM: 1.0 })).wallResult.requiredExtWallFrl).toEqual(frl(240, 240, 240));
  });
});

describe("WS-3 C4D4 opening separation by angle (boundaries)", () => {
  function sepAt(angle: number): number | null {
    const w = wall({ hasOpenings: true, angleToAdjacentOpeningDeg: angle });
    return oneWall("5", "A", w).wallResult.openingSeparation?.requiredSeparationM ?? null;
  }
  it("angle boundaries land in the correct band (0/45/90/135/180)", () => {
    expect(sepAt(0)).toBe(6); // 0° singleton
    expect(sepAt(45)).toBe(5); // > 0° to 45°
    expect(sepAt(90)).toBe(4); // > 45° to 90°
    expect(sepAt(135)).toBe(3); // > 90° to 135°
    expect(sepAt(179)).toBe(2); // > 135° to < 180°
    expect(sepAt(180)).toBeNull(); // ≥ 180° ⇒ Nil
  });

  it("openings but no angle supplied ⇒ separation not computed, noted", () => {
    const w = oneWall("5", "A", wall({ hasOpenings: true, angleToAdjacentOpeningDeg: null }));
    expect(w.wallResult.openingSeparation?.requiredSeparationM).toBeNull();
    expect(w.wallResult.openingSeparation?.note).toMatch(/angle/i);
  });
});

describe("WS-3 safe degradation", () => {
  it("undetermined Type ⇒ insufficient-input, no DRAFT flag", () => {
    const { input, compartment } = inp("8", [wall()]);
    const r = assessSetbackSeparation({ input, data: nccData, compartment, requiredType: null });
    expect(r.status).toBe("insufficient-input");
    expect(r.usesUnverifiedData).toBe(false);
    expect(r.detail.walls).toHaveLength(1);
  });
});
