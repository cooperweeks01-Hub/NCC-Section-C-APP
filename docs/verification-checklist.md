# NCC Data Verification Checklist

> **Who:** a competent person (registered building surveyor / fire safety engineer)
> with access to the **licensed NCC 2022 Volume One**.
> **What:** transcribe each value below from the source, confirm it, and flip
> `verified: true` in the named data file. **Do not populate from web summaries,
> PDF auto-extraction, or model output** (brief §9 — hard rule).
>
> Until a row is verified, every compliance result that touches it renders
> `DRAFT — unverified` and the tool returns `insufficient-input`. This is by design.

## How to verify one table

1. Open the source table in the licensed NCC 2022 Volume One.
2. Open the corresponding data file (below) and fill the `value` for each cell/band.
   The typed shape (`C2D2Band[]`, `C3D3Cell`, `NccValue<FRL>`, …) tells you exactly
   what to enter — see [`src/data/schema.ts`](../src/data/schema.ts).
3. Set `verified: true` **only** on rows you have personally confirmed against source.
4. Keep the `source` string accurate (table/clause + edition).
5. Re-run `npm run test` — the safe-degradation tests for that table will flip to
   computed-result tests as values become usable.

## Global caveats (confirm once, note in the report)

- [ ] **Adopted edition** — confirm the project's jurisdiction adopts NCC 2022 Vol One.
- [ ] **State/territory Schedule variations** (NSW, VIC, QLD, SA, …) — these vary
      clauses and can add requirements. The base data layer targets the base NCC;
      record any applicable variation.
- [ ] **Defined terms** — confirm exact wording of *rise in storeys*, *effective
      height*, *fire compartment*, *fire-source feature*, *fire wall*, *FRL*, and
      *sprinkler system (Spec 17)* (scaffold §4).

## Tables to transcribe

| # | Value / table | Data file | Structure to fill | Verified |
|---|---|---|---|---|
| 1 | **Table C2D2** — required Type by (Class, rise in storeys) | [`src/data/tables/c2d2.ts`](../src/data/tables/c2d2.ts) | Per Class 5–9: ordered `C2D2Band[]` (min/max rise → Type A/B/C) | ☐ |
| 2 | **Table C3D3** — max compartment floor area + volume by (Class, Type) | [`src/data/tables/c3d3.ts`](../src/data/tables/c3d3.ts) | Every Class×Type cell: `maxFloorAreaM2`, `maxVolumeM3` | ☐ |
| 3 | **C3D4 caps** — large-isolated max area / max volume | [`src/data/tables/c3d4-c3d5.ts`](../src/data/tables/c3d4-c3d5.ts) | `maxFloorAreaM2` (headline 18,000 m²), `maxVolumeM3` (headline 108,000 m³) — **confirm, do not assume** | ☐ |
| 4 | **C3D5(1) open space** — min width around building | [`src/data/tables/c3d4-c3d5.ts`](../src/data/tables/c3d4-c3d5.ts) | `minWidthM` (headline ≥ 18 m, Class 7/8); confirm any class dependence | ☐ |
| 5 | **Table C4D4** — opening separation between adjacent compartments | [`src/data/tables/c4d4.ts`](../src/data/tables/c4d4.ts) | `bands: C4D4Band[]` (confirm axes) + `exemptionFrlThreshold` (headline 60/60/60) | ☐ |
| 6 | **Specification 5 — FRL schedule** by (Type, element) | [`src/data/tables/spec5-frl.ts`](../src/data/tables/spec5-frl.ts) | Every Type×element cell: `FRL { structural, integrity, insulation }` (min; "–" ⇒ null) | ☐ |
| 7 | **Specification 5 — external-wall FRL by distance** | [`src/data/tables/spec5-extwall.ts`](../src/data/tables/spec5-extwall.ts) | Per Type: `Spec5ExtWallBand[]` (distance bands → FRL + opening treatment) | ☐ |
| 8 | **Specification 17** — complying-system conditions | [`src/data/tables/spec17.ts`](../src/data/tables/spec17.ts) | `compliesDefinition` (+ FPAA101D/H exclusions for concessions) | ☐ |

## Clause references to re-confirm (scaffold §3 `[VERIFY]`)

These are used as citation strings and/or logic gates — confirm the exact clause
number and scope against the licensed edition before relying on them:

- [ ] C2D2 / C2D2(2) — Type driver + link to Spec 5
- [ ] C2D3 — rise-in-storeys calculation method
- [ ] C2D5 / C2D6 — concessions; **confirm applicability to Class 5–9**
- [ ] C3D3, C3D4, C3D5(1), C3D5(2) — compartment size + large isolated
- [ ] C3D8 / C3D9 — fire walls / separation (subdivision path)
- [ ] C4D4, C4D5, C4D6 — opening separation, protection methods, fire-wall openings
- [ ] Spec 5 clauses cited per FRL line (and carpark concessions S5C19/S5C22/S5C25)
- [ ] E1D5 — sprinkler trigger at effective height > 25 m (flag-only)

## Sign-off

- Verifier: ____________________  Registration #: ____________________
- Date: ____________________
- NCC edition + jurisdiction: ____________________
- Notes / variations applied: ____________________

> No number ships to a final report with `verified: false`. When every row above is
> ticked and confirmed, the DRAFT banner clears automatically.
