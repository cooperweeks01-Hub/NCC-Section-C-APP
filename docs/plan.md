# Implementation Plan — NCC Section C (Fire Resistance) DTS Compliance Tool

> Companion to [`brief.md`](./brief.md) and
> [`ncc-section-c-reference-scaffold.md`](./ncc-section-c-reference-scaffold.md).
> This plan governs the build. It defines the workstreams, the frozen contracts,
> the acceptance criteria per workstream, the whole-product Definition of Done,
> and the test strategy while every NCC value is still an unverified placeholder.

---

## 0. Where this plan sits

The build follows the orchestration in brief §11:

- **Phase 0 — plan + Definition of Done** (this document). No code fan-out until it exists.
- **Phase A — foundation, single-threaded.** Freeze the shared contracts: repo layout,
  the typed NCC data schema, `ComplianceResult`/`ProjectState`, and every module interface.
  **This is done in the same pass as this plan** and is what "lock the schema" means.
  Nothing parallelises until these compile.
- **Phase B — parallel subagents on independent leaf modules**, each built against the
  frozen contracts (see §3 workstreams).
- **Phase C — integration + review, single-threaded.** Wire modules, run the full suite,
  one correctness pass over the whole compliance path. Iterate B→C until the DoD is met.

**Status at time of writing:** Phase 0 + Phase A complete. Contracts are frozen and
typecheck. All NCC table values are `{ value: null, verified: false, source: "… TRANSCRIBE" }`.
Rules modules exist as signature-locked stubs that safely degrade to `insufficient-input`.

---

## 1. Non-negotiables (inherited by every workstream and subagent)

1. **No fabricated NCC data — hard rule.** Never invent, guess, infer, scrape, or
   model-extract an NCC value. Every value stays `verified: false` with `value: null`
   until a competent person transcribes it from the licensed NCC 2022 Volume One.
   If a needed value is missing, **surface `insufficient-input` — never substitute a plausible number.**
2. **Traceability is structural.** Every `ComplianceResult` carries `clauseRef`
   (and `tableRef`/`pathway` where relevant) plus an `inputSnapshot`. No number
   renders anywhere without a citation attached.
3. **No LLM in the compliance path.** Every pass/fail is a pure function of typed
   inputs and the NCC data layer. The optional `explain()` layer narrates *after* a
   deterministic decision and can never change it.
4. **No magic numbers in code.** Every threshold lives in the typed data layer with a `source`.
5. **Safe degradation.** Missing input or unverified value ⇒ the tool says so explicitly
   (`insufficient-input`, `usesUnverifiedData: true`) rather than guessing or defaulting.
6. **Strict TypeScript.** `strict: true`; types are the correctness lever, not a preference.

---

## 2. Frozen contracts (Phase A — do not redefine downstream)

These are locked in `src/domain/` and `src/data/schema.ts`. Subagents **import** them;
they never redefine types. Redefining a shared type is the single biggest failure mode
this plan exists to prevent.

| Contract | File | Role |
|---|---|---|
| `NccValue<T>` + `isUsable`/`isPending` helpers | `src/domain/ncc-value.ts` | Every table value: `{ value, verified, source }`. |
| `BuildingClass`, `ConstructionType`, `FRL`, `ExternalWall`, `Compartment`, `BuildingInput` | `src/domain/building.ts` | The lever set / typed inputs. |
| `ComplianceResult<T>`, `ResultStatus`, per-check detail types | `src/domain/result.ts` | The traceable output object every rule returns. |
| `ProjectState`, `ProjectMeta`, `ProjectSummary` | `src/domain/project.ts` | The single serializable project object. |
| NCC table lookup types + the placeholder data layer | `src/data/` | Typed lookups; all leaf values `null`/`verified:false`. |
| `RuleFn`, `RuleContext` | `src/engine/types.ts` | The signature every rules module implements. |
| `ProjectStore` | `src/persistence/project-store.ts` | Persistence interface (IndexedDB now, Azure later). |
| `Explainer` / `explain()` | `src/llm/explain.ts` | Optional LLM layer, off by default. |
| `DISCLAIMER`, `DRAFT_BANNER` | `src/domain/disclaimer.ts` | Shared constants for UI + PDF. |

