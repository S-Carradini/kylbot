import { useEffect, useRef, useState, type ReactNode } from "react";
import { Send, Layers, MapPin, BookOpen, X, RotateCcw } from "lucide-react";
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
  /** True for a reply to a plain greeting — skip the trail/bullets/map-link UI for these. */
  isGreetingReply?: boolean;
};

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
  onOpenMap: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [input, setInput] = useState("");
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
      {/* Floating mascot — hidden when panel is open */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40"
          aria-label="Open Blue assistant"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bwi-pulse" />
            <div className="relative w-16 h-16 rounded-full bg-white shadow-[0_10px_30px_rgba(10,61,98,0.2)] border border-[color:var(--color-mist-blue)] flex items-center justify-center">
              <BlueMascot size={56} variant="character" />
            </div>
            <div className="absolute -top-2 -right-2 bg-[color:var(--color-cyan-glow)] text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">AI</div>
          </div>
        </button>
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
              <div key={m.id} className={`flex gap-2 min-w-0 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "blue" && (
                  <div className="w-8 h-8 rounded-full bg-white border border-[color:var(--color-mist-blue)] flex items-center justify-center shrink-0">
                    <BlueMascot size={28} variant="original" />
                  </div>
                )}
                <div className={`max-w-[80%] min-w-0 rounded-2xl px-3 py-2 text-sm break-words overflow-wrap-anywhere ${
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
                    <button onClick={onOpenMap} className="mt-2 text-[11px] text-[color:var(--color-deep-water)] underline underline-offset-2 hover:text-[color:var(--color-river-teal)]">
                      View on map →
                    </button>
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
