import { LayerKey } from "./data";
import websiteScreenshot from "../../imports/azwaterblueprint-asu-edu-2026-06-11-11_54_05.png";

export function WebpageView({
  onOpenMap,
  onOpenTour,
  onApplyResult,
}: {
  onOpenMap: () => void;
  onOpenTour: () => void;
  onApplyResult: (layers: LayerKey[], focusPlace?: string) => void;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white">

      {/* ── Full-page website screenshot (scrollable background) ── */}
      <div className="w-full">
        <img
          src={websiteScreenshot}
          alt="Arizona Water Blueprint website"
          className="w-full block"
          style={{ display: "block", userSelect: "none", pointerEvents: "none" }}
        />
      </div>

    </div>
  );
}
