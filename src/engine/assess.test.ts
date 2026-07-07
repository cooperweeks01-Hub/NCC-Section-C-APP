import { describe, expect, it } from "vitest";
import type { BuildingInput, Compartment, ExternalWall } from "../domain/building.ts";
import type { FrlScheduleDetail, TypeOfConstructionDetail } from "../domain/result.ts";
import { nccData } from "../data/index.ts";
import { assessProject } from "./assess.ts";

/**
 * Phase C · orchestrator integration — the three DoD worked examples (brief §9)
 * plus the sprinkler-gating rule. Per-rule tests call rules directly; these prove
 * they wire together, that the C3D4 question surfaces only at the decision point,
 * and that multi-compartment results scope by compartmentId.
 */
function wall(overrides: Partial<ExternalWall> = {}): ExternalWall {
  return { id: "w1", name: "Wall", distanceToFireSourceFeatureM: 6, loadbearing: true, hasOpenings: false, angleToAdjacentOpeningDeg: null, ...overrides };
}
function comp(overrides: Partial<Compartment> = {}): Compartment {
  return { id: "c1", name: "Compartment 1", floorAreaM2: 1000, volumeM3: 5000, sizeExemption: null, externalWalls: [], ...overrides };
}
function project(overrides: Partial<BuildingInput> = {}): BuildingInput {
  return {
    buildingClass: "8",
    riseInStoreys: 1,
    effectiveHeightM: 8,
    sprinkleredToSpec17: null,
    openSpaceAroundBuildingM: null,
    perimeterAccess6mWide: null,
    perimeterAccessWithin18m: null,
    compartments: [comp()],
    fireWallsSeparateCompartments: false,
    ...overrides,
  };
}

describe("WORKED EXAMPLE 1 — Type C Class 8 over-compartment routes through C3D4", () => {
  it("size fails and routes to C3D4; unanswered concession ⇒ insufficient-input, no DRAFT", () => {
    const input = project({ buildingClass: "8", riseInStoreys: 1, compartments: [comp({ floorAreaM2: 5000, volumeM3: 25000 })] });
    const { requiredType, results } = assessProject(input, nccData);
    expect(requiredType).toBe("C");
    expect(results.find((r) => r.check === "CompartmentSize")!.status).toBe("fails");
    const li = results.find((r) => r.check === "LargeIsolated");
    expect(li).toBeDefined(); // routed → the C3D4 question surfaces here
    expect(li!.status).toBe("insufficient-input"); // caps verified; questions unanswered
    expect(li!.usesUnverifiedData).toBe(false);
  });

  it("a large OVER-CAPS building resolves via the sprinkler pathway (C3D5(2)) end-to-end", () => {
    // 25,000 m² is over the 18,000 m² cap — only pathway B can save it.
    const input = project({
      buildingClass: "8",
      riseInStoreys: 1,
      sprinkleredToSpec17: true,
      perimeterAccess6mWide: true,
      perimeterAccessWithin18m: true,
      compartments: [comp({ floorAreaM2: 25000, volumeM3: 130000 })],
    });
    const { results } = assessProject(input, nccData);
    const li = results.find((r) => r.check === "LargeIsolated")!;
    expect(li.status).toBe("complies");
    expect(li.pathway).toMatch(/C3D5\(2\)/);
  });
});

describe("GATING — the sprinkler question is asked ONLY at the decision point", () => {
  it("a size-compliant compartment produces NO LargeIsolated result", () => {
    // Class 8 rise 4 → A, limit 5000/30000; compartment 4000/25000 is within.
    const input = project({ riseInStoreys: 4, compartments: [comp({ floorAreaM2: 4000, volumeM3: 25000 })] });
    const { requiredType, results } = assessProject(input, nccData);
    expect(requiredType).toBe("A");
    expect(results.find((r) => r.check === "CompartmentSize")!.status).toBe("complies");
    expect(results.some((r) => r.check === "LargeIsolated")).toBe(false);
  });
});

