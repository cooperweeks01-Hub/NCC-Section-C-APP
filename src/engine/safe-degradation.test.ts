import { describe, expect, it } from "vitest";
import type { BuildingInput, Compartment } from "../domain/building.ts";
import type { ProjectState } from "../domain/project.ts";
import { PROJECT_SCHEMA_VERSION } from "../domain/project.ts";
import { nccData } from "../data/index.ts";
import { assessTypeOfConstruction } from "./type-of-construction.ts";
import { assessCompartmentSize } from "./compartment-size.ts";
import { assessLargeIsolated } from "./large-isolated.ts";
import { assessSetbackSeparation } from "./setback-separation.ts";
import { assessFrlSchedule } from "./frl-schedule.ts";

/**
 * Safe-degradation contract (plan §5.1). Against the REAL placeholder data layer
 * — where every NCC value is null/unverified — every rule must return
 * `insufficient-input` with `usesUnverifiedData: true`, never a computed pass/fail.
 * This proves the tool refuses to compute against unverified data (brief §9).
 *
 * Phase B keeps these assertions AND adds fixture-backed logic tests (plan §5.2).
 */
const compartment: Compartment = {
  id: "c1",
  name: "Compartment 1",
  floorAreaM2: 5000,
  volumeM3: 25000,
  externalWalls: [
    { id: "w1", name: "North wall", distanceToFireSourceFeatureM: 6, hasOpenings: true },
  ],
};

const input: BuildingInput = {
  buildingClass: "8",
  riseInStoreys: 1,
  effectiveHeightM: 8,
  sprinkleredToSpec17: null,
  openSpaceAroundBuildingM: null,
  perimeterVehicularAccess: null,
  compartments: [compartment],
  fireWallsSeparateCompartments: false,
};

describe("safe degradation against the placeholder data layer", () => {
  it("type of construction degrades to insufficient-input", () => {
    const r = assessTypeOfConstruction({ input, data: nccData });
    expect(r.status).toBe("insufficient-input");
    expect(r.usesUnverifiedData).toBe(true);
    expect(r.clauseRef).toBe("C2D2");
    expect(r.detail.requiredType).toBeNull();
  });

  it("compartment size degrades to insufficient-input", () => {
    const r = assessCompartmentSize({ input, data: nccData, compartment, requiredType: null });
    expect(r.status).toBe("insufficient-input");
    expect(r.usesUnverifiedData).toBe(true);
    expect(r.tableRef).toBe("Table C3D3");
    expect(r.detail.areaWithinLimit).toBeNull();
  });

  it("large isolated degrades to insufficient-input", () => {
    const r = assessLargeIsolated({ input, data: nccData, compartment });
    expect(r.status).toBe("insufficient-input");
    expect(r.detail.eligible).toBeNull();
    expect(r.detail.pathwayA.clauseRef).toBe("C3D5(1)");
    expect(r.detail.pathwayB.clauseRef).toBe("C3D5(2)");
  });

  it("setback / separation degrades to insufficient-input", () => {
    const r = assessSetbackSeparation({ input, data: nccData, compartment, requiredType: null });
    expect(r.status).toBe("insufficient-input");
    expect(r.detail.walls).toHaveLength(1);
    expect(r.detail.walls[0]?.requiredExtWallFrl).toBeNull();
  });

  it("FRL schedule degrades to insufficient-input with every line unverified", () => {
    const r = assessFrlSchedule({ input, data: nccData, requiredType: null });
    expect(r.status).toBe("insufficient-input");
    expect(r.detail.lines.every((l) => l.usesUnverifiedData)).toBe(true);
    expect(r.detail.lines.every((l) => l.frl === null)).toBe(true);
    expect(r.detail.type).toBeNull(); // never defaulted (brief §9)
  });
});

/**
 * Aggregation seam (plan §4). Every WS-4 rule stores its typed result in the
 * shared `ProjectState.results: AnyComplianceResult[]`. This is the busiest
 * Phase-B integration point: it must accept results of DIFFERENT detail types.
 * The explicit `ProjectState` annotation makes `tsc` enforce the covariant
 * `ComplianceResult<TDetail>` -> `ComplianceResult<ResultDetail>` assignment,
 * and the JSON round-trip proves the assembled state stays serializable (§4).
 */
describe("aggregation seam: typed rule results collect into ProjectState.results", () => {
  it("accepts heterogeneous rule results and round-trips through JSON", () => {
    const project: ProjectState = {
      id: "p1",
      schemaVersion: PROJECT_SCHEMA_VERSION,
      meta: {
        projectName: "Seam test",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      input,
      results: [
        assessTypeOfConstruction({ input, data: nccData }),
        assessFrlSchedule({ input, data: nccData, requiredType: null }),
      ],
    };

    expect(project.results).toHaveLength(2);
    expect(project.results.map((r) => r.check)).toEqual(["TypeOfConstruction", "FrlSchedule"]);
    expect(JSON.parse(JSON.stringify(project))).toEqual(project);
  });
});
