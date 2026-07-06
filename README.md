# NCC Section C — DTS Fire Resistance Compliance Tool

Internal web tool for **Crossmuller / Borg** designers to assess a Class 5–9 building
against **Section C (Fire Resistance) of NCC 2022 Volume One** via the
**Deemed-to-Satisfy (DTS)** pathway. It determines the required Type of construction,
checks fire-compartment sizes, computes setback / separation and FRL requirements, and
produces a branded, clause-referenced report.

> **Indicative only.** This tool does not constitute certification, a Performance
> Solution, or professional advice. Every result must be verified by a registered
> building surveyor and/or fire safety engineer. See the disclaimer in
> [`src/domain/disclaimer.ts`](src/domain/disclaimer.ts).

---

## Status: Phase 0 + Phase A complete (foundation locked)

This repository currently contains the **frozen foundation**, not the finished app:

- ✅ Implementation plan, workstreams, acceptance criteria, and Definition of Done —
  [`docs/plan.md`](docs/plan.md).
- ✅ **Locked schema / contracts** — domain types, the `ComplianceResult` output with
  concrete per-check detail types, `ProjectState`, and the module interfaces
  (`ProjectStore`, `Explainer`, `RuleFn`). These do not change downstream.
- ✅ **Typed NCC data layer** with every value an **unverified placeholder**
  (`{ value: null, verified: false, source: "… TRANSCRIBE" }`).
- ✅ **Signature-locked rules engine** that safely degrades to `insufficient-input`
  against the placeholder data (proven by [`src/engine/safe-degradation.test.ts`](src/engine/safe-degradation.test.ts)).
- ✅ Verification checklist — [`docs/verification-checklist.md`](docs/verification-checklist.md).
- ⏳ **Next (Phase B):** rules logic, persistence (IndexedDB + JSON), PDF export, the
  guided workflow UI, and the optional `explain()` layer — each built against the frozen
  contracts. See the workstreams in [`docs/plan.md`](docs/plan.md).

No NCC numbers are trusted until a competent person verifies them (see below).

---

## Repository layout

```
docs/
  brief.md                          project brief
  ncc-section-c-reference-scaffold.md   clause map, decision flow, schema spine
  plan.md                           workstreams · acceptance criteria · Definition of Done
  verification-checklist.md         every value to confirm against the licensed NCC
src/
  domain/        FROZEN contracts — NccValue, building inputs, ComplianceResult, ProjectState, disclaimer
  data/          typed NCC lookups; every leaf is an unverified placeholder
    schema.ts      lookup shapes (grid + band tables)
    tables/        one file per table (verifiers edit these)
    index.ts       assembles `nccData`
  engine/        pure RuleFn modules (signature-locked stubs) + safe-degradation test
  persistence/   ProjectStore interface (IndexedDB now, Azure later)
  llm/           Explainer interface + disabled default (optional, off by default)
  App.tsx        UI shell (full workflow is WS-8)
```

---

## Running locally

Requires Node 18+ and npm.

```bash
npm install
npm run dev        # start the Vite dev server
npm run typecheck  # tsc --noEmit (strict) — proves the contracts compile
npm run test       # vitest — includes the safe-degradation suite
npm run build      # typecheck + production build
```

The app is **local-first with zero cloud dependency** — it runs entirely in the browser.

---

## The verification gate (why every value is null)

NCC tables are dense multi-column layouts; automated extraction silently mangles them,
and every result in a compliance tool must trace to a confirmed value. So:

1. The data layer ships with **every value `verified: false`, `value: null`**.
2. The engine **refuses to compute** against unverified values — it returns
   `insufficient-input` and flags `usesUnverifiedData`, and the UI/PDF show
   `DRAFT — unverified`.
3. A competent person works [`docs/verification-checklist.md`](docs/verification-checklist.md),
   transcribing each value from the licensed NCC 2022 Volume One and flipping
   `verified: true`. **This is a data step — no code changes.** The same engine then
   produces final results.

**Hard rule:** never invent, guess, scrape, or auto-fill an NCC value. If a needed value
is missing, the tool surfaces it rather than substituting a plausible number.

---

## Architecture guarantees

- **No LLM in the compliance path.** Every pass/fail is a pure function of typed inputs
  and the NCC data layer. The optional `explain()` layer (Anthropic, off by default)
  only narrates an already-decided result and can never change it.
- **Azure-later, not now.** Persistence and any would-be-server concern sit behind the
  `ProjectStore` / `Explainer` interfaces. Moving to Azure is a config/implementation
  swap, not a rewrite. Nothing depends on Azure or on an LLM being present.
- **Traceability is structural.** Every result carries `{ clauseRef, tableRef?, pathway?,
  inputSnapshot, usesUnverifiedData }`. The PDF is a rendering of these objects — no
  number appears without a citation.

---

## Out of scope (future adds, kept clean behind interfaces)

Performance Solutions · Building Classes 1–4 and 10 (Class 5–9 only) · egress-path
checker · Revit / drawing reader · cloud accounts & multi-user storage (Azure phase).
