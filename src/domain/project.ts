import type { BuildingInput } from "./building.ts";
import type { AnyComplianceResult } from "./result.ts";

/**
 * ProjectState — the single serializable object (brief §4).
 *
 * Everything the tool holds about one assessment lives here. It is designed to be
 * cleanly JSON-serializable from day one so that IndexedDB autosave, JSON
 * export/import, and (later) cloud multi-user storage are the SAME shape behind
 * the `ProjectStore` interface — a config swap, not a redesign.
 *
 * Keep this free of class instances, functions, Dates-as-objects, Maps, or Sets —
 * timestamps are ISO strings so the object round-trips through `JSON.stringify`.
 */

/** Current schema version — bump on any breaking change to enable migrations. */
export const PROJECT_SCHEMA_VERSION = 1 as const;

export interface ProjectMeta {
  projectName: string;
  address?: string;
  author?: string;
  /** ISO-8601 timestamps (strings, not Date objects — serializable). */
  createdAt: string;
  updatedAt: string;
}

export interface ProjectState {
  /** Stable id (also the IndexedDB key). */
  id: string;
  /** Schema version this project was written with. */
  schemaVersion: typeof PROJECT_SCHEMA_VERSION;
  meta: ProjectMeta;
  input: BuildingInput;
  /** Per-compartment + building-level results (see AnyComplianceResult). */
  results: AnyComplianceResult[];
}

/** Lightweight listing shape for the projects list (no heavy result payload). */
export interface ProjectSummary {
  id: string;
  projectName: string;
  updatedAt: string;
  /** True if any stored result used unverified data (drives a DRAFT badge). */
  usesUnverifiedData: boolean;
}
