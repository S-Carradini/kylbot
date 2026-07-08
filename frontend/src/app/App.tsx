import { useState } from "react";
import { WebpageView } from "./components/WebpageView";
import { MapView } from "./components/MapView";
import { BlueChat } from "./components/BlueChat";
import { ExportModal, ShareModal, TourModal } from "./components/Modals";
import { LayerKey } from "./components/data";

export default function App() {
  const [view, setView] = useState<"home" | "map">("home");
  const [mapUrl, setMapUrl] = useState<string | undefined>(undefined);
  const openMap = (url?: string) => {
    setMapUrl(url);
    setView("map");
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
      {view === "home" ? (
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
      )}

      {/* Kept mounted (just hidden) while on the map screen so the conversation
          survives going Home instead of resetting — it only clears on Restart. */}
      <div style={{ display: view === "map" ? "none" : "contents" }}>
        <BlueChat
          onLayersOn={(l) => applyResult(l)}
          onFocusPlace={setFocusPlace}
          onOpenMap={openMap}
        />
      </div>

      <ShareModal open={share} onClose={() => setShare(false)} />
      <ExportModal open={exp} onClose={() => setExp(false)} />
      <TourModal open={tour} onClose={() => setTour(false)} />
    </div>
  );
}
