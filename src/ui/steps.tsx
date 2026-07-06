import { useRef } from "react";
import type { ReactNode } from "react";
import type { BuildingClass, CompartmentSizeExemption } from "../domain/building.ts";
import { BUILDING_CLASSES, IN_SCOPE_CLASSES, isInScope } from "../domain/building.ts";
import type { UseProject } from "../state/project.ts";
import { Button, Field, NumberInput, Segmented, Select, TextInput, TriToggle } from "./controls.tsx";
import { ResultsView } from "./ResultsView.tsx";

/** Step 1 — classification (direct class pick; A6 questionnaire is a future add). */
export function ClassifyStep({ p }: { p: UseProject }) {
  const cls = p.input.buildingClass;
  const options = BUILDING_CLASSES.map((c) => ({
    value: c,
    label: isInScope(c) ? `Class ${c}` : `Class ${c} — out of scope`,
  }));
  return (
    <div className="space-y-4">
      <Intro title="Classification" text="Pick the building class. This tool assesses Class 5, 7a, 7b and 8 only; any other class returns “out of scope — not assessed”, never a guessed result." />
      <div className="max-w-xs">
        <Field label="Building class" hint="NCC 2022 Part A6">
          <Select value={cls} options={options} onChange={(v) => p.setClass(v as BuildingClass)} />
        </Field>
      </div>
      {!isInScope(cls) ? (
        <Notice tone="warn">Class {cls} is outside this tool’s scope ({IN_SCOPE_CLASSES.map((c) => `Class ${c}`).join(", ")}). No assessment is produced.</Notice>
      ) : (
        <Notice tone="ok">Class {cls} is in scope — verified NCC data available.</Notice>
      )}
    </div>
  );
}

/** Step 2 — building-level inputs; C3D4 concession inputs appear at the decision point. */
export function BuildingStep({ p }: { p: UseProject }) {
  const routed = p.assessment.results.some((r) => r.check === "LargeIsolated");
  return (
    <div className="space-y-4">
      <Intro title="Building" text="Rise in storeys drives the Type (Table C2D2). Effective height is kept separate — > 25 m triggers the sprinkler flag (E1D5)." />
      <div className="grid max-w-xl grid-cols-2 gap-4">
        <Field label="Rise in storeys" hint="NCC counting method"><NumberInput value={p.input.riseInStoreys} min={0} onChange={(v) => p.setInput({ riseInStoreys: v ?? 0 })} /></Field>
        <Field label="Effective height (m)"><NumberInput value={p.input.effectiveHeightM} min={0} onChange={(v) => p.setInput({ effectiveHeightM: v ?? 0 })} /></Field>
        <Field label="Fire walls separate the building into >1 compartment?">
          <Segmented value={p.input.fireWallsSeparateCompartments ? "y" : "n"} options={[{ value: "n", label: "No" }, { value: "y", label: "Yes" }]} onChange={(v) => p.setInput({ fireWallsSeparateCompartments: v === "y" })} />
        </Field>
      </div>

      {routed ? (
        <div className="rounded border border-borg-red/40 bg-borg-red/5 p-4">
          <h3 className="text-sm font-semibold text-borg-charcoal">C3D4 large-isolated concession — decision point</h3>
          <p className="mt-1 text-xs text-borg-slate">A compartment exceeds its C3D3 limit. Whether the building is/can be sprinklered to Specification 17 is the biggest lever here (brief §6.4).</p>
          <div className="mt-3 grid max-w-xl grid-cols-1 gap-4">
            <Field label="Sprinklered to Specification 17?"><TriToggle value={p.input.sprinkleredToSpec17} onChange={(v) => p.setInput({ sprinkleredToSpec17: v })} /></Field>
            <Field label="Open space width around building (m)" hint="C3D5(1)"><div className="max-w-[12rem]"><NumberInput value={p.input.openSpaceAroundBuildingM} min={0} onChange={(v) => p.setInput({ openSpaceAroundBuildingM: v })} /></div></Field>
            <Field label="Perimeter vehicular access?" hint="C3D5(2)"><TriToggle value={p.input.perimeterVehicularAccess} onChange={(v) => p.setInput({ perimeterVehicularAccess: v })} /></Field>
          </div>
        </div>
      ) : (
        <Notice tone="muted">The C3D4 sprinkler question is asked only if a compartment exceeds its C3D3 size limit.</Notice>
      )}
    </div>
  );
}

