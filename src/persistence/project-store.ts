import type { ProjectState, ProjectSummary } from "../domain/project.ts";

/**
 * ProjectStore — the persistence interface (brief §4, §5).
 *
 * FROZEN CONTRACT. The MVP implements this over IndexedDB + JSON import/export
 * (WS-6). The later Azure phase implements the SAME interface for cloud
 * multi-user storage — a config/implementation swap, not a rewrite. Nothing in
 * the app may depend on a concrete implementation; depend on this interface.
 *
 * All methods are async so a network-backed implementation fits without changing
 * callers. Export/import are synchronous string operations (pure serialization).
 */
export interface ProjectStore {
  /** Persist (create or overwrite) a project. */
  save(state: ProjectState): Promise<void>;
  /** Load a project by id, or null if not found. */
  load(id: string): Promise<ProjectState | null>;
  /** List lightweight summaries of all stored projects. */
  list(): Promise<ProjectSummary[]>;
  /** Delete a project by id. */
  delete(id: string): Promise<void>;

  /** Serialize a project to a JSON string for file export. */
  exportJson(state: ProjectState): string;
  /**
   * Parse a JSON string into a ProjectState (round-trips `exportJson`).
   * Implementations must validate the shape and throw on malformed/incompatible
   * input rather than returning a partial object.
   */
  importJson(json: string): ProjectState;
}

/**
 * Optional autosave surface layered over a ProjectStore (WS-6) so a refresh never
 * loses work (brief §4). Kept separate from the core CRUD interface.
 */
export interface AutosaveController {
  /** Begin autosaving the given project id; debounced by the implementation. */
  start(id: string): void;
  /** Stop autosaving. */
  stop(): void;
}