**Rule about detail types:** `ComplianceResult<T>` is generic, but every rule returns a
**named, concrete** detail type (`TypeOfConstructionDetail`, `CompartmentSizeDetail`,
`LargeIsolatedDetail`, `SetbackDetail`, `FrlScheduleDetail`). No rule returns
`ComplianceResult<unknown>`. A frozen signature includes its return type.

---

## 3. Workstreams (Phase B — one subagent each, all against §2 contracts)

Each workstream lists: **objective · scope · depends-on contract · acceptance criteria**.
Acceptance criteria are the tests that must pass. "Green against a verified fixture data
layer" is defined in §5.

### WS-1 · Rules: Type of construction (Table C2D2)
- **Objective.** Determine required minimum Type A/B/C from `(Class, riseInStoreys)`, then
  derive a "less-onerous Type achievable?" analysis **only** from real levers (reduce rise;
  applicable concessions C2D5/C2D6), each with its clause.
- **Scope.** `src/engine/type-of-construction.ts`. Reads `data.c2d2`. Returns
  `ComplianceResult<TypeOfConstructionDetail>`.
- **Depends on.** `RuleFn`, `TypeOfConstructionDetail`, `data.c2d2`.
- **Acceptance.**
  - Given a verified C2D2 fixture, returns the exact Type for representative `(Class, rise)` cells.
  - Asserts `clauseRef === "C2D2"` and `tableRef === "Table C2D2"`.
  - The less-onerous analysis lists each lever with a clause and the resulting Type; it
    **never** brute-forces C→B→A — it re-looks-up C2D2 at reduced rise.
  - With the placeholder (null) data layer ⇒ `insufficient-input`, `usesUnverifiedData: true`.

### WS-2 · Rules: Compartment size + large isolated (C3D3 / C3D4 / C3D5)
- **Objective.** Per compartment, compare floor area + volume against Table C3D3 for
  `(Class, Type)`. On exceedance, compute options with exact thresholds: subdivide
  (target sizes + required fire-wall FRL + opening protection) and the C3D4 large-isolated
  concession (only while area ≤ cap AND volume ≤ cap), evaluating C3D5(1) open-space and
  C3D5(2) sprinkler+perimeter-access pathways and reporting the gap.
- **Scope.** `src/engine/compartment-size.ts`, `src/engine/large-isolated.ts`.
- **Depends on.** `CompartmentSizeDetail`, `LargeIsolatedDetail`, `data.c3d3`, `data.c3d4Caps`,
  `data.spec17`.
- **Acceptance.**
  - Type C Class 7/8 compartment that exceeds C3D3 routes into the C3D4 assessment and
    **asks the sprinkler question at that point** (not upfront).
  - Reports value-vs-limit numerically for both area and volume.
  - C3D4 offered **only** while area ≤ cap AND volume ≤ cap; above either cap it is withheld
    with the reason.
  - Pathway A vs B evaluated from inputs; the missing element is named.
  - Null data layer ⇒ `insufficient-input` (no compute against unverified caps).

### WS-3 · Rules: Setback / separation + external-wall FRL (Spec 5 / C4D4)
- **Objective.** Per external wall, compute required external-wall FRL as a function of
  distance to the fire-source feature (Spec 5). For openings in adjacent compartments
  separated by a fire wall, compute required separation (Table C4D4) with the
  `≥60/60/60 + protected openings` exemption. Recompute + cite on setback reduction.
- **Scope.** `src/engine/setback-separation.ts`.
- **Depends on.** `SetbackDetail`, `data.spec5ExtWall`, `data.c4d4`.
- **Acceptance.**
  - A worked setback/FRL case returns the correct FRL band and cites Spec 5.
  - Separation check applies the exemption path correctly.
  - Null data layer ⇒ `insufficient-input`.