const EXEMPTION_OPTIONS: { value: string; label: string }[] = [
  { value: "none", label: "No carve-out (normal)" },
  { value: "sprinkleredCarpark", label: "Sprinklered carpark" },
  { value: "openDeckCarpark", label: "Open-deck carpark" },
  { value: "openSpectatorStand", label: "Open spectator stand" },
];

/** Step 3 — compartments + their external walls. */
export function CompartmentsStep({ p }: { p: UseProject }) {
  return (
    <div className="space-y-4">
      <Intro title="Fire compartments" text="Each genuinely separate fire compartment is assessed independently (size, external-wall FRL). 7a carparks / open spectator stands are exempt from the size check." />
      {p.input.compartments.map((c) => (
        <div key={c.id} className="rounded border border-borg-line bg-white p-4">
          <div className="flex items-center justify-between">
            <TextInput value={c.name} onChange={(v) => p.updateCompartment(c.id, { name: v })} />
            {p.input.compartments.length > 1 && <Button variant="ghost" onClick={() => p.removeCompartment(c.id)}>Remove</Button>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3">
            <Field label="Floor area (m²)"><NumberInput value={c.floorAreaM2} min={0} onChange={(v) => p.updateCompartment(c.id, { floorAreaM2: v ?? 0 })} /></Field>
            <Field label="Volume (m³)"><NumberInput value={c.volumeM3} min={0} onChange={(v) => p.updateCompartment(c.id, { volumeM3: v ?? 0 })} /></Field>
            <Field label="Size carve-out" hint="C3D5(1)">
              <Select
                value={c.sizeExemption ?? "none"}
                options={EXEMPTION_OPTIONS}
                onChange={(v) => p.updateCompartment(c.id, { sizeExemption: v === "none" ? null : (v as CompartmentSizeExemption) })}
              />
            </Field>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-borg-slate">External walls</h4>
              <Button variant="secondary" onClick={() => p.addWall(c.id)}>+ Wall</Button>
            </div>
            {c.externalWalls.length === 0 && <p className="mt-2 text-xs text-borg-slate/70">No external walls added.</p>}
            {c.externalWalls.map((w) => (
              <div key={w.id} className="mt-2 grid grid-cols-2 items-end gap-3 rounded bg-borg-mist p-3 md:grid-cols-5">
                <Field label="Name"><TextInput value={w.name} onChange={(v) => p.updateWall(c.id, w.id, { name: v })} /></Field>
                <Field label="Dist. FSF (m)"><NumberInput value={w.distanceToFireSourceFeatureM} min={0} onChange={(v) => p.updateWall(c.id, w.id, { distanceToFireSourceFeatureM: v ?? 0 })} /></Field>
                <Field label="Loadbearing"><Segmented value={w.loadbearing ? "y" : "n"} options={[{ value: "y", label: "Yes" }, { value: "n", label: "No" }]} onChange={(v) => p.updateWall(c.id, w.id, { loadbearing: v === "y" })} /></Field>
                <Field label="Openings"><Segmented value={w.hasOpenings ? "y" : "n"} options={[{ value: "y", label: "Yes" }, { value: "n", label: "No" }]} onChange={(v) => p.updateWall(c.id, w.id, { hasOpenings: v === "y" })} /></Field>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Field label="Angle (°)" hint="C4D4">
                      <NumberInput value={w.angleToAdjacentOpeningDeg} min={0} onChange={(v) => p.updateWall(c.id, w.id, { angleToAdjacentOpeningDeg: v })} />
                    </Field>
                  </div>
                  <Button variant="ghost" onClick={() => p.removeWall(c.id, w.id)}>×</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <Button variant="secondary" onClick={p.addCompartment}>+ Add compartment</Button>
    </div>
  );
}

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

// ── small presentational helpers ────────────────────────────────────────────
function Intro({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-borg-charcoal">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-borg-slate">{text}</p>
    </div>
  );
}
function Notice({ tone, children }: { tone: "ok" | "warn" | "muted"; children: ReactNode }) {
  const cls = tone === "ok" ? "border-status-complies/40 bg-status-complies/5 text-borg-charcoal" : tone === "warn" ? "border-borg-red/40 bg-borg-red/5 text-borg-charcoal" : "border-borg-line bg-borg-mist text-borg-slate";
  return <div className={`rounded border p-3 text-sm ${cls}`}>{children}</div>;
}
