import {
  BUILDING_ELEMENTS,
  CONSTRUCTION_TYPES,
} from "../../domain/building.ts";
import type {
  BuildingElement,
  ConstructionType,
  FRL,
} from "../../domain/building.ts";
import { placeholder } from "../../domain/ncc-value.ts";
import type { NccValue } from "../../domain/ncc-value.ts";
import type { Spec5FrlTable } from "../schema.ts";

/**
 * Specification 5 — FRL schedule by (Type, building element). The largest
 * transcription task (scaffold §7).
 *
 * PLACEHOLDER (Phase 0): the grid is fully enumerated (Type × element are facts),
 * every FRL null and unverified. Transcribe the FRL (structural/integrity/
 * insulation, in minutes; "–" => criterion null) for each cell, then verify.
 */
function elementRow(
  type: ConstructionType,
): Record<BuildingElement, NccValue<FRL>> {
  return Object.fromEntries(
    BUILDING_ELEMENTS.map((el) => [
      el,
      placeholder<FRL>(
        `Specification 5, NCC 2022 Vol One — Type ${type}, ${el} → FRL — TRANSCRIBE`,
      ),
    ]),
  ) as Record<BuildingElement, NccValue<FRL>>;
}

export const spec5Frl: Spec5FrlTable = Object.fromEntries(
  CONSTRUCTION_TYPES.map((type) => [type, elementRow(type)]),
) as Spec5FrlTable;
