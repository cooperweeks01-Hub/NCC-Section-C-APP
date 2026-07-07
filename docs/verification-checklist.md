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

## Tables — verification status

Class **5, 7a, 7b, 8** values are transcribed and confirmed from
[`ncc-section-c-data-verified.md`](./ncc-section-c-data-verified.md) and shipped
`verified: true`. The large-isolated concession inputs and Spec 17 are NOT in that
extract and remain unverified placeholders — any result touching them degrades to
`insufficient-input` by design.

| # | Value / table | Data file | Status |
|---|---|---|---|
| 1 | **Table C2D2** — required Type by rise (Class 5–8) | [`src/data/tables/c2d2.ts`](../src/data/tables/c2d2.ts) | ✅ Verified (5/7a/7b/8) |
| 2 | **Table C3D3** — max compartment area + volume; grouping {5} vs {7a,7b,8} | [`src/data/tables/c3d3.ts`](../src/data/tables/c3d3.ts) | ✅ Verified (5/7a/7b/8) |
| 3 | **Table C4D4** — opening separation by angle | [`src/data/tables/c4d4.ts`](../src/data/tables/c4d4.ts) | ✅ Verified |
| 4 | **Spec 5 — external-wall FRL by distance**; grouping {5,7a} vs {7b,8} | [`src/data/tables/spec5-extwall.ts`](../src/data/tables/spec5-extwall.ts) | ✅ Verified (Types A/B/C) |
| 5 | **Spec 5 — fixed FRL schedule** (walls/columns/floors/roofs) | [`src/data/tables/spec5-schedule.ts`](../src/data/tables/spec5-schedule.ts) | ✅ Verified (Types A/B/C) |
| 6 | **C3D4 caps** — large-isolated max area / volume (18,000 m² / 108,000 m³; bound pathway A only) | [`src/data/tables/c3d4-c3d5.ts`](../src/data/tables/c3d4-c3d5.ts) | ✅ Verified |
| 7 | **C3D5(1) / C3D5(2) geometry** — open space ≥ 18 m; perimeter access ≥ 6 m within 18 m | [`src/data/tables/c3d4-c3d5.ts`](../src/data/tables/c3d4-c3d5.ts) | ✅ Verified |
| 8 | **C4D5 exemption FRL threshold** — ≥60/60/60 + protected openings | [`src/data/tables/c4d4.ts`](../src/data/tables/c4d4.ts) | ☐ **Unverified** — not in extract (exemption not yet computed) |
| 9 | **Specification 17** — complying-system conditions | [`src/data/tables/spec17.ts`](../src/data/tables/spec17.ts) | ☐ Placeholder — **not consulted** by any decision (sprinkler status is a designer yes/no) |

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
