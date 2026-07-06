# NCC Section C — DTS Fire Resistance Compliance Tool

Internal web tool for **Crossmuller / Borg** designers to assess a building against
**Section C (Fire Resistance) of NCC 2022 Volume One** via the **Deemed-to-Satisfy
(DTS)** pathway. It determines the required Type of construction, checks fire-compartment
sizes (with the large-isolated concession), computes setback / external-wall FRL and the
FRL schedule, flags knock-on consequences, and produces a branded, clause-referenced PDF.

> **Indicative only.** This tool does not constitute certification, a Performance
> Solution, or professional advice. Every result must be verified by a registered
> building surveyor and/or fire safety engineer. The disclaimer
> ([`src/domain/disclaimer.ts`](src/domain/disclaimer.ts)) appears on screen and in every PDF.

---

## Scope (v1)

- **Classes assessed: 5, 7a, 7b, 8 only.** Any other class returns *“out of scope — not
  assessed”*, never a guessed result. The verified NCC data extract covers exactly these
  classes ([`docs/ncc-section-c-data-verified.md`](docs/ncc-section-c-data-verified.md)).
- **Computed checks:** type of construction (C2D2) · compartment size (C3D3) ·
  large-isolated concession (C3D4/C3D5) · setback + external-wall FRL (Spec 5) + opening
  separation (C4D4) · FRL schedule (Spec 5) · multi-compartment roll-up.
- **Advisory / flag-only:** §6.8 cross-references (C2D10/C2D11/Part C4) and §6.9 knock-on
  flags (E1D5 sprinkler trigger > 25 m; hydrant/appliance-access coupling — AS 2419.1).

### Data verification status

Class 5/7a/7b/8 values for **C2D2, C3D3, C4D4, and Specification 5** are transcribed and
confirmed (`verified: true`). The **large-isolated caps (C3D4), C3D5 open-space width, the
C4D5 exemption threshold, and Specification 17 are not in the extract** and remain
unverified — the engine **safely degrades** any result that touches them to
`insufficient-input` (never fabricated), and the UI/PDF show `DRAFT — unverified`. See
[`docs/verification-checklist.md`](docs/verification-checklist.md).

**Hard rule:** never invent, guess, scrape, or auto-fill an NCC value. Filling the
remaining values is a **data step, no code change** — transcribe into
[`src/data/tables/`](src/data/tables/) and flip `verified: true`.

---

## Running locally

Requires Node 18+ and npm.

```bash
npm install
npm run dev        # Vite dev server
npm run test       # vitest — 56 tests (engine, orchestrator, persistence, PDF, app)
npm run typecheck  # tsc --noEmit (strict)
npm run build      # typecheck + production build
```

Local-first with **zero cloud dependency** — everything runs in the browser. Projects
autosave to IndexedDB and can be exported/imported as JSON.

---

## Architecture

- **Deterministic engine is the entire compliance path.** Every result is a pure function
  of typed inputs and the NCC data layer, returning an exact clause/table reference. No
  LLM ever decides a result.
- **`assessProject`** ([`src/engine/assess.ts`](src/engine/assess.ts)) orchestrates the
  pure rule modules per compartment; the UI derives the assessment on every input change,
  so screen and PDF never drift.
- **Class grouping is per-table** (a correctness trap the schema encodes explicitly): C3D3
  groups `{5}` vs `{7a,7b,8}`; Spec 5 groups `{5,7a}` vs `{7b,8}` — 7a lands in different
  buckets. See [`docs/phase-b-data-model.md`](docs/phase-b-data-model.md).
- **Traceability is structural.** Every `ComplianceResult` carries `{ clauseRef, tableRef?,
  pathway?, inputSnapshot, usesUnverifiedData }`. The PDF is a pure rendering of these — no
  number appears without a citation.
- **Azure-later, not now.** Persistence sits behind the `ProjectStore` interface
  (IndexedDB today; the same interface is what Azure implements). The optional Anthropic
  `explain()` layer ([`src/llm/explain.ts`](src/llm/explain.ts)) is **interface-only and
  off** for v1 — it may only narrate an already-decided result, never change one.

```
src/
  domain/        frozen contracts — NccValue, building inputs, ComplianceResult, ProjectState
  data/          typed NCC lookups (verified for 5/7a/7b/8) + __fixtures__ (synthetic test data)
  engine/        pure RuleFn modules + assessProject orchestrator + tests
  persistence/   ProjectStore over IndexedDB + JSON import/export
  pdf/           client-side branded report (@react-pdf/renderer, lazy-loaded)
  ui/ state/     guided workflow, persistent clause panel, single-ProjectState hook
  llm/           Explainer interface + disabled default (optional, off)
```

---

## Not in scope (future adds, kept clean behind interfaces)

Performance Solutions · Classes 1–4, 6, 9, and 10 · the Part A6 use-based classification
questionnaire (direct class picker only in v1) · egress-path checker · Revit / drawing
reader · cloud accounts & multi-user storage (Azure phase) · the optional LLM narration.
