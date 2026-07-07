import { useId, useState } from "react";
import type { ReactNode } from "react";

/**
 * Small, consistent form primitives (Borg tokens). Dense but legible, per the
 * brief's "reads like a compliance document" direction.
 */

export function Field({ label, hint, info, children }: { label: string; hint?: string; info?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-borg-slate">{label}</span>
      {hint && <span className="ml-1 text-[11px] text-borg-slate/70">· {hint}</span>}
      {info}
      <div className="mt-1">{children}</div>
    </label>
  );
}

/**
 * Dependency-free, accessible info affordance: a small "i" icon that reveals a
 * short help bubble on hover AND keyboard focus. `title` is kept as a native
 * fallback, and the bubble is wired to the trigger via aria-describedby.
 */
export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative ml-1 inline-block align-middle">
      <button
        type="button"
        aria-label="More information"
        aria-describedby={open ? id : undefined}
        title={text}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-borg-slate outline-none hover:text-borg-charcoal focus-visible:ring-2 focus-visible:ring-borg-red"
      >
        <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
          />
        </svg>
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute left-1/2 top-full z-20 mt-2 w-72 max-w-[18rem] -translate-x-1/2 rounded border border-borg-line bg-white p-2 text-left text-[11px] font-normal leading-snug text-borg-charcoal shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
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
