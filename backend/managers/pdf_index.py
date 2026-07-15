import hashlib
import json
import logging
import pathlib
import re

import requests
from pypdf import PdfReader
import io

_STOPWORDS = {
    "the", "a", "an", "is", "are", "of", "in", "on", "for", "to", "and", "or",
    "what", "how", "why", "when", "where", "do", "does", "my", "i", "me",
    "about", "with", "can", "you", "tell",
}


def _tokenize(text: str) -> set[str]:
    words = re.findall(r"[a-zA-Z']+", (text or "").lower())
    return {w for w in words if w not in _STOPWORDS and len(w) > 2}


def _chunk_text(text: str, target_words: int = 180) -> list[str]:
    # PDFs often extract with real paragraph breaks (blank lines) — prefer
    # those. But some PDF layouts (columns, headers, footnote markers) cause
    # the text to fragment into many tiny pieces instead — those are useless
    # as search units, so require a reasonable average length before trusting
    # paragraph mode; otherwise fall back to fixed-size word windows, which
    # merge fragments into chunks substantial enough to actually search.
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    avg_len = (sum(len(p) for p in paragraphs) / len(paragraphs)) if paragraphs else 0
    if len(paragraphs) >= 3 and avg_len >= 200:
        return paragraphs
    words = text.split()
    return [" ".join(words[i:i + target_words]) for i in range(0, len(words), target_words)]


class PdfContentIndex:
    """Downloads PDF resources, extracts their real text, and finds the most
    relevant excerpt for a given question via the same keyword-overlap
    approach used elsewhere in this app (no embeddings / vector DB).

    Extracted text is cached to disk per-PDF so a document is only
    downloaded and parsed once, not on every question or server restart.
    """

    def __init__(self, cache_dir: str | pathlib.Path):
        self.cache_dir = pathlib.Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _cache_path(self, url: str) -> pathlib.Path:
        key = hashlib.sha256(url.encode("utf-8")).hexdigest()[:24]
        return self.cache_dir / f"{key}.json"

    def _get_chunks(self, url: str) -> list[str] | None:
        cache_path = self._cache_path(url)
        if cache_path.exists():
            try:
                with open(cache_path, encoding="utf-8") as f:
                    return json.load(f)["chunks"]
            except Exception:
                pass  # fall through and re-fetch if the cache file is corrupt

        try:
            resp = requests.get(url, timeout=20, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            reader = PdfReader(io.BytesIO(resp.content))
            full_text = "\n\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            logging.warning("Could not fetch/parse PDF %s: %s", url, e)
            return None

        chunks = _chunk_text(full_text)
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump({"url": url, "chunks": chunks}, f, ensure_ascii=False)
        return chunks

    def get_excerpt(self, resource: dict, query: str, max_chars: int = 1200) -> str | None:
        """Returns the most relevant excerpt(s) from this PDF resource for the
        given query, or None if the resource isn't a PDF or couldn't be read."""
        if resource.get("type") != "PDF":
            return None
        url = resource.get("link")
        if not url:
            return None

        chunks = self._get_chunks(url)
        if not chunks:
            return None

        query_tokens = _tokenize(query)
        if not query_tokens:
            return None

        scored = []
        for chunk in chunks:
            overlap = len(query_tokens & _tokenize(chunk))
            if overlap > 0:
                scored.append((overlap, chunk))
        if not scored:
            return None

        scored.sort(key=lambda pair: pair[0], reverse=True)

        excerpt = ""
        for _, chunk in scored:
            # Always include at least the single best-matching chunk, even if
            # it alone exceeds max_chars — only stop adding *more* chunks
            # once the budget is used up.
            if excerpt and len(excerpt) + len(chunk) > max_chars:
                break
            excerpt += ("\n\n" if excerpt else "") + chunk
        return excerpt or None
