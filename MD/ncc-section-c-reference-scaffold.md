# NCC 2022 Volume One — Section C (Fire Resistance) Reference Scaffold

**Purpose.** Defines the clause map, decision flow, and data schema for the compliance tool. It is
the structural spine the rules engine is built against.

**Status of numeric values.** This scaffold deliberately contains **no ABCB table values**. Clause
numbers, table axes, defined-term names, and the headline large-isolated thresholds are stated as
facts. Every actual number (FRL minutes, compartment m²/m³ limits, setback distances) is a
`TRANSCRIBE + VERIFY` slot to be filled from the **licensed NCC 2022 Volume One** by a competent
person before the tool is relied upon.

**Why.** (1) Accuracy — automated extraction of dense NCC tables is unreliable; every value needs
human verification against source. (2) Copyright — ABCB holds copyright in the NCC; the licensee
transcribes the values, they are not scraped or hardcoded here.

**References used to build this scaffold:** the ABCB NCC 2022 Volume One online pages for Part C1,
C2, C3, C4, Specification 5, Specification 17, and Part E1. Confirm everything against the current
adopted edition (note state variations / Schedule appendices, e.g. NSW/VIC/QLD, which can alter
clauses).

---

## 1. Scope

**Computed (DTS pass/fail):** Type of construction (C2), compartment size + large isolated buildings
(C3), setback/separation + external-wall FRL (Spec 5 + C4), FRL schedule (Spec 5), multi-compartment.

**Advisory (surfaced, not computed):** remainder of Section C — fire hazard properties, non-
combustibility, protection-of-openings detail.

**Out of scope:** Performance Solutions (Part C1 performance route); Classes 1–4 and 10; anything
outside Section C except flag-only cross-references.

---

## 2. Section C structure (NCC 2022, SPTC referencing)

Under the DTS pathway, Performance Requirements **C1P1–C1P9** are satisfied by complying with
**C2D2–C2D15, C3D2–C3D15, and C4D2–C4D17** (plus Parts G3/G6/I1 where atriums, occupiable outdoor
areas, or certain Class 9b uses apply).

| Part | Title | Role in this tool |
|---|---|---|
| **C1** | Fire resistance | Performance Requirements C1P1–C1P9 + Verification Methods (C1V4 = Fire Safety Verification Method). **Context only** — the performance route we are *not* automating. |
| **C2** | Fire resistance and stability | **Computed.** Type of construction + FRLs. |
| **C3** | Compartmentation and separation | **Computed.** Compartment size, large isolated buildings, fire walls/separation. |
| **C4** | Protection of openings | **Partly computed** (C4D4 separation) + **advisory** (opening protection detail). |

### Specifications referenced by Section C

| Spec | Title | Use |
|---|---|---|
| **Specification 5** | Fire-resisting construction | **The FRL tables** per Type (A/B/C) per element; external-wall FRL by distance to fire-source feature. Core computed data. |
| **Specification 17** | Fire sprinkler systems | The sprinkler standard referenced by C3D4 (large isolated buildings) and E1. Sprinkler = "complying with Spec 17". |
| Specification 7 | Fire hazard properties | Advisory. |
| Specification 6 | Structural tests for lightweight construction | Advisory / reference. |

---

## 3. Clause map (computed core)

> `[VERIFY]` = confirm the exact clause number/scope against the licensed NCC before coding logic
> against it. Clause numbers below are from the ABCB online edition and should still be re-checked.

### Part C2 — Fire resistance and stability
| Clause / Table | Governs | Tool use |
|---|---|---|
| **C2D2 + Table C2D2** | Minimum **Type of construction** by `(Class, rise in storeys)` | **Source of truth for Type A/B/C.** |
| **C2D2(2)** | Building elements comply with **Specification 5** | Links Type → FRL schedule. |
| C2D3 `[VERIFY clause]` | Rise in storeys — calculation method | Compute/validate the `rise in storeys` input. |
| C2D5 / C2D6 | Concessions (low-rise Class 2/3; sprinklered Class 9c) `[VERIFY applicability to 5–9]` | Levers in the "less-onerous Type" analysis. |
| C2D10 (+ Tables C2D10a/b) | Non-combustibility (Type A/B) | Advisory. |
| C2D11 | Fire hazard properties | Advisory. |

### Part C3 — Compartmentation and separation
| Clause / Table | Governs | Tool use |
|---|---|---|
| **C3D3 + Table C3D3** | **Maximum size of a fire compartment** (floor area + volume), Class 5–9 | **Compartment size check.** |
| **C3D4** | **Large isolated buildings** concession — exceed Table C3D3 if `floor area ≤ 18,000 m²` AND `volume ≤ 108,000 m³` and the applicable pathway is met | **Large-isolated assessment. Ask sprinklers here.** |
| **C3D5(1)** | **Open space** geometry (≥ 18 m around building for the open-space pathway) | Large-isolated pathway A. |
| **C3D5(2)** | **Perimeter vehicular access** (continuous forward-direction emergency-vehicle access around the building) | Large-isolated pathway B; also drives knock-on flags. |
| C3D6 (+ Table C3D6) | Separation of classifications; Class 9a patient-care compartment sizing | Multi-class / Class 9a — `[VERIFY]`, likely advisory in MVP. |
| C3D7 | Vertical separation of openings in external walls | `[VERIFY]` — advisory/edge. |
| C3D8 / C3D9 | **Fire walls**; separation of different classifications | Fire-wall FRL + multi-compartment. |
| C3D11 | Fire-isolated shafts (lifts/stairs) | Advisory in MVP. |

