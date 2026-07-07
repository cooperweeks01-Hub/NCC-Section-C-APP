import type { BuildingInput } from "../domain/building.ts";
import type { Assessment } from "../engine/assess.ts";
import type {
  AdvisoryDetail,
  AnyComplianceResult,
  CompartmentSizeDetail,
  FlagDetail,
  FrlScheduleDetail,
  LargeIsolatedDetail,
  SetbackDetail,
  TypeOfConstructionDetail,
} from "../domain/result.ts";
import { formatFrl, statusColor, statusLabel } from "../format.ts";

/** On-screen full results (mirror of the PDF), each number citing its clause. */
function checkTitle(check: AnyComplianceResult["check"]): string {
  const map: Record<AnyComplianceResult["check"], string> = {
    TypeOfConstruction: "Type of construction",
    CompartmentSize: "Fire compartment size",
    LargeIsolated: "Large isolated building (C3D4)",
    SetbackSeparation: "Setback / external-wall FRL",
    FrlSchedule: "FRL schedule",
    KnockOnFlag: "Knock-on flag",
    Advisory: "Advisory",
  };
  return map[check];
}

function Cite({ r }: { r: AnyComplianceResult }) {
  const cite = [r.clauseRef, r.tableRef, r.pathway].filter(Boolean).join(" · ");
  return <p className="mt-1 text-[11px] font-medium text-borg-slate">{cite}</p>;
}

