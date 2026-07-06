import type { ReactNode } from "react";

/**
 * Small, consistent form primitives (Borg tokens). Dense but legible, per the
 * brief's "reads like a compliance document" direction.
 */

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-borg-slate">{label}</span>
      {hint && <span className="ml-1 text-[11px] text-borg-slate/70">· {hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded border border-borg-line bg-white px-2 py-1.5 text-sm text-borg-charcoal outline-none focus:border-borg-red";

export function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input className={inputClass} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function NumberInput({ value, onChange, min, step }: { value: number | null; onChange: (v: number | null) => void; min?: number; step?: number }) {
  return (
    <input
      type="number"
      className={inputClass}
      value={value ?? ""}
      min={min}
      step={step ?? "any"}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    />
  );
}

export function Select<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded border border-borg-line">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`px-3 py-1.5 text-sm ${active ? "bg-borg-red text-white" : "bg-white text-borg-charcoal hover:bg-borg-mist"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Tri-state control for `boolean | null` inputs asked at a decision point. */
export function TriToggle({ value, onChange, yes = "Yes", no = "No" }: { value: boolean | null; onChange: (v: boolean | null) => void; yes?: string; no?: string }) {
  const opts: { value: string; label: string }[] = [
    { value: "null", label: "Not answered" },
    { value: "true", label: yes },
    { value: "false", label: no },
  ];
  const current = value === null ? "null" : value ? "true" : "false";
  return (
    <Segmented
      value={current}
      options={opts}
      onChange={(v) => onChange(v === "null" ? null : v === "true")}
    />
  );
}

export function Button({ children, onClick, variant = "secondary", type = "button" }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost"; type?: "button" | "submit" }) {
  const cls =
    variant === "primary"
      ? "bg-borg-red text-white hover:opacity-90"
      : variant === "ghost"
      ? "bg-transparent text-borg-slate hover:bg-borg-mist"
      : "bg-white text-borg-charcoal border border-borg-line hover:bg-borg-mist";
  return (
    <button type={type} onClick={onClick} className={`rounded px-3 py-1.5 text-sm font-medium ${cls}`}>
      {children}
    </button>
  );
}
