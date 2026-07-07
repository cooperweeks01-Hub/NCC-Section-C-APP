import type { ReactNode } from "react";

/** Shared presentational bits used across the workflow steps. */
export function Intro({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-borg-charcoal">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-borg-slate">{text}</p>
    </div>
  );
}

export function Notice({ tone, children }: { tone: "ok" | "warn" | "muted"; children: ReactNode }) {
  const cls =
    tone === "ok"
      ? "border-status-complies/40 bg-status-complies/5 text-borg-charcoal"
      : tone === "warn"
      ? "border-borg-red/40 bg-borg-red/5 text-borg-charcoal"
      : "border-borg-line bg-borg-mist text-borg-slate";
  return <div className={`rounded border p-3 text-sm ${cls}`}>{children}</div>;
}
