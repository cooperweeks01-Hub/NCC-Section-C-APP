/**
 * NccValue — the unit of every NCC table value in this tool.
 *
 * WHY THIS EXISTS (brief §9, scaffold §6): no NCC number is trusted until a
 * competent person has transcribed it from the licensed NCC 2022 Volume One and
 * confirmed it. Automated PDF/table extraction silently mangles the NCC's dense
 * multi-column layouts, so every value carries its verification state and source
 * with it — it can never be separated from its provenance.
 *
 * Placeholder state (Phase 0): `{ value: null, verified: false, source: "… TRANSCRIBE" }`.
 * A value is only usable in a compliance result once `verified === true` AND
 * `value !== null`. See `isUsable`.
 */
export interface NccValue<T> {
  /** The transcribed value, or `null` until transcribed. Never fabricated. */
  value: T | null;
  /** True only once a competent person has confirmed the value against the source. */
  verified: boolean;
  /** Human-readable provenance, e.g. "Table C3D3, NCC 2022 Vol One — TRANSCRIBE". */
  source: string;
}

/**
 * A value is safe to use in a compliance decision only when it has been verified
 * and actually has a value. Everything else must degrade to `insufficient-input`.
 */
export function isUsable<T>(v: NccValue<T>): v is NccValue<T> & { value: T } {
  return v.verified && v.value !== null;
}

/** True while a value is still an unverified placeholder (either flag failing). */
export function isPending<T>(v: NccValue<T>): boolean {
  return !isUsable(v);
}

/**
 * Construct an unverified placeholder. Use this everywhere in the real data layer
 * so no value is ever accidentally created as verified.
 *
 * @param source provenance/transcription hint, e.g. "Table C2D2 — TRANSCRIBE".
 */
export function placeholder<T>(source: string): NccValue<T> {
  return { value: null, verified: false, source };
}

/**
 * Construct a VERIFIED value. Reserved for (a) real transcribed data after human
 * confirmation, and (b) synthetic test fixtures. Never call this from the real
 * data layer with a guessed number — that would violate the no-fabrication rule.
 */
export function verified<T>(value: T, source: string): NccValue<T> {
  return { value, verified: true, source };
}
