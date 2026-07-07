import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import type { ProjectState } from "../domain/project.ts";
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
import { DISCLAIMER, DRAFT_BANNER } from "../domain/disclaimer.ts";
import { formatFrl, statusColor, statusLabel } from "../format.ts";

/**
 * WS-7 · Client-side branded PDF report (brief §6.10). A pure rendering of the
 * assessment result objects — every number carries its clause/table reference,
 * and a DRAFT banner appears whenever any result used unverified data. No backend.
 */
const BORG = {
  red: "#C8102E",
  charcoal: "#1F2328",
  slate: "#3A4149",
  mist: "#F5F6F7",
  line: "#E2E5E9",
  white: "#FFFFFF",
};

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 56, paddingHorizontal: 40, fontSize: 9, color: BORG.charcoal, fontFamily: "Helvetica", lineHeight: 1.4 },
  draftBanner: { backgroundColor: BORG.red, color: BORG.white, textAlign: "center", padding: 5, fontSize: 9, fontFamily: "Helvetica-Bold", letterSpacing: 1, marginBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  logo: { width: 16, height: 16, backgroundColor: BORG.red, marginRight: 8 },
  h1: { fontSize: 15, fontFamily: "Helvetica-Bold" },
  subtle: { color: BORG.slate, fontSize: 8 },
  rule: { borderBottomWidth: 1, borderBottomColor: BORG.line, marginVertical: 8 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 12, marginBottom: 4, color: BORG.charcoal },
  compartmentTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 2, color: BORG.red },
  metaGrid: { flexDirection: "row", flexWrap: "wrap" },
  metaCell: { width: "50%", marginBottom: 2 },
  metaLabel: { color: BORG.slate, fontSize: 8 },
  resultCard: { borderWidth: 1, borderColor: BORG.line, borderRadius: 3, padding: 6, marginBottom: 6 },
  resultHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 },
  resultName: { fontFamily: "Helvetica-Bold", fontSize: 9.5 },
  badge: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: BORG.white, paddingVertical: 1, paddingHorizontal: 4, borderRadius: 2 },
  cite: { color: BORG.slate, fontSize: 7.5, marginTop: 2 },
  tableHead: { flexDirection: "row", backgroundColor: BORG.mist, paddingVertical: 2, paddingHorizontal: 3, marginTop: 3 },
  tRow: { flexDirection: "row", paddingVertical: 1.5, paddingHorizontal: 3, borderBottomWidth: 0.5, borderBottomColor: BORG.line },
  th: { fontFamily: "Helvetica-Bold", fontSize: 8 },
  td: { fontSize: 8 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, borderTopWidth: 1, borderTopColor: BORG.line, paddingTop: 6 },
  disclaimer: { fontSize: 6.5, color: BORG.slate, lineHeight: 1.35 },
  pageNo: { position: "absolute", bottom: 10, right: 40, fontSize: 7, color: BORG.slate },
});

function Badge({ result }: { result: AnyComplianceResult }) {
  return <Text style={[s.badge, { backgroundColor: statusColor(result.status) }]}>{statusLabel(result.status).toUpperCase()}</Text>;
}

function Cite({ result }: { result: AnyComplianceResult }) {
  const parts = [result.clauseRef, result.tableRef, result.pathway].filter(Boolean);
  return <Text style={s.cite}>{parts.join(" · ")}</Text>;
}

/** Column widths reused for FRL-ish tables. */
const col = (w: string | number) => ({ width: w } as const);

/** Render a nullable boolean input for the snapshot. */
const yn = (v: boolean | null): string => (v === null ? "not answered" : v ? "yes" : "no");

function TypeDetailView({ d }: { d: TypeOfConstructionDetail }) {
  const upgraded = d.effectiveType && d.effectiveType !== d.requiredType;
  return (
    <View>
      <Text style={s.td}>Required minimum Type (C2D2): {d.requiredType ?? "—"} (rise {d.riseInStoreys}).</Text>
      {upgraded && (
        <Text style={s.td}>Assessed at Type {d.effectiveType} — construction upgraded to permit a larger C3D3 compartment.</Text>
      )}
      {d.typeTrials && d.typeTrials.length > 1 && (
        <View>
          <Text style={s.td}>Construction-type trial (compartment size):</Text>
          {d.typeTrials.map((t, i) => (
            <Text key={i} style={s.td}>• Type {t.type}: {t.allCompartmentsFit ? "all compartments fit" : "a compartment exceeds the limit"}.</Text>
          ))}
        </View>
      )}
      {d.sizeUpgradeSuggestion && (
        <Text style={s.td}>Option: upgrade construction to Type {d.sizeUpgradeSuggestion} to fit all compartments without the C3D4 concession.</Text>
      )}
      {d.levers.length > 0 && (
        <View>
          <Text style={s.td}>Less-onerous options (reduce rise):</Text>
          {d.levers.map((l, i) => (
            <Text key={i} style={s.td}>• {l.lever} → {l.resultingType ?? "verify"} ({l.clauseRef})</Text>
          ))}
        </View>
      )}
    </View>
  );
}

