import type { CompartmentSizeExemption } from "../domain/building.ts";
import { nccData } from "../data/index.ts";
import type { UseProject } from "../state/project.ts";
import { Button, Field, NumberInput, Segmented, Select, TextInput, TriToggle } from "./controls.tsx";
import { Intro, Notice } from "./stepParts.tsx";

const EXEMPTION_OPTIONS: { value: string; label: string }[] = [
  { value: "none", label: "No carve-out (normal)" },
  { value: "sprinkleredCarpark", label: "Sprinklered carpark" },
  { value: "openDeckCarpark", label: "Open-deck carpark" },
  { value: "openSpectatorStand", label: "Open spectator stand" },
];

/** Step 3 — compartments + external walls, with the C3D4 concession at the bottom. */
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

      <ConcessionSection p={p} />
    </div>
  );
}

/**
 * C3D4 large-isolated concession — a concession to compartment SIZING, so it lives
 * here at the bottom of the Compartments step and only appears when a compartment
 * exceeds its C3D3 limit.
 */
function ConcessionSection({ p }: { p: UseProject }) {
  const routed = p.assessment.results.some((r) => r.check === "LargeIsolated");
  if (!routed) {
    return <Notice tone="muted">The C3D4 large-isolated concession is offered here only if a compartment exceeds its C3D3 size limit.</Notice>;
  }
  const openSpaceMin = nccData.c3d5.openSpaceMinWidthM.value ?? 18;
  const accessWidth = nccData.c3d5.perimeterAccessMinWidthM.value ?? 6;
  const accessDist = nccData.c3d5.perimeterAccessMaxDistanceM.value ?? 18;
  return (
    <div className="rounded border border-borg-red/40 bg-borg-red/5 p-4">
      <h3 className="text-sm font-semibold text-borg-charcoal">C3D4 large-isolated concession — decision point</h3>
      <p className="mt-1 text-xs text-borg-slate">A compartment exceeds its C3D3 limit. It can still qualify by <strong>either</strong> pathway — open space (C3D5(1), capped) <strong>or</strong> sprinklers + perimeter access (C3D5(2), no size limit).</p>
      <div className="mt-3 grid max-w-2xl grid-cols-1 gap-4">
        <Field label={`Pathway A — open space width around the building (m)`} hint={`C3D5(1) · needs ≥ ${openSpaceMin} m; Class 7/8, ≤ 2 storeys, within caps`}>
          <div className="max-w-[12rem]"><NumberInput value={p.input.openSpaceAroundBuildingM} min={0} onChange={(v) => p.setInput({ openSpaceAroundBuildingM: v })} /></div>
        </Field>
        <Field label="Pathway B — sprinklered throughout to Specification 17?" hint="C3D5(2) · no size limit">
          <TriToggle value={p.input.sprinkleredToSpec17} onChange={(v) => p.setInput({ sprinkleredToSpec17: v })} />
        </Field>
        <Field label={`Is there continuous, unobstructed, not-built-upon vehicle access ≥ ${accessWidth} m wide around the building?`} hint="C3D5(2)">
          <TriToggle value={p.input.perimeterAccess6mWide} onChange={(v) => p.setInput(v === true ? { perimeterAccess6mWide: v } : { perimeterAccess6mWide: v, perimeterAccessWithin18m: null })} />
        </Field>
        {p.input.perimeterAccess6mWide === true && (
          <Field label={`Is that access within ${accessDist} m of the building (its far side ≤ ${accessDist} m)?`} hint="C3D5(2)">
            <TriToggle value={p.input.perimeterAccessWithin18m} onChange={(v) => p.setInput({ perimeterAccessWithin18m: v })} />
          </Field>
        )}
      </div>
    </div>
  );
}
