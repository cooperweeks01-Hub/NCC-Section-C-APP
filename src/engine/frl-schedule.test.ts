import { describe, expect, it } from "vitest";
import type { BuildingInput } from "../domain/building.ts";
import type { FrlScheduleLine } from "../domain/result.ts";
import { nccData } from "../data/index.ts";
import { assessFrlSchedule } from "./frl-schedule.ts";

/**
 * WS-4 · FRL schedule (Spec 5) — real verified layer. Grouping {5,7a} vs {7b,8}.
 */
function inp(cls: BuildingInput["buildingClass"]): BuildingInput {
  return {
    buildingClass: cls,
    riseInStoreys: 4,
    effectiveHeightM: 12,
    sprinkleredToSpec17: null,
    openSpaceAroundBuildingM: null,
    perimeterAccess6mWide: null,
    perimeterAccessWithin18m: null,
    compartments: [],
    fireWallsSeparateCompartments: false,
  };
}
const find = (lines: FrlScheduleLine[], startsWith: string) =>
  lines.find((l) => l.label.startsWith(startsWith));
const data = nccData;

describe("WS-4 FRL schedule against verified Spec 5", () => {
  it("Type A Class 8 emits cited lines with the right FRLs", () => {
    const r = assessFrlSchedule({ input: inp("8"), data, requiredType: "A" });
    expect(r.status).toBe("determined");
    expect(r.usesUnverifiedData).toBe(false);
    expect(r.detail.type).toBe("A");
    const fireWall = find(r.detail.lines, "Common walls and fire walls");
    expect(fireWall?.frl).toEqual({ structural: 240, integrity: 240, insulation: 240 });
    expect(fireWall?.clauseRef).toBe("S5C11d");
    expect(find(r.detail.lines, "Roofs")?.frl).toEqual({ structural: 240, integrity: 90, insulation: 60 });
  });

  it("a '–' criterion is a null-valued FRL object, distinct from an unverified null line", () => {
    const r = assessFrlSchedule({ input: inp("5"), data, requiredType: "A" });
    const noReq = find(r.detail.lines, "Non-loadbearing internal wall — bounding public corridors");
    // "–/–/–" ⇒ an FRL object with null criteria (NOT frl === null).
    expect(noReq?.frl).toEqual({ structural: null, integrity: null, insulation: null });
    expect(noReq?.usesUnverifiedData).toBe(false);
  });

  it("Type C has no Floors line (verified note 4) but has the rated-stair wall", () => {
    const r = assessFrlSchedule({ input: inp("5"), data, requiredType: "C" });
    expect(r.detail.lines.some((l) => l.label === "Floors")).toBe(false);
    expect(find(r.detail.lines, "Common walls and fire walls")?.frl).toEqual({ structural: 90, integrity: 90, insulation: 90 });
    expect(find(r.detail.lines, "Internal wall — bounding a stair")?.frl).toEqual({ structural: 60, integrity: 60, insulation: 60 });
  });
});

describe("WS-4 Spec 5 grouping: 7a groups with 5", () => {
  it("Type A common/fire wall: Class 7a ⇒ 120, Class 7b ⇒ 240", () => {
    const r7a = assessFrlSchedule({ input: inp("7a"), data, requiredType: "A" });
    const r7b = assessFrlSchedule({ input: inp("7b"), data, requiredType: "A" });
    expect(find(r7a.detail.lines, "Common walls and fire walls")?.frl).toEqual({ structural: 120, integrity: 120, insulation: 120 });
    expect(find(r7b.detail.lines, "Common walls and fire walls")?.frl).toEqual({ structural: 240, integrity: 240, insulation: 240 });
  });
});

describe("WS-4 safe degradation", () => {
  it("undetermined Type ⇒ insufficient-input, type null, never defaulted", () => {
    const r = assessFrlSchedule({ input: inp("8"), data, requiredType: null });
    expect(r.status).toBe("insufficient-input");
    expect(r.detail.type).toBeNull();
    expect(r.usesUnverifiedData).toBe(false);
  });

  it("out-of-scope class ⇒ not produced", () => {
    const r = assessFrlSchedule({ input: inp("9a"), data, requiredType: "A" });
    expect(r.status).toBe("insufficient-input");
    expect(r.summary).toMatch(/out of scope/i);
  });
});
