import { useState } from "react";
import { DISCLAIMER, DRAFT_BANNER } from "./domain/disclaimer.ts";
import { useProject } from "./state/project.ts";
import { ClausePanel } from "./ui/ClausePanel.tsx";
import { Button } from "./ui/controls.tsx";
import { ClassifyStep } from "./ui/ClassifyStep.tsx";
import { BuildingStep } from "./ui/BuildingStep.tsx";
import { CompartmentsStep } from "./ui/CompartmentsStep.tsx";
import { ReviewStep } from "./ui/ReviewStep.tsx";

/**
 * WS-8 · the guided §6 workflow. A linear, step-back-and-forth flow around a
 * single derived assessment, with a persistent results/clause panel, an always-on
 * disclaimer, and a DRAFT banner wired to live `usesUnverifiedData`. Local-first:
 * everything runs in the browser.
 */
const STEPS = [
  { key: "classify", label: "1 · Classify" },
  { key: "building", label: "2 · Building" },
  { key: "compartments", label: "3 · Compartments" },
  { key: "review", label: "4 · Assessment" },
] as const;
type StepKey = (typeof STEPS)[number]["key"];

export default function App() {
  const p = useProject();
  const [step, setStep] = useState<StepKey>("classify");
  const [pdfBusy, setPdfBusy] = useState(false);
  // Gate: the user must ACTIVELY choose a class on the Classify step (direct picker
  // or questionnaire) before they can advance past it — the default class is not a choice.
  const [classChosen, setClassChosen] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const go = (delta: number) => {
    const next = STEPS[Math.min(STEPS.length - 1, Math.max(0, stepIndex + delta))];
    if (next) setStep(next.key);
  };

  const onDownloadPdf = async () => {
    setPdfBusy(true);
    try {
      // Lazy-load @react-pdf/renderer only on export — keeps initial load light.
      const { downloadReport } = await import("./pdf/report.tsx");
      await downloadReport(p.projectState);
    } catch (e) {
      alert(`PDF export failed: ${(e as Error).message}`);
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-borg-mist text-borg-charcoal">
      {p.isDraft && (
        <div className="bg-status-draft px-4 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-white">
          {DRAFT_BANNER} · results depend on values that must be confirmed against the licensed NCC — not final
        </div>
      )}

      <header className="border-b border-borg-line bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="inline-block h-6 w-6 rounded-sm bg-borg-red" aria-hidden />
          <div className="flex-1">
            <h1 className="text-base font-semibold leading-tight">NCC Section C — DTS Fire Resistance Assessment</h1>
            <p className="text-[11px] text-borg-slate">Borg / Crossmuller · internal tool · indicative only</p>
          </div>
          <input
            className="rounded border border-borg-line px-2 py-1 text-sm outline-none focus:border-borg-red"
            value={p.meta.projectName}
            onChange={(e) => p.setMeta({ projectName: e.target.value })}
            aria-label="Project name"
          />
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_22rem]">
        <main className="flex min-h-0 flex-col">
          <nav className="flex gap-1 border-b border-borg-line bg-white px-6 py-2">
            {STEPS.map((sdef, i) => {
              const blocked = step === "classify" && !classChosen && i > stepIndex;
              return (
                <button
                  key={sdef.key}
                  onClick={() => { if (!blocked) setStep(sdef.key); }}
                  disabled={blocked}
                  className={`rounded px-3 py-1.5 text-sm font-medium ${sdef.key === step ? "bg-borg-red text-white" : blocked ? "cursor-not-allowed text-borg-slate/40" : i <= stepIndex ? "text-borg-charcoal hover:bg-borg-mist" : "text-borg-slate hover:bg-borg-mist"}`}
                >
                  {sdef.label}
                </button>
              );
            })}
          </nav>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto max-w-4xl">
              {step === "classify" && <ClassifyStep p={p} classChosen={classChosen} setClassChosen={setClassChosen} />}
              {step === "building" && <BuildingStep p={p} />}
              {step === "compartments" && <CompartmentsStep p={p} />}
              {step === "review" && <ReviewStep p={p} onDownloadPdf={onDownloadPdf} />}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-borg-line bg-white px-6 py-3">
            <Button variant="secondary" onClick={() => go(-1)}>← Back</Button>
            <span className="text-xs text-borg-slate">{pdfBusy ? "Generating PDF…" : `Step ${stepIndex + 1} of ${STEPS.length}`}</span>
            {step === "review" ? (
              <Button variant="primary" onClick={onDownloadPdf}>Download PDF</Button>
            ) : step === "classify" && !classChosen ? (
              <button type="button" disabled title="Choose a building class to continue" className="cursor-not-allowed rounded bg-borg-red/40 px-3 py-1.5 text-sm font-medium text-white">
                Next →
              </button>
            ) : (
              <Button variant="primary" onClick={() => go(1)}>Next →</Button>
            )}
          </div>

          <footer className="border-t border-borg-line bg-borg-mist px-6 py-3">
            <p className="text-[11px] leading-relaxed text-borg-slate">{DISCLAIMER}</p>
          </footer>
        </main>

        <div className="hidden min-h-0 lg:block">
          <ClausePanel assessment={p.assessment} compartments={p.input.compartments} />
        </div>
      </div>
    </div>
  );
}
