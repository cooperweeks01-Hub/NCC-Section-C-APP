# Claude Code Prompt — NCC 2022 Volume One, Section C (Fire Resistance) Compliance Tool

> Paste this whole file into Claude Code as the project brief. A companion file,
> `ncc-section-c-reference-scaffold.md`, defines the clause map, decision flow, and
> data schema — read it before writing engine code. Add both files to the repo as
> `/docs/brief.md` and `/docs/ncc-reference-scaffold.md`.

---

## 1. What we're building

An internal web tool for **Crossmuller / Borg** designers to assess an existing or proposed
building against **Section C (Fire Resistance) of NCC 2022 Volume One**, via the
**Deemed-to-Satisfy (DTS)** pathway only.

The core job is to determine, for a given building, the **required Type of construction**,
whether the building's **fire compartments** fit the allowable sizes, and what a designer
must do about **setbacks / separation and fire-resistance levels (FRLs)** — with **every
result traceable to an exact NCC clause or table**. When the building fails a check, the tool
computes the **specific levers and thresholds** to fix it (not vague advice) and flags the
**knock-on consequences** (e.g. reducing boundary setback compromising fire-hydrant coverage).

**Non-negotiable:** accuracy and traceability. This tool guides internal design decisions.
A single wrong FRL or compartment limit is worse than no tool. Correctness beats speed and
beats features. Do not over-engineer, but do not cut corners on the compliance core.

**Users:** internal designers doing early feasibility. **Output is indicative only** — it never
constitutes certification and is not a Performance Solution. It must be verified by a
registered building surveyor / fire safety engineer. Every report carries that disclaimer.

---

## 2. Build in two phases

### Phase 0 — NCC reference data layer + verification gate (do this first)

The tool's compliance logic reads from a structured NCC data layer. **Build the layer's
schema and decision logic first** (structure is in the companion scaffold), then stub the
numeric table values as clearly-marked **unverified placeholders**.

Why this ordering and why placeholders:

- **Accuracy.** NCC tables are dense multi-column layouts (FRL values, compartment limits).
  Automated PDF extraction reliably mangles exactly this content — merged cells, footnotes,
  superscripts. **No table value is trusted until a competent person has verified it against
  the licensed NCC.** Ship a verification checklist. Mark every unverified value visibly in
  the UI and PDF as `DRAFT — unverified`.
- **Provenance & verification (the real constraint).** Values are transcribed from the NCC — which
  the company accesses freely — and confirmed by a competent person, **not scraped or model-guessed**,
  because model extraction of dense multi-column tables is unreliable and every result must trace to a
  confirmed value. Clause *numbers* and what each clause governs are facts and fine to encode; the
  numeric *values* come from the source under verification. Keep the data layer and tool internal.

Deliverable for Phase 0: typed schema + lookup structure for every table, populated with
`{ value: null, verified: false, source: "Table Cxxx — TRANSCRIBE" }` placeholders, plus the
verification checklist doc.

### Phase 1 — MVP web app

Build the full app against the Phase 0 schema. The engine and UI work end-to-end on
placeholder data; real values drop in after verification without code changes.

### Do NOT build (note in README, keep architecture clean for them)

- Performance Solutions (bespoke fire engineering — not automatable).
- Building Classes 1–4 and 10 (Class **5–9 only** for now).
- Egress-path checker (future add-on).
- Revit / drawing reader (future add-on).
- Cloud accounts / multi-user storage (deferred to the Azure phase — see §4).

---

## 3. Scope of Section C

**Computed (deterministic pass/fail with exact numbers):**

1. **Type of construction** — Table C2D2 (Class × rise in storeys → Type A/B/C).
2. **Fire compartment size** — C3D3 + Table C3D3 (max floor area + max volume, Class 5–9).
3. **Large isolated buildings** — C3D4 concession + C3D5 (open space / perimeter vehicular access).
4. **Setback / separation from fire-source features** — Specification 5 (external-wall FRL by
   distance to fire-source feature) and C4D4 + Table C4D4 (separation between openings in
   adjacent compartments separated by a fire wall).
5. **FRL schedule** — Specification 5 (FRLs per element for the determined Type).
6. **Multi-compartment** — assess each genuinely separate fire compartment independently.

**Advisory (surfaced as guidance for the chosen class/type/rise, NOT computed):** the rest of
Section C — fire hazard properties (C2D11, Spec 7), protection of openings detail (Part C4),
non-combustibility (C2D10), etc. Present these as "you will also need to consider…" cross-
references with clause pointers, not pass/fail results. Add computed checks for these later
only if the team asks.

**Flag-only cross-references (outside Section C):** hydrant coverage (**AS 2419.1**), fire
brigade vehicular access, sprinkler triggers (Part E1, E1D5 for >25 m effective height). See §5.9.

---

