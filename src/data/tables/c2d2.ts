import { BUILDING_CLASSES } from "../../domain/building.ts";
import type { BuildingClass } from "../../domain/building.ts";
import { placeholder } from "../../domain/ncc-value.ts";
import type { NccValue } from "../../domain/ncc-value.ts";
import type { C2D2Band, C2D2Table } from "../schema.ts";

/**
 * Table C2D2 — required Type of construction by (Class, rise in storeys).
 *
 * PLACEHOLDER (Phase 0): every class maps to a null banded list. The rise-in-
 * storeys band boundaries AND the resulting Types are NCC content — transcribe
 * the full `C2D2Band[]` per class from the licensed NCC 2022 Volume One, then
 * flip `verified: true`. Do not populate from web summaries.
 */
export const c2d2: C2D2Table = Object.fromEntries(
  BUILDING_CLASSES.map((cls): [BuildingClass, NccValue<C2D2Band[]>] => [
    cls,
    placeholder<C2D2Band[]>(
      `Table C2D2, NCC 2022 Vol One — Class ${cls} rise-in-storeys → Type A/B/C — TRANSCRIBE`,
    ),
  ]),
) as C2D2Table;
