import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { BlueMascot } from "./BlueMascot";
import { BlueChatPanel } from "./BlueChatPanel";
import { LayerKey } from "./data";

export function BlueChat({
  onLayersOn,
  onFocusPlace,
  onOpenMap,
}: {
  onLayersOn: (l: LayerKey[]) => void;
  onFocusPlace: (id?: string) => void;
  onOpenMap: (url?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);

  useEffect(() => {
    if (open || hintDismissed) return;
    const t = setTimeout(() => setShowHint(true), 2000);
    return () => clearTimeout(t);
  }, [open, hintDismissed]);

  return (
    <>
      {/* Keyframe styles for the floating mascot button */}
      <style>{`
        @keyframes blueRing1 {
          0%   { transform: scale(1);   opacity: 0.55; }
          100% { transform: scale(2.1); opacity: 0; }
        }
        @keyframes blueRing2 {
          0%   { transform: scale(1);   opacity: 0.4; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes blueRing3 {
          0%   { transform: scale(1);   opacity: 0.25; }
          100% { transform: scale(3.1); opacity: 0; }
        }
        @keyframes blueBob {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes badgeGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(62,193,211,0.7); }
          50%       { box-shadow: 0 0 0 6px rgba(62,193,211,0); }
        }
        @keyframes hintSlide {
          0%   { opacity: 0; transform: translateX(12px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes labelPop {
          0%   { opacity: 0; transform: translateY(6px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .blue-bob { animation: blueBob 2.8s ease-in-out infinite; }
        .blue-ring-1 { animation: blueRing1 2s ease-out infinite; }
        .blue-ring-2 { animation: blueRing2 2s ease-out infinite 0.5s; }
        .blue-ring-3 { animation: blueRing3 2s ease-out infinite 1s; }
        .blue-badge  { animation: badgeGlow 1.8s ease-in-out infinite; }
        .blue-hint   { animation: hintSlide 0.3s ease-out forwards; }
        .blue-label  { animation: labelPop 0.4s ease-out forwards; }
        .blue-btn:hover .blue-bob { animation-play-state: paused; }
      `}</style>

      {/* Floating mascot — hidden when panel is open */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">

          {/* Speech bubble hint */}
          {showHint && !hintDismissed && (
            <div className="blue-hint flex items-start gap-2 bg-white rounded-2xl rounded-br-sm px-4 py-3 shadow-[0_8px_32px_rgba(10,61,98,0.18)] border border-[color:var(--color-mist-blue)] max-w-[220px]">
              <div className="flex-1">
                <p className="text-xs font-semibold text-[color:var(--color-deep-water)] leading-snug">
                  👋 Hi, I'm Blue!
                </p>
                <p className="text-[11px] text-[color:var(--color-slate-navy)]/75 mt-0.5 leading-snug">
                  Ask me anything about Arizona water.
                </p>
                <button
                  onClick={() => setOpen(true)}
                  className="mt-2 text-[11px] font-semibold text-[color:var(--color-river-teal)] hover:text-[color:var(--color-deep-water)] transition"
                >
                  Get started →
                </button>
              </div>
              <button
                onClick={() => { setShowHint(false); setHintDismissed(true); }}
                className="text-[color:var(--color-slate-navy)]/30 hover:text-[color:var(--color-slate-navy)]/60 mt-0.5 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* "Ask Blue" label */}
          {!showHint && (
            <div className="blue-label bg-[color:var(--color-deep-water)] text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-md">
              Ask Blue
            </div>
          )}

          {/* Main button */}
          <button
            onClick={() => { setOpen(true); setShowHint(false); }}
            className="blue-btn relative flex items-center justify-center"
            aria-label="Open Blue assistant"
            style={{ width: 104, height: 104 }}
          >
            {/* Triple pulse rings */}
            <span className="blue-ring-1 absolute inset-0 rounded-full bg-[color:var(--color-cyan-glow)]/40 pointer-events-none" />
            <span className="blue-ring-2 absolute inset-0 rounded-full bg-[color:var(--color-cyan-glow)]/25 pointer-events-none" />
            <span className="blue-ring-3 absolute inset-0 rounded-full bg-[color:var(--color-cyan-glow)]/15 pointer-events-none" />

            {/* Button face — prominent circle with gradient ring */}
            <div
              className="relative w-[104px] h-[104px] rounded-full flex items-center justify-center hover:scale-105 transition-transform duration-200 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #e8f8fb 0%, #c8eff5 100%)",
                boxShadow: "0 16px 48px rgba(10,61,98,0.35), 0 0 0 4px rgba(62,193,211,0.55), 0 0 0 8px rgba(62,193,211,0.18)",
              }}
            >
              <div className="blue-bob">
                <BlueMascot size={86} variant="character" />
              </div>
            </div>

            {/* Glowing AI badge */}
            <div className="blue-badge absolute top-0 right-0 bwi-grad text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              AI
            </div>
          </button>
        </div>
      )}

      {/* Chat panel — flush to bottom-right edge */}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 w-[380px] max-w-[calc(100vw-3rem)] h-[560px] max-h-[calc(100vh-4rem)] bwi-card overflow-hidden">
          <BlueChatPanel
            onLayersOn={onLayersOn}
            onFocusPlace={onFocusPlace}
            onOpenMap={onOpenMap}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
}

export function ChatHint() {
  return null;
}