function CompartmentSizeView({ d }: { d: CompartmentSizeDetail }) {
  if (d.sizeExemption) return <Text style={s.td}>Size check not applicable — {d.sizeExemption} (C3D5(1)/C3D3).</Text>;
  return (
    <View>
      <Text style={s.td}>
        Floor area {d.floorAreaM2} m² (limit {d.maxFloorAreaM2 ?? "—"} m²); volume {d.volumeM3} m³ (limit {d.maxVolumeM3 ?? "—"} m³).
      </Text>
      {d.subdivide && (
        <Text style={s.td}>Subdivide: ≥ {d.subdivide.targetCompartmentCount} compartments ≤ {d.subdivide.targetMaxFloorAreaM2} m²; fire-wall FRL {formatFrl(d.subdivide.requiredFireWallFrl)} ({d.subdivide.clauseRef}); openings {d.subdivide.openingProtectionClauseRef}.</Text>
      )}
      {d.routedToLargeIsolated && <Text style={s.td}>→ Assessed under the C3D4 large-isolated concession (below).</Text>}
    </View>
  );
}

function LargeIsolatedView({ d }: { d: LargeIsolatedDetail }) {
  return (
    <View>
      <Text style={s.td}>Within C3D4 caps (pathway A only): {d.eligible === null ? "—" : d.eligible ? "yes" : "no"} — caps {d.areaCapM2 ?? "—"} m² / {d.volumeCapM3 ?? "—"} m³ vs {d.floorAreaM2} m² / {d.volumeM3} m³.</Text>
      <Text style={s.td}>• {d.pathwayA.clauseRef}: {d.pathwayA.satisfied === null ? "?" : d.pathwayA.satisfied ? "satisfied" : "not satisfied"}{d.pathwayA.missing ? ` — ${d.pathwayA.missing}` : ""}</Text>
      <Text style={s.td}>• {d.pathwayB.clauseRef}: {d.pathwayB.satisfied === null ? "?" : d.pathwayB.satisfied ? "satisfied" : "not satisfied"}{d.pathwayB.missing ? ` — ${d.pathwayB.missing}` : ""}</Text>
    </View>
  );
}

function SetbackView({ d }: { d: SetbackDetail }) {
  if (d.walls.length === 0) return <Text style={s.td}>No external walls supplied.</Text>;
  return (
    <View>
      <View style={s.tableHead}>
        <Text style={[s.th, col("40%")]}>Wall</Text>
        <Text style={[s.th, col("15%")]}>Dist (m)</Text>
        <Text style={[s.th, col("22%")]}>Ext-wall FRL</Text>
        <Text style={[s.th, col("23%")]}>Clause</Text>
      </View>
      {d.walls.map((w, i) => (
        <View key={i} style={s.tRow}>
          <Text style={[s.td, col("40%")]}>{w.wallName}</Text>
          <Text style={[s.td, col("15%")]}>{w.distanceToFireSourceFeatureM}</Text>
          <Text style={[s.td, col("22%")]}>{formatFrl(w.requiredExtWallFrl)}</Text>
          <Text style={[s.td, col("23%")]}>{w.clauseRef}</Text>
        </View>
      ))}
    </View>
  );
}

function FrlScheduleView({ d }: { d: FrlScheduleDetail }) {
  return (
    <View>
      <View style={s.tableHead}>
        <Text style={[s.th, col("62%")]}>Element (Type {d.type ?? "—"})</Text>
        <Text style={[s.th, col("23%")]}>FRL</Text>
        <Text style={[s.th, col("15%")]}>Clause</Text>
      </View>
      {d.lines.map((l, i) => (
        <View key={i} style={s.tRow}>
          <Text style={[s.td, col("62%")]}>{l.label}</Text>
          <Text style={[s.td, col("23%")]}>{formatFrl(l.frl)}</Text>
          <Text style={[s.td, col("15%")]}>{l.clauseRef}</Text>
        </View>
      ))}
    </View>
  );
}

function ResultCard({ result }: { result: AnyComplianceResult }) {
  return (
    <View style={s.resultCard} wrap={false}>
      <View style={s.resultHead}>
        <Text style={s.resultName}>{checkTitle(result.check)}</Text>
        <Badge result={result} />
      </View>
      <Text style={s.td}>{result.summary}</Text>
      <View style={{ marginTop: 3 }}>
        <DetailView result={result} />
      </View>
      <Cite result={result} />
    </View>
  );
}

