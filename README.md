# Kyl Waterbot

Conversational AI assistant ("Blue") for the Kyl Center for Water Policy's Arizona Water
Blueprint. FastAPI backend (OpenAI-powered chat, grounded in real KYL resource data) +
React frontend, plus an embeddable iframe widget for external sites.

This project is fully separate from any other chatbot project (e.g. Waterbot) — it has its
own OpenAI API key, its own session cookie, and no shared database.

## Project structure

```
kylbot/
├── backend/     FastAPI server — chat API, OpenAI integration, resource grounding
├── frontend/    React app — the full Arizona Water Blueprint map site with Blue's chat panel
├── Dockerfile   Builds both for deployment (e.g. Railway)
└── railway.toml Railway deployment config
```

## Prerequisites

- [Conda](https://docs.conda.io/) (Anaconda or Miniconda) — for the Python backend
- [Node.js](https://nodejs.org/) (v18+) — for the React frontend
- An OpenAI API key — get one at https://platform.openai.com/account/api-keys

## 1. Run the frontend

In a terminal, from the project root:

Create a file called `.env.local` inside the `frontend/` folder with:

```
VITE_API_URL=http://localhost:8000
```

Then install and run:

```
cd frontend
npm install
npm run dev
```

The frontend is now running at **http://localhost:5173**, and talks to the backend at
`http://localhost:8000` (configured via `VITE_API_URL` in `.env.local`).

Open `http://localhost:5173` in your browser — you should see the full Arizona Water
Blueprint site with Blue's chat widget in the bottom-right corner. (It won't get real
replies until the backend below is also running.)

## 2. Run the backend

In a **separate terminal**, from the project root:

```
cd backend
conda create -n kyl-backend python=3.10 -y
conda activate kyl-backend
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

## 3. The standalone iframe widget

There's also a lightweight, standalone chat page meant to be embedded into someone else's
webpage via `<iframe>` (instead of the full map site). It's served directly by the backend:

```
http://localhost:8000/widget
```

To embed it on another page:

```html
<iframe src="http://localhost:8000/widget" width="400" height="600" style="border:none;"></iframe>
```

Once deployed (see below), swap `http://localhost:8000` for the real deployed URL.

## How the chatbot answers questions

The backend loads a list of real KYL/Arizona Water Blueprint resources from
`backend/data/resources.json` (extracted from the client's resource list). When a user asks
a question, it does a simple keyword match against that list and includes any relevant
resources in the prompt sent to OpenAI — so Blue can mention real KYL resources by name with
clickable links, instead of only answering from general knowledge.

There is no database. Chat history is kept in memory per browser session (via a session
cookie) and is lost when the backend restarts.

## Deployment (Railway)

The `Dockerfile` at the project root builds the frontend, then bundles it into the backend's
container so one deployed service serves both the full site and the `/widget` page. See
`railway.toml` for the Railway-specific config.

Required environment variables in your Railway service settings:

- `OPENAI_API_KEY` — your OpenAI key
- `FRONTEND_URL` — the deployed frontend origin (if served separately) or leave default if
  the frontend is bundled into the same service
