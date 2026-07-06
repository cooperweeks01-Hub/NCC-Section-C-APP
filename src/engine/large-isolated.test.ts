import { describe, expect, it } from "vitest";
import type { BuildingInput, Compartment } from "../domain/building.ts";
import { nccData } from "../data/index.ts";
import { syntheticDataLayer } from "../data/__fixtures__/synthetic-data-layer.ts";
import { assessLargeIsolated } from "./large-isolated.ts";

/**
 * WS-2 · Large isolated (C3D4 + C3D5). The real caps are unverified, so branch
 * logic is proven against the fixture (caps 20,000 m² / 120,000 m³; open-space
 * width 15 m). The real-layer degradation is asserted in safe-degradation.test.
 */
function comp(overrides: Partial<Compartment> = {}): Compartment {
  return {
    id: "c1",
    name: "Big shed",
    floorAreaM2: 5000,
    volumeM3: 25000,
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
    perimeterVehicularAccess: null,
    compartments: [],
    fireWallsSeparateCompartments: false,
    ...overrides,
  };
}
const fx = syntheticDataLayer;

describe("WS-2 large isolated — the sprinkler question is asked HERE", () => {
  it("degrades on the real layer (C3D4 caps deliberately unverified)", () => {
    const c = comp();
    const r = assessLargeIsolated({ input: inp(), data: nccData, compartment: c });
    expect(r.status).toBe("insufficient-input");
    expect(r.detail.eligible).toBeNull();
  });

  it("eligible + open-space pathway satisfied ⇒ complies via C3D5(1)", () => {
    const c = comp({ floorAreaM2: 5000, volumeM3: 25000 });
    const r = assessLargeIsolated({
      input: inp({ openSpaceAroundBuildingM: 20 }), // ≥ 15 fixture width
      data: fx,
      compartment: c,
    });
    expect(r.status).toBe("complies");
    expect(r.detail.eligible).toBe(true);
    expect(r.detail.satisfiedPathway).toBe("openSpace");
    expect(r.pathway).toMatch(/open space/i);
  });

  it("eligible + sprinklers & perimeter access ⇒ complies via C3D5(2)", () => {
    const c = comp();
    const r = assessLargeIsolated({
      input: inp({ sprinkleredToSpec17: true, perimeterVehicularAccess: true }),
      data: fx,
      compartment: c,
    });
    expect(r.status).toBe("complies");
    expect(r.detail.satisfiedPathway).toBe("sprinklerPerimeter");
  });

  it("over the cap ⇒ not eligible, subdivision required", () => {
    const c = comp({ floorAreaM2: 25000, volumeM3: 130000 }); // > 20,000 / 120,000
    const r = assessLargeIsolated({ input: inp(), data: fx, compartment: c });
    expect(r.status).toBe("fails");
    expect(r.detail.eligible).toBe(false);
  });

  it("eligible but no pathway inputs yet ⇒ insufficient-input (asks the question)", () => {
    const c = comp();
    const r = assessLargeIsolated({ input: inp(), data: fx, compartment: c });
    expect(r.status).toBe("insufficient-input");
    expect(r.detail.eligible).toBe(true);
    expect(r.detail.pathwayB.missing).toMatch(/sprinkler/i);
  });

  it("eligible but both pathways fail ⇒ fails, each gap named", () => {
    const c = comp();
    const r = assessLargeIsolated({
      input: inp({ openSpaceAroundBuildingM: 10, sprinkleredToSpec17: false, perimeterVehicularAccess: false }),
      data: fx,
      compartment: c,
    });
    expect(r.status).toBe("fails");
    expect(r.detail.pathwayA.satisfied).toBe(false);
    expect(r.detail.pathwayA.missing).toMatch(/needs ≥ 15 m/);
    expect(r.detail.pathwayB.satisfied).toBe(false);
  });
});
