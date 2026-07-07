import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import type { BuildingInput } from "../domain/building.ts";
import type { ProjectState } from "../domain/project.ts";
import { PROJECT_SCHEMA_VERSION } from "../domain/project.ts";
import { nccData } from "../data/index.ts";
import { assessProject } from "../engine/assess.ts";
import { ComplianceReport } from "./report.tsx";

/**
 * WS-7 · the report renders a full assessment to an actual PDF offline. Content
 * fidelity (every number cited, DRAFT banner logic) is the responsibility of the
 * pure result objects it renders; this proves the renderer produces a valid PDF.
 */
const input: BuildingInput = {
  buildingClass: "8",
  riseInStoreys: 1,
  effectiveHeightM: 30, // > 25 ⇒ E1D5 flag included
  sprinkleredToSpec17: null,
  openSpaceAroundBuildingM: null,
  perimeterAccess6mWide: null,
  perimeterAccessWithin18m: null,
  compartments: [
    { id: "c1", name: "Warehouse", floorAreaM2: 5000, volumeM3: 25000, sizeExemption: null, externalWalls: [{ id: "w1", name: "North", distanceToFireSourceFeatureM: 6, loadbearing: true, hasOpenings: true, angleToAdjacentOpeningDeg: 90 }] },
  ],
  fireWallsSeparateCompartments: false,
};

function project(): ProjectState {
  return {
    id: "p1",
    schemaVersion: PROJECT_SCHEMA_VERSION,
    meta: { projectName: "Demo Shed", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z" },
    input,
    results: assessProject(input, nccData).results,
  };
}

describe("WS-7 PDF report", () => {
  it("renders a full assessment to a valid multi-section PDF", async () => {
    const buf = await renderToBuffer(<ComplianceReport project={project()} />);
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(buf.length).toBeGreaterThan(2000); // a real, populated document
  });
});
