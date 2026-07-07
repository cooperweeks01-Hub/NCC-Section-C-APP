# Phase B — data-model revision (driven by the verified NCC extract)

> The Phase A schema was frozen before real values existed. The verified extract
> (`docs/ncc-section-c-data-verified.md`, Class 5/7a/7b/8) reveals structure the
> flat schema can't hold. This records the revision and why. Scope: **Class 5,
> 7a, 7b, 8 only.**

## What the verified data actually contains (and doesn't)

Present (VERIFIED): Table C2D2, Table C3D3, Table C4D4, Specification 5 FRLs for
Types A/B/C (external-wall-by-distance **and** the fixed element schedule).

Absent from the original extract: the C3D4/C3D5 concession values. **These were
subsequently confirmed** (caps 18,000 m² / 108,000 m³; C3D5(1) open space ≥ 18 m;
C3D5(2) perimeter access ≥ 6 m within 18 m) and the large-isolated rule now
computes end-to-end via TWO pathways — the caps bound only pathway A; pathway B
(sprinklers + C3D5(2)) has no size cap. Only the C4D5 exemption threshold and
Spec 17's text remain placeholders, and neither gates any decision.

## Constraint 1 — class grouping differs per table (do NOT share one enum)

| Table | Grouping | Key type |
|---|---|---|
| C2D2 | uniform across 5–8 | none (single band list) |
| C3D3 | `{5}` vs `{7a,7b,8}` | `C3D3ClassGroup = "5" \| "7a_7b_8"` |
| Spec 5 (all) | `{5,7a}` vs `{7b,8}` | `FrlClassGroup = "5_7a" \| "7b_8"` |

Each table keyed on its OWN grouping via its own `groupFor(cls)` mapper. 7a
deliberately lands in different buckets per table — the whole point of the rule.

## Constraint 2 — 7a carpark carve-out is a branch, not a value

C3D3 sizing does **not** apply to a sprinklered carpark, open-deck carpark, or
open spectator stand (C3D5(1)). Modelled as a per-compartment input
`sizeExemption: "sprinkleredCarpark" | "openDeckCarpark" | "openSpectatorStand" | null`.
When set, the compartment-size rule SKIPS the C3D3 comparison and returns a
non-failing result citing the carve-out — never applies the 2,000 m²/12,000 m³
Type C limit.

## Constraint 3 — scope gate

`InScopeClass = "5"|"7a"|"7b"|"8"`. `BuildingClass` (full NCC 5–9) stays for the
classifier, but any class outside `IN_SCOPE_CLASSES` yields an explicit
"out of scope — not assessed" result, never a guessed number.

## Revised NCC schema (shapes)

- **C2D2** — single `NccValue<C2D2Band[]>` (uniform 5–8); rise≥4→A, 3→B, 1–2→C.
- **C3D3** — `Record<C3D3ClassGroup, Record<ConstructionType, C3D3Cell>>`.
- **Spec 5 external wall (setback / WS-3)** — distance-banded, by Type × FrlClassGroup,
  with a loadbearing/non-loadbearing split (Type A/B) or single "parts of external
  walls" (Type C). `Spec5ExtWallElement { label, clauseRef, bands: Spec5ExtWallBand[] }`.
- **Spec 5 fixed schedule (FRL schedule / WS-4)** — the non-distance elements
  (common/fire walls, internal walls incl. sub-locations, columns, floors, roofs).
  `Spec5ScheduleLine { label, clauseRef, frl: NccValue<FRL> }`, listed per Type ×
  FrlClassGroup. The list of lines is structural fact; each FRL is an NccValue.
- **C4D4** — angle-banded: `C4D4AngleBand { minAngleDeg, maxAngleDeg, minSeparationM|null, description }`
  (≥180° ⇒ Nil ⇒ null). Exemption clause `C4D5` kept as a fact; its FRL threshold
  is NOT in the extract ⇒ stays unverified.
- **C3D4Caps / C3D5OpenSpace / Spec17** — unchanged placeholders (unverified).

## Input-model additions

- `ExternalWall.loadbearing: boolean` — selects the LB/non-LB ext-wall band set.
- `ExternalWall.angleToAdjacentOpeningDeg: number | null` — feeds C4D4 opening
  separation; null ⇒ that sub-check degrades to `insufficient-input` (no
  adjacency graph in v1; the angle is supplied per wall when relevant).
- `Compartment.sizeExemption` — the carve-out above.

## Result-type revisions

- `FrlScheduleLine` switches from the flat `element: BuildingElement` to
  `{ label, clauseRef, frl, usesUnverifiedData }` to hold source granularity.
- `CompartmentSizeDetail` gains optional `sizeExemption` (carve-out reason).
- New `ResultStatus` already added: `determined`. Out-of-scope uses a dedicated
  result (status `insufficient-input`, `usesUnverifiedData:false`, clear summary).

## Test strategy (unchanged dual-layer, plan §5)

Real layer proves: verified C2D2/C3D3/C4D4/Spec5 compute; C3D4 concession
safely-degrades. Synthetic fixture proves: full C3D4/C3D5 pathway branches.
Three required worked examples (brief §9): Type C Class 7/8 over-compartment →
C3D4; multi-compartment; setback/FRL.
