import { useState } from "react";
import type { BuildingClass } from "../domain/building.ts";
import { BUILDING_CLASSES, IN_SCOPE_CLASSES, isInScope } from "../domain/building.ts";
import type { ClassifyUse } from "../domain/classification.ts";
import { classifyFromAnswers } from "../domain/classification.ts";
import type { UseProject } from "../state/project.ts";
import { Button, Field, Segmented, Select, TriToggle } from "./controls.tsx";
import { Intro, Notice } from "./stepParts.tsx";

/** Placeholder value for the direct picker before a class has been actively chosen. */
const PICK = "";

const USE_OPTIONS: { value: ClassifyUse; label: string }[] = [
  { value: "storage", label: "Storage / warehouse / wholesale" },
  { value: "office", label: "Commercial offices" },
  { value: "manufacturing", label: "Manufacturing (factory)" },
  { value: "processing", label: "Processing / packing / laboratory" },
  { value: "carpark", label: "Carpark" },
  { value: "shop", label: "Shop / retail / café" },
  { value: "health", label: "Health / aged care / assembly" },
  { value: "residential", label: "Residential" },
  { value: "other", label: "Something else" },
];

/** Step 1 — classification: a direct class pick plus an A6 "not sure" questionnaire. */
export function ClassifyStep({
  p,
  classChosen,
  setClassChosen,
}: {
  p: UseProject;
  classChosen: boolean;
  setClassChosen: (v: boolean) => void;
}) {
  const cls = p.input.buildingClass;

  const [showHelp, setShowHelp] = useState(false);
  const [primaryUse, setPrimaryUse] = useState<ClassifyUse>("storage");
  const [secondaryUse, setSecondaryUse] = useState<ClassifyUse | null>(null);
  const [separatedByFireWall, setSeparated] = useState<boolean | null>(null);
  const [dominantUse, setDominantUse] = useState<"primary" | "secondary" | null>(null);

  // Placeholder-aware direct picker: until a class is actively chosen the picker
  // shows "Select a class"; both the empty option AND the empty value are gated on
  // the SAME `!classChosen` so the controlled <select> never renders a value that
  // isn't in its option list. Selecting any real option — even the default class —
  // then fires onChange and unblocks Next.
  const classOptions: { value: string; label: string }[] = [
    ...(classChosen ? [] : [{ value: PICK, label: "— Select a building class —" }]),
    ...BUILDING_CLASSES.map((c) => ({
      value: c as string,
      label: isInScope(c) ? `Class ${c}` : `Class ${c} — out of scope`,
    })),
  ];
  const pickClass = (v: string) => {
    if (v === PICK) return;
    p.setClass(v as BuildingClass);
    setClassChosen(true);
  };

  const result = classifyFromAnswers({ primaryUse, secondaryUse, separatedByFireWall, dominantUse });
  const hasSecondary = secondaryUse !== null;

  const useHelpClass = () => {
    if (result.buildingClass === null) return;
    p.setClass(result.buildingClass);
    // Fire-separated multi-class ⇒ preload both parts as per-class compartments.
    if (result.compartments) p.preloadCompartments(result.compartments);
    setClassChosen(true);
  };

  return (
    <div className="space-y-4">
      <Intro title="Classification" text="Pick the building class. This tool assesses Class 5, 7a, 7b and 8 only; any other class returns “out of scope — not assessed”, never a guessed result." />

      <div className="max-w-xs">
        <Field label="Building class" hint="NCC 2022 Part A6">
          <Select value={classChosen ? (cls as string) : PICK} options={classOptions} onChange={pickClass} />
        </Field>
      </div>

      {!classChosen ? (
        <Notice tone="muted">Choose the building class above — or use “Not sure” below to work it out. You can’t continue until a class is chosen.</Notice>
      ) : !isInScope(cls) ? (
        <Notice tone="warn">Class {cls} is outside this tool’s scope ({IN_SCOPE_CLASSES.map((c) => `Class ${c}`).join(", ")}). No assessment is produced.</Notice>
      ) : (
        <Notice tone="ok">Class {cls} is in scope — verified NCC data available.</Notice>
      )}

      <div>
        <Button variant={showHelp ? "secondary" : "ghost"} onClick={() => setShowHelp((s) => !s)}>
          {showHelp ? "Hide the questionnaire" : "Not sure — help me classify"}
        </Button>
      </div>

      {showHelp && (
        <div className="space-y-4 rounded border border-borg-line bg-white p-4">
          <p className="text-xs text-borg-slate">
            An indicative guide based on NCC Part A6. Answer a couple of questions and the tool suggests the closest class — the final classification is always the certifier’s call.
          </p>

          <Field label="What is the building’s primary use?">
            <Select value={primaryUse} options={USE_OPTIONS} onChange={setPrimaryUse} />
          </Field>

          <Field label="Is there a second, distinct use in the building?">
            <Segmented
              value={hasSecondary ? "yes" : "no"}
              options={[
                { value: "no", label: "No — single use" },
                { value: "yes", label: "Yes — a second use" },
              ]}
              onChange={(v) => {
                if (v === "yes") {
                  setSecondaryUse((s) => s ?? "office");
                } else {
                  setSecondaryUse(null);
                  setSeparated(null);
                  setDominantUse(null);
                }
              }}
            />
          </Field>

          {hasSecondary && (
            <>
              <Field label="What is the second use?">
                <Select value={secondaryUse} options={USE_OPTIONS} onChange={(v) => setSecondaryUse(v)} />
              </Field>

              <Field label="Are the two uses in separate compartments separated by a fire-rated wall?">
                <TriToggle
                  value={separatedByFireWall}
                  onChange={setSeparated}
                  yes="Yes — separate fire compartments"
                  no="No — one open building"
                />
              </Field>

              {separatedByFireWall === false && (
                <Field label="Which is the major (dominant) use?" hint="A minor use that serves the major use is ancillary and takes its class">
                  <Segmented
                    value={dominantUse ?? "auto"}
                    options={[
                      { value: "auto", label: "Let the tool decide" },
                      { value: "primary", label: "Primary use" },
                      { value: "secondary", label: "Second use" },
                    ]}
                    onChange={(v) => setDominantUse(v === "auto" ? null : (v as "primary" | "secondary"))}
                  />
                </Field>
              )}
            </>
          )}

          {result.buildingClass !== null ? (
            <Notice tone={result.inScope ? "ok" : "warn"}>
              <p>
                Based on your answers, this is closest to <strong>Class {result.buildingClass}</strong>
                {result.inScope ? "" : " — outside this tool’s scope"}.
              </p>
              <p className="mt-1 text-borg-slate">{result.rationale}</p>
              {result.separateCompartments && (
                <p className="mt-1 text-borg-slate">The two fire-separated uses will be entered as separate compartments in a later step; the class field records the dominant compartment’s class for now.</p>
              )}
              <div className="mt-3">
                <Button variant="primary" onClick={useHelpClass}>Use Class {result.buildingClass}</Button>
              </div>
            </Notice>
          ) : (
            <Notice tone="muted">{result.rationale}</Notice>
          )}
        </div>
      )}
    </div>
  );
}
