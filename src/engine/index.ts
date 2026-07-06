// Rules engine barrel. Every rule is a pure `RuleFn` against the frozen contracts.
// No side effects, no network, no LLM (brief §4).
export * from "./types.ts";
export * from "./result-helpers.ts";
export { assessTypeOfConstruction } from "./type-of-construction.ts";
export { assessCompartmentSize } from "./compartment-size.ts";
export { assessLargeIsolated } from "./large-isolated.ts";
export { assessSetbackSeparation } from "./setback-separation.ts";
export { assessFrlSchedule } from "./frl-schedule.ts";
