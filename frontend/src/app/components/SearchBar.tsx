import { Search, Sparkles, ArrowRight } from "lucide-react";
import { useState } from "react";

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask Blue anything about Arizona water…",
  size = "lg",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  placeholder?: string;
  size?: "lg" | "md";
}) {
  const [focused, setFocused] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
      className={`group flex items-center gap-2 bg-white border rounded-2xl transition-all ${
        focused
          ? "border-[color:var(--color-cyan-glow)] bwi-glow"
          : "border-[color:var(--color-soft-gray)] shadow-[0_4px_24px_rgba(10,61,98,0.08)]"
      } ${size === "lg" ? "px-4 py-3" : "px-3 py-2"}`}
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bwi-grad text-white shrink-0">
        <Sparkles className={size === "lg" ? "w-5 h-5" : "w-4 h-4"} strokeWidth={2.4} />
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={`flex-1 bg-transparent outline-none placeholder:text-[color:var(--color-slate-navy)]/40 ${
          size === "lg" ? "text-base" : "text-sm"
        }`}
      />
      <button
        type="submit"
        className="flex items-center gap-1.5 bwi-grad text-white px-4 py-2 rounded-xl hover:opacity-95 active:scale-[0.98] transition"
      >
        <Search className="w-4 h-4" />
        <span className={size === "lg" ? "text-sm" : "text-xs"}>Ask Blue</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
