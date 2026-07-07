import { describe, expect, it } from "vitest";
import type { BuildingInput, Compartment } from "../domain/building.ts";
import { nccData } from "../data/index.ts";
import { assessLargeIsolated } from "./large-isolated.ts";

/**
 * WS-2 · Large isolated (C3D4 + C3D5), two independent pathways, against the
 * VERIFIED layer (caps 18,000 m² / 108,000 m³; open space ≥ 18 m; access ≥ 6 m
 * within 18 m). The headline correctness point: the caps bound ONLY pathway A —
 * pathway B (sprinklers + perimeter access) has no size limit.
 */
function comp(overrides: Partial<Compartment> = {}): Compartment {
  return { id: "c1", name: "Shed", floorAreaM2: 5000, volumeM3: 25000, sizeExemption: null, externalWalls: [], ...overrides };
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
const run = (input: BuildingInput, c: Compartment) => assessLargeIsolated({ input, data, compartment: c });

describe("WS-2 large isolated — pathway B (sprinklers) has NO size cap", () => {
  it("a building OVER the caps qualifies via C3D5(2) when sprinklered + access", () => {
    // 25,000 m² / 130,000 m³ — well over 18,000 / 108,000.
    const c = comp({ floorAreaM2: 25000, volumeM3: 130000 });
    const r = run(inp({ sprinkleredToSpec17: true, perimeterAccess6mWide: true, perimeterAccessWithin18m: true }), c);
    expect(r.status).toBe("complies");
    expect(r.detail.satisfiedPathway).toBe("sprinklerPerimeter");
    expect(r.detail.eligible).toBe(false); // over caps, but pathway B doesn't care
    expect(r.pathway).toMatch(/C3D5\(2\)/);
    expect(r.usesUnverifiedData).toBe(false);
  });

  it("sprinklered but access not within 18 m ⇒ pathway B fails", () => {
    const c = comp({ floorAreaM2: 25000, volumeM3: 130000 });
    const r = run(inp({ sprinkleredToSpec17: true, perimeterAccess6mWide: true, perimeterAccessWithin18m: false }), c);
    expect(r.status).toBe("fails");
    expect(r.detail.pathwayB.satisfied).toBe(false);
    expect(r.detail.pathwayB.missing).toMatch(/within 18 m/);
  });

  it("6 m access answered yes but the within-18 m question is unanswered ⇒ insufficient-input", () => {
    const c = comp({ floorAreaM2: 25000, volumeM3: 130000 });
    const r = run(inp({ sprinkleredToSpec17: true, perimeterAccess6mWide: true, perimeterAccessWithin18m: null }), c);
    expect(r.status).toBe("insufficient-input");
    expect(r.usesUnverifiedData).toBe(false); // data verified — it's the input that's missing
  });
});

describe("WS-2 large isolated — pathway A (open space) is capped + Class 7/8 + ≤ 2 storeys", () => {
  it("within caps, Class 8, ≤ 2 storeys, open space ≥ 18 m ⇒ complies via C3D5(1)", () => {
    const c = comp({ floorAreaM2: 5000, volumeM3: 25000 });
    const r = run(inp({ riseInStoreys: 1, openSpaceAroundBuildingM: 20 }), c);
    expect(r.status).toBe("complies");
    expect(r.detail.satisfiedPathway).toBe("openSpace");
    expect(r.pathway).toMatch(/C3D5\(1\)/);
  });

  it("Class 5 cannot use the open-space pathway (needs Class 7/8)", () => {
    const c = comp({ floorAreaM2: 2500, volumeM3: 12000 });
    const r = run(inp({ buildingClass: "5", openSpaceAroundBuildingM: 20, sprinkleredToSpec17: false, perimeterAccess6mWide: false }), c);
    expect(r.detail.pathwayA.satisfied).toBe(false);
    expect(r.detail.pathwayA.missing).toMatch(/Class 7 or 8/);
    expect(r.status).toBe("fails"); // B answered no too
  });

  it("> 2 storeys removes the open-space pathway", () => {
    const c = comp({ floorAreaM2: 5000, volumeM3: 25000 });
    const r = run(inp({ riseInStoreys: 3, openSpaceAroundBuildingM: 20, sprinkleredToSpec17: false, perimeterAccess6mWide: false }), c);
    expect(r.detail.pathwayA.satisfied).toBe(false);
    expect(r.detail.pathwayA.missing).toMatch(/storeys/);
  });

  it("over the caps removes the open-space pathway (but not pathway B)", () => {
    const c = comp({ floorAreaM2: 25000, volumeM3: 130000 });
    const r = run(inp({ openSpaceAroundBuildingM: 20, sprinkleredToSpec17: false, perimeterAccess6mWide: false }), c);
    expect(r.detail.pathwayA.satisfied).toBe(false);
    expect(r.detail.pathwayA.missing).toMatch(/caps/);
  });
});

describe("WS-2 large isolated — resolution states", () => {
  it("no concession answers yet ⇒ insufficient-input (asks the questions)", () => {
    const r = run(inp(), comp({ floorAreaM2: 5000, volumeM3: 25000 }));
    expect(r.status).toBe("insufficient-input");
    expect(r.usesUnverifiedData).toBe(false);
  });

  it("all answered, neither pathway met ⇒ fails (subdivide)", () => {
    const c = comp({ floorAreaM2: 5000, volumeM3: 25000 });
    const r = run(inp({ openSpaceAroundBuildingM: 10, sprinkleredToSpec17: false, perimeterAccess6mWide: false }), c);
    expect(r.status).toBe("fails");
    expect(r.detail.pathwayA.satisfied).toBe(false);
    expect(r.detail.pathwayB.satisfied).toBe(false);
    expect(r.summary).toMatch(/subdivision/i);
  });
});