describe("WORKED EXAMPLE 2 — multi-compartment building, results scoped by compartmentId", () => {
  it("assesses each compartment independently; building-level results appear once", () => {
    const c1 = comp({ id: "c1", name: "Office", floorAreaM2: 2000, volumeM3: 10000, externalWalls: [wall({ id: "c1w1" })] });
    const c2 = comp({ id: "c2", name: "Store", floorAreaM2: 9000, volumeM3: 50000, externalWalls: [wall({ id: "c2w1", distanceToFireSourceFeatureM: 1.0 })] });
    const input = project({ buildingClass: "5", riseInStoreys: 3, fireWallsSeparateCompartments: true, compartments: [c1, c2] });
    const { requiredType, results } = assessProject(input, nccData);
    expect(requiredType).toBe("B"); // Class 5 rise 3

    // Each compartment's per-compartment results scope to it.
    const c1Results = results.filter((r) => r.compartmentId === "c1");
    const c2Results = results.filter((r) => r.compartmentId === "c2");
    expect(c1Results.map((r) => r.check).sort()).toEqual(["CompartmentSize", "SetbackSeparation"]);
    // c2 (9000 m² > 5500 Type B limit for Class 5) fails and routes to C3D4.
    expect(c2Results.map((r) => r.check).sort()).toEqual(["CompartmentSize", "LargeIsolated", "SetbackSeparation"]);
    expect(c2Results.find((r) => r.check === "CompartmentSize")!.status).toBe("fails");

    // Building-level results carry no compartmentId and appear exactly once.
    const buildingLevel = results.filter((r) => r.compartmentId === undefined);
    expect(buildingLevel.filter((r) => r.check === "TypeOfConstruction")).toHaveLength(1);
    expect(buildingLevel.filter((r) => r.check === "FrlSchedule")).toHaveLength(1);
  });
});

describe("WORKED EXAMPLE 3 — setback / external-wall FRL flows through the orchestrator", () => {
  it("a Class 8 Type A wall at 6 m yields the determined Spec 5 FRL", () => {
    const input = project({ riseInStoreys: 4, compartments: [comp({ floorAreaM2: 1000, volumeM3: 5000, externalWalls: [wall({ distanceToFireSourceFeatureM: 6, loadbearing: true })] })] });
    const { results } = assessProject(input, nccData);
    const setback = results.find((r) => r.check === "SetbackSeparation")!;
    expect(setback.status).toBe("determined");
    expect(setback.detail).toMatchObject({ walls: [{ requiredExtWallFrl: { structural: 240, integrity: 180, insulation: 90 }, clauseRef: "S5C11a" }] });
  });
});

describe("construction-type escalation (Type C → B → A)", () => {
  const typeDetail = (input: ReturnType<typeof project>) =>
    assessProject(input, nccData).results.find((r) => r.check === "TypeOfConstruction")!.detail as TypeOfConstructionDetail;

  it("suggests upgrading Type when a higher Type's C3D3 limit would fit (4,000 m² Class 8: C✗ B✗ A✓)", () => {
    // Class 8 rise 1 → required min C. Type C limit 2000, B 3500, A 5000 (m²).
    const input = project({ buildingClass: "8", riseInStoreys: 1, compartments: [comp({ floorAreaM2: 4000, volumeM3: 20000 })] });
    const d = typeDetail(input);
    expect(d.requiredType).toBe("C");
    expect(d.typeTrials?.map((t) => [t.type, t.allCompartmentsFit])).toEqual([["C", false], ["B", false], ["A", true]]);
    expect(d.sizeUpgradeSuggestion).toBe("A");
  });

  it("applying the upgrade recomputes the whole assessment at the new Type", () => {
    const input = project({ buildingClass: "8", riseInStoreys: 1, constructionTypeOverride: "A", compartments: [comp({ floorAreaM2: 4000, volumeM3: 20000 })] });
    const { effectiveType, results } = assessProject(input, nccData);
    expect(effectiveType).toBe("A");
    // Now within the Type A limit ⇒ complies, and NOT routed to the concession.
    expect(results.find((r) => r.check === "CompartmentSize")!.status).toBe("complies");
    expect(results.some((r) => r.check === "LargeIsolated")).toBe(false);
    // FRL schedule + type detail reflect the upgraded Type.
    expect((results.find((r) => r.check === "FrlSchedule")!.detail as { type: string }).type).toBe("A");
    expect(typeDetail(input).overriddenTo).toBe("A");
  });

  it("offers NO upgrade when even Type A can't fit (over-caps compartment) — concession only", () => {
    const input = project({ buildingClass: "8", riseInStoreys: 1, compartments: [comp({ floorAreaM2: 25000, volumeM3: 130000 })] });
    const d = typeDetail(input);
    expect(d.sizeUpgradeSuggestion).toBeNull();
    expect(d.typeTrials?.every((t) => !t.allCompartmentsFit)).toBe(true);
    expect(assessProject(input, nccData).results.some((r) => r.check === "LargeIsolated")).toBe(true);
  });

  it("ignores an override that is LESS onerous than the required minimum", () => {
    // Rise 5 → required min A; a 'C' override must be ignored (can't build less onerous).
    const input = project({ buildingClass: "8", riseInStoreys: 5, constructionTypeOverride: "C", compartments: [comp({ floorAreaM2: 1000, volumeM3: 5000 })] });
    const { effectiveType } = assessProject(input, nccData);
    expect(effectiveType).toBe("A");
    expect(typeDetail(input).overriddenTo).toBeNull();
  });
});

