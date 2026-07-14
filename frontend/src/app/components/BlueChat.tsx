import { useEffect, useRef, useState, type ReactNode } from "react";
import { Send, Layers, MapPin, BookOpen, X, RotateCcw, Copy, Check, Download } from "lucide-react";
import { BlueMascot } from "./BlueMascot";
import { AgentResponse, LayerKey, answerQuery } from "./data";
import { AgentTrail } from "./AgentTrail";
import { askKylBot } from "../lib/api";

type Msg = {
  id: number;
  role: "user" | "blue";
  text: string;
  bullets?: string[];
  trail?: string[];
  topic?: string;
  /** True for a reply to a plain greeting — skip the trail/bullets/map-link UI for these. */
  isGreetingReply?: boolean;
};

const GROUNDWATER_DASHBOARD_URL = "https://asu.maps.arcgis.com/apps/dashboards/57696be87aac421f90ab2033807b7310";
const GROUNDWATER_MAP_URL = "https://experience.arcgis.com/experience/867a5e5600e64e5f9cee4ec34c88d16c";

function isGroundwaterTopic(topic?: string): boolean {
  return topic === "Groundwater" || topic === "Trends";
}

const GREETING_WORDS = new Set([
  "hi", "hello", "hey", "yo", "hiya", "howdy", "sup", "hola",
  "good morning", "good afternoon", "good evening", "greetings",
]);

function isGreetingOnly(text: string): boolean {
  const normalized = text.trim().toLowerCase().replace(/[!.?]+$/, "");
  return GREETING_WORDS.has(normalized);
}

// Matches Markdown links [Name](url) first, then falls back to bare URLs.
const LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)|(https?:\/\/[^\s)]+)/g;

