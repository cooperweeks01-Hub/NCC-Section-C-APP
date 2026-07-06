import {
  BUILDING_CLASSES,
  CONSTRUCTION_TYPES,
} from "../../domain/building.ts";
import type { BuildingClass, ConstructionType } from "../../domain/building.ts";
import { placeholder } from "../../domain/ncc-value.ts";
import type { C3D3Cell, C3D3Table } from "../schema.ts";

/**
 * Table C3D3 — maximum fire-compartment size (floor area m² + volume m³) by
 * (Class, Type), Class 5–9.
 *
 * PLACEHOLDER (Phase 0): the grid is fully enumerated (axes are facts), every
 * cell null and unverified. Transcribe max floor area + max volume for each
 * (Class, Type) cell, then flip `verified: true`.
 */
function cell(cls: BuildingClass, type: ConstructionType): C3D3Cell {
  const where = `Table C3D3, NCC 2022 Vol One — Class ${cls}, Type ${type}`;
  return {
    maxFloorAreaM2: placeholder<number>(`${where} — max floor area (m²) — TRANSCRIBE`),
    maxVolumeM3: placeholder<number>(`${where} — max volume (m³) — TRANSCRIBE`),
  };
}

export const c3d3: C3D3Table = Object.fromEntries(
  BUILDING_CLASSES.map((cls) => [
    cls,
    Object.fromEntries(
      CONSTRUCTION_TYPES.map((type) => [type, cell(cls, type)]),
    ) as Record<ConstructionType, C3D3Cell>,
  ]),
) as C3D3Table;
