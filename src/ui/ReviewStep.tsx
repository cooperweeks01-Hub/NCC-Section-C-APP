import { useRef } from "react";
import type { UseProject } from "../state/project.ts";
import { Button } from "./controls.tsx";
import { Intro } from "./stepParts.tsx";
import { ResultsView } from "./ResultsView.tsx";

/** Step 4 — full results + export / import. */
export function ReviewStep({ p, onDownloadPdf }: { p: UseProject; onDownloadPdf: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const exportJson = () => {
    const blob = new Blob([p.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.meta.projectName.replace(/[^\w.-]+/g, "_") || "project"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        p.loadJson(String(reader.result));
      } catch (e) {
        alert(`Import failed: ${(e as Error).message}`);
      }
    };
    reader.readAsText(file);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Intro title="Assessment" text="Every result below is traceable to its NCC clause/table. Export a branded PDF or a re-openable JSON project file." />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>Import JSON</Button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
          <Button variant="secondary" onClick={exportJson}>Export JSON</Button>
          <Button variant="primary" onClick={onDownloadPdf}>Download PDF</Button>
        </div>
      </div>
      <ResultsView assessment={p.assessment} input={p.input} />
    </div>
  );
}