function linkify(text: string, linkClassName: string) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  LINK_PATTERN.lastIndex = 0;
  while ((match = LINK_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<span key={`t-${key++}`}>{text.slice(lastIndex, match.index)}</span>);
    }
    const [, mdLabel, mdUrl, bareUrl] = match;
    const label = mdLabel ?? bareUrl;
    const href = mdUrl ?? bareUrl;
    nodes.push(
      <a key={`u-${key++}`} href={href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
        {label}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(<span key={`t-${key++}`}>{text.slice(lastIndex)}</span>);
  }
  return nodes;
}

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
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [input, setInput] = useState("");

  const copyMsg = (m: Msg) => {
    const lines = [m.text, ...(m.bullets ?? [])].join("\n• ");
    navigator.clipboard.writeText(lines);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const downloadTranscript = () => {
    const lines = msgs.map((m) => {
      const speaker = m.role === "user" ? "You" : "Blue";
      const body = [m.text, ...(m.bullets ?? []).map((b) => `  • ${b}`)].join("\n");
      return `[${speaker}]\n${body}`;
    });
    const text = `Arizona Water Blueprint — Blue Chat Transcript\n${"─".repeat(48)}\n\n${lines.join("\n\n")}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "blue-chat-transcript.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (open || hintDismissed) return;
    const t = setTimeout(() => setShowHint(true), 2000);
    return () => clearTimeout(t);
  }, [open, hintDismissed]);

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: 1,
      role: "blue",
      text: "Hi! I'm Blue, your guide to the Arizona Water Blueprint. I can help you understand water security, Active Management Areas, groundwater trends, Colorado River impacts, and more. What are you wondering about?",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  // Word-by-word reveal for the most recent Blue reply — easier to read than
  // having the full answer appear all at once. `pendingId` holds the reply
  // while the agent-trail animation plays, before word streaming begins.
  const [streamId, setStreamId] = useState<number | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [visibleWords, setVisibleWords] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll the newest message (or the typing indicator) into view at the top,
    // so long answers are read from the start instead of jumping to the bottom.
    const container = ref.current;
    if (!container) return;
    const last = container.lastElementChild;
    last?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [msgs, isTyping, open]);

  useEffect(() => {
    // As the word-by-word reveal grows the answer taller, keep following it
    // downward — otherwise the box stays put and the user has to manually
    // scroll to see text that's still being "typed" below the fold.
    if (streamId === null) return;
    const container = ref.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [visibleWords, streamId]);

  useEffect(() => {
    if (streamId === null) return;
    const streamingMsg = msgs.find((m) => m.id === streamId);
    if (!streamingMsg) return;
    const totalWords = streamingMsg.text.split(/\s+/).filter(Boolean).length;
    if (visibleWords >= totalWords) {
      setStreamId(null);
      return;
    }
    const timer = setTimeout(() => setVisibleWords((c) => c + 1), 110);
    return () => clearTimeout(timer);
  }, [streamId, visibleWords, msgs]);

  const ask = async (q: string, options?: { knownEnglish?: boolean; fresh?: boolean }) => {
    const userMsg: Msg = { id: Date.now(), role: "user", text: q };
    setMsgs((m) => [...m, userMsg]);
    setInput("");

    // Local lookup still drives map layer/place highlighting and quick bullets.
    const res: AgentResponse = answerQuery(q);
    if (res.layersOn) onLayersOn(res.layersOn);
    if (res.focusPlace !== undefined) onFocusPlace(res.focusPlace);

    setIsTyping(true);
    let text: string;
    let failed = false;
    try {
      // Quick-topic chips and suggestion bullets are our own fixed English text —
      // tell the backend explicitly instead of letting language auto-detection
      // misread a short phrase (e.g. "Casa Grande" reads as Spanish on its own).
      text = await askKylBot(q, options);
    } catch (err) {
      console.error("KYL backend request failed", err);
      text = "Sorry, I'm having trouble connecting right now. Please try asking again in a moment.";
      failed = true;
    } finally {
      setIsTyping(false);
    }

    const greeting = isGreetingOnly(q);
    const replyId = Date.now() + 1;
    setMsgs((m) => [
      ...m,
      {
        id: replyId,
        role: "blue",
        text,
        bullets: failed || greeting ? undefined : res.bullets,
        trail: failed || greeting ? undefined : res.trail,
        topic: failed || greeting ? undefined : res.topic,
        isGreetingReply: greeting,
      },
    ]);
    setVisibleWords(0);
    setPendingId(replyId);
    // Let the agent-trail animation (AgentTrail ticks every 220ms per step) finish
    // completely before the word-by-word text starts, instead of both running at once.
    const trailDuration = !greeting && res.trail ? res.trail.length * 220 + 300 : 0;
    setTimeout(() => {
      setPendingId(null);
      setStreamId(replyId);
    }, trailDuration);
  };

  const quick = [
    { label: "Water security", icon: BookOpen, q: "How secure is my water supply?" },
    { label: "Find my AMA", icon: MapPin, q: "Is my address within an Active Management Area?" },
    { label: "Colorado River", icon: Layers, q: "How will the Colorado River shortage impact me?" },
    { label: "Groundwater trends", icon: Layers, q: "How are AZ's groundwater levels trending?" },
  ];

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
        <div className="fixed bottom-6 right-6 z-40 w-[380px] max-w-[calc(100vw-3rem)] h-[560px] max-h-[calc(100vh-4rem)] bwi-card flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bwi-grad text-white px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
              <BlueMascot size={36} variant="original" />
            </div>
            <div className="flex-1">
              <div className="font-display text-sm font-semibold">Blue · Arizona Water Blueprint</div>
              <div className="text-[11px] text-white/70">Kyl Center for Water Policy</div>
            </div>
            <button
              onClick={downloadTranscript}
              className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
              title="Download transcript"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setConfirmRestart(true); }}
              className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
              title="Restart conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={() => { setOpen(false); setConfirmRestart(false); }} className="text-white/80 hover:text-white transition p-1 rounded-lg hover:bg-white/10" title="Close (keeps conversation)">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Restart confirmation banner */}
          {confirmRestart && (
            <div className="shrink-0 px-4 py-3 flex items-center gap-3 border-b border-[color:var(--color-soft-gray)]" style={{ background: "#fffbeb" }}>
              <div className="flex-1 text-xs text-[color:var(--color-slate-navy)]">
                <span className="font-semibold">Start over?</span> This will erase your conversation history.
              </div>
              <button
                onClick={() => {
                  setMsgs([{ id: 1, role: "blue", text: "Hi! I'm Blue, your guide to the Arizona Water Blueprint. I can help you understand water security, Active Management Areas, groundwater trends, Colorado River impacts, and more. What are you wondering about?" }]);
                  setInput("");
                  setConfirmRestart(false);
                }}
                className="shrink-0 text-xs px-3 py-1.5 rounded-lg text-white font-medium transition"
                style={{ background: "#e47e77" }}
              >
                Restart
              </button>
              <button
                onClick={() => setConfirmRestart(false)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-[color:var(--color-soft-gray)] text-[color:var(--color-slate-navy)] hover:bg-[color:var(--color-cloud-white)] transition"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Messages */}
          <div ref={ref} className="flex-1 overflow-y-auto overflow-x-hidden bwi-scroll px-4 py-3 space-y-3 bg-[color:var(--color-cloud-white)]">
            {msgs.map((m) => (
              <div key={m.id} className={`flex gap-2 min-w-0 group ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "blue" && (
                  <div className="w-8 h-8 rounded-full bg-white border border-[color:var(--color-mist-blue)] flex items-center justify-center shrink-0">
                    <BlueMascot size={28} variant="original" />
                  </div>
                )}
                <div className="flex flex-col gap-1 max-w-[80%] min-w-0">
                <div className={`min-w-0 rounded-2xl px-3 py-2 text-sm break-words overflow-wrap-anywhere ${
                  m.role === "user"
                    ? "bwi-grad text-white rounded-br-sm"
                    : "bg-white border border-[color:var(--color-soft-gray)] text-[color:var(--color-slate-navy)] rounded-bl-sm"
                }`}>
                  {m.trail && (
                    <div className="mb-2 -mx-1">
                      <AgentTrail steps={m.trail} runKey={m.id} />
                    </div>
                  )}
                  <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                    {linkify(
                      m.id === pendingId
                        ? ""
                        : m.id === streamId
                        ? m.text.split(/\s+/).filter(Boolean).slice(0, visibleWords).join(" ")
                        : m.text,
                      m.role === "user"
                        ? "underline underline-offset-2 text-white"
                        : "underline underline-offset-2 text-[color:var(--color-deep-water)] hover:text-[color:var(--color-river-teal)]"
                    )}
                  </div>
                  {m.bullets && m.id !== streamId && m.id !== pendingId && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.bullets.map((b, i) => (
                        <button
                          key={i}
                          onClick={() => ask(b, { knownEnglish: true })}
                          title={b}
                          className="max-w-full text-[11px] leading-snug text-left px-2.5 py-1 rounded-full bg-[color:var(--color-mist-blue)]/40 border border-[color:var(--color-mist-blue)] text-[color:var(--color-deep-water)] hover:bg-[color:var(--color-mist-blue)] transition truncate"
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  )}
                  {m.role === "blue" && m.id !== 1 && !m.isGreetingReply && m.id !== streamId && m.id !== pendingId && (
                    <div className="mt-2 flex flex-col items-start gap-1">
                      <button
                        onClick={() => onOpenMap(isGroundwaterTopic(m.topic) ? GROUNDWATER_MAP_URL : undefined)}
                        className="text-[11px] text-[color:var(--color-deep-water)] underline underline-offset-2 hover:text-[color:var(--color-river-teal)]"
                      >
                        View on map →
                      </button>
                      {isGroundwaterTopic(m.topic) && (
                        <a
                          href={GROUNDWATER_DASHBOARD_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[color:var(--color-deep-water)] underline underline-offset-2 hover:text-[color:var(--color-river-teal)]"
                        >
                          View groundwater dashboard →
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {m.id !== streamId && m.id !== pendingId && (
                  <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <button
                      onClick={() => copyMsg(m)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-[color:var(--color-soft-gray)] bg-white text-[color:var(--color-slate-navy)]/60 hover:text-[color:var(--color-deep-water)] hover:border-[color:var(--color-cyan-glow)]"
                      title="Copy to clipboard"
                    >
                      {copiedId === m.id
                        ? <><Check className="w-3 h-3 text-[color:var(--color-river-teal)]" /> Copied</>
                        : <><Copy className="w-3 h-3" /> Copy</>
                      }
                    </button>
                  </div>
                )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white border border-[color:var(--color-mist-blue)] flex items-center justify-center shrink-0">
                  <BlueMascot size={28} variant="original" />
                </div>
                <div className="rounded-2xl rounded-bl-sm px-3 py-2.5 bg-white border border-[color:var(--color-soft-gray)] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-mist-blue)] bwi-pulse-dot" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-mist-blue)] bwi-pulse-dot" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-mist-blue)] bwi-pulse-dot" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {/* Chips + input */}
          <div className="border-t border-[color:var(--color-soft-gray)] bg-white">
            <div className="px-3 pt-2.5 pb-1 flex flex-wrap gap-1.5">
              {quick.map((q) => (
                <button
                  key={q.label}
                  onClick={() => ask(q.q, { knownEnglish: true, fresh: true })}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[color:var(--color-mist-blue)]/50 border border-[color:var(--color-mist-blue)] text-[color:var(--color-deep-water)] hover:bg-[color:var(--color-mist-blue)] transition"
                >
                  <q.icon className="w-3 h-3" /> {q.label}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); if (input.trim()) ask(input.trim()); }}
              className="flex items-center gap-2 px-3 py-2.5"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Arizona water…"
                className="flex-1 px-3 py-2 rounded-xl border border-[color:var(--color-soft-gray)] text-sm outline-none focus:border-[color:var(--color-cyan-glow)] transition"
              />
              <button type="submit" className="w-9 h-9 rounded-xl bwi-grad text-white flex items-center justify-center shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function ChatHint() {
  return null;
}
