import { CONSTRUCTION_TYPES } from "../../domain/building.ts";
import { placeholder } from "../../domain/ncc-value.ts";
import type { Spec5ExtWallBand, Spec5ExtWallTable } from "../schema.ts";

/**
 * Specification 5 — external-wall FRL as a function of distance to the fire-source
 * feature, per Type. Feeds the setback check (scaffold §3, §7).
 *
 * PLACEHOLDER (Phase 0): a null banded list per Type. The distance-band
 * boundaries, FRLs, and opening-treatment text are all NCC content — transcribe
 * the full `Spec5ExtWallBand[]` per Type, then verify.
 */
export const spec5ExtWall: Spec5ExtWallTable = Object.fromEntries(
  CONSTRUCTION_TYPES.map((type) => [
    type,
    placeholder<Spec5ExtWallBand[]>(
      `Specification 5, NCC 2022 Vol One — Type ${type}, external-wall FRL by distance to fire-source feature — TRANSCRIBE`,
    ),
  ]),
) as Spec5ExtWallTable;
