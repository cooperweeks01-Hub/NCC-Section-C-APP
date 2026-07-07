import { verified } from "../../domain/ncc-value.ts";
import type { C3D4Caps, C3D5Requirements } from "../schema.ts";

/**
 * C3D4 large-isolated caps + C3D5 geometry thresholds.
 *
 * VERIFIED (confirmed with the competent person against NCC 2022 Vol One):
 *  - C3D4 caps: 18,000 m² floor area / 108,000 m³ volume. These bound ONLY the
 *    open-space pathway (C3D5(1)); the sprinkler pathway (C3D5(2)) has NO size
 *    limit and is what allows a building to exceed them.
 *  - C3D5(1): open space ≥ 18 m wide around the building.
 *  - C3D5(2): continuous, unobstructed, not-built-upon vehicle access ≥ 6 m wide
 *    whose far side is ≤ 18 m from the building.
 */
export const c3d4Caps: C3D4Caps = {
  maxFloorAreaM2: verified<number>(18000, "C3D4, NCC 2022 Vol One — large-isolated max floor area — verified"),
  maxVolumeM3: verified<number>(108000, "C3D4, NCC 2022 Vol One — large-isolated max volume — verified"),
};

export const c3d5: C3D5Requirements = {
  openSpaceMinWidthM: verified<number>(18, "C3D5(1), NCC 2022 Vol One — min open-space width around building — verified"),
  perimeterAccessMinWidthM: verified<number>(6, "C3D5(2), NCC 2022 Vol One — min perimeter vehicle-access width — verified"),
  perimeterAccessMaxDistanceM: verified<number>(18, "C3D5(2), NCC 2022 Vol One — max distance of access far side from building — verified"),
};
