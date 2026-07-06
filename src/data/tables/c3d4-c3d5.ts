import { placeholder } from "../../domain/ncc-value.ts";
import type { C3D4Caps, C3D5OpenSpace } from "../schema.ts";

/**
 * C3D4 — large-isolated-building concession caps.
 *
 * PLACEHOLDER (Phase 0): the brief and scaffold both state the headline caps as
 * 18,000 m² floor area / 108,000 m³ volume "confirm". Per the no-fabrication rule
 * (brief §9) those figures are NOT copied in as live values — the concession only
 * applies while `floorArea ≤ cap AND volume ≤ cap`, and computing against an
 * untrusted cap could wrongly grant the concession. Values stay null until a
 * competent person transcribes them; the headline appears only as a hint.
 */
export const c3d4Caps: C3D4Caps = {
  maxFloorAreaM2: placeholder<number>(
    "C3D4, NCC 2022 Vol One — large-isolated max floor area (headline 18,000 m²) — TRANSCRIBE + CONFIRM",
  ),
  maxVolumeM3: placeholder<number>(
    "C3D4, NCC 2022 Vol One — large-isolated max volume (headline 108,000 m³) — TRANSCRIBE + CONFIRM",
  ),
};

/**
 * C3D5(1) — open-space geometry for the large-isolated open-space pathway.
 *
 * PLACEHOLDER: headline is ≥ 18 m around the building for Class 7/8. The exact
 * width and any class dependence must be transcribed/confirmed.
 */
export const c3d5OpenSpace: C3D5OpenSpace = {
  minWidthM: placeholder<number>(
    "C3D5(1), NCC 2022 Vol One — min open-space width around building (headline ≥ 18 m, Class 7/8) — TRANSCRIBE + CONFIRM",
  ),
};
