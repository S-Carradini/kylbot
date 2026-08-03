import { useEffect } from "react";
import { BlueChat } from "../components/BlueChat";
import { ARCGIS_MAP_URL } from "../components/MapView";

/**
 * Standalone route loaded inside the host page's iframe by waterbot-embed.js.
 * Renders just the floating chat widget — no map, no full site chrome — and
 * opens map links in a new tab since the host page owns navigation.
 */
export function WidgetPage() {
  useEffect(() => {
    document.documentElement.classList.add("wb-widget-mode");
    return () => document.documentElement.classList.remove("wb-widget-mode");
  }, []);

  return (
    <BlueChat
      embedded
      onLayersOn={() => {}}
      onFocusPlace={() => {}}
      onOpenMap={(url) => window.open(url || ARCGIS_MAP_URL, "_blank", "noopener,noreferrer")}
    />
  );
}
