import { openDB } from "idb";
import type { DBSchema, IDBPDatabase } from "idb";
import type { ProjectState, ProjectSummary } from "../domain/project.ts";
import { PROJECT_SCHEMA_VERSION } from "../domain/project.ts";
import type { ProjectStore } from "./project-store.ts";

/**
 * WS-6 · `ProjectStore` over IndexedDB (via `idb`) + JSON export/import.
 *
 * Local-first (brief §4): all persistence runs in the browser, zero backend. The
 * later Azure phase implements this SAME interface — callers depend on
 * `ProjectStore`, never on IndexedDB. Export/import are pure string operations;
 * `importJson` validates the shape and throws rather than returning a partial.
 */
const DB_NAME = "ncc-section-c";
const STORE = "projects";

interface ProjectDB extends DBSchema {
  projects: { key: string; value: ProjectState };
}

/** Whether any stored result used unverified data (drives the DRAFT badge). */
function usesUnverifiedData(state: ProjectState): boolean {
  return state.results.some((r) => r.usesUnverifiedData);
}

function summarize(state: ProjectState): ProjectSummary {
  return {
    id: state.id,
    projectName: state.meta.projectName,
    updatedAt: state.meta.updatedAt,
    usesUnverifiedData: usesUnverifiedData(state),
  };
}

/**
 * Validate an untrusted object (e.g. an imported JSON file) as a `ProjectState`.
 * Throws with a clear message on anything malformed or version-incompatible —
 * never returns a partial object (brief §4 / interface contract).
 */
export function validateProjectState(data: unknown): ProjectState {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid project file: not an object.");
  }
  const o = data as Record<string, unknown>;
  if (o["schemaVersion"] !== PROJECT_SCHEMA_VERSION) {
    throw new Error(
      `Incompatible project schema version: expected ${PROJECT_SCHEMA_VERSION}, got ${String(o["schemaVersion"])}.`,
    );
  }
  if (typeof o["id"] !== "string" || o["id"] === "") {
    throw new Error("Invalid project file: missing id.");
  }
  const meta = o["meta"];
  if (typeof meta !== "object" || meta === null || typeof (meta as Record<string, unknown>)["projectName"] !== "string") {
    throw new Error("Invalid project file: missing or malformed meta.");
  }
  if (typeof o["input"] !== "object" || o["input"] === null) {
    throw new Error("Invalid project file: missing building input.");
  }
  if (!Array.isArray(o["results"])) {
    throw new Error("Invalid project file: results must be an array.");
  }
  return data as ProjectState;
}

export class IndexedDbProjectStore implements ProjectStore {
  private readonly dbPromise: Promise<IDBPDatabase<ProjectDB>>;

  constructor(dbName: string = DB_NAME) {
    this.dbPromise = openDB<ProjectDB>(dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      },
    });
  }

  async save(state: ProjectState): Promise<void> {
    const db = await this.dbPromise;
    // Structured-clone through JSON to guarantee a plain serializable record.
    await db.put(STORE, JSON.parse(JSON.stringify(state)) as ProjectState);
  }

  async load(id: string): Promise<ProjectState | null> {
    const db = await this.dbPromise;
    return (await db.get(STORE, id)) ?? null;
  }

  async list(): Promise<ProjectSummary[]> {
    const db = await this.dbPromise;
    const all = await db.getAll(STORE);
    return all
      .map(summarize)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async delete(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(STORE, id);
  }

  exportJson(state: ProjectState): string {
    return JSON.stringify(state, null, 2);
  }

  importJson(json: string): ProjectState {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error("Invalid project file: not valid JSON.");
    }
    return validateProjectState(parsed);
  }
}
