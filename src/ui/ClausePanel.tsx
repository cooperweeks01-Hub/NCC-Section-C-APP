import type { Assessment } from "../engine/assess.ts";
import type { AnyComplianceResult } from "../domain/result.ts";
import { statusColor, statusLabel } from "../format.ts";

/**
 * The persistent results / clause panel (brief §6): always visible, it shows the
 * running compliance results with their exact clause/table references, updating
 * live as inputs change. No number appears without a citation.
 */
function checkTitle(check: AnyComplianceResult["check"]): string {
  const map: Record<AnyComplianceResult["check"], string> = {
    TypeOfConstruction: "Type of construction",
    CompartmentSize: "Compartment size",
    LargeIsolated: "Large isolated (C3D4)",
    SetbackSeparation: "Setback / ext-wall FRL",
    FrlSchedule: "FRL schedule",
    KnockOnFlag: "Flag",
    Advisory: "Advisory",
  };
  return map[check];
}

function ResultRow({ r }: { r: AnyComplianceResult }) {
  const cite = [r.clauseRef, r.tableRef, r.pathway].filter(Boolean).join(" · ");
  return (
    <li className="border-b border-borg-line py-2 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-borg-charcoal">{checkTitle(r.check)}</span>
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-white"
          style={{ backgroundColor: statusColor(r.status) }}
        >
          {statusLabel(r.status)}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-borg-slate">{r.summary}</p>
      <p className="mt-0.5 text-[10px] font-medium text-borg-slate/80">{cite}</p>
    </li>
  );
}

export function ClausePanel({ assessment }: { assessment: Assessment }) {
  const { results } = assessment;
  const buildingLevel = results.filter((r) => r.compartmentId === undefined);
  const compartmentIds = [...new Set(results.map((r) => r.compartmentId).filter((x): x is string => !!x))];

  return (
    <aside className="flex h-full flex-col border-l border-borg-line bg-white">
      <div className="border-b border-borg-line px-4 py-3">
        <h2 className="text-sm font-semibold text-borg-charcoal">Running results</h2>
        <p className="text-[11px] text-borg-slate">Live · every result cites its clause</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <ul>
          {buildingLevel.map((r, i) => <ResultRow key={`b${i}`} r={r} />)}
        </ul>
        {compartmentIds.map((cid) => {
          const rows = results.filter((r) => r.compartmentId === cid);
          return (
            <div key={cid} className="mt-2">
              <h3 className="mt-2 text-[11px] font-bold uppercase tracking-wide text-borg-red">Compartment {cid.slice(0, 6)}</h3>
              <ul>{rows.map((r, i) => <ResultRow key={`${cid}${i}`} r={r} />)}</ul>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
