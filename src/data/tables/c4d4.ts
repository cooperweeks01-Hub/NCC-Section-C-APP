import { placeholder } from "../../domain/ncc-value.ts";
import type { FRL } from "../../domain/building.ts";
import type { C4D4Band, C4D4Table } from "../schema.ts";

/**
 * Table C4D4 — separation between openings of adjacent compartments separated by
 * a fire wall, plus the exemption where the walls are ≥ 60/60/60 and openings are
 * protected per C4D5.
 *
 * PLACEHOLDER (Phase 0): the separation bands (axes to be confirmed during
 * verification) and the exemption FRL threshold are null/unverified. The
 * exemption clause reference "C4D5" is a fact and is encoded.
 */
export const c4d4: C4D4Table = {
  bands: placeholder<C4D4Band[]>(
    "Table C4D4, NCC 2022 Vol One — opening separation between adjacent compartments — TRANSCRIBE (confirm axes)",
  ),
  exemptionFrlThreshold: placeholder<FRL>(
    "C4D4/C4D5, NCC 2022 Vol One — exemption FRL threshold (headline 60/60/60) — TRANSCRIBE + CONFIRM",
  ),
  exemptionClauseRef: "C4D5",
};
