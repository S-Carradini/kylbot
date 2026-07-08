import { useEffect, useRef, useState } from "react";
import { Send, Home, ChevronRight, ChevronLeft } from "lucide-react";
import { BlueMascot } from "./BlueMascot";
import { AgentTrail } from "./AgentTrail";
import { LayerKey, AgentResponse, answerQuery, EXAMPLE_QUESTIONS } from "./data";

const ARCGIS_MAP_URL = "https://experience.arcgis.com/experience/71bc84edbbf9424f9ceb2116acc6bf5a"; // main map

type Msg = {
  id: number;
  role: "user" | "blue";
  text: string;
  bullets?: string[];
  trail?: string[];
};

export function MapView({
  onBack,
  layers,
  setLayers,
  focusPlace,
  setFocusPlace,
  onShare,
  onExport,
  onTour,
  initialResult,
}: {
  onBack: () => void;
  layers: Set<LayerKey>;
  setLayers: (s: Set<LayerKey>) => void;
  focusPlace?: string;
  setFocusPlace: (id?: string) => void;
  onShare: () => void;
  onExport: () => void;
  onTour: () => void;
  initialResult?: AgentResponse | null;
}) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: 1,
      role: "blue",
      text: "Hi! I'm Blue. Ask me anything about this map — water security, AMAs, groundwater trends, the Colorado River shortage, and more.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 1e6, behavior: "smooth" });
  }, [msgs]);

  const ask = (q: string) => {
    setMsgs((m) => [...m, { id: Date.now(), role: "user", text: q }]);
    const res: AgentResponse = answerQuery(q);
    setTimeout(() => {
      setMsgs((m) => [
        ...m,
        { id: Date.now() + 1, role: "blue", text: res.summary, bullets: res.bullets, trail: res.trail },
      ]);
      if (res.layersOn) {
        const s = new Set(layers);
        res.layersOn.forEach((l) => s.add(l));
        setLayers(s);
      }
      if (res.focusPlace !== undefined) setFocusPlace(res.focusPlace);
    }, 350);
    setInput("");
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden">

      {/* Live ArcGIS map — grows/shrinks as panel toggles */}
      <div className="flex-1 min-w-0 relative">
        <iframe
          src={ARCGIS_MAP_URL}
          title="Arizona Water Blueprint ArcGIS Map"
          className="w-full h-full"
          style={{ border: "none", display: "block" }}
          allowFullScreen
        />

        {/* Single pill button — right edge, vertically centered */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          <div className="flex items-stretch rounded-xl overflow-hidden shadow-lg border border-[color:var(--color-mist-blue)] bg-white/95">
            {/* Home zone */}
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 hover:bg-[color:var(--color-mist-blue)]/40 transition border-r border-[color:var(--color-soft-gray)]"
              title="Back to homepage"
            >
              <Home className="w-4 h-4 text-[color:var(--color-deep-water)]" />
            </button>
            {/* Ask Blue / Hide Blue zone */}
            <button
              onClick={() => setPanelOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2.5 hover:bg-[color:var(--color-mist-blue)]/40 transition text-xs font-medium text-[color:var(--color-deep-water)]"
            >
              <BlueMascot size={20} variant="original" />
              {panelOpen ? "Hide Blue" : "Ask Blue"}
              {panelOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Embedded chat panel — only rendered when open */}
      {panelOpen && (
        <div
          className="w-[360px] shrink-0 flex flex-col border-l border-[color:var(--color-soft-gray)] bg-white"
        >
          {/* Panel header */}
          <div className="px-4 py-3 flex items-center gap-3 shrink-0 bwi-grad">
            <div className="bwi-float">
              <BlueMascot size={38} variant="original" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm text-white">Blue</div>
              <div className="text-[11px] text-white/65">
                Arizona Water Blueprint assistant
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto bwi-scroll px-3 py-3 space-y-3"
            style={{ background: "var(--color-cloud-white)" }}
          >
            {msgs.map((m) => (
              <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "blue" && (
                  <div className="w-7 h-7 rounded-full bg-white border border-[color:var(--color-mist-blue)] flex items-center justify-center shrink-0 mt-0.5">
                    <BlueMascot size={24} variant="original" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bwi-grad text-white rounded-br-sm"
                      : "bg-white border border-[color:var(--color-soft-gray)] text-[color:var(--color-slate-navy)] rounded-bl-sm"
                  }`}
                >
                  {m.trail && (
                    <div className="mb-2">
                      <AgentTrail steps={m.trail} runKey={m.id} />
                    </div>
                  )}
                  <div>{m.text}</div>
                  {m.bullets && (
                    <ul className="mt-2 space-y-1 text-[12px] text-[color:var(--color-slate-navy)]/85">
                      {m.bullets.map((b, i) => (
                        <li key={i} className="flex gap-1.5">
                          <span className="text-[color:var(--color-cyan-glow)] shrink-0">•</span>{b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick chips */}
          <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5 shrink-0 border-t border-[color:var(--color-soft-gray)]">
            {EXAMPLE_QUESTIONS.slice(0, 4).map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-[color:var(--color-mist-blue)]/50 border border-[color:var(--color-mist-blue)] text-[color:var(--color-deep-water)] hover:bg-[color:var(--color-mist-blue)] transition"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); if (input.trim()) ask(input.trim()); }}
            className="px-3 py-3 flex items-center gap-2 shrink-0"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Arizona water…"
              className="flex-1 px-3 py-2 rounded-xl border border-[color:var(--color-soft-gray)] text-sm outline-none focus:border-[color:var(--color-cyan-glow)] transition"
            />
            <button
              type="submit"
              className="w-9 h-9 rounded-xl bwi-grad text-white flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
