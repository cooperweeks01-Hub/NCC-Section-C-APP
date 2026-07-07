import type { UseProject } from "../state/project.ts";
import { Field, InfoTooltip, NumberInput, Segmented } from "./controls.tsx";
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
        <Field
          label="Rise in storeys"
          hint="NCC counting method"
          info={
            <InfoTooltip text="Rise in storeys (NCC 2022, C2D3) is the greatest number of storeys counted from the lowest storey that provides direct egress to a road or open space, up to the topmost storey. A storey is a space between two floor levels, or between a floor and a ceiling or roof. It excludes a space with a ceiling less than 1.5 m above the floor, and a non-habitable roof/ceiling space. Rise in storeys is not the same as effective height." />
          }
        >
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
