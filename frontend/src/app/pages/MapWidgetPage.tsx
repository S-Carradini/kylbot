import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Home, ChevronRight, ChevronLeft } from "lucide-react";
import { BlueMascot } from "../components/BlueMascot";
import { BlueChatPanel } from "../components/BlueChatPanel";

/**
 * Standalone route loaded inside the host page's iframe by
 * map-waterbot-embed.js. Meant to sit on top of a map that already exists on
 * the host page (e.g. an ArcGIS Experience embed) — this widget renders no
 * map of its own, just the pill (matching MapView's own Home/Ask Blue
 * control) and, when opened, the same real backend-connected BlueChatPanel
 * docked as a full-height sidebar.
 *
 * The host iframe spans the full page height (see map-waterbot-embed.js) so
 * the pill can stay vertically centered regardless of where on the page it
 * sits; only its width changes between collapsed and open.
 */
export function MapWidgetPage() {
  useEffect(() => {
    document.documentElement.classList.add("wb-widget-mode");
    return () => document.documentElement.classList.remove("wb-widget-mode");
  }, []);

  const [open, setOpen] = useState(true);
  const pillRef = useRef<HTMLDivElement>(null);
  const PANEL_WIDTH = 360;
  const GAP = 12;

  // The panel is pinned to the right edge via justify-end, so while the
  // iframe is still collapsed-width, the 360px panel overflows *leftward*
  // (negative X) past the container. scrollWidth only picks up overflow in
  // the positive/right direction for LTR pages, so it silently misses that
  // — measuring the flex row's scrollWidth after opening reports the old,
  // pre-open width instead of the true expanded size. Sidestep it entirely:
  // the pill is measured in isolation (safe — it never overflows), and the
  // expanded width is just arithmetic from there, since the panel width is
  // a fixed constant.
  const sendResize = useCallback(() => {
    const pillWidth = pillRef.current?.offsetWidth ?? 0;
    const width = open ? PANEL_WIDTH + GAP + pillWidth : pillWidth;
    window.parent.postMessage(
      { type: "waterbot:resize", state: open ? "expanded" : "collapsed", width },
      "*"
    );
  }, [open]);

  useLayoutEffect(() => {
    sendResize();
  }, [sendResize]);

  useEffect(() => {
    const el = pillRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => sendResize());
    observer.observe(el);
    return () => observer.disconnect();
  }, [sendResize]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "waterbot:query-state") sendResize();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [sendResize]);

  return (
    <div className="h-full w-full flex items-stretch justify-end">
      {/* Pill sits at the panel's left edge (like a handle at the map/panel
          boundary in the main app), with the panel flush against the true
          right edge — not the other way around. */}
      <div ref={pillRef} className="flex items-center pl-1" style={{ paddingRight: GAP }}>
        <div className="flex items-stretch rounded-xl overflow-hidden shadow-lg border border-[color:var(--color-mist-blue)] bg-white/95">
          {/* Home — this widget doesn't control the host's own map, so this
              just opens the full Arizona Water Blueprint site in a new tab. */}
          <a
            href={window.location.origin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 hover:bg-[color:var(--color-mist-blue)]/40 transition border-r border-[color:var(--color-soft-gray)]"
            title="Open the Arizona Water Blueprint"
            onClick={(e) => {
              e.preventDefault();
              window.parent.postMessage({ type: "waterbot:open", url: window.location.origin }, "*");
            }}
          >
            <Home className="w-4 h-4 text-[color:var(--color-deep-water)]" />
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2.5 hover:bg-[color:var(--color-mist-blue)]/40 transition text-xs font-medium text-[color:var(--color-deep-water)] whitespace-nowrap"
          >
            <BlueMascot size={20} variant="original" />
            {open ? "Hide Blue" : "Ask Blue"}
            {open ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="shrink-0 h-full flex flex-col bwi-card overflow-hidden"
          style={{ width: PANEL_WIDTH }}
        >
          <BlueChatPanel
            onLayersOn={() => {}}
            onFocusPlace={() => {}}
            onOpenMap={(url) => window.parent.postMessage({ type: "waterbot:open", url }, "*")}
            onClose={() => setOpen(false)}
            closeTitle="Hide chat panel"
            embedded
          />
        </div>
      )}
    </div>
  );
}
