import { Check } from "lucide-react";
import { useEffect, useState } from "react";

export function AgentTrail({ steps, runKey }: { steps: string[]; runKey: string | number }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    setActive(0);
    const ids: number[] = [];
    steps.forEach((_, i) => {
      ids.push(window.setTimeout(() => setActive(i + 1), 220 * (i + 1)));
    });
    return () => ids.forEach(clearTimeout);
  }, [runKey, steps.length]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => {
        const done = i < active;
        const live = i === active;
        return (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${
                done
                  ? "bg-[color:var(--color-cyan-glow)]/15 border-[color:var(--color-river-teal)]/40 text-[color:var(--color-deep-water)]"
                  : live
                  ? "bg-white border-[color:var(--color-cyan-glow)] text-[color:var(--color-deep-water)] shadow-[0_0_0_3px_rgba(62,193,211,0.18)]"
                  : "bg-white/60 border-[color:var(--color-soft-gray)] text-[color:var(--color-slate-navy)]/50"
              }`}
            >
              {done ? (
                <Check className="w-3 h-3" strokeWidth={3} />
              ) : live ? (
                <span className="w-2 h-2 rounded-full bg-[color:var(--color-cyan-glow)] animate-pulse" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-[color:var(--color-soft-gray)]" />
              )}
              <span>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <span className={`text-xs ${i < active ? "text-[color:var(--color-river-teal)]" : "text-[color:var(--color-soft-gray)]"}`}>→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
