import { useEffect } from "react";
import { BlueChat } from "../components/BlueChat";
import { ARCGIS_MAP_URL } from "../components/MapView";

/**
 * Standalone route loaded inside the host page's iframe by waterbot-embed.js.
 * Renders just the floating chat widget — no map, no full site chrome. Map
 * links are relayed to the host page via postMessage (waterbot:open) rather
 * than opened directly with window.open() here — a window.open() call made
 * from inside this cross-origin iframe gets silently canceled by some
 * ad/content-blocker rules that key off the request's initiator being
 * cross-origin from the top-level page; relaying to the host's own script
 * makes the resulting navigation indistinguishable from a normal same-page
 * click.
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
      onOpenMap={(url) => window.parent.postMessage({ type: "waterbot:open", url: url || ARCGIS_MAP_URL }, "*")}
    />
  );
}
