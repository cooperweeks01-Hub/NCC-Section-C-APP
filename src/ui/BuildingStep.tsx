import type { UseProject } from "../state/project.ts";
import { Field, NumberInput, Segmented } from "./controls.tsx";
import { Intro } from "./stepParts.tsx";

/**
 * Step 2 — building-level inputs. Rise in storeys drives the Type (Table C2D2);
 * effective height is kept separate (> 25 m triggers the E1D5 sprinkler flag).
 * NOTE: the C3D4 large-isolated concession lives at the bottom of the Compartments
 * step (it is a concession to compartment sizing), not here.
 */
export function BuildingStep({ p }: { p: UseProject }) {
  return (
    <div className="space-y-4">
      <Intro title="Building" text="Rise in storeys drives the Type (Table C2D2). Effective height is kept separate — > 25 m triggers the sprinkler flag (E1D5)." />
      <div className="grid max-w-xl grid-cols-2 gap-4">
        <Field label="Rise in storeys" hint="NCC counting method">
          <NumberInput value={p.input.riseInStoreys} min={0} onChange={(v) => p.setInput({ riseInStoreys: v ?? 0 })} />
        </Field>
        <Field label="Effective height (m)">
          <NumberInput value={p.input.effectiveHeightM} min={0} onChange={(v) => p.setInput({ effectiveHeightM: v ?? 0 })} />
        </Field>
        <Field label="Fire walls separate the building into >1 compartment?">
          <Segmented value={p.input.fireWallsSeparateCompartments ? "y" : "n"} options={[{ value: "n", label: "No" }, { value: "y", label: "Yes" }]} onChange={(v) => p.setInput({ fireWallsSeparateCompartments: v === "y" })} />
        </Field>
      </div>
    </div>
  );
}
