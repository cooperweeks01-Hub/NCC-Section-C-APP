import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import type { BuildingInput } from "../domain/building.ts";
import type { ProjectState } from "../domain/project.ts";
import { PROJECT_SCHEMA_VERSION } from "../domain/project.ts";
import { nccData } from "../data/index.ts";
import { assessProject } from "../engine/assess.ts";
import { IndexedDbProjectStore, validateProjectState } from "./indexeddb-store.ts";

/**
 * WS-6 · persistence round-trip acceptance (brief §4). CRUD runs against
 * fake-indexeddb; export/import are pure. Each test uses a fresh DB name.
 */
const input: BuildingInput = {
  buildingClass: "8",
  riseInStoreys: 1,
  effectiveHeightM: 8,
  sprinkleredToSpec17: null,
  openSpaceAroundBuildingM: null,
  perimeterAccess6mWide: null,
  perimeterAccessWithin18m: null,
  compartments: [{ id: "c1", name: "C1", floorAreaM2: 5000, volumeM3: 25000, sizeExemption: null, externalWalls: [] }],
  fireWallsSeparateCompartments: false,
};

function sampleProject(id = "p1"): ProjectState {
  return {
    id,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    meta: { projectName: "Test project", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z" },
    input,
    results: assessProject(input, nccData).results,
  };
}

let dbSeq = 0;
const freshStore = () => new IndexedDbProjectStore(`test-db-${dbSeq++}`);

describe("WS-6 IndexedDB CRUD round-trip", () => {
  it("save then load returns the project unchanged", async () => {
    const store = freshStore();
    const project = sampleProject();
    await store.save(project);
    const loaded = await store.load("p1");
    expect(loaded).toEqual(project);
  });

  it("load of a missing id returns null", async () => {
    expect(await freshStore().load("nope")).toBeNull();
  });

  it("list summaries carry the DRAFT flag both ways; delete removes", async () => {
    const store = freshStore();
    // A normal project on the fully-verified layer uses no unverified values.
    await store.save(sampleProject("clean"));
    // Inject a result that used unverified data ⇒ the summary DRAFT flag is true.
    const draft = sampleProject("draft");
    draft.results = [...draft.results, { ...draft.results[0]!, usesUnverifiedData: true }];
    await store.save(draft);

    const list = await store.list();
    expect(list.map((s) => s.id).sort()).toEqual(["clean", "draft"]);
    expect(list.find((s) => s.id === "clean")!.usesUnverifiedData).toBe(false);
    expect(list.find((s) => s.id === "draft")!.usesUnverifiedData).toBe(true);
    await store.delete("clean");
    expect((await store.list()).map((s) => s.id)).toEqual(["draft"]);
  });
});

describe("WS-6 JSON export/import round-trip + validation", () => {
  it("exportJson then importJson returns an equal project", () => {
    const store = freshStore();
    const project = sampleProject();
    expect(store.importJson(store.exportJson(project))).toEqual(project);
  });

  it("importJson throws on malformed / incompatible input", () => {
    const store = freshStore();
    expect(() => store.importJson("{not json")).toThrow(/JSON/i);
    expect(() => store.importJson(JSON.stringify({ ...sampleProject(), schemaVersion: 999 }))).toThrow(/schema/i);
    expect(() => store.importJson(JSON.stringify({ schemaVersion: PROJECT_SCHEMA_VERSION }))).toThrow(/id/i);
  });

  it("validateProjectState rejects a non-object", () => {
    expect(() => validateProjectState(42)).toThrow();
  });
});