## 4. Architecture decisions (already made — implement, don't relitigate)

- **Web app, local-first.** Runs entirely locally with **zero cloud dependency**. Structured so
  that deploying to **Azure later is a config/implementation swap, not a rewrite** — isolate every
  "would-be-server" concern (persistence, optional LLM calls) behind interfaces. (Borg uses Azure;
  we don't have access yet, so nothing may depend on it now.)
- **Hybrid engine, with a hard wall:**
  - The **deterministic rules engine is the entire compliance path.** Every pass/fail is a pure
    function of typed inputs and the NCC data layer, and returns an exact clause/table reference.
    **No LLM is ever in the compliance path.**
  - An **optional LLM explanation layer** (Anthropic API, key-configurable, **off by default**)
    may narrate a result in plain English *after* the deterministic engine has decided it. It may
    never change, override, or produce a compliance result. If the key isn't set, the app is fully
    functional without it.
- **Persistence — half now, half in the Azure phase.** In the MVP: **local project save/load**
  (JSON project-file export/import + IndexedDB autosave so a refresh never loses work). Design the
  `ProjectState` object cleanly and serializably from day one so that **cloud multi-user storage,
  accounts, and a shared team library are a later add behind the same interface** — not a redesign.
- **Traceability is structural.** Every compliance result object carries
  `{ result, clauseRef, tableRef?, inputSnapshot, pathway }`. The PDF is a rendering of these
  objects. No number appears anywhere without a citation attached.

---

## 5. Recommended tech stack (with rationale — the user is building fluency, optimise for readability + tests)

- **React + TypeScript + Vite.** TypeScript is a correctness lever here, not a preference: the
  NCC data is highly structured, so typed schemas catch transcription and logic errors at compile
  time. Use strict mode.
- **Tailwind CSS** for styling (see §7 for the design system).
- **State:** plain React state around a single serializable `ProjectState`. No heavy state library
  for the MVP — keep it legible.
- **Rules engine:** plain TypeScript modules, **pure functions, exhaustively unit-tested**. One
  module per check (type-of-construction, compartment-size, large-isolated, setback, frl-schedule).
  No side effects, no network, no LLM.
- **PDF:** client-side generation (e.g. `@react-pdf/renderer` or `pdfmake`) so reports work offline
  with no backend.
- **Persistence:** IndexedDB via a thin typed wrapper (e.g. `idb`) behind a `ProjectStore`
  interface; JSON export/import alongside it. The interface is what Azure later implements.
- **Optional LLM layer:** a single `explain()` module behind an interface, calling the Anthropic
  API only if a key is configured.

Prefer clarity and test coverage over cleverness. Comment the *why* on every non-obvious NCC rule,
citing the clause.

---

## 6. Feature spec (MVP)

Build these as a guided, linear workflow the user can step back through, with a persistent
side panel showing the running result and its clause references.

### 6.1 Project setup + classification
Two entry modes:
- **Direct:** user picks the Class (5, 6, 7a, 7b, 8, 9a, 9b, 9c).
- **Questionnaire:** short use-based multiple-choice flow that derives the Class (5–9) + subclass.
  Ground it in the NCC classification logic (Part A6). Show which answer led to which class, and
  let the user override.

### 6.2 Building inputs (the lever set)
Collect, per project and per compartment as noted:
- Class (5–9) + subclass.
- **Rise in storeys** (drives Type via Table C2D2).
- **Effective height** (drives sprinkler trigger E1D5 at >25 m; keep separate from rise).
- Per **fire compartment**: floor area (m²), volume (m³).
- **Sprinkler status** — but **ask it at the decision point, not upfront** (see §6.4). Whether the
  building is//can be sprinklered to Specification 17 is the single biggest lever and changes the
  large-isolated-building viability, so surface it precisely when it matters.
- External wall(s): **distance to fire-source feature** for each relevant wall (drives external-wall
  FRL via Spec 5 and opening separation via C4D4).
- **Open space / perimeter vehicular access** available around the building (for the large-isolated
  test and the knock-on flags).
- **Multi-compartment / fire-wall configuration:** does a fire wall genuinely separate the building
  into more than one fire compartment? (see §6.7).

### 6.3 Type of construction determination
Read **Table C2D2** as the **source of truth**: `(Class, rise in storeys) → required Type A/B/C`.

**Correctness directive — do not implement a naive "try Type C, then B, then A" heuristic.** That
misrepresents the code. Instead:
1. Determine the **required minimum Type** from Table C2D2.
2. Present a **derived "can a less-onerous Type be achieved?"** analysis, grounded only in the
   actual levers the NCC provides — principally **reducing rise in storeys**, and any applicable
   **concessions** (e.g. C2D5/C2D6 for certain classes). Show each lever, its clause, and its effect.

The user's mental model is "start simple and move up" — deliver that experience, but every step
must be derived from Table C2D2 and real concessions, never from an ad-hoc rule.

### 6.4 Fire compartment size assessment + suggestions engine
For each compartment: compare floor area and volume against **Table C3D3** for the determined
Class and Type. If a compartment **exceeds** the limit, present computed options with **exact
thresholds**, each with its clause reference:

- **Subdivide** into smaller fire compartments — compute the compartment size(s) needed to comply,
  and the fire-wall FRL required (Spec 5) plus opening protection (Part C4). Then re-assess.
- **Large isolated building concession (C3D4).** Applicable only while floor area ≤ 18,000 m² **and**
  volume ≤ 108,000 m³. **This is where the tool asks about sprinklers.** Present the C3D4 pathways:
  - Open space complying with **C3D5(1)** (≥ 18 m wide around the building for Class 7/8), or
  - **Sprinkler system to Specification 17** + perimeter vehicular access complying with **C3D5(2)**.
  Compute which pathway the building's inputs satisfy, and what's missing.
- Report the exact numbers throughout ("compartment is X m² against a Y m² limit; reduce below Y, or
  qualify under C3D4 by …").

Typical trigger this must handle well: a **Type C Class 7/8** building whose compartment exceeds
Table C3D3 → route into the C3D4 large-isolated assessment with the sprinkler question.

### 6.5 Setback / separation from fire-source features
Compute the **external-wall FRL** required as a function of **distance to the fire-source feature**
(Specification 5), and the **separation between openings** in adjacent compartments separated by a
fire wall (**C4D4 + Table C4D4**). When the user reduces a setback, recompute the FRL/opening
protection required and show the clause. (Confirm the exact `fire-source feature` definition against
the NCC defined terms during Phase 0.)

### 6.6 FRL schedule
For the determined Type, produce the **FRL schedule per building element** (loadbearing/non-
loadbearing walls, columns, floors, roofs, shafts, etc.) from **Specification 5**, each line citing
its Spec 5 clause/table.

### 6.7 Multi-compartment handling
Ask whether a **fire wall** separates the building into genuinely separate fire compartments. If so,
**assess each compartment independently** (its own size check, FRLs, external-wall/setback checks) as
the NCC permits, then roll all compartments into one report. This shapes the data model — a project
has *N* compartments, each with its own result set. The fire wall itself gets its FRL (Spec 5) and
opening protection (C4D6) checked.

### 6.8 Advisory surfacing of the rest of Section C
For the chosen class/type/rise, surface (as non-computed guidance with clause pointers) the further
Section C matters the designer must address — fire hazard properties (C2D11 / Spec 7), non-
combustibility (C2D10), protection-of-openings detail (Part C4). Clearly labelled as guidance, not
assessment.

### 6.9 Knock-on advisory flags (flag + cite only, do not compute)
When a lever affects something outside Section C, raise a flag with the standard/source:
- Reducing boundary setback or perimeter access → **may compromise fire-hydrant coverage and
  appliance access — verify against AS 2419.1 and Part E1 with your hydraulic/fire consultants.**
- Perimeter vehicular access used for C3D4/C3D5 interacts with the same boundary — flag the coupling.
- Effective height > 25 m → sprinklers required (E1D5) — flag.
Keep these as advisory cross-references; the tool does not compute AS 2419.1 or E1.

### 6.10 Branded PDF report
On demand, generate a formal, branded PDF (see §7) containing:
- Project + building metadata and **every input** (the full input snapshot).
- Every computed result with its **exact clause/table reference** and the **pathway chosen**
  (e.g. "complied via C3D4 large-isolated concession, sprinklered pathway").
- All advisory flags and cross-references.
- Per-compartment breakdown for multi-compartment buildings.
- The **disclaimer** (§8) and a visible `DRAFT — unverified data` banner if any table value used is
  still unverified.
The PDF is a pure rendering of the result objects — it must never contain a number without a citation.

---

## 7. Design

Match the **Borg group** identity (Crossmuller sits under Borg, so one system covers both). From
borgs.com.au: clean, industrial-corporate, **white / light base, a strong Borg red as the primary
accent, charcoal / near-black text, generous whitespace, a technical sans-serif.** Restrained and
precise — this is an internal engineering instrument, not a consumer app.

- Pull the **exact logo and hex values** from borgs.com.au (and Crossmuller branding if available).
  Use the red as a deliberate accent (actions, active states, flags), not a flood.
- Layout: a calm, form-driven workflow with a persistent results/clause panel. Dense but legible;
  tables and references should read like a compliance document.
- PDF styling: formal — logo, metadata header, clause-referenced results table, footer disclaimer.
  It should look like something you'd file with a design package.

If a `frontend-design` skill is available in this environment, consult it for the design tokens and
component styling before building UI.

---

## 8. Liability / disclaimer (must appear on screen and in every PDF)

> This is an indicative Deemed-to-Satisfy assessment against NCC 2022 Volume One, Section C, for
> internal design guidance only. It does not constitute certification, a Performance Solution, or
> professional advice, and must be verified by a registered building surveyor and/or fire safety
> engineer before it is relied upon. Compliance results depend on NCC table values that must be
> confirmed against the current licensed edition of the NCC.

---

## 9. Correctness & testing requirements

- **No fabricated data — hard rule (applies to you and every subagent).** Never invent, guess,
  infer, scrape, or auto-fill an NCC value. Model extraction of the NCC's multi-column tables is not
  reliable enough for a compliance tool — cells get misread silently. Every value is transcribed from
  the source and confirmed by a competent person, and stays `verified: false` until then. If a value
  you need is missing, **stop and surface it — do not substitute a plausible number.**
- **Verification gate:** unverified table values are visibly flagged everywhere they influence a
  result; the report cannot present them as final.
- **Unit tests** for every rules module against worked examples (include at least one Type C Class 7/8
  over-compartment case that routes through C3D4, one multi-compartment building, and one setback/FRL
  case). Tests should assert both the result and the returned clause reference.
- **Safe degradation:** if an input is missing or a value is unverified, the tool says so explicitly
  rather than guessing or defaulting silently.
- **No magic numbers in code** — every threshold lives in the typed NCC data layer with a source ref.

---

## 10. What to deliver

1. Repo scaffold (React + TS + Vite + Tailwind), README covering local run and the Azure-later path.
2. `/docs/brief.md` and `/docs/ncc-reference-scaffold.md` (these two files).
3. The **NCC data layer**: typed schema + lookups with clearly-marked unverified placeholders, plus a
   **verification checklist** doc listing every table/value to confirm against the licensed NCC.
4. The **rules engine** (pure TS modules) with full unit tests.
5. The **MVP UI** implementing the §6 workflow, with the persistent clause panel.
6. **Client-side branded PDF export.**
7. Clean interfaces (`ProjectStore`, `explain()`) isolating the future Azure and optional-LLM work.

**Start by** reading `ncc-section-c-reference-scaffold.md`, confirming the data schema, stubbing the
tables with unverified placeholders, then building the engine + UI against them. Ask me before
inventing any NCC value — placeholders are correct until the team verifies real data.

---

## 11. Agent orchestration (subagents)

Break the build into parallel subagent tasks to work efficiently — but sequence it so parallelism
doesn't create integration drift on a correctness-critical codebase.

**Phase 0 — implementation plan (you, the main agent, before any code).** Decompose the build into
workstreams and write a plan to `/docs/plan.md`. For each workstream state: objective, scope, the
contract/interface it depends on, explicit **acceptance criteria** (the tests that must pass), and its
dependencies. Define **done** for the whole product — all acceptance criteria green, the §6 workflow
working end-to-end on placeholder data, the PDF rendering with clause references, disclaimer present.
Do not spawn subagents until the plan and the definition of done exist.

**Phase A — foundation, single-threaded (you, the main agent, own this).** Lock the shared contracts
*before* fanning out: repo/folder structure, the typed NCC data schema, the `ComplianceResult` and
`ProjectState` types, and the module interfaces (`ProjectStore`, `explain()`, each rules module's
signature). Nothing parallelises until these are frozen.

**Phase B — parallel subagents on independent leaf modules,** each built against the frozen contracts.
Natural workstreams, one subagent each:
- Rules: type-of-construction (Table C2D2) + tests
- Rules: compartment-size + large-isolated (C3D3 / C3D4 / C3D5) + tests
- Rules: setback / separation + external-wall FRL (Spec 5 / C4D4) + tests
- Rules: FRL-schedule (Spec 5) + tests
- NCC data layer: typed lookups + unverified placeholders + verification checklist
- Persistence: `ProjectStore` (IndexedDB + JSON import/export)
- PDF export module
- UI shell + §6 workflow screens
- Optional `explain()` LLM layer

**Phase C — integration + review, single-threaded.** Wire the modules, run the full test suite, do
one correctness pass across the whole compliance path.

**Iterate until done.** Run the full acceptance suite from the plan. For every failure or gap, create
fix tasks — subagents where the work is independent, otherwise fix in place — and repeat Phase B → C.
Do not declare the product complete until every acceptance criterion passes and the definition of done
is met.

**Guardrails:**
- **Do not parallelise the shared schema or types.** Subagents defining types independently is the
  main failure mode — it produces duplicated, drifting definitions and merge pain. Types are Phase A
  only.
- Allocate subagents by real module boundaries, not arbitrarily. "As many as needed" means as many
  as there are genuinely independent tasks — not more. Idle or overlapping subagents add coordination
  cost without speed.
- Every subagent inherits the §9 no-fabricated-data rule and the traceability requirement (every
  result carries a clause reference).
