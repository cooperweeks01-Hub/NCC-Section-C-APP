import { verified } from "../../domain/ncc-value.ts";
import type { C3D3Cell, C3D3Table } from "../schema.ts";

/**
 * Table C3D3 — maximum fire-compartment size (floor area m² + volume m³).
 *
 * VERIFIED (Class 5, 7a, 7b, 8) from docs/ncc-section-c-data-verified.md §2.
 * Keyed on the C3D3 grouping (note 1): Class 5 alone vs {7a, 7b, 8} together.
 * 7a groups with 7b/8 HERE (it groups with 5 for Spec 5 — different bucket).
 */
function cell(area: number, volume: number, group: string, type: string): C3D3Cell {
  const where = `Table C3D3, NCC 2022 Vol One — Class ${group}, Type ${type}`;
  return {
    maxFloorAreaM2: verified<number>(area, `${where} — verified`),
    maxVolumeM3: verified<number>(volume, `${where} — verified`),
  };
}

export const c3d3: C3D3Table = {
  "5": {
    A: cell(8000, 48000, "5", "A"),
    B: cell(5500, 33000, "5", "B"),
    C: cell(3000, 18000, "5", "C"),
  },
  "7a_7b_8": {
    A: cell(5000, 30000, "7a/7b/8", "A"),
    B: cell(3500, 21000, "7a/7b/8", "B"),
    C: cell(2000, 12000, "7a/7b/8", "C"),
  },
};
