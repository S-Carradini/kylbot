# Kyl Waterbot

Conversational AI assistant ("Blue") for the Kyl Center for Water Policy's Arizona Water
Blueprint. FastAPI backend (OpenAI-powered chat, grounded in real KYL resource data,
official term definitions, and the actual text of source PDFs) + React frontend, plus an
embeddable widget for external sites (e.g. Drupal).

This project is fully separate from any other chatbot project (e.g. Waterbot) — it has its
own OpenAI API key, its own session cookie, and no shared database.

## Project structure

```
kylbot/
├── backend/
│   ├── main.py              FastAPI app — chat API, routing
│   ├── adapters/openai.py   OpenAI integration, system prompt
│   ├── managers/
│   │   ├── resource_index.py  Keyword-matches questions to entries in resources.json
│   │   ├── term_index.py      Keyword-matches questions to official term definitions
│   │   └── pdf_index.py       Downloads, reads, and caches the actual text of PDF resources
│   └── data/
│       ├── resources.json         KYL/Arizona Water Blueprint resource list (links + descriptions)
│       ├── term_definitions.json  Official term/concept definitions (aquifer, AMA, etc.)
│       └── pdf_cache/              Auto-generated cache of PDF text already read (gitignored)
├── frontend/    React app — the full Arizona Water Blueprint map site, the standalone
│                /chat page, the embeddable /widget page, and Blue's chat panel
├── Dockerfile   Builds both for deployment (e.g. Railway)
└── railway.toml Railway deployment config
```

## Prerequisites

- [Python](https://www.python.org/) 3.11 — for the backend (see `backend/.python-version`)
- [Node.js](https://nodejs.org/) (v18+) — for the React frontend
- An OpenAI API key — get one at https://platform.openai.com/account/api-keys

## 1. Run the frontend

In a terminal, from the project root:

```
cd frontend
```

Create a file called `.env.local` inside this `frontend/` folder with:

```
VITE_API_URL=http://localhost:8000
```

Then install and run:

```
npm install
npm run dev
```

The frontend is now running at **http://localhost:5173**, and talks to the backend at
`http://localhost:8000` (configured via `VITE_API_URL` in `.env.local`).

Open `http://localhost:5173` in your browser — you should see the full Arizona Water
Blueprint site with Blue's chat widget in the bottom-right corner. There's also a
standalone full-page chat at `http://localhost:5173/chat`. Neither gets real replies
until the backend below is also running.

## 2. Run the backend

In a **separate terminal**, from the project root:

```
cd backend
python -m venv venv
```

Activate the virtual environment:

**Windows:**

```
venv\Scripts\activate
```

**Mac/Linux:**

```
source venv/bin/activate
```

Then install dependencies:

```
pip install -r requirements.txt
```

Copy the sample environment file and fill in your own OpenAI key:

**Windows:**

```
copy sample.env .env
```

**Mac/Linux:**

```
cp sample.env .env
```

Note: the `.env` file must live inside the `backend/` folder (not the project root).

Open `.env` and set:

```
OPENAI_API_KEY=sk-your-real-key-here
```

Start the server:

```
uvicorn main:app --reload --port 8000
```

The backend is now running at **http://localhost:8000**.

## 3. The embeddable widget (for external sites, e.g. Drupal)

There's a lightweight widget page meant to be embedded into someone else's webpage, served
by the frontend at `/widget` and loaded via a small embed script (`waterbot-embed.js`) that
handles sizing it correctly as an iframe — it grows/shrinks automatically as the widget
opens, closes, or shows its intro hint bubble.

To embed it on another page, add this script tag (see the comments at the top of
`frontend/public/waterbot-embed.js` for all available options):

```html
<script
  src="https://YOUR-DEPLOYED-DOMAIN/waterbot-embed.js"
  data-waterbot-url="https://YOUR-DEPLOYED-DOMAIN/widget"
></script>
```

For local testing, that would be `http://localhost:5173` in place of
`YOUR-DEPLOYED-DOMAIN`. Once deployed (see below), swap in the real deployed URL.

## How the chatbot answers questions

Blue's answers are grounded in real Kyl Center data, not just general AI knowledge, via
three layers:

1. **Resource links** (`backend/data/resources.json`) — a keyword match against the
   question surfaces relevant KYL/Arizona Water Blueprint resources (reports, maps,
   dashboards), so Blue can mention them by name with clickable links.
2. **Official term definitions** (`backend/data/term_definitions.json`) — a glossary of
   authoritative definitions (aquifer, AMA, CAP, etc.) pulled from the team's source
   material. When a question touches one of these, Blue works the real definition into its
   answer instead of paraphrasing from general knowledge.
3. **Real PDF content** (`backend/managers/pdf_index.py`) — for the most relevant PDF
   resources, the backend actually downloads and reads the real PDF text (not just its
   one-line description), and Blue grounds its answer in that real content — paraphrased in
   the source material's own tone, not copied verbatim. Each PDF is downloaded once and then
   cached locally (`backend/data/pdf_cache/`, gitignored) so it isn't re-fetched on every
   question — the cache resets on each fresh deploy.

All of this uses simple keyword matching (no embeddings / vector database) — see the
`ResourceIndex`, `TermIndex`, and `PdfContentIndex` classes for the matching logic.

There is no database. Chat history is kept in memory per browser session (via a session
cookie) and is lost when the backend restarts.

## Deployment (Railway)

The `Dockerfile` at the project root builds the frontend, then bundles it into the backend's
container so one deployed service serves the full site, `/chat`, `/widget`, and the API. See
`railway.toml` for the Railway-specific config.

Required environment variables in your Railway service settings:

- `OPENAI_API_KEY` — your OpenAI key
- `FRONTEND_URL` — the deployed frontend origin (if served separately) or leave default if
  the frontend is bundled into the same service

Note: `backend/data/pdf_cache/` is not committed to the repo and has no persistent storage
volume configured on Railway, so it resets to empty on every new deploy — the first question
touching each PDF after a deploy takes a couple seconds longer while it re-downloads, then is
instant again for everyone until the next deploy.