### WS-4 · Rules: FRL schedule (Spec 5)
- **Objective.** For the determined Type, produce the FRL schedule per building element,
  each line citing its Spec 5 clause/table.
- **Scope.** `src/engine/frl-schedule.ts`.
- **Depends on.** `FrlScheduleDetail`, `data.spec5Frl`.
- **Acceptance.**
  - Given a verified Spec 5 fixture, emits one cited FRL line per element for the Type.
  - `"–"` (no requirement) is represented distinctly from a numeric FRL.
  - Null data layer ⇒ each line flagged `usesUnverifiedData`, overall `insufficient-input`.

### WS-5 · NCC data layer + verification checklist
- **Objective.** Typed lookups for every table with `value:null`/`verified:false`
  placeholders; the verification checklist doc enumerating every value to confirm.
- **Scope.** `src/data/**`, `docs/verification-checklist.md`. **Owned in Phase A** (this pass);
  Phase B only fills values after human verification.
- **Acceptance.**
  - Every leaf value is an `NccValue` with `verified: false` and a `source` string.
  - `isUsable()` returns false for every placeholder; the checklist lists every table cell/band.

### WS-6 · Persistence (`ProjectStore`: IndexedDB + JSON import/export)
- **Objective.** Implement `ProjectStore` over IndexedDB (`idb`) plus JSON export/import,
  behind the frozen interface. Autosave so a refresh never loses work.
- **Scope.** `src/persistence/**`.
- **Depends on.** `ProjectStore`, `ProjectState`.
- **Acceptance.**
  - Round-trips a `ProjectState` through save/load and through export/import unchanged.
  - Interface matches the frozen signature exactly (Azure later implements the same interface).

### WS-7 · PDF export
- **Objective.** Client-side branded PDF: metadata + full input snapshot + every result with
  clause/table ref + pathway + advisory flags + per-compartment breakdown + disclaimer +
  DRAFT banner when any value is unverified.
- **Scope.** `src/pdf/**`.
- **Depends on.** `ComplianceResult`, `ProjectState`, `DISCLAIMER`, `DRAFT_BANNER`.
- **Acceptance.**
  - Renders a result set to PDF offline (no backend).
  - No number appears without a citation; DRAFT banner present iff any `usesUnverifiedData`.

### WS-8 · UI shell + §6 workflow screens
- **Objective.** Guided linear workflow (classify → inputs → type → compartment → setback →
  FRL → advisory → report) with a persistent results/clause side panel. Borg identity.
- **Scope.** `src/ui/**`, `src/App.tsx`.
- **Depends on.** all domain types + rule outputs.
- **Acceptance.**
  - Workflow steps back and forth; side panel shows running results + clause refs.
  - Disclaimer always visible; DRAFT banner wired to `usesUnverifiedData`.

### WS-9 · Optional `explain()` LLM layer
- **Objective.** Single `Explainer` behind an interface; Anthropic API only if a key is
  configured; off by default; never in the compliance path.
- **Scope.** `src/llm/**`.
- **Depends on.** `Explainer`, `ComplianceResult`.
- **Acceptance.**
  - With no key, `isEnabled() === false` and the app is fully functional.
  - `explain()` takes an already-decided `ComplianceResult` and returns prose; it cannot
    mutate or produce a result.

---

## 4. Dependency ordering

```
Phase A contracts (§2)  ── frozen ──┐
                                    ├─► WS-1  Type of construction
                                    ├─► WS-2  Compartment + large isolated
                                    ├─► WS-3  Setback / separation
                                    ├─► WS-4  FRL schedule
                                    ├─► WS-5  Data layer + checklist  (Phase A owned)
                                    ├─► WS-6  Persistence
                                    ├─► WS-7  PDF export
                                    ├─► WS-8  UI shell + workflow
                                    └─► WS-9  explain()
                                            │
Phase C: integrate ◄────────────────────────┘  wire · full suite · correctness pass
```

