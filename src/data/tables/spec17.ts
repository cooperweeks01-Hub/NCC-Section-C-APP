import { placeholder } from "../../domain/ncc-value.ts";
import type { Spec17Conditions } from "../schema.ts";

/**
 * Specification 17 — the conditions under which a sprinkler system "complies with
 * Specification 17" (generally excluding FPAA101D/H for the C3D4 concession).
 * Boolean logic rather than a numeric table, but still confirmed against source.
 *
 * PLACEHOLDER (Phase 0): the complying-conditions statement is null/unverified.
 */
export const spec17: Spec17Conditions = {
  compliesDefinition: placeholder<string>(
    "Specification 17, NCC 2022 Vol One — conditions for a complying system (+ FPAA101D/H exclusions for concessions) — TRANSCRIBE",
  ),
};
