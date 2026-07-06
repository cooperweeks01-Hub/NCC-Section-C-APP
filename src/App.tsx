import { DISCLAIMER, DRAFT_BANNER } from "./domain/disclaimer.ts";
import { nccData } from "./data/index.ts";

/**
 * App shell (Phase A placeholder for WS-8).
 *
 * This is intentionally minimal: it wires the always-on disclaimer and the
 * DRAFT — unverified banner so the correctness/traceability chrome exists from
 * day one. The full §6 guided workflow (classify → inputs → type → compartment →
 * setback → FRL → advisory → report) with the persistent clause panel is WS-8,
 * built against the frozen contracts.
 */
export default function App() {
  // Until any NCC value is verified, the whole layer is DRAFT. WS-8 wires this to
  // the live results' `usesUnverifiedData` instead of the static layer state.
  const dataIsDraft = true;

  return (
    <div className="min-h-full bg-borg-mist text-borg-charcoal font-sans">
      {dataIsDraft && (
        <div className="bg-status-draft px-4 py-2 text-center text-sm font-semibold uppercase tracking-wide text-white">
          {DRAFT_BANNER} · NCC values are unverified placeholders — results are not final
        </div>
      )}

      <header className="border-b border-borg-line bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="inline-block h-6 w-6 rounded-sm bg-borg-red" aria-hidden />
          <div>
            <h1 className="text-lg font-semibold leading-tight">
              NCC Section C — DTS Fire Resistance Assessment
            </h1>
            <p className="text-xs text-borg-slate">
              Internal tool · Borg / Crossmuller · {nccData.meta.edition}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <section className="rounded-lg border border-borg-line bg-white p-6">
          <h2 className="text-base font-semibold">Phase 0 / A complete — foundation locked</h2>
          <p className="mt-2 text-sm text-borg-slate">
            The typed NCC schema, compliance-result contracts, rules-engine
            signatures, and persistence / LLM interfaces are frozen. Every NCC
            table value is an unverified placeholder, so every check safely
            degrades to <code className="rounded bg-borg-mist px-1">insufficient-input</code>.
            The guided workflow and PDF export (WS-6–WS-9) are built next against
            these contracts. See <code className="rounded bg-borg-mist px-1">docs/plan.md</code>.
          </p>
        </section>

        <footer className="mt-8 border-t border-borg-line pt-4 text-xs leading-relaxed text-borg-slate">
          {DISCLAIMER}
        </footer>
      </main>
    </div>
  );
}
