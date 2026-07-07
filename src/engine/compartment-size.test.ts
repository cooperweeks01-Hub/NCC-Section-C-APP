import { describe, expect, it } from "vitest";
import type { BuildingInput, Compartment } from "../domain/building.ts";
import { nccData } from "../data/index.ts";
import { assessCompartmentSize } from "./compartment-size.ts";

/**
 * WS-2 · Compartment size (Table C3D3) — against the REAL verified layer.
 * Real C3D3 (verified extract §2): group {5} = A 8000/B 5500/C 3000 (m²);
 * group {7a,7b,8} = A 5000/B 3500/C 2000 (m²). 7a groups with 7b/8 HERE.
 */
function comp(overrides: Partial<Compartment> = {}): Compartment {
  return {
    id: "c1",
    name: "Compartment 1",
    floorAreaM2: 1000,
    volumeM3: 5000,
    sizeExemption: null,
    externalWalls: [],
    ...overrides,
  };
}
function inp(overrides: Partial<BuildingInput> = {}): BuildingInput {
  return {
    buildingClass: "8",
    riseInStoreys: 1,
    effectiveHeightM: 8,
    sprinkleredToSpec17: null,
    openSpaceAroundBuildingM: null,
    perimeterAccess6mWide: null,
    perimeterAccessWithin18m: null,
    compartments: [],
    fireWallsSeparateCompartments: false,
    ...overrides,
  };
}
const data = nccData;

describe("WS-2 compartment size — pass/fail against C3D3", () => {
  it("within both limits ⇒ complies with the numbers cited", () => {
    const c = comp({ floorAreaM2: 4000, volumeM3: 25000 }); // Class 8 Type A: 5000/30000
    const r = assessCompartmentSize({ input: inp({ compartments: [c] }), data, compartment: c, requiredType: "A" });
    expect(r.status).toBe("complies");
    expect(r.detail.areaWithinLimit).toBe(true);
    expect(r.detail.maxFloorAreaM2).toBe(5000);
    expect(r.usesUnverifiedData).toBe(false);
    expect(r.detail.routedToLargeIsolated).toBe(false);
  });

  it("WORKED EXAMPLE: Type C Class 8 over-compartment fails and routes to C3D4", () => {
    // Class 8 Type C limit = 2000 m² / 12,000 m³ (group 7a/7b/8).
    const c = comp({ name: "Warehouse", floorAreaM2: 5000, volumeM3: 25000 });
    const r = assessCompartmentSize({ input: inp({ buildingClass: "8", compartments: [c] }), data, compartment: c, requiredType: "C" });
    expect(r.status).toBe("fails");
    expect(r.clauseRef).toBe("C3D3");
    expect(r.tableRef).toBe("Table C3D3");
    expect(r.detail.areaWithinLimit).toBe(false);
    expect(r.detail.routedToLargeIsolated).toBe(true);
    // Subdivide: ceil(5000/2000)=3, ceil(25000/12000)=3 ⇒ 3 compartments.
    expect(r.detail.subdivide?.targetCompartmentCount).toBe(3);
    expect(r.detail.subdivide?.targetMaxFloorAreaM2).toBe(2000);
    // Fire-wall FRL pulled from Spec 5 (Type C common/fire wall = 90/90/90).
    expect(r.detail.subdivide?.requiredFireWallFrl).toEqual({ structural: 90, integrity: 90, insulation: 90 });
  });
});

describe("WS-2 class grouping: 7a groups with 7b/8 for C3D3 (NOT with 5)", () => {
  it("a 2,500 m² Type C compartment fails for Class 7a but passes for Class 5", () => {
    const c = comp({ floorAreaM2: 2500, volumeM3: 10000 });
    // Class 7a ⇒ group {7a,7b,8}, Type C limit 2000 ⇒ exceeds.
    const r7a = assessCompartmentSize({ input: inp({ buildingClass: "7a", compartments: [c] }), data, compartment: c, requiredType: "C" });
    expect(r7a.status).toBe("fails");
    // Class 5 ⇒ group {5}, Type C limit 3000 ⇒ within.
    const r5 = assessCompartmentSize({ input: inp({ buildingClass: "5", compartments: [c] }), data, compartment: c, requiredType: "C" });
    expect(r5.status).toBe("complies");
  });
});

describe("WS-2 carpark carve-out (verified extract note 2)", () => {
  it("an open-deck carpark skips the C3D3 size check entirely", () => {
    const c = comp({ name: "Deck", floorAreaM2: 9999, volumeM3: 99999, sizeExemption: "openDeckCarpark" });
    const r = assessCompartmentSize({ input: inp({ buildingClass: "7a", compartments: [c] }), data, compartment: c, requiredType: "C" });
    expect(r.status).toBe("complies");
    expect(r.detail.sizeExemption).toBe("openDeckCarpark");
    // No comparison was made — limits stay null, never the 2,000 m² Type C limit.
    expect(r.detail.maxFloorAreaM2).toBeNull();
    expect(r.detail.routedToLargeIsolated).toBe(false);
    expect(r.clauseRef).toBe("C3D2(1)");
  });
});

describe("WS-2 safe degradation", () => {
  it("undetermined Type ⇒ insufficient-input, no DRAFT flag (data is verified)", () => {
    const c = comp();
    const r = assessCompartmentSize({ input: inp({ compartments: [c] }), data, compartment: c, requiredType: null });
    expect(r.status).toBe("insufficient-input");
    expect(r.usesUnverifiedData).toBe(false);
  });

  it("out-of-scope class ⇒ not assessed", () => {
    const c = comp();
    const r = assessCompartmentSize({ input: inp({ buildingClass: "6", compartments: [c] }), data, compartment: c, requiredType: "C" });
    expect(r.status).toBe("insufficient-input");
    expect(r.usesUnverifiedData).toBe(false);
    expect(r.summary).toMatch(/out of scope/i);
  });
});