### Part C4 — Protection of openings
| Clause / Table | Governs | Tool use |
|---|---|---|
| **C4D4 + Table C4D4** | **Separation distance** between external walls/openings of different compartments separated by a fire wall (unless walls ≥ 60/60/60 and openings protected per C4D5) | **Setback/separation check.** |
| C4D5 | Acceptable methods of protection (doors, windows) | Advisory / used when subdividing. |
| C4D6 | Fire doors/shutters in fire walls | Fire-wall opening protection (multi-compartment). |
| C4D15 | Service penetrations (Spec 13) | Advisory. |

### Specification 5 — Fire-resisting construction
| Content | Tool use |
|---|---|
| FRL tables per **Type A / B / C**, per building element (loadbearing & non-loadbearing external walls, common/fire walls, internal walls, columns, floors, roofs, shafts) | **FRL schedule** for the determined Type. |
| **External-wall FRL as a function of distance to fire-source feature** | **Setback → external-wall FRL** computation (with C4D4). |
| S5C19 / S5C22 / S5C25 | Carpark concessions `[VERIFY]` | Edge cases. |

---

## 4. Defined terms the engine needs (confirm against Part A / Schedule definitions)

| Term | Working meaning `[VERIFY exact wording]` |
|---|---|
| **Rise in storeys** | Number of storeys counted per the NCC method; drives Table C2D2. Confirm the counting rules (which storeys count, sloping sites). |
| **Effective height** | Height from lowest to highest storey per NCC; `> 25 m` triggers sprinklers (E1D5). Distinct from rise in storeys. |
| **Fire compartment** | Part of a building separated by construction with the required FRL such that fire is contained; the unit assessed for size (Table C3D3). |
| **Fire-source feature** | Typically: the far boundary of an adjoining road/river/park; a side or rear allotment boundary; or the external wall of another building on the same allotment. Drives external-wall FRL/setback (Spec 5, C4D4). **Confirm the precise definition.** |
| **Fire wall** | Wall with an FRL that separates fire compartments, with openings protected per Part C4. |
| **FRL** | Fire Resistance Level — the `structural adequacy / integrity / insulation` grading in minutes (e.g. `90/90/90`), from Spec 5. |
| **Sprinkler system (Spec 17)** | A sprinkler system complying with Specification 17 (generally excluding FPAA101D/H for the concessions). The lever for C3D4. |

---

## 5. Decision flow (engine spine)

```
0. CLASSIFY
   Input Class (5–9 + subclass) directly, OR derive via use questionnaire (Part A6).

1. TYPE OF CONSTRUCTION
   requiredType = Table C2D2 lookup (Class, riseInStoreys)     -> A | B | C   [C2D2]
   Then derive "less-onerous type achievable?" ONLY from real levers:
     - reduce rise in storeys (re-lookup Table C2D2)
     - applicable concessions (C2D5/C2D6...)                    [cite each]
   (Do NOT brute-force C->B->A as a heuristic; Table C2D2 is authoritative.)

2. FOR EACH FIRE COMPARTMENT:
   2a. SIZE CHECK
       pass = floorArea <= maxArea(Class, requiredType)                       [Table C3D3]
              AND volume <= maxVolume(Class, requiredType)
       if pass -> record COMPLIES (cite C3D3 + Table C3D3)
       if fail -> present computed options:
          (i)  SUBDIVIDE: compute compartment size(s) to comply;
               required fire-wall FRL (Spec 5) + opening protection (C4D6);   [C3D8/C3D9, C4D6]
               re-run size check on the sub-compartments.
          (ii) LARGE ISOLATED BUILDING (only if floorArea <= 18,000
               AND volume <= 108,000):                                        [C3D4]
                 ASK: is/can the building be sprinklered to Spec 17?
                 Pathway A: open space >=18 m around building                 [C3D5(1)]
                 Pathway B: Spec 17 sprinklers + perimeter vehicular access   [C3D5(2)]
                 Evaluate which pathway the inputs satisfy; report the gap.
                 FLAG: perimeter access / open space couples to boundary
                       setback + hydrant coverage (see step 4).
          Report exact numbers throughout (value vs limit).

   2b. SETBACK / SEPARATION + EXTERNAL-WALL FRL
       For each external wall:
         requiredExtWallFRL = Spec 5 lookup(distanceToFireSourceFeature, Type) [Spec 5]
       For openings in adjacent compartments separated by a fire wall:
         requiredSeparation = Table C4D4 (unless walls >=60/60/60 &            [C4D4]
                              openings protected per C4D5)
       On setback reduction -> recompute + cite.

   2c. FRL SCHEDULE
       For requiredType, list FRL per element from Spec 5, each line cited.    [Spec 5]

3. MULTI-COMPARTMENT ROLL-UP
   Combine per-compartment results; check the separating fire wall's FRL +
   opening protection; produce one report.

4. KNOCK-ON FLAGS (flag + cite, not computed)
   - reduced setback / perimeter access -> verify hydrant coverage            [AS 2419.1, Part E1]
     and fire-appliance access.
   - effectiveHeight > 25 m -> sprinklers required.                           [E1D5]

5. ADVISORY (surfaced for chosen class/type)
   fire hazard properties [C2D11/Spec 7], non-combustibility [C2D10],
   protection-of-openings detail [Part C4] -> guidance pointers, not pass/fail.

6. REPORT
   Render all result objects to branded PDF: inputs + results + clause refs +
   pathway chosen + flags + disclaimer (+ DRAFT banner if any value unverified).
```

