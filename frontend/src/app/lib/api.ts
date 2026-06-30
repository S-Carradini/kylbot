// In production this is built into the same FastAPI app that serves it, so an
// empty base (same-origin request) is correct. In local dev, set VITE_API_URL
// in .env.local to point at the separately-running backend (e.g. :8000).
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

function htmlToText(html: string): string {
  // Keep Markdown links ([Name](url)) intact — BlueChat renders those as named hyperlinks.
  return html
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?p>/gi, "");
}

export async function askKylBot(
  userQuery: string,
  options?: { knownEnglish?: boolean; fresh?: boolean }
): Promise<string> {
  const body = new FormData();
  body.append("user_query", userQuery);
  if (options?.knownEnglish) body.append("language_preference", "en");
  if (options?.fresh) body.append("fresh", "true");

  const res = await fetch(`${API_BASE_URL}/chat_api`, {
    method: "POST",
    credentials: "include",
    body,
  });

  if (!res.ok) {
    throw new Error(`KYL backend returned ${res.status}`);
  }

  const data: { resp: string; msgID: number } = await res.json();
  return htmlToText(data.resp);
}
