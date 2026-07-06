import type { NccDataLayer } from "./schema.ts";
import { c2d2 } from "./tables/c2d2.ts";
import { c3d3 } from "./tables/c3d3.ts";
import { c3d4Caps, c3d5OpenSpace } from "./tables/c3d4-c3d5.ts";
import { c4d4 } from "./tables/c4d4.ts";
import { spec5Frl } from "./tables/spec5-frl.ts";
import { spec5ExtWall } from "./tables/spec5-extwall.ts";
import { spec17 } from "./tables/spec17.ts";

export * from "./schema.ts";

/**
 * The real NCC data layer.
 *
 * SHIPPED STATE: every value is an unverified placeholder (`value: null,
 * verified: false`). The rules engine reads from this object and safely degrades
 * to `insufficient-input` for anything not yet verified. Real values are
 * transcribed table-by-table (see docs/verification-checklist.md) with no code
 * change — the shape here is frozen.
 */
export const nccData: NccDataLayer = {
  c2d2,
  c3d3,
  c3d4Caps,
  c3d5OpenSpace,
  c4d4,
  spec5Frl,
  spec5ExtWall,
  spec17,
  meta: {
    edition: "NCC 2022 Volume One",
    note:
      "Placeholder data layer — all values unverified. Confirm against the licensed " +
      "edition and check state/territory Schedule variations (NSW/VIC/QLD/SA…).",
  },
};