All WS in Phase B are independent leaves against frozen contracts — they parallelise safely.
WS-7 (PDF) and WS-8 (UI) consume rule outputs, so integrate after WS-1..4 land, but they
can be built in parallel against the typed result shapes with fixture results.

---

## 5. Test strategy while every value is `null` (critical)

The engine ships **before** any NCC value is verified, so "acceptance = tests green" must be
defined against placeholder data. Two layers:

1. **The null path is itself a tested requirement (safe degradation).**
   Every rule, run against the real placeholder data layer, must return `insufficient-input`
   with `usesUnverifiedData: true` — never a computed pass/fail. This is asserted per rule.
   It proves the tool refuses to compute against unverified data.

2. **Logic is tested against a verified *fixture* data layer, not the real one.**
   `src/data/__fixtures__/` provides a small, clearly-labelled **synthetic** data layer whose
   values are `verified: true`. These numbers are **test fixtures, not NCC values** — they
   exist only to exercise branch logic (does a value over the limit route to C3D4? does a
   reduced rise re-lookup C2D2?). Every fixture file carries a header: *"SYNTHETIC TEST DATA —
   NOT NCC VALUES. Do not copy into the real data layer."* Rules take the data layer as a
   parameter (`RuleContext.data`) precisely so tests can inject the fixture.

This keeps the no-fabrication rule intact (real data layer stays null) while still proving the
branch logic is correct before real values land. When a competent person fills the real values
and flips `verified: true`, the same logic runs unchanged — no code change, per brief Phase 1.

Worked examples the suite must include (brief §9): at least one **Type C Class 7/8
over-compartment case routing through C3D4**, one **multi-compartment building**, and one
**setback/FRL case** — each asserting both the result and the returned clause reference.

---

## 6. Definition of Done (whole product)

The product is **done** only when all of the following hold:

- [ ] Every workstream's acceptance criteria (§3) pass — full unit suite green.
- [ ] The §6 workflow runs **end-to-end on placeholder data**: a user can classify, enter a
      building, and walk every step, with the tool reporting `insufficient-input` /
      `DRAFT — unverified` honestly wherever a value is null.
- [ ] The safe-degradation path (§5.1) is asserted for every rule.
- [ ] Branch logic is proven against the verified fixture layer (§5.2), including the three
      named worked examples.
- [ ] The persistent clause/results panel shows every result with its clause/table ref.
- [ ] Client-side PDF renders end-to-end offline: full input snapshot, every result with
      citation + pathway, advisory flags, per-compartment breakdown, the §8 disclaimer, and a
      DRAFT banner whenever any value used is unverified.
- [ ] The §8 disclaimer appears on screen and in every PDF.
- [ ] No number renders without a citation; no value ships with `verified: false` presented as final.
- [ ] `ProjectStore` and `explain()` sit behind their frozen interfaces; nothing depends on
      Azure or on an LLM being present.
- [ ] `tsc --noEmit` clean under `strict`; README covers local run + the Azure-later path.

**Explicitly NOT in scope** (keep architecture clean, note in README): Performance Solutions;
Classes 1–4 and 10; egress-path checker; Revit/drawing reader; cloud accounts / multi-user
storage. These are future adds behind the same interfaces.

---

## 7. Verification gate (before the tool is relied upon for real numbers)

Placeholder → production is a **data** step, not a code step:

1. A competent person works [`verification-checklist.md`](./verification-checklist.md),
   transcribing each value from the licensed NCC 2022 Volume One and flipping `verified: true`.
2. Until then, every result the value touches renders `DRAFT — unverified` and the PDF carries
   the banner. The engine will not present an unverified value as a final result.
3. State/territory Schedule variations (NSW/VIC/QLD/SA…) are checked as part of verification;
   the MVP targets base NCC and flags that variations apply.
