import json
import re
import pathlib

_STOPWORDS = {
    "the", "a", "an", "is", "are", "of", "in", "on", "for", "to", "and", "or",
    "what", "how", "why", "when", "where", "do", "does", "my", "i", "me",
    "about", "with", "can", "you", "tell",
}

# These are already surfaced via their own dedicated "View on map" / "View groundwater
# dashboard" buttons in the chat UI — excluded here so the AI doesn't cite them again
# in its answer text, which would just repeat the same link the buttons already offer.
_EXCLUDED_FROM_KNOWLEDGE = {
    "Groundwater Level Change Map (changes in Arizona sub-basins)",
    "Arizona Groundwater Dashboard",
}


def _tokenize(text: str) -> set[str]:
    words = re.findall(r"[a-zA-Z']+", (text or "").lower())
    return {w for w in words if w not in _STOPWORDS and len(w) > 2}


class ResourceIndex:
    """Simple keyword-overlap search over the KYL Resource List (no vector DB)."""

    def __init__(self, data_path: str | pathlib.Path):
        self.resources = []
        path = pathlib.Path(data_path)
        if path.exists():
            with open(path, encoding="utf-8") as f:
                self.resources = json.load(f)

        self.resources = [r for r in self.resources if r.get("name") not in _EXCLUDED_FROM_KNOWLEDGE]

        self._doc_tokens = []
        for r in self.resources:
            blob = " ".join([
                r.get("name", ""),
                r.get("description", ""),
                r.get("resource_description", ""),
                r.get("topics", ""),
                r.get("tags", ""),
            ])
            self._doc_tokens.append(_tokenize(blob))

    def search(self, query: str, top_k: int = 4) -> list[dict]:
        if not self.resources:
            return []
        query_tokens = _tokenize(query)
        if not query_tokens:
            return []

        scored = []
        for resource, tokens in zip(self.resources, self._doc_tokens):
            overlap = len(query_tokens & tokens)
            if overlap > 0:
                scored.append((overlap, resource))

        scored.sort(key=lambda pair: pair[0], reverse=True)
        return [resource for _, resource in scored[:top_k]]

    def format_as_knowledge(self, query: str, top_k: int = 4) -> str:
        matches = self.search(query, top_k=top_k)
        if not matches:
            return ""
        lines = []
        for r in matches:
            desc = r.get("resource_description") or r.get("description") or ""
            lines.append(f"- {r['name']} ({r.get('type', 'resource')}): {desc} [{r.get('link', '')}]")
        return "\n".join(lines)
