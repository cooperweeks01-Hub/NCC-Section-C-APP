import type { FRL } from "./domain/building.ts";
import type { ResultStatus } from "./domain/result.ts";

/**
 * Shared presentation helpers used by BOTH the UI and the PDF, so a result reads
 * identically on screen and in the filed report. No compliance logic here — pure
 * formatting of already-decided values.
 */

/**
 * Format an FRL as "structural/integrity/insulation" minutes. A null CRITERION
 * renders "–" (no requirement); a null FRL OBJECT renders "—" (not determined /
 * unverified) — the two are deliberately distinct.
 */
export function formatFrl(frl: FRL | null): string {
  if (frl === null) return "—";
  const c = (n: number | null) => (n === null ? "–" : String(n));
  return `${c(frl.structural)}/${c(frl.integrity)}/${c(frl.insulation)}`;
}

/** Human label for a result status. */
export function statusLabel(status: ResultStatus): string {
  switch (status) {
    case "complies":
      return "Complies";
    case "fails":
      return "Does not comply";
    case "determined":
      return "Determined";
    case "advisory":
      return "Advisory";
    case "flag":
      return "Flag";
    case "insufficient-input":
      return "Insufficient input";
  }
}

/** A short, stable colour token per status (hex, for PDF + inline styles). */
export function statusColor(status: ResultStatus): string {
  switch (status) {
    case "complies":
      return "#1a7f4b"; // green
    case "fails":
      return "#c0392b"; // red
    case "determined":
      return "#1f5fbf"; // blue
    case "advisory":
      return "#8a6d1a"; // amber
    case "flag":
      return "#b8600f"; // orange
    case "insufficient-input":
      return "#6b6b6b"; // grey
  }
}
