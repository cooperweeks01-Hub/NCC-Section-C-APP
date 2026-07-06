import type { BuildingInput } from "../domain/building.ts";
import type {
  CheckName,
  ComplianceResult,
  ResultDetail,
} from "../domain/result.ts";

/**
 * Shared helpers for building `ComplianceResult`s. Keeps traceability consistent
 * across every rule and gives Phase B a single, correct way to emit the
 * safe-degradation result.
 */

/** Pick a subset of input fields for a result's `inputSnapshot` (traceability). */
export function snapshotFor(
  input: BuildingInput,
  ...keys: (keyof BuildingInput)[]
): Partial<BuildingInput> {
  const snap: Partial<BuildingInput> = {};
  for (const key of keys) {
    // Assign through a typed helper to preserve the per-key type.
    (snap as Record<keyof BuildingInput, unknown>)[key] = input[key];
  }
  return snap;
}

/**
 * Build the `insufficient-input` result — the safe-degradation state used when a
 * required input is missing OR a required NCC value is unverified/null. This is
 * the ONLY correct response to unverified data; never guess or default.
 */
export function insufficientInput<TDetail extends ResultDetail>(args: {
  check: CheckName;
  clauseRef: string;
  detail: TDetail;
  summary: string;
  inputSnapshot: Partial<BuildingInput>;
  tableRef?: string;
  compartmentId?: string;
}): ComplianceResult<TDetail> {
  const result: ComplianceResult<TDetail> = {
    check: args.check,
    status: "insufficient-input",
    detail: args.detail,
    clauseRef: args.clauseRef,
    summary: args.summary,
    inputSnapshot: args.inputSnapshot,
    usesUnverifiedData: true,
  };
  // exactOptionalPropertyTypes: only attach optional fields when provided.
  if (args.tableRef !== undefined) result.tableRef = args.tableRef;
  if (args.compartmentId !== undefined) result.compartmentId = args.compartmentId;
  return result;
}