---

## 6. Data schema (TypeScript sketch — refine in code)

```ts
// Every table value carries verification state and a source ref.
interface NccValue<T> {
  value: T | null;
  verified: boolean;
  source: string;          // e.g. "Table C3D3, NCC 2022 Vol One"
}

type BuildingClass = "5" | "6" | "7a" | "7b" | "8" | "9a" | "9b" | "9c";
type ConstructionType = "A" | "B" | "C";
type FRL = { structural: number; integrity: number; insulation: number }; // minutes; -1 => "–"

interface ExternalWall {
  id: string;
  distanceToFireSourceFeatureM: number;
  hasOpenings: boolean;
}

interface Compartment {
  id: string;
  name: string;
  floorAreaM2: number;
  volumeM3: number;
  externalWalls: ExternalWall[];
}

interface BuildingInput {
  buildingClass: BuildingClass;
  riseInStoreys: number;
  effectiveHeightM: number;
  sprinkleredToSpec17: boolean | null;      // asked at the C3D4 decision point
  openSpaceAroundBuildingM: number | null;  // for C3D5(1)
  perimeterVehicularAccess: boolean | null; // for C3D5(2)
  compartments: Compartment[];              // >1 => multi-compartment
  fireWallsSeparateCompartments: boolean;
}

interface ComplianceResult<T = unknown> {
  check: string;                 // "TypeOfConstruction" | "CompartmentSize" | ...
  status: "complies" | "fails" | "advisory" | "flag" | "insufficient-input";
  detail: T;
  clauseRef: string;             // "C2D2" | "C3D4" | "Spec 5 ..." 
  tableRef?: string;             // "Table C3D3"
  pathway?: string;              // e.g. "C3D4 large-isolated, sprinklered"
  inputSnapshot: Partial<BuildingInput>;
  usesUnverifiedData: boolean;
}

interface ProjectState {         // the single serializable object (IndexedDB + export)
  id: string;
  meta: { projectName: string; address?: string; author?: string; createdAt: string; };
  input: BuildingInput;
  results: ComplianceResult[];   // per-compartment + building-level
}
```

---

## 7. Tables to transcribe in Phase 0 (from the licensed NCC — VERIFY)

Each needs its values filled and `verified: true` set before results are final. **Do not populate
from web summaries.**

| Table / data | Axes / structure to capture | Notes |
|---|---|---|
| **Table C2D2** | rows = Class (2–9, use 5–9); cols = rise in storeys bands → required Type A/B/C | The Type driver. |
| **Table C3D3** | Class (5–9) × Type (A/B/C) → max floor area (m²) + max volume (m³) | Headline concession cap under C3D4 is **18,000 m² / 108,000 m³** — confirm. |
| **Table C4D4** | separation distances between openings of adjacent compartments | Plus the `≥60/60/60 + protected openings` exemption path. |
| **Specification 5 — FRL tables** | per Type (A/B/C), per element (ext walls loadbearing/non, fire/common walls, internal walls, columns, floors, roofs, shafts) → FRL | Largest transcription task. |
| **Specification 5 — external wall FRL by distance** | distance-to-fire-source-feature bands × Type → external-wall FRL and opening treatment | Feeds the setback check. |
| **Specification 17 references** | conditions under which a system "complies with Spec 17" (and FPAA101D/H exclusions for the concessions) | Boolean logic, not numeric, but confirm. |

---

## 8. Flag-only cross-references (outside Section C — do not compute)

| Trigger | Flag text pointer | Source |
|---|---|---|
| Reduced boundary setback / perimeter access | Verify fire-hydrant coverage and appliance access | **AS 2419.1**; Part E1 |
| C3D4/C3D5 perimeter access reused as boundary | Coupling between compartment concession and hydrant/access | C3D5, AS 2419.1 |
| Effective height > 25 m | Sprinklers required throughout | **E1D5** |

---

## 9. Reminders

- Check **state/territory Schedules** (NSW, VIC, QLD, SA, etc.) — they vary clauses and can add
  requirements. The MVP can target the base NCC and note that variations apply; flag this in the UI.
- The **rest of Section C** stays advisory until the team explicitly asks to compute it.
- No number ships without `verified: true` and a `source`.
