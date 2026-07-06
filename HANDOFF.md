# Session handoff — NCC Section C tool

_Written 2026-07-07. Temporary handoff for the next Claude Code session. Delete
once read (it is committed only for durability)._

## TL;DR

**v1 is complete and working** for Class 5, 7a, 7b, 8. The full app — deterministic
engine, orchestrator, IndexedDB persistence, client-side PDF, and the guided UI —
is built, committed per phase, and **verified end-to-end in a real browser**.

- Branch `master`, HEAD `4448fa1` (13 commits). Working tree clean.
- `npm test` → **56 tests pass**. `npm run build` → **exit 0** (strict `tsc` + Vite).
- Browser-verified (Edge): walked the workflow, forced a C3D3 exceedance → C3D4
  routing, DRAFT banner, and a valid PDF download via the browser `toBlob()` path.

## What exists (architecture map)

- `src/domain/` — frozen contracts: `NccValue<T>`, `BuildingInput` (+ `InScopeClass`,
  `isInScope`), `ComplianceResult<TDetail>` with concrete detail types + the
  `determined` status, `ProjectState`, disclaimer constants.
- `src/data/` — **verified** NCC layer (Class 5/7a/7b/8): C2D2, C3D3, C4D4, Spec 5
  (external-wall-by-distance + fixed schedule). `__fixtures__/synthetic-data-layer.ts`
  is SYNTHETIC test data (verified caps the real layer lacks) — never copy into real.
- `src/engine/` — pure `RuleFn` modules (type-of-construction, compartment-size,
  large-isolated, setback-separation, frl-schedule) + `assess.ts` orchestrator
  (`assessProject`). Each has its own `*.test.ts`; `assess.test.ts` holds the three
  brief-§9 worked examples + the sprinkler-gating test.
- `src/persistence/` — `IndexedDbProjectStore` implements the frozen `ProjectStore`
  (save/load/list/delete + JSON export/import + validation).
- `src/pdf/report.tsx` — branded `@react-pdf/renderer` report (lazy-loaded).
- `src/state/` + `src/ui/` + `src/App.tsx` — single-derived-assessment app, guided
  workflow, persistent clause panel, DRAFT banner, autosave.
- `src/llm/explain.ts` — Explainer interface + disabled default (OFF for v1, by request).

## The one thing to understand: verified vs unverified data

Verified (`verified: true`): **C2D2, C3D3, C4D4, Spec 5**.
NOT in the verified extract → still `null`/unverified, **safely degrades** (never
fabricated): **C3D4 large-isolated caps, C3D5 open-space width, C4D5 exemption
threshold, Specification 17**.

Consequence: on real data, any compartment that exceeds C3D3 routes to the
large-isolated concession, which then returns `insufficient-input` (DRAFT) until
those caps are transcribed. **This is by design, not a bug.** The synthetic fixture
carries invented caps so the concession's branch logic is fully tested.

## Next steps / open items

1. **Fill the remaining data (pure data step, no code change).** Transcribe C3D4
   caps, C3D5(1) width, C4D5 threshold, and Spec 17 into `src/data/tables/`
   (`c3d4-c3d5.ts`, `c4d4.ts`, `spec17.ts`) and flip `verified: true`. The
   large-isolated result then computes and the DRAFT banner clears itself. See
   `docs/verification-checklist.md`.
2. **Off-machine backup — still unresolved.** No git remote is configured; all 13
   commits are local only. Pushing to GitHub is the backup story (left for the user
   to authorise — it's outward-facing).
3. **Old C:\ OneDrive copy — contents deleted** (`…/OneDrive/Desktop/Claude/
   NCC Section C APP`). The empty folder node may still linger if OneDrive held a
   lock; remove the empty folder manually if so.
4. **Branch:** all Phase B/C work is on `master`. Move to a feature branch if preferred.

## Known limitations to preserve/decide (not bugs)

- The C3D4 sprinkler / open-space inputs appear in **Step 2** only once a Step-3
  compartment triggers routing — a first linear pass needs a step-back. Fine while
  the concession degrades anyway; relocate to the results view if desired.
- **Part A6 use-based classification questionnaire is NOT built** — direct class
  picker only (in-scope classes + an out-of-scope notice). Future add.
- Out of scope by design: Performance Solutions; Classes 1–4, 6, 9, 10; egress
  checker; Revit reader; cloud/multi-user (Azure phase); the LLM `explain()` layer.

## Design rules to keep (do not violate)

- **No fabricated NCC values — ever.** Missing/unverified ⇒ `insufficient-input`,
  never a plausible number. `usesUnverifiedData` drives the DRAFT banner.
- **Per-table class grouping is deliberate** (7a groups with 5 for Spec 5, with
  7b/8 for C3D3 — separate enums + mappers). See `docs/phase-b-data-model.md`.
- **No LLM in the compliance path.** Every pass/fail is a pure function of typed
  inputs + the data layer, and carries a clause/table reference.
- The less-onerous Type analysis **re-looks-up C2D2 at reduced rise** — never a
  C→B→A brute force.

## Run it

```bash
npm install
npm run dev        # Vite dev server
npm run test       # 56 tests
npm run build      # strict tsc + production build
```

Orientation docs: `docs/brief.md` (source brief), `docs/plan.md` (workstreams +
Definition of Done), `docs/phase-b-data-model.md` (the data-driven schema
revision), `docs/ncc-section-c-data-verified.md` (the source of truth for values),
`docs/verification-checklist.md` (what's verified vs pending).
