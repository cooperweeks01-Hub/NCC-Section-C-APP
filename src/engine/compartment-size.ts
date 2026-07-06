import type { CompartmentSizeDetail } from "../domain/result.ts";
import { insufficientInput, snapshotFor } from "./result-helpers.ts";
import type { RuleFn } from "./types.ts";

/**
 * WS-2 · Compartment size (Table C3D3).
 *
 * SIGNATURE-LOCKED STUB (Phase A). Phase B implements: compare the compartment's
 * floor area and volume against Table C3D3 for (Class, requiredType). On
 * exceedance, present computed options with exact thresholds — subdivide (target
 * sizes + fire-wall FRL + opening protection) and route to the C3D4 large-isolated
 * assessment (see `assessLargeIsolated`). Report value-vs-limit numerically
 * throughout (brief §6.4).
 *
 * Requires `ctx.compartment` and `ctx.requiredType`. Until C3D3 is verified,
 * degrades to `insufficient-input`.
 */
export const assessCompartmentSize: RuleFn<CompartmentSizeDetail> = (ctx) => {
  const c = ctx.compartment;
  const detail: CompartmentSizeDetail = {
    compartmentId: c?.id ?? "",
    floorAreaM2: c?.floorAreaM2 ?? 0,
    volumeM3: c?.volumeM3 ?? 0,
    maxFloorAreaM2: null,
    maxVolumeM3: null,
    areaWithinLimit: null,
    volumeWithinLimit: null,
    routedToLargeIsolated: false,
  };
  // TODO(WS-2): read ctx.data.c3d3[class][type]; if usable, decide pass/fail and
  // build subdivide/large-isolated options. Placeholder layer ⇒ safe-degrade.
  return insufficientInput({
    check: "CompartmentSize",
    clauseRef: "C3D3",
    tableRef: "Table C3D3",
    detail,
    summary:
      "Compartment size cannot be assessed: Table C3D3 limits are unverified.",
    inputSnapshot: snapshotFor(ctx.input, "buildingClass", "compartments"),
    ...(c ? { compartmentId: c.id } : {}),
  });
};
