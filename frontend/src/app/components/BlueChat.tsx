import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { BlueMascot } from "./BlueMascot";
import { BlueChatPanel } from "./BlueChatPanel";
import { LayerKey } from "./data";

export function BlueChat({
  onLayersOn,
  onFocusPlace,
  onOpenMap,
  embedded = false,
}: {
  onLayersOn: (l: LayerKey[]) => void;
  onFocusPlace: (id?: string) => void;
  onOpenMap: (url?: string) => void;
  /** Renders for the standalone /widget route (loaded in a host page's iframe
   *  via waterbot-embed.js): fills its container instead of pinning to the
   *  viewport, and reports size changes to the host via postMessage so it can
   *  resize the iframe to match. */
  embedded?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  // Lets the user enlarge the docked floating panel to read long answers more
  // comfortably. Only meaningful for the non-embedded floating-widget case —
  // the full-page /chat route and the embedded /widget iframe are already
  // sized by their context, so BlueChatPanel hides the toggle when this
  // isn't wired up (see WidgetPage/ChatPage, which don't pass it through).
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (open || hintDismissed) return;
    const t = setTimeout(() => setShowHint(true), 2000);
    return () => clearTimeout(t);
  }, [open, hintDismissed]);

  const widgetState: "mascot" | "nudge" | "expanded" = open
    ? "expanded"
    : showHint && !hintDismissed
      ? "nudge"
      : "mascot";

  // Only the closed (mascot/nudge) states are measured — their footprint is
  // driven by content (the "Ask Blue" label, the hint bubble) so a hardcoded
  // size in the host embed script would drift out of sync and clip content.
  // The expanded panel is a fixed chat-window footprint, not content-sized,
  // so the host applies its own (viewport-aware) size for that state.
  const closedRef = useRef<HTMLDivElement>(null);

  // The iframe can only ever be as wide as the host has *already* sized it to
  // — an element can't lay out wider than its own viewport. So when mascot
  // (~170px) flips to nudge (~240px), the hint bubble's first measurement
  // happens while the iframe is still mascot-width, gets wrapped to fit that
  // narrower box, and that cramped size is what gets reported — the iframe
  // then "confirms" it's correctly sized for content that's actually being
  // squeezed. Reserving nudge-sized room even while showing the mascot means
  // there's always enough width for the bubble to lay out unconstrained.
  const MIN_CLOSED_WIDTH = 260;
  const MIN_CLOSED_HEIGHT = 300;

  const sendResize = useCallback(() => {
    if (!embedded) return;
    if (open) {
      window.parent.postMessage({ type: "waterbot:resize", state: "expanded" }, "*");
      return;
    }
    const el = closedRef.current;
    if (!el) return;
    window.parent.postMessage(
      {
        type: "waterbot:resize",
        state: widgetState,
        width: Math.max(el.offsetWidth, MIN_CLOSED_WIDTH),
        height: Math.max(el.offsetHeight, MIN_CLOSED_HEIGHT),
      },
      "*"
    );
  }, [embedded, open, widgetState]);

  useLayoutEffect(() => {
    sendResize();
  }, [sendResize]);

  useEffect(() => {
    if (!embedded || open) return;
    const el = closedRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => sendResize());
    observer.observe(el);
    return () => observer.disconnect();
  }, [embedded, open, sendResize]);

  useEffect(() => {
    if (!embedded) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "waterbot:query-state") sendResize();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [embedded, sendResize]);

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

      {/* Floating mascot — hidden when panel is open.
          Embedded mode splits this into two layers: an outer box that fills
          the iframe and anchors content to the bottom-right corner (so the
          button doesn't jump as the iframe grows/shrinks), and an inner,
          naturally-sized box (closedRef) whose offsetWidth/offsetHeight are
          the widget's real, content-driven footprint — that's what gets
          reported to the host so it can size the iframe to match exactly. */}
      {!open && (
        <div
          className={
            embedded
              ? "w-full h-full flex items-end justify-end"
              : "fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3"
          }
        >
        <div
          ref={embedded ? closedRef : undefined}
          className={embedded ? "flex flex-col items-end gap-3 p-3" : "contents"}
        >

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
        </div>
      )}

      {/* Chat panel — flush to bottom-right edge.
          Kept mounted at all times (just hidden via display:none when closed)
          so BlueChatPanel's internal conversation state survives closing and
          reopening the widget — it should only reset when the user explicitly
          clicks Restart, not just from closing/reopening. */}
      <div
        className={embedded ? "w-full h-full bwi-card overflow-hidden" : "fixed bottom-6 right-6 z-40 bwi-card overflow-hidden"}
        style={{
          display: open ? undefined : "none",
          ...(embedded
            ? undefined
            : {
                width: expanded ? 580 : 380,
                height: expanded ? "calc(100vh - 3rem)" : 560,
                maxWidth: "calc(100vw - 3rem)",
                maxHeight: "calc(100vh - 3rem)",
                transition: "width 0.25s ease, height 0.25s ease",
              }),
        }}
      >
        <BlueChatPanel
          onLayersOn={onLayersOn}
          onFocusPlace={onFocusPlace}
          onOpenMap={onOpenMap}
          onClose={() => setOpen(false)}
          {...(!embedded ? { expanded, onToggleExpand: () => setExpanded((v) => !v) } : {})}
        />
      </div>
    </>
  );
}

export function ChatHint() {
  return null;
}