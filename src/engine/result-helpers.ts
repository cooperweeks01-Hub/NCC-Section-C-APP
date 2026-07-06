import type { BuildingInput } from "../domain/building.ts";
import type {
  CheckName,
  ComplianceResult,
  ResultDetail,
  ResultStatus,
} from "../domain/result.ts";

/**
 * Shared helpers for building `ComplianceResult`s. Keeps traceability consistent
 * across every rule and gives Phase B a single, correct way to emit the
 * safe-degradation result.
 */

/**
 * Build any `ComplianceResult`, attaching optional fields only when provided
 * (required under `exactOptionalPropertyTypes`). Rules use this for computed
 * `complies` / `fails` / `determined` results; `insufficientInput` wraps it for
 * the safe-degradation case.
 */
export function complianceResult<TDetail extends ResultDetail>(args: {
  check: CheckName;
  status: ResultStatus;
  detail: TDetail;
  clauseRef: string;
  summary: string;
  inputSnapshot: Partial<BuildingInput>;
  usesUnverifiedData: boolean;
  tableRef?: string;
  pathway?: string;
  compartmentId?: string;
}): ComplianceResult<TDetail> {
  const result: ComplianceResult<TDetail> = {
    check: args.check,
    status: args.status,
    detail: args.detail,
    clauseRef: args.clauseRef,
    summary: args.summary,
    inputSnapshot: args.inputSnapshot,
    usesUnverifiedData: args.usesUnverifiedData,
  };
  if (args.tableRef !== undefined) result.tableRef = args.tableRef;
  if (args.pathway !== undefined) result.pathway = args.pathway;
  if (args.compartmentId !== undefined) result.compartmentId = args.compartmentId;
  return result;
}

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
  /**
   * Whether an unverified NCC value was involved. Defaults to `true` — the usual
   * reason for insufficient-input. Set `false` when the DATA is verified but a
   * required INPUT is missing/out of range: the result is still insufficient-input
   * (we cannot decide), but no unverified value was touched, so the DRAFT banner
   * must not fire for it.
   */
  usesUnverifiedData?: boolean;
}): ComplianceResult<TDetail> {
  const result: ComplianceResult<TDetail> = {
    check: args.check,
    status: "insufficient-input",
    detail: args.detail,
    clauseRef: args.clauseRef,
    summary: args.summary,
    inputSnapshot: args.inputSnapshot,
    usesUnverifiedData: args.usesUnverifiedData ?? true,
  };
  // exactOptionalPropertyTypes: only attach optional fields when provided.
  if (args.tableRef !== undefined) result.tableRef = args.tableRef;
  if (args.compartmentId !== undefined) result.compartmentId = args.compartmentId;
  return result;
}
