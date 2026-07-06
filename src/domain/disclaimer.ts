/**
 * Shared liability text (brief §8). Imported by BOTH the UI and the PDF so the two
 * can never drift. Must appear on screen and in every PDF report.
 */
export const DISCLAIMER =
  "This is an indicative Deemed-to-Satisfy assessment against NCC 2022 Volume One, " +
  "Section C, for internal design guidance only. It does not constitute certification, " +
  "a Performance Solution, or professional advice, and must be verified by a registered " +
  "building surveyor and/or fire safety engineer before it is relied upon. Compliance " +
  "results depend on NCC table values that must be confirmed against the current licensed " +
  "edition of the NCC.";

/**
 * The banner shown whenever any result used an unverified NCC value. Wire this to
 * `ComplianceResult.usesUnverifiedData` — it fires automatically until real,
 * verified values are transcribed into the data layer.
 */
export const DRAFT_BANNER = "DRAFT — unverified data";

/** Short badge form of the draft banner. */
export const DRAFT_BADGE = "DRAFT";
