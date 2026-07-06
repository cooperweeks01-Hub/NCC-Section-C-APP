import type { NccDataLayer } from "./schema.ts";
import { c2d2 } from "./tables/c2d2.ts";
import { c3d3 } from "./tables/c3d3.ts";
import { c3d4Caps, c3d5OpenSpace } from "./tables/c3d4-c3d5.ts";
import { c4d4 } from "./tables/c4d4.ts";
import { spec5ExtWall } from "./tables/spec5-extwall.ts";
import { spec5Schedule } from "./tables/spec5-schedule.ts";
import { spec17 } from "./tables/spec17.ts";

export * from "./schema.ts";

/**
 * The real NCC data layer.
 *
 * SHIPPED STATE (Class 5, 7a, 7b, 8): Table C2D2, C3D3, C4D4, and Specification 5
 * (external-wall + fixed schedule) are VERIFIED from
 * docs/ncc-section-c-data-verified.md. The large-isolated concession inputs
 * (C3D4 caps, C3D5 open space) and Specification 17 are NOT in that extract and
 * remain unverified placeholders — the engine safely degrades any result that
 * touches them to `insufficient-input` (never fabricated). Real values drop in
 * table-by-table with no code change; the schema is fixed.
 */
export const nccData: NccDataLayer = {
  c2d2,
  c3d3,
  c3d4Caps,
  c3d5OpenSpace,
  c4d4,
  spec5ExtWall,
  spec5Schedule,
  spec17,
  meta: {
    edition: "NCC 2022 Volume One",
    note:
      "Class 5, 7a, 7b, 8 VERIFIED (C2D2, C3D3, C4D4, Spec 5). Large-isolated " +
      "concession (C3D4/C3D5) and Spec 17 remain UNVERIFIED and safely degrade. " +
      "Confirm state/territory Schedule variations (NSW/VIC/QLD/SA…).",
  },
};
