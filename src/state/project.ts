import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  BuildingClass,
  BuildingInput,
  Compartment,
  ExternalWall,
} from "../domain/building.ts";
import type { ProjectMeta, ProjectState } from "../domain/project.ts";
import { PROJECT_SCHEMA_VERSION } from "../domain/project.ts";
import { nccData } from "../data/index.ts";
import { assessProject } from "../engine/assess.ts";
import type { Assessment } from "../engine/assess.ts";
import { IndexedDbProjectStore } from "../persistence/indexeddb-store.ts";

/**
 * Single-`ProjectState` app state (brief §5): the building input is the source of
 * truth; the assessment is DERIVED from it by the pure engine on every change, so
 * the UI can never drift from the compliance result. IndexedDB autosave (debounced)
 * means a refresh never loses work. The store is behind the ProjectStore interface.
 */
const store = new IndexedDbProjectStore();

function nowIso(): string {
  return new Date().toISOString();
}
function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export function newWall(): ExternalWall {
  return {
    id: makeId(),
    name: "External wall",
    distanceToFireSourceFeatureM: 6,
    loadbearing: true,
    hasOpenings: false,
    angleToAdjacentOpeningDeg: null,
  };
}

export function newCompartment(index: number): Compartment {
  return {
    id: makeId(),
    name: `Compartment ${index}`,
    floorAreaM2: 1000,
    volumeM3: 5000,
    sizeExemption: null,
    externalWalls: [],
  };
}

export function emptyInput(): BuildingInput {
  return {
    buildingClass: "8",
    riseInStoreys: 1,
    effectiveHeightM: 8,
    sprinkleredToSpec17: null,
    openSpaceAroundBuildingM: null,
    perimeterAccess6mWide: null,
    perimeterAccessWithin18m: null,
    compartments: [newCompartment(1)],
    fireWallsSeparateCompartments: false,
  };
}

export interface UseProject {
  id: string;
  meta: ProjectMeta;
  input: BuildingInput;
  assessment: Assessment;
  isDraft: boolean;
  projectState: ProjectState;
  setMeta: (patch: Partial<ProjectMeta>) => void;
  setInput: (patch: Partial<BuildingInput>) => void;
  setClass: (cls: BuildingClass) => void;
  addCompartment: () => void;
  updateCompartment: (id: string, patch: Partial<Compartment>) => void;
  removeCompartment: (id: string) => void;
  addWall: (compartmentId: string) => void;
  updateWall: (compartmentId: string, wallId: string, patch: Partial<ExternalWall>) => void;
  removeWall: (compartmentId: string, wallId: string) => void;
  loadJson: (json: string) => void;
  exportJson: () => string;
}

export function useProject(): UseProject {
  const [id] = useState(makeId);
  const [createdAt] = useState(nowIso);
  const [meta, setMetaState] = useState<ProjectMeta>(() => ({
    projectName: "Untitled project",
    createdAt,
    updatedAt: createdAt,
  }));
  const [input, setInputState] = useState<BuildingInput>(emptyInput);

  const touch = useCallback(() => setMetaState((m) => ({ ...m, updatedAt: nowIso() })), []);

  const setMeta = useCallback((patch: Partial<ProjectMeta>) => {
    setMetaState((m) => ({ ...m, ...patch, updatedAt: nowIso() }));
  }, []);

  const setInput = useCallback((patch: Partial<BuildingInput>) => {
    setInputState((i) => ({ ...i, ...patch }));
    touch();
  }, [touch]);

  const setClass = useCallback((cls: BuildingClass) => setInput({ buildingClass: cls }), [setInput]);

  const addCompartment = useCallback(() => {
    setInputState((i) => ({ ...i, compartments: [...i.compartments, newCompartment(i.compartments.length + 1)] }));
    touch();
  }, [touch]);

  const updateCompartment = useCallback((cid: string, patch: Partial<Compartment>) => {
    setInputState((i) => ({ ...i, compartments: i.compartments.map((c) => (c.id === cid ? { ...c, ...patch } : c)) }));
    touch();
  }, [touch]);

  const removeCompartment = useCallback((cid: string) => {
    setInputState((i) => ({ ...i, compartments: i.compartments.filter((c) => c.id !== cid) }));
    touch();
  }, [touch]);

  const addWall = useCallback((cid: string) => {
    setInputState((i) => ({
      ...i,
      compartments: i.compartments.map((c) => (c.id === cid ? { ...c, externalWalls: [...c.externalWalls, newWall()] } : c)),
    }));
    touch();
  }, [touch]);

  const updateWall = useCallback((cid: string, wid: string, patch: Partial<ExternalWall>) => {
    setInputState((i) => ({
      ...i,
      compartments: i.compartments.map((c) =>
        c.id === cid ? { ...c, externalWalls: c.externalWalls.map((w) => (w.id === wid ? { ...w, ...patch } : w)) } : c,
      ),
    }));
    touch();
  }, [touch]);

  const removeWall = useCallback((cid: string, wid: string) => {
    setInputState((i) => ({
      ...i,
      compartments: i.compartments.map((c) =>
        c.id === cid ? { ...c, externalWalls: c.externalWalls.filter((w) => w.id !== wid) } : c,
      ),
    }));
    touch();
  }, [touch]);

  const assessment = useMemo(() => assessProject(input, nccData), [input]);
  const isDraft = useMemo(() => assessment.results.some((r) => r.usesUnverifiedData), [assessment]);

  const projectState: ProjectState = useMemo(
    () => ({ id, schemaVersion: PROJECT_SCHEMA_VERSION, meta, input, results: assessment.results }),
    [id, meta, input, assessment],
  );

  const loadJson = useCallback((json: string) => {
    const loaded = store.importJson(json);
    setInputState(loaded.input);
    setMetaState({ ...loaded.meta, updatedAt: nowIso() });
  }, []);

  const exportJson = useCallback(() => store.exportJson(projectState), [projectState]);

  // Debounced IndexedDB autosave — a refresh never loses work (best-effort).
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      store.save(projectState).catch(() => {/* non-fatal */});
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [projectState]);

  return {
    id, meta, input, assessment, isDraft, projectState,
    setMeta, setInput, setClass,
    addCompartment, updateCompartment, removeCompartment,
    addWall, updateWall, removeWall,
    loadJson, exportJson,
  };
}
