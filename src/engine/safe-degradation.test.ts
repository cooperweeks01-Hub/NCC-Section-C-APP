import { describe, expect, it } from "vitest";
import type { BuildingInput, Compartment } from "../domain/building.ts";
import type { ProjectState } from "../domain/project.ts";
import { PROJECT_SCHEMA_VERSION } from "../domain/project.ts";
import { nccData } from "../data/index.ts";
import { assessProject } from "./assess.ts";
import { assessTypeOfConstruction } from "./type-of-construction.ts";
import { assessCompartmentSize } from "./compartment-size.ts";
import { assessLargeIsolated } from "./large-isolated.ts";
import { assessSetbackSeparation } from "./setback-separation.ts";
import { assessFrlSchedule } from "./frl-schedule.ts";

/**
 * Behaviour against the REAL (now fully verified for Class 5/7a/7b/8) data layer.
 * Two properties (plan §5.1, advisor):
 *  - Rules whose data is verified COMPUTE (they no longer degrade on the caps).
 *  - Degradation is now purely a MISSING-INPUT state — undetermined Type,
 *    unanswered concession questions, or an out-of-scope class — and it carries
 *    `usesUnverifiedData: false`, so it never raises a false DRAFT banner. (Spec 17
 *    is the only remaining placeholder and is not consulted by any decision.)
 */
const compartment: Compartment = {
  id: "c1",
  name: "Compartment 1",
  floorAreaM2: 5000,
  volumeM3: 25000,
  sizeExemption: null,
  externalWalls: [
    { id: "w1", name: "North wall", distanceToFireSourceFeatureM: 6, loadbearing: true, hasOpenings: true, angleToAdjacentOpeningDeg: null },
  ],
};
const input: BuildingInput = {
  buildingClass: "8",
  riseInStoreys: 1,
  effectiveHeightM: 8,
  sprinkleredToSpec17: null,
  openSpaceAroundBuildingM: null,
  perimeterAccess6mWide: null,
  perimeterAccessWithin18m: null,
  compartments: [compartment],
  fireWallsSeparateCompartments: false,
};

describe("engine behaviour against the real verified layer", () => {
  it("type of construction COMPUTES (Class 8, rise 1 → C), no DRAFT", () => {
    const r = assessTypeOfConstruction({ input, data: nccData });
    expect(r.status).toBe("determined");
    expect(r.usesUnverifiedData).toBe(false);
    expect(r.detail.requiredType).toBe("C");
  });

  it("large isolated COMPUTES on verified caps; unanswered concession ⇒ insufficient-input, no DRAFT", () => {
    const r = assessLargeIsolated({ input, data: nccData, compartment });
    expect(r.status).toBe("insufficient-input");
    expect(r.usesUnverifiedData).toBe(false); // caps verified — the inputs are missing, not the data
    expect(r.detail.eligible).toBe(true); // 5000/25000 within 18,000/108,000
  });

  it("compartment size / setback / FRL degrade on an undetermined Type — never a DRAFT", () => {
    const size = assessCompartmentSize({ input, data: nccData, compartment, requiredType: null });
    const setback = assessSetbackSeparation({ input, data: nccData, compartment, requiredType: null });
    const frl = assessFrlSchedule({ input, data: nccData, requiredType: null });
    for (const r of [size, setback, frl]) {
      expect(r.status).toBe("insufficient-input");
      expect(r.usesUnverifiedData).toBe(false);
    }
  });

  it("a fully-answered in-scope assessment uses NO unverified data (DRAFT is off)", () => {
    const answered: BuildingInput = { ...input, sprinkleredToSpec17: true, perimeterAccess6mWide: true, perimeterAccessWithin18m: true };
    const { results } = assessProject(answered, nccData);
    expect(results.every((r) => r.usesUnverifiedData === false)).toBe(true);
    // The routed compartment now RESOLVES via the sprinkler pathway.
    expect(results.find((r) => r.check === "LargeIsolated")?.status).toBe("complies");
  });
});

/**
 * Aggregation seam (plan §4): heterogeneous typed results collect into
 * `ProjectState.results` and round-trip through JSON unchanged.
 */
describe("aggregation seam: typed rule results collect into ProjectState.results", () => {
  it("accepts heterogeneous rule results and round-trips through JSON", () => {
    const project: ProjectState = {
      id: "p1",
      schemaVersion: PROJECT_SCHEMA_VERSION,
      meta: { projectName: "Seam test", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
      input,
      results: [
        assessTypeOfConstruction({ input, data: nccData }),
        assessFrlSchedule({ input, data: nccData, requiredType: null }),
      ],
    };
    expect(project.results.map((r) => r.check)).toEqual(["TypeOfConstruction", "FrlSchedule"]);
    expect(JSON.parse(JSON.stringify(project))).toEqual(project);
  });
});
