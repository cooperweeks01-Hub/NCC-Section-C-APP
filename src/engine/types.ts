import type {
  BuildingClass,
  BuildingInput,
  Compartment,
  ConstructionType,
} from "../domain/building.ts";
import type { ComplianceResult, ResultDetail } from "../domain/result.ts";
import type { NccDataLayer } from "../data/schema.ts";

/**
 * The frozen rules-engine signature (brief §11 Phase A). Every rules module is a
 * PURE function of `(RuleContext) => ComplianceResult<TDetail>` — no side effects,
 * no network, no LLM (brief §4). The data layer is passed in (not imported) so
 * tests can inject a verified fixture layer while the real one stays all-null.
 */
export interface RuleContext {
  /** The typed building inputs. */
  input: BuildingInput;
  /** The NCC data layer to read thresholds from. Injected for testability. */
  data: NccDataLayer;
  /**
   * The compartment under assessment, for per-compartment rules
   * (compartment-size, large-isolated, setback). Omitted for building-level
   * rules (type-of-construction).
   */
  compartment?: Compartment;
  /**
   * The Type determined by the C2D2 check, for rules that depend on it
   * (compartment-size, FRL schedule, setback). `null` when not yet determined /
   * unverified; omitted when not applicable.
   */
  requiredType?: ConstructionType | null;
  /**
   * The class to assess this rule against — the compartment's own class in a
   * fire-separated multi-class building. Omitted ⇒ the rule uses
   * `input.buildingClass`. Only class-keyed rules (size, setback, FRL) read it.
   */
  assessClass?: BuildingClass;
}

/** A single deterministic rule: pure, typed in, traceable result out. */
export type RuleFn<TDetail extends ResultDetail> = (
  ctx: RuleContext,
) => ComplianceResult<TDetail>;
