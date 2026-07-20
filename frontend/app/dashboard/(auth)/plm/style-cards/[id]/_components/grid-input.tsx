"use client";

import { cn } from "@/lib/utils";

export const uid = () => Math.random().toString(36).slice(2, 10);
export const num = (v: any) => (v === null || v === undefined || v === "" ? 0 : Number(v));
export const fmt2 = (n: number) => (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function GridInput({
  value,
  onChange,
  align = "left",
  type = "text",
}: {
  value: string | number;
  onChange: (v: string) => void;
  align?: "left" | "right";
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-7 w-full min-w-0 bg-transparent text-xs px-1.5 outline-none rounded focus:bg-accent/50",
        align === "right" && "text-right font-mono"
      )}
    />
  );
}

export function GridCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-center h-7">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-3.5 w-3.5" />
    </div>
  );
}