function Detail({ r }: { r: AnyComplianceResult }) {
  switch (r.check) {
    case "TypeOfConstruction": {
      const d = r.detail as TypeOfConstructionDetail;
      const upgraded = d.effectiveType && d.effectiveType !== d.requiredType;
      return (
        <div className="text-sm text-borg-slate">
          <p>Required minimum Type (C2D2): <strong className="text-borg-charcoal">{d.requiredType ?? "—"}</strong> (rise {d.riseInStoreys}).</p>
          {upgraded && <p>Assessed at <strong className="text-borg-charcoal">Type {d.effectiveType}</strong> — construction upgraded to permit a larger C3D3 compartment.</p>}
          {d.typeTrials && d.typeTrials.length > 1 && (
            <p className="mt-1">Type trial: {d.typeTrials.map((t) => `Type ${t.type} ${t.allCompartmentsFit ? "✓" : "✗"}`).join(" · ")}</p>
          )}
          {d.sizeUpgradeSuggestion && <p className="mt-1">Option: upgrade construction to <strong className="text-borg-charcoal">Type {d.sizeUpgradeSuggestion}</strong> to fit all compartments without the concession.</p>}
          {d.levers.length > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {d.levers.map((l, i) => <li key={i}>{l.lever} → {l.resultingType ?? "verify"} <span className="text-borg-slate/70">({l.clauseRef})</span></li>)}
            </ul>
          )}
        </div>
      );
    }
    case "CompartmentSize": {
      const d = r.detail as CompartmentSizeDetail;
      if (d.sizeExemption) return <p className="text-sm text-borg-slate">Size check not applicable — {d.sizeExemption} (C3D5(1)/C3D3).</p>;
      return (
        <div className="text-sm text-borg-slate">
          <p>Floor area {d.floorAreaM2} m² (limit {d.maxFloorAreaM2 ?? "—"} m²); volume {d.volumeM3} m³ (limit {d.maxVolumeM3 ?? "—"} m³).</p>
          {d.subdivide && <p className="mt-1">Subdivide ≥ {d.subdivide.targetCompartmentCount} compartments ≤ {d.subdivide.targetMaxFloorAreaM2} m²; fire-wall FRL {formatFrl(d.subdivide.requiredFireWallFrl)} ({d.subdivide.clauseRef}); openings {d.subdivide.openingProtectionClauseRef}.</p>}
        </div>
      );
    }
    case "LargeIsolated": {
      const d = r.detail as LargeIsolatedDetail;
      return (
        <div className="text-sm text-borg-slate">
          <p>Within C3D4 caps: {d.eligible === null ? "—" : d.eligible ? "yes" : "no"} (caps {d.areaCapM2 ?? "—"} m² / {d.volumeCapM3 ?? "—"} m³ — bounds pathway A only).</p>
          <p>• {d.pathwayA.clauseRef}: {d.pathwayA.satisfied === null ? "?" : d.pathwayA.satisfied ? "satisfied" : "not satisfied"}{d.pathwayA.missing ? ` — ${d.pathwayA.missing}` : ""}</p>
          <p>• {d.pathwayB.clauseRef}: {d.pathwayB.satisfied === null ? "?" : d.pathwayB.satisfied ? "satisfied" : "not satisfied"}{d.pathwayB.missing ? ` — ${d.pathwayB.missing}` : ""}</p>
        </div>
      );
    }
    case "SetbackSeparation": {
      const d = r.detail as SetbackDetail;
      if (d.walls.length === 0) return <p className="text-sm text-borg-slate">No external walls.</p>;
      return (
        <table className="mt-1 w-full text-sm">
          <thead><tr className="text-left text-xs text-borg-slate"><th className="py-1">Wall</th><th>Dist (m)</th><th>Ext-wall FRL</th><th>Clause</th><th>Opening sep.</th></tr></thead>
          <tbody>
            {d.walls.map((w, i) => (
              <tr key={i} className="border-t border-borg-line text-borg-charcoal">
                <td className="py-1">{w.wallName}</td>
                <td>{w.distanceToFireSourceFeatureM}</td>
                <td>{formatFrl(w.requiredExtWallFrl)}</td>
                <td>{w.clauseRef}</td>
                <td>{w.openingSeparation ? (w.openingSeparation.requiredSeparationM === null ? "—" : `${w.openingSeparation.requiredSeparationM} m`) : "n/a"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    case "FrlSchedule": {
      const d = r.detail as FrlScheduleDetail;
      return (
        <table className="mt-1 w-full text-sm">
          <thead><tr className="text-left text-xs text-borg-slate"><th className="py-1">Element (Type {d.type ?? "—"}{d.assessedClass ? `, Class ${d.assessedClass}` : ""})</th><th>FRL</th><th>Clause</th></tr></thead>
          <tbody>
            {d.lines.map((l, i) => (
              <tr key={i} className="border-t border-borg-line text-borg-charcoal">
                <td className="py-1 pr-2">{l.label}</td><td className="whitespace-nowrap">{formatFrl(l.frl)}</td><td>{l.clauseRef}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    case "KnockOnFlag": {
      const d = r.detail as FlagDetail;
      return <p className="text-sm text-borg-slate">{d.guidance} <span className="text-borg-slate/70">(source: {d.source})</span></p>;
    }
    case "Advisory": {
      const d = r.detail as AdvisoryDetail;
      return <p className="text-sm text-borg-slate">{d.guidance}</p>;
    }
  }
}

function Card({ r }: { r: AnyComplianceResult }) {
  return (
    <div className="rounded border border-borg-line bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-borg-charcoal">{checkTitle(r.check)}</h3>
          <p className="text-sm text-borg-slate">{r.summary}</p>
        </div>
        <span className="shrink-0 rounded px-2 py-0.5 text-[11px] font-bold uppercase text-white" style={{ backgroundColor: statusColor(r.status) }}>{statusLabel(r.status)}</span>
      </div>
      <div className="mt-2"><Detail r={r} /></div>
      <Cite r={r} />
    </div>
  );
}

export function ResultsView({ assessment, input }: { assessment: Assessment; input: BuildingInput }) {
  const { results } = assessment;
  const buildingLevel = results.filter((r) => r.compartmentId === undefined);
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-borg-slate">Building-level</h3>
        {buildingLevel.map((r, i) => <Card key={i} r={r} />)}
      </section>
      {input.compartments.map((c) => {
        const cr = results.filter((r) => r.compartmentId === c.id);
        if (cr.length === 0) return null;
        return (
          <section key={c.id} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-borg-red">Compartment · {c.name} — Class {c.buildingClass ?? input.buildingClass} ({c.floorAreaM2} m² / {c.volumeM3} m³)</h3>
            {cr.map((r, i) => <Card key={i} r={r} />)}
          </section>
        );
      })}
    </div>
  );
}
