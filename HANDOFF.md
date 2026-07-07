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

## Data status: fully verified for the covered scope

Verified (`verified: true`): **C2D2, C3D3, C4D4, Spec 5, and C3D4 caps / C3D5
geometry** (caps 18,000 m² / 108,000 m³; open space ≥ 18 m; perimeter access
≥ 6 m within 18 m). So the large-isolated concession now **computes** end-to-end;
it only reports `insufficient-input` when the designer hasn't yet answered the
concession questions — and that carries `usesUnverifiedData: false`, so **no DRAFT
banner** for a normal in-scope assessment.

Still placeholders (do NOT gate anything): the **C4D5 exemption FRL threshold**
(the setback opening-separation exemption isn't computed — `exemptionApplies`
stays null with a cite-and-verify note) and **Specification 17's complying-conditions
text** (unused — the sprinkler pathway trusts the designer's yes/no).

**Large-isolated has TWO independent pathways (get this right):** the 18,000 /
108,000 caps bound ONLY pathway A (open space, C3D5(1), Class 7/8 + ≤ 2 storeys).
Pathway B (sprinklers to Spec 17 + perimeter access, C3D5(2)) has **no size cap** —
that is what lets a large building qualify. See `src/engine/large-isolated.ts`.

## Next steps / open items

1. **Optional remaining data/logic (not blocking).** The C4D5 opening-separation
   exemption is cited but not computed (would need both its FRL threshold in
   `c4d4.ts` and a small setback-rule addition). Spec 17's text is unused. Neither
   affects current results. See `docs/verification-checklist.md`.
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
