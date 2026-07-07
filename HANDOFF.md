# Session handoff — NCC Section C tool

_Updated 2026-07-07. Temporary handoff for the next Claude Code session. Delete
once read (committed only for durability)._

## TL;DR

A working v1 for **Class 5, 7a, 7b, 8**: deterministic engine, orchestrator,
IndexedDB persistence, client-side branded PDF, and a guided UI. Built and
verified in a real browser.

- Branch `main`, working tree clean. `npm test` → **76 pass**. `npm run build` → **exit 0**.
- Local-first, **no backend** — the PDF is generated in the browser.

## Features (current)

- **Classification** — direct class pick + a "Not sure" NCC Part A6 questionnaire
  (use → class, dominant/ancillary rule). Can't advance until a class is chosen.
- **Rise in storeys** — info tooltip with the C2D3 storey definition.
- **Compartment size (C3D3)** — per compartment; carve-out (C3D2(1): sprinklered/
  open-deck carpark, open spectator stand) skips the size check.
- **Large-isolated concession (C3D4/C3D5)** — two pathways: A open space (C3D5(1),
  capped, Class 7/8 ≤2 storeys) OR B sprinklers + perimeter access (C3D5(2), NO
  size cap). Lives at the bottom of the Compartments step; shows only the pathways
  actually available for the entered size.
- **Construction-type escalation** — when a compartment exceeds its Type's C3D3
  limit, offers "upgrade to Type B/A" if a higher Type fits; recomputes the whole
  assessment; PDF logs the C→B→A trial.
- **Per-compartment class (fire-separated multi-class)** — each compartment
  assessed against its OWN class's C3D3 + Spec 5; FRL schedule per distinct class;
  the questionnaire preloads two fire-separated parts as per-class compartments.
- **C3D4(c)** — advisory flag (verify-only, NOT computed): parts < 6 m apart may be
  one building; open-space/access extends to the whole group. (Whether fire-
  separated parts are "separate buildings" is a surveyor judgement.)
- **Setback / external-wall FRL (Spec 5)** + C4D4 opening separation by angle.
- **PDF** — branded, clause-referenced, per-compartment, DRAFT banner logic,
  disclaimer; lazy-loaded so initial JS is ~200 kB.

## Data status (all verified for the covered scope)

C2D2, C3D3, C4D4, Spec 5, C3D4 caps (18,000 m²/108,000 m³), C3D5 geometry (18 m;
6 m/18 m) are `verified:true`. Only the C4D5 exemption threshold and Spec 17 text
remain placeholders and gate nothing — so a normal in-scope assessment shows no
DRAFT banner.

## Architecture

- `src/domain/` frozen contracts · `src/data/` verified NCC layer (+ `__fixtures__`
  synthetic test data) · `src/engine/` pure rules + `assess.ts` orchestrator ·
  `src/persistence/` IndexedDB ProjectStore · `src/pdf/` report · `src/ui/`+`state/`
  workflow · `src/llm/` disabled Explainer interface.
- Deterministic engine is the whole compliance path; every result carries a
  clause/table ref. No LLM in the path. See `docs/phase-b-data-model.md`.

## Run / build

```bash
npm install
npm run dev      # dev server
npm run test     # 76 tests
npm run build    # tsc --noEmit + vite build → dist/
```

## Deployment (in progress — see the session where this was written)

- **No backend needed.** The build in `dist/` is a static SPA; the PDF is
  client-side. Any static host works (Netlify / Vercel / Cloudflare Pages /
  GitHub Pages). `netlify.toml` is committed for one-click Netlify.
- **GitHub:** no remote yet, `gh` CLI not installed. To push: create an empty
  GitHub repo, `git remote add origin <url>`, `git push -u origin main`.
- **GitHub Pages caveat:** a *project* Pages site serves under `/<repo>/`, so set
  `base: '/<repo>/'` in `vite.config.ts` before building for Pages. Netlify/Vercel
  serve at the root — no base change needed.

## Design rules to keep

No fabricated NCC values (missing ⇒ insufficient-input). Per-table class grouping
(C3D3 {5}/{7a,7b,8}; Spec 5 {5,7a}/{7b,8}). No LLM in the compliance path. C2D2 is
uniform across 5–8 so construction type is building-wide — a class-specific C2D2
would need per-class Type handling (commented in `assess.ts`).

## Known follow-ups / limitations

- Part A6 questionnaire is indicative; classification is always the certifier's call.
- Field labels wrap the Segmented/Toggle buttons, so those buttons inherit the
  question as their accessible name (works; minor a11y polish).
- C4D5 opening-separation exemption is cited but not computed.
- Off-machine backup = pushing to GitHub (see Deployment).
