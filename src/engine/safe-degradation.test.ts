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
 * Behaviour against the REAL data layer (Class 5/7a/7b/8 verified; C3D4/C3D5/
 * Spec 17 still null). Two things must hold (plan §5.1, advisor):
 *  - Rules whose tables are VERIFIED now COMPUTE (type of construction here).
 *  - The large-isolated concession still SAFELY DEGRADES, because its caps are
 *    deliberately unverified — never computed against untrusted caps (brief §9).
 *
 * (compartment-size / setback / frl-schedule are stubs pending their own commits;
 * their degradation here is stub behaviour, converted when each rule lands.)
 */
const compartment: Compartment = {
  id: "c1",
  name: "Compartment 1",
  floorAreaM2: 5000,
  volumeM3: 25000,
  sizeExemption: null,
  externalWalls: [
    {
      id: "w1",
      name: "North wall",
      distanceToFireSourceFeatureM: 6,
      loadbearing: true,
      hasOpenings: true,
      angleToAdjacentOpeningDeg: null,
    },
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

describe("engine behaviour against the real (partly verified) data layer", () => {
  it("type of construction COMPUTES against the verified C2D2 (Class 8, rise 1 → C)", () => {
    const r = assessTypeOfConstruction({ input, data: nccData });
    expect(r.status).toBe("determined");
    expect(r.usesUnverifiedData).toBe(false);
    expect(r.clauseRef).toBe("C2D2");
    expect(r.detail.requiredType).toBe("C");
  });

  it("large isolated still degrades — C3D4 caps are deliberately unverified", () => {
    const r = assessLargeIsolated({ input, data: nccData, compartment });
    expect(r.status).toBe("insufficient-input");
    expect(r.detail.eligible).toBeNull();
    expect(r.detail.pathwayA.clauseRef).toBe("C3D5(1)");
    expect(r.detail.pathwayB.clauseRef).toBe("C3D5(2)");
  });

  it("compartment size (stub) degrades pending WS-2", () => {
    const r = assessCompartmentSize({ input, data: nccData, compartment, requiredType: null });
    expect(r.status).toBe("insufficient-input");
    expect(r.tableRef).toBe("Table C3D3");
  });

  it("setback / separation (stub) degrades pending WS-3", () => {
    const r = assessSetbackSeparation({ input, data: nccData, compartment, requiredType: null });
    expect(r.status).toBe("insufficient-input");
    expect(r.detail.walls).toHaveLength(1);
  });

  it("FRL schedule (stub) degrades pending WS-4", () => {
    const r = assessFrlSchedule({ input, data: nccData, requiredType: null });
    expect(r.status).toBe("insufficient-input");
    expect(r.detail.type).toBeNull();
  });
});

/**
 * Aggregation seam (plan §4). Every rule stores its typed result in the shared
 * `ProjectState.results: AnyComplianceResult[]`. This is the busiest Phase-B
 * integration point: it must accept results of DIFFERENT detail types. The
 * explicit `ProjectState` annotation makes `tsc` enforce the covariant
 * `ComplianceResult<TDetail>` -> `ComplianceResult<ResultDetail>` assignment,
 * and the JSON round-trip proves the assembled state stays serializable.
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
