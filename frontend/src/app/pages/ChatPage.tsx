import { useNavigate } from "react-router";
import { BlueChatPanel } from "../components/BlueChatPanel";
import { LayerKey } from "../components/data";

export function ChatPage({
  onLayersOn,
  onFocusPlace,
  onOpenMap,
}: {
  onLayersOn: (l: LayerKey[]) => void;
  onFocusPlace: (id?: string) => void;
  onOpenMap: (url?: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-40 bg-white">
      <BlueChatPanel
        onLayersOn={onLayersOn}
        onFocusPlace={onFocusPlace}
        onOpenMap={onOpenMap}
        onClose={() => navigate("/chat")}
        closeTitle="Back to site"
        fullScreen
      />
    </div>
  );
}