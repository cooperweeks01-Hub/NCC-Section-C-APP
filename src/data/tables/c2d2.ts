import { verified } from "../../domain/ncc-value.ts";
import type { C2D2Band, C2D2Table } from "../schema.ts";

/**
 * Table C2D2 — required Type of construction by rise in storeys.
 *
 * VERIFIED (Class 5, 7a, 7b, 8) from docs/ncc-section-c-data-verified.md §1. The
 * mapping is uniform across Class 5–8, so this is a single banded value with no
 * class axis. Bands are inclusive `[min, max]`; the top band uses a large "and
 * over" sentinel.
 *
 *   rise 1–2 → C   ·   rise 3 → B   ·   rise ≥ 4 → A
 */
const RISE_OVER = 999;

export const c2d2: C2D2Table = verified<C2D2Band[]>(
  [
    { minRiseInStoreys: 1, maxRiseInStoreys: 2, requiredType: "C" },
    { minRiseInStoreys: 3, maxRiseInStoreys: 3, requiredType: "B" },
    { minRiseInStoreys: 4, maxRiseInStoreys: RISE_OVER, requiredType: "A" },
  ],
  "Table C2D2, NCC 2022 Vol One (Class 5–8) — verified",
);
