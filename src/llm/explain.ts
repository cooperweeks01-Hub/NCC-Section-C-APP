import type { AnyComplianceResult } from "../domain/result.ts";

/**
 * Optional LLM explanation layer (brief §4, §5).
 *
 * HARD WALL: the LLM is NEVER in the compliance path. `explain()` receives a
 * result the deterministic engine has ALREADY decided and returns plain-English
 * narration of it. It cannot change, override, or produce a compliance result.
 *
 * OFF BY DEFAULT: with no API key configured, `isEnabled()` is false and the app
 * is fully functional without it. Anthropic is the only provider (WS-9).
 */
export interface Explainer {
  /** True only when a key is configured and the layer is available. */
  isEnabled(): boolean;
  /**
   * Narrate an already-decided result in plain English. Purely additive — the
   * returned string is descriptive text, never a new or modified result.
   * Implementations must reject (throw) if called while `isEnabled()` is false.
   */
  explain(result: AnyComplianceResult): Promise<string>;
}

/**
 * The always-available no-op explainer. This is the DEFAULT: the app ships wired
 * to this, so nothing depends on an LLM being present. WS-9 provides an
 * Anthropic-backed implementation behind the same interface, selected only when a
 * key is configured.
 */
export const disabledExplainer: Explainer = {
  isEnabled: () => false,
  explain: () =>
    Promise.reject(
      new Error(
        "Explanation layer is disabled (no API key configured). The compliance " +
          "result is unaffected; enable the optional LLM layer to narrate it.",
      ),
    ),
};
