import type { NccDataLayer } from "./schema.ts";
import { c2d2 } from "./tables/c2d2.ts";
import { c3d3 } from "./tables/c3d3.ts";
import { c3d4Caps, c3d5 } from "./tables/c3d4-c3d5.ts";
import { c4d4 } from "./tables/c4d4.ts";
import { spec5ExtWall } from "./tables/spec5-extwall.ts";
import { spec5Schedule } from "./tables/spec5-schedule.ts";
import { spec17 } from "./tables/spec17.ts";

export * from "./schema.ts";

/**
 * The real NCC data layer.
 *
 * SHIPPED STATE (Class 5, 7a, 7b, 8): Table C2D2, C3D3, C4D4, Specification 5
 * (external-wall + fixed schedule), and the C3D4 caps / C3D5 geometry are all
 * VERIFIED. Only Specification 17's complying-conditions text remains a
 * placeholder — and it is not consulted by any compliance decision (the sprinkler
 * pathway trusts the designer's yes/no answer), so it never raises the DRAFT flag.
 * Real values drop in table-by-table with no code change; the schema is fixed.
 */
export const nccData: NccDataLayer = {
  c2d2,
  c3d3,
  c3d4Caps,
  c3d5,
  c4d4,
  spec5ExtWall,
  spec5Schedule,
  spec17,
  meta: {
    edition: "NCC 2022 Volume One",
    note:
      "Class 5, 7a, 7b, 8 VERIFIED (C2D2, C3D3, C4D4, Spec 5, C3D4/C3D5). Spec 17 " +
      "text is a placeholder but is not used by any decision. Confirm state/territory " +
      "Schedule variations (NSW/VIC/QLD/SA…).",
  },
};
