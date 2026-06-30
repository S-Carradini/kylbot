import { X, Download, Share2, Map as MapIcon, Check } from "lucide-react";
import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[color:var(--color-slate-navy)]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bwi-card w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-[color:var(--color-deep-water)]" style={{ fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[color:var(--color-soft-gray)] flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-sm text-[color:var(--color-slate-navy)]/80 space-y-3">{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export current view"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[color:var(--color-soft-gray)] text-sm">Cancel</button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bwi-grad text-white text-sm flex items-center gap-1.5">
            <Download className="w-4 h-4" /> Export
          </button>
        </>
      }
    >
      <p>Export the current Arizona Water Blueprint view, including active layers and Blue's last summary.</p>
      <div className="grid grid-cols-3 gap-2">
        {["PNG image", "PDF brief", "GeoJSON"].map((f) => (
          <button key={f} className="rounded-lg border border-[color:var(--color-soft-gray)] p-3 text-xs hover:border-[color:var(--color-cyan-glow)] hover:bg-[color:var(--color-mist-blue)]/40">
            {f}
          </button>
        ))}
      </div>
      <div className="text-xs text-[color:var(--color-slate-navy)]/60 italic">Synthetic demo data only.</div>
    </Modal>
  );
}

export function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const link = "https://demo.azwaterblueprint.org/share/blue-7f3a";
  return (
    <Modal open={open} onClose={onClose} title="Share this view">
      <p>Anyone with this link can view the current map state and Blue's summary.</p>
      <div className="flex items-center gap-2">
        <input readOnly value={link} className="flex-1 bg-[color:var(--color-mist-blue)]/40 rounded-lg px-3 py-2 text-sm border border-[color:var(--color-soft-gray)]" />
        <button onClick={() => navigator.clipboard?.writeText(link)} className="px-3 py-2 rounded-lg bwi-grad text-white text-sm flex items-center gap-1.5">
          <Share2 className="w-4 h-4" /> Copy
        </button>
      </div>
      <div className="flex gap-2">
        {["Email", "Slack", "Teams"].map((c) => (
          <span key={c} className="text-xs px-2 py-1 rounded-full bg-[color:var(--color-mist-blue)]/50 border border-[color:var(--color-soft-gray)]">{c}</span>
        ))}
      </div>
    </Modal>
  );
}

export function TourModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const steps = [
    { t: "Ask Blue anything", d: "Type a natural-language question into the search bar — Blue will route, summarize, and update the map." },
    { t: "Toggle authoritative layers", d: "Turn AMAs, basins, providers, CAP, drought, and infrastructure on or off in the left panel." },
    { t: "Open Blue's drawer", d: "Get plain-language explanations and quick actions tied to what you see on the map." },
    { t: "Share or export", d: "Generate an executive-ready PNG, PDF, or GeoJSON with one click." },
  ];
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Guided tour"
      footer={<button onClick={onClose} className="px-4 py-2 rounded-lg bwi-grad text-white text-sm">Got it</button>}
    >
      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={s.t} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bwi-grad text-white flex items-center justify-center text-xs font-semibold shrink-0">{i + 1}</div>
            <div>
              <div className="font-semibold text-[color:var(--color-deep-water)]">{s.t}</div>
              <div className="text-[color:var(--color-slate-navy)]/70 text-sm">{s.d}</div>
            </div>
          </div>
        ))}
        <div className="text-xs text-[color:var(--color-slate-navy)]/60 italic flex items-center gap-1.5">
          <Check className="w-3 h-3" /> All visible data is synthetic demo data — not legal, regulatory, health, or engineering determinations.
        </div>
      </div>
    </Modal>
  );
}

export function OpenInMapBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 bwi-grad text-white px-4 py-2 rounded-xl text-sm hover:opacity-95">
      <MapIcon className="w-4 h-4" /> Open in Map
    </button>
  );
}
