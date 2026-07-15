import { useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router";
import { WebpageView } from "./components/WebpageView";
import { MapView } from "./components/MapView";
import { BlueChat } from "./components/BlueChat";
import { ChatPage } from "./pages/ChatPage";
import { ExportModal, ShareModal, TourModal } from "./components/Modals";
import { LayerKey } from "./components/data";

export default function App() {
  const [view, setView] = useState<"home" | "map">("home");
  const [mapUrl, setMapUrl] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  const location = useLocation();
  const openMap = (url?: string) => {
    setMapUrl(url);
    setView("map");
    // "View on map" can be triggered from the full-screen /chat page — bring the
    // user back to the home route where the map view actually lives.
    if (location.pathname !== "/") navigate("/");
  };
  const [layers, setLayers] = useState<Set<LayerKey>>(new Set(["ama", "cap"]));
  const [focusPlace, setFocusPlace] = useState<string | undefined>(undefined);
  const [share, setShare] = useState(false);
  const [exp, setExp] = useState(false);
  const [tour, setTour] = useState(false);

  const applyResult = (l: LayerKey[], place?: string) => {
    const s = new Set(layers);
    l.forEach((k) => s.add(k));
    setLayers(s);
    if (place !== undefined) setFocusPlace(place);
  };

  return (
    <div className="size-full">
      <Routes>
        <Route
          path="/"
          element={
            view === "home" ? (
              <WebpageView
                onOpenMap={() => openMap()}
                onOpenTour={() => setTour(true)}
                onApplyResult={applyResult}
              />
            ) : (
              <MapView
                onBack={() => setView("home")}
                layers={layers}
                setLayers={setLayers}
                focusPlace={focusPlace}
                setFocusPlace={setFocusPlace}
                onShare={() => setShare(true)}
                onExport={() => setExp(true)}
                onTour={() => setTour(true)}
                mapUrl={mapUrl}
              />
            )
          }
        />
        <Route
          path="/chat"
          element={
            <ChatPage
              onLayersOn={(l) => applyResult(l)}
              onFocusPlace={setFocusPlace}
              onOpenMap={openMap}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* The floating widget only makes sense on the home/map route — the /chat
          route has its own full-screen chat UI. Kept mounted (just hidden) while
          on the map screen so the conversation survives going Home instead of
          resetting — it only clears on Restart. */}
      {location.pathname !== "/chat" && (
        <div style={{ display: view === "map" ? "none" : "contents" }}>
          <BlueChat
            onLayersOn={(l) => applyResult(l)}
            onFocusPlace={setFocusPlace}
            onOpenMap={openMap}
          />
        </div>
      )}

      <ShareModal open={share} onClose={() => setShare(false)} />
      <ExportModal open={exp} onClose={() => setExp(false)} />
      <TourModal open={tour} onClose={() => setTour(false)} />
    </div>
  );
}
