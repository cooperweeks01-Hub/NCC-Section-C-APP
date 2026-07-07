import type { BuildingClass } from "../domain/building.ts";
import { BUILDING_CLASSES, IN_SCOPE_CLASSES, isInScope } from "../domain/building.ts";
import type { UseProject } from "../state/project.ts";
import { Field, Select } from "./controls.tsx";
import { Intro, Notice } from "./stepParts.tsx";

/** Step 1 — classification (direct class pick; A6 "not sure" questionnaire is a future add). */
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