describe("per-compartment class (fire-separated multi-class building)", () => {
  it("assesses each compartment against its OWN class — Class 5 fits where Class 7b fails", () => {
    // 2,500 m²: within the Class 5 Type C limit (3,000) but over the Class 7b limit (2,000).
    const c5 = comp({ id: "office", name: "Office", buildingClass: "5", floorAreaM2: 2500, volumeM3: 10000 });
    const c7b = comp({ id: "store", name: "Warehouse", buildingClass: "7b", floorAreaM2: 2500, volumeM3: 10000 });
    const input = project({ buildingClass: "5", riseInStoreys: 1, fireWallsSeparateCompartments: true, compartments: [c5, c7b] });
    const { results } = assessProject(input, nccData);
    expect(results.find((r) => r.check === "CompartmentSize" && r.compartmentId === "office")!.status).toBe("complies");
    expect(results.find((r) => r.check === "CompartmentSize" && r.compartmentId === "store")!.status).toBe("fails");
  });

  it("produces one FRL schedule per distinct class", () => {
    const c5 = comp({ id: "office", buildingClass: "5", floorAreaM2: 1000, volumeM3: 5000 });
    const c7b = comp({ id: "store", buildingClass: "7b", floorAreaM2: 1000, volumeM3: 5000 });
    const input = project({ buildingClass: "5", riseInStoreys: 1, fireWallsSeparateCompartments: true, compartments: [c5, c7b] });
    const frls = assessProject(input, nccData).results.filter((r) => r.check === "FrlSchedule");
    expect(frls.map((r) => (r.detail as FrlScheduleDetail).assessedClass).sort()).toEqual(["5", "7b"]);
  });

  it("a single-class building still yields exactly one FRL schedule", () => {
    const frls = assessProject(project({ buildingClass: "8", riseInStoreys: 1 }), nccData).results.filter((r) => r.check === "FrlSchedule");
    expect(frls).toHaveLength(1);
  });

  it("flags C3D4(c) (6 m / one-building) when the concession is used in a multi-part building — as a verify-only note", () => {
    const big = comp({ id: "store", floorAreaM2: 25000, volumeM3: 130000 }); // over caps ⇒ routed
    const small = comp({ id: "office", floorAreaM2: 1000, volumeM3: 5000 });
    const input = project({ buildingClass: "8", riseInStoreys: 1, fireWallsSeparateCompartments: true, compartments: [big, small] });
    const flag = assessProject(input, nccData).results.find((r) => r.check === "KnockOnFlag" && r.clauseRef === "C3D4(c)");
    expect(flag).toBeDefined();
    expect(flag!.status).toBe("flag");
    expect(flag!.summary).toMatch(/verify/i); // consideration, not an assertion
  });

  it("does NOT flag C3D4(c) for a single-compartment building", () => {
    const input = project({ buildingClass: "8", riseInStoreys: 1, compartments: [comp({ floorAreaM2: 25000, volumeM3: 130000 })] });
    expect(assessProject(input, nccData).results.some((r) => r.clauseRef === "C3D4(c)")).toBe(false);
  });
});

describe("orchestrator flags, advisories, and out-of-scope", () => {
  it("effective height > 25 m raises the E1D5 sprinkler flag", () => {
    const input = project({ effectiveHeightM: 30 });
    const flags = assessProject(input, nccData).results.filter((r) => r.check === "KnockOnFlag");
    expect(flags.some((r) => r.clauseRef === "E1D5")).toBe(true);
  });

  it("always surfaces §6.8 advisory cross-references", () => {
    const advisories = assessProject(project(), nccData).results.filter((r) => r.check === "Advisory");
    expect(advisories.length).toBeGreaterThanOrEqual(3);
    expect(advisories.every((r) => r.status === "advisory")).toBe(true);
  });

  it("an out-of-scope class is not assessed beyond the scope notice", () => {
    const { inScope, results } = assessProject(project({ buildingClass: "9a" }), nccData);
    expect(inScope).toBe(false);
    expect(results).toHaveLength(1);
    expect(results[0]!.summary).toMatch(/out of scope/i);
  });
});
