import json
import re
import pathlib

_STOPWORDS = {
    "the", "a", "an", "is", "are", "of", "in", "on", "for", "to", "and", "or",
    "what", "how", "why", "when", "where", "do", "does", "my", "i", "me",
    "about", "with", "can", "you", "tell",
}


def _normalize(word: str) -> str:
    # Naive singularization (e.g. "aquifers" -> "aquifer") so a plural in the
    # user's question still matches a singular term name, and vice versa.
    if len(word) > 4 and word.endswith("s") and not word.endswith("ss"):
        return word[:-1]
    return word


def _tokenize(text: str) -> set[str]:
    words = re.findall(r"[a-zA-Z']+", (text or "").lower())
    return {_normalize(w) for w in words if w not in _STOPWORDS and len(w) > 2}


class TermIndex:
    """Keyword-overlap search over authoritative Kyl Center term definitions
    (same simple approach as ResourceIndex — no vector DB / embeddings)."""

    def __init__(self, data_path: str | pathlib.Path):
        self.terms = []
        path = pathlib.Path(data_path)
        if path.exists():
            with open(path, encoding="utf-8") as f:
                self.terms = json.load(f)

        # Matches against the term/parent-term names only (not the long
        # definition body) — matching against the full definition text would
        # cause false positives, since definitions share lots of generic
        # water-related vocabulary with unrelated questions.
        self._name_tokens = [
            _tokenize(f"{t.get('parent_term', '')} {t.get('term', '')}")
            for t in self.terms
        ]

    def search(self, query: str, top_k: int = 3) -> list[dict]:
        if not self.terms:
            return []
        query_tokens = _tokenize(query)
        if not query_tokens:
            return []

        scored = []
        for term, tokens in zip(self.terms, self._name_tokens):
            overlap = len(query_tokens & tokens)
            if overlap > 0:
                scored.append((overlap, term))

        scored.sort(key=lambda pair: pair[0], reverse=True)
        return [term for _, term in scored[:top_k]]

    def format_as_knowledge(self, query: str, top_k: int = 3) -> str:
        matches = self.search(query, top_k=top_k)
        if not matches:
            return ""
        lines = []
        for t in matches:
            lines.append(
                f"- Term: \"{t['term']}\" (under {t.get('parent_term', '')})\n"
                f"  Authoritative definition: \"{t['definition']}\"\n"
                f"  Source: {t.get('source', 'Kyl Center')}"
            )
        return "\n".join(lines)