function DetailView({ result }: { result: AnyComplianceResult }) {
  switch (result.check) {
    case "TypeOfConstruction":
      return <TypeDetailView d={result.detail as TypeOfConstructionDetail} />;
    case "CompartmentSize":
      return <CompartmentSizeView d={result.detail as CompartmentSizeDetail} />;
    case "LargeIsolated":
      return <LargeIsolatedView d={result.detail as LargeIsolatedDetail} />;
    case "SetbackSeparation":
      return <SetbackView d={result.detail as SetbackDetail} />;
    case "FrlSchedule":
      return <FrlScheduleView d={result.detail as FrlScheduleDetail} />;
    case "KnockOnFlag": {
      const d = result.detail as FlagDetail;
      return <Text style={s.td}>{d.guidance} (source: {d.source})</Text>;
    }
    case "Advisory": {
      const d = result.detail as AdvisoryDetail;
      return <Text style={s.td}>{d.guidance}</Text>;
    }
  }
}

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

export function ComplianceReport({ project }: { project: ProjectState }) {
  const { meta, input, results } = project;
  const isDraft = results.some((r) => r.usesUnverifiedData);
  const buildingLevel = results.filter((r) => r.compartmentId === undefined);
  const byCompartment = input.compartments.map((c) => ({
    compartment: c,
    results: results.filter((r) => r.compartmentId === c.id),
  }));

  return (
    <Document title={`NCC Section C — ${meta.projectName}`}>
      <Page size="A4" style={s.page}>
        {isDraft && <Text style={s.draftBanner}>{DRAFT_BANNER.toUpperCase()} — RESULTS ARE NOT FINAL</Text>}

        <View style={s.headerRow}>
          <View style={s.logo} />
          <View>
            <Text style={s.h1}>NCC Section C — DTS Fire Resistance Assessment</Text>
            <Text style={s.subtle}>Borg / Crossmuller · NCC 2022 Volume One · indicative only</Text>
          </View>
        </View>
        <View style={s.rule} />

        <Text style={s.sectionTitle}>Project</Text>
        <View style={s.metaGrid}>
          <View style={s.metaCell}><Text style={s.metaLabel}>Project</Text><Text>{meta.projectName}</Text></View>
          <View style={s.metaCell}><Text style={s.metaLabel}>Address</Text><Text>{meta.address ?? "—"}</Text></View>
          <View style={s.metaCell}><Text style={s.metaLabel}>Author</Text><Text>{meta.author ?? "—"}</Text></View>
          <View style={s.metaCell}><Text style={s.metaLabel}>Updated</Text><Text>{meta.updatedAt}</Text></View>
        </View>

        <Text style={s.sectionTitle}>Building inputs</Text>
        <View style={s.metaGrid}>
          <View style={s.metaCell}><Text style={s.metaLabel}>Class</Text><Text>{input.buildingClass}</Text></View>
          <View style={s.metaCell}><Text style={s.metaLabel}>Rise in storeys</Text><Text>{input.riseInStoreys}</Text></View>
          <View style={s.metaCell}><Text style={s.metaLabel}>Effective height (m)</Text><Text>{input.effectiveHeightM}</Text></View>
          <View style={s.metaCell}><Text style={s.metaLabel}>Fire walls separate compartments</Text><Text>{input.fireWallsSeparateCompartments ? "yes" : "no"}</Text></View>
          <View style={s.metaCell}><Text style={s.metaLabel}>Sprinklered to Spec 17</Text><Text>{yn(input.sprinkleredToSpec17)}</Text></View>
          <View style={s.metaCell}><Text style={s.metaLabel}>Open space (m)</Text><Text>{input.openSpaceAroundBuildingM ?? "—"}</Text></View>
          <View style={s.metaCell}><Text style={s.metaLabel}>Perimeter access ≥6 m / within 18 m</Text><Text>{yn(input.perimeterAccess6mWide)} / {yn(input.perimeterAccessWithin18m)}</Text></View>
        </View>

        <Text style={s.sectionTitle}>Building-level results</Text>
        {buildingLevel.map((r, i) => <ResultCard key={i} result={r} />)}

        {byCompartment.map(({ compartment, results: cr }) => (
          <View key={compartment.id}>
            <Text style={s.compartmentTitle}>Compartment: {compartment.name} ({compartment.floorAreaM2} m² / {compartment.volumeM3} m³)</Text>
            {cr.length === 0 ? <Text style={s.td}>No compartment-specific results.</Text> : cr.map((r, i) => <ResultCard key={i} result={r} />)}
          </View>
        ))}

        <View style={s.footer} fixed>
          <Text style={s.disclaimer}>{DISCLAIMER}</Text>
        </View>
        <Text style={s.pageNo} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </Page>
    </Document>
  );
}

/** Generate the report as a Blob (browser). */
export function generateReportBlob(project: ProjectState): Promise<Blob> {
  return pdf(<ComplianceReport project={project} />).toBlob();
}

/** Generate + trigger a download in the browser. */
export async function downloadReport(project: ProjectState): Promise<void> {
  const blob = await generateReportBlob(project);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.meta.projectName.replace(/[^\w.-]+/g, "_") || "ncc-section-c"}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
