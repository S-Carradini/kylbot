import uvicorn
import uuid
import secrets
import logging

from typing import Annotated

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi import Request, Form
from fastapi.responses import HTMLResponse, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from managers.memory_manager import MemoryManager
from managers.resource_index import ResourceIndex
from managers.term_index import TermIndex
from managers.pdf_index import PdfContentIndex

from adapters.openai import OpenAIAdapter
from openai import OpenAI
from starlette.middleware.sessions import SessionMiddleware
from langdetect import detect, DetectorFactory

import asyncio

from dotenv import load_dotenv

import os
import json
import pathlib
import io
from starlette.middleware.base import BaseHTTPMiddleware

# Configure logging — write to stdout for log aggregation
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Ensure reproducibility by setting the seed
DetectorFactory.seed = 0


def detect_language(text):
    try:
        return detect(text)
    except Exception as e:
        logging.error(f"Language detection failed: {str(e)}")
        return None


def resolve_language(preferred_language: str | None, detected_language: str | None) -> str:
    # Spanish auto-detection disabled — short inputs like addresses or place names
    # (e.g. "Casa Grande", "1216 E Vista Del Cerro Dr") were unreliably misread as
    # Spanish. Always answer in English unless explicitly told otherwise.
    normalized_preference = (preferred_language or "").lower()
    if normalized_preference == "es":
        return "es"
    return "en"


def determine_prompt_language(chat_language: str, preferred_language: str | None) -> str:
    normalized_preference = (preferred_language or "").lower()
    if normalized_preference in ("en", "es"):
        return normalized_preference
    return chat_language


# Set the cookie name for the KYL bot's own session, isolated from any other project
COOKIE_NAME = "KYL_SESSION"
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN") or None


class SetCookieMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        session_value = request.cookies.get(COOKIE_NAME) or str(uuid.uuid4())
        request.state.client_cookie_disabled_uuid = session_value

        response = await call_next(request)

        is_https = request.url.scheme == "https" or request.headers.get("x-forwarded-proto", "").lower() == "https"
        cookie_kwargs = {
            "key": COOKIE_NAME,
            "value": session_value,
            "max_age": 7200,  # 2 hours
            "path": "/",
            "httponly": True,
            "secure": is_https,
            "samesite": "none" if is_https else "lax",
        }
        if COOKIE_DOMAIN:
            req_host = request.url.hostname or ""
            if req_host.endswith(COOKIE_DOMAIN.lstrip(".")):
                cookie_kwargs["domain"] = COOKIE_DOMAIN
        response.set_cookie(**cookie_kwargs)

        return response


load_dotenv(override=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
    expose_headers=["Set-Cookie"],
)

# Mount static files from the React frontend build (if present alongside this file)
possible_paths = [
    pathlib.Path(__file__).parent / "frontend" / "dist",
    pathlib.Path(__file__).parent.parent / "frontend" / "dist",
]

frontend_dist_path = None
for path in possible_paths:
    resolved_path = path.resolve()
    if resolved_path.exists() and (resolved_path / "assets").exists():
        frontend_dist_path = resolved_path
        break

if frontend_dist_path:
    app.mount("/assets", StaticFiles(directory=str(frontend_dist_path / "assets")), name="assets")
    images_path = frontend_dist_path / "images"
    if images_path.exists():
        app.mount("/images", StaticFiles(directory=str(images_path)), name="images")
else:
    logging.warning("Frontend dist directory not found. Run `npm run build` in frontend/ first.")

if pathlib.Path("static").exists():
    app.mount("/static", StaticFiles(directory="static"), name="static")

secret_key = os.getenv("SESSION_SECRET", secrets.token_urlsafe(32))
app.add_middleware(SetCookieMiddleware)
app.add_middleware(SessionMiddleware, secret_key=secret_key)

llm_adapter = OpenAIAdapter("gpt-4.1")
memory = MemoryManager()
resource_index = ResourceIndex(pathlib.Path(__file__).parent / "data" / "resources.json")
term_index = TermIndex(pathlib.Path(__file__).parent / "data" / "term_definitions.json")
pdf_index = PdfContentIndex(pathlib.Path(__file__).parent / "data" / "pdf_cache")


@app.post("/session-transcript")
async def session_transcript_post(request: Request):
    session_uuid = request.cookies.get(COOKIE_NAME) or request.state.client_cookie_disabled_uuid
    session_history = await memory.get_session_history_all(session_uuid)

    if not session_history or not isinstance(session_history, list):
        return {"message": "No chat history found for this session."}

    import datetime
    filename = f"{session_uuid}_{datetime.datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.txt"
    session_text = ""
    for entry in session_history:
        if isinstance(entry, dict) and "role" in entry and "content" in entry:
            session_text += f"Role: {entry['role']}\nContent: {entry['content']}\n\n"

    return {"presigned_url": None, "transcript": session_text, "filename": filename}


# Max texts and chars for translate to avoid timeouts/cost
TRANSLATE_MAX_TEXTS = 20
TRANSLATE_MAX_TOTAL_CHARS = 50_000


async def _translate_one(text: str, target_lang: str) -> str:
    """Translate a single text via LLM. Returns translated string."""
    lang_name = "Spanish" if target_lang == "es" else "English"
    system = (
        "You are a translator. Translate the following to "
        + lang_name
        + ". Output only the translation, no preamble or explanation. "
        "Preserve line breaks and HTML-like tags (e.g. <br>) as in the original."
    )
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": text},
    ]
    llm_body = json.dumps({"messages": messages, "temperature": 0.3})
    out = await llm_adapter.generate_response(llm_body=llm_body)
    return out or ""


@app.post("/translate")
async def translate_post(request: Request):
    """Translate a list of texts to the target language. Used when user switches UI language."""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    texts = body.get("texts")
    target_lang = body.get("target_lang")
    if not isinstance(texts, list) or not target_lang or target_lang not in ("es", "en"):
        raise HTTPException(
            status_code=400,
            detail="Body must include 'texts' (array of strings) and 'target_lang' ('es' or 'en').",
        )
    if len(texts) > TRANSLATE_MAX_TEXTS:
        raise HTTPException(status_code=400, detail=f"At most {TRANSLATE_MAX_TEXTS} texts allowed.")
    total_chars = sum(len(t) for t in texts if isinstance(t, str))
    if total_chars > TRANSLATE_MAX_TOTAL_CHARS:
        raise HTTPException(status_code=400, detail=f"Total length of texts exceeds {TRANSLATE_MAX_TOTAL_CHARS} characters.")

    to_translate = [t for t in texts if isinstance(t, str) and t.strip()]
    if not to_translate:
        return {"translations": list(texts)}
    try:
        translations = await asyncio.gather(*[_translate_one(t, target_lang) for t in to_translate])
    except Exception as e:
        logging.warning("Translate LLM failed: %s", e)
        raise HTTPException(status_code=503, detail="Translation service unavailable.")

    out = []
    idx = 0
    for t in texts:
        if isinstance(t, str) and t.strip():
            out.append(translations[idx] if idx < len(translations) else t)
            idx += 1
        else:
            out.append(t if isinstance(t, str) else "")
    return {"translations": out}


@app.post('/chat_api')
async def chat_api_post(
    request: Request,
    user_query: Annotated[str, Form()],
    background_tasks: BackgroundTasks,
    language_preference: Annotated[str | None, Form()] = None,
    fresh: Annotated[bool, Form()] = False
):
    session_uuid = request.cookies.get(COOKIE_NAME) or request.state.client_cookie_disabled_uuid

    await memory.create_session(session_uuid)

    moderation_result, intent_result = await llm_adapter.safety_checks(user_query)

    prompt_injection = 1
    unrelated_topic = 1
    not_handled = "I am sorry, your request cannot be handled."
    try:
        data = json.loads(intent_result)
        prompt_injection = data["prompt_injection"]
        unrelated_topic = data["unrelated_topic"]
    except Exception as e:
        logging.warning("Could not parse intent_result: %s", e)
        prompt_injection = 0
        unrelated_topic = 0

    if moderation_result or (prompt_injection or unrelated_topic):
        response_content = "I am sorry, your request is inappropriate and I cannot answer it." if moderation_result else not_handled
        await memory.increment_message_count(session_uuid)
        return {
            "resp": response_content,
            "msgID": await memory.get_message_count(session_uuid)
        }

    await memory.add_message_to_session(
        session_id=session_uuid,
        message={"role": "user", "content": user_query},
        source_list=[]
    )

    detected_language = detect_language(user_query)
    language = resolve_language(language_preference, detected_language)
    response_language = determine_prompt_language(language, language_preference)

    kb_data = resource_index.format_as_knowledge(user_query, top_k=8)
    term_data = term_index.format_as_knowledge(user_query, top_k=3)

    # Ground the answer in real excerpts from the actual PDF resources, not
    # just their one-line descriptions. Capped to the top 2 PDF matches —
    # downloading/parsing a PDF (only happens once per PDF, then cached)
    # takes a couple seconds, so we bound how many we fetch per question.
    matched_resources = resource_index.search(user_query, top_k=8)
    doc_excerpt_parts = []
    for r in [m for m in matched_resources if m.get("type") == "PDF"][:2]:
        excerpt = await asyncio.to_thread(pdf_index.get_excerpt, r, user_query)
        if excerpt:
            doc_excerpt_parts.append(f"- From \"{r['name']}\" ({r.get('link', '')}):\n  \"{excerpt}\"")
    doc_excerpts = "\n\n".join(doc_excerpt_parts)

    # The four fixed quick-topic buttons are meant to be standalone topic-starters,
    # not follow-ups — asking them with no prior history avoids the AI dragging in
    # an address/city discussed earlier in the conversation.
    chat_history = [{"role": "user", "content": user_query}] if fresh else await memory.get_session_history_all(session_uuid)

    llm_body = await llm_adapter.get_llm_body(
        chat_history=chat_history,
        kb_data=kb_data,
        term_data=term_data,
        doc_excerpts=doc_excerpts,
        temperature=.6,
        max_tokens=2000,
        endpoint_type="spanish" if response_language == 'es' else "default"
    )

    response_content = await llm_adapter.generate_response(llm_body=llm_body)

    await memory.add_message_to_session(
        session_id=session_uuid,
        message={"role": "assistant", "content": response_content},
        source_list=[]
    )

    await memory.increment_message_count(session_uuid)

    return {
        "resp": response_content.replace('\n\n', '</p><p>').replace('\n', '<br>'),
        "msgID": await memory.get_message_count(session_uuid)
    }


# Serve React frontend static files (favicons)
@app.get("/favicon.ico")
async def favicon():
    if not frontend_dist_path:
        raise HTTPException(status_code=404)
    favicon_path = frontend_dist_path / "favicon.ico"
    if favicon_path.exists():
        return FileResponse(str(favicon_path))
    raise HTTPException(status_code=404)


@app.get("/favicon-196x196.png")
async def favicon_png():
    if not frontend_dist_path:
        raise HTTPException(status_code=404)
    favicon_path = frontend_dist_path / "favicon-196x196.png"
    if favicon_path.exists():
        return FileResponse(str(favicon_path))
    raise HTTPException(status_code=404)


async def _serve_react_spa():
    if not frontend_dist_path:
        raise HTTPException(status_code=404, detail="React frontend not found. Please build the frontend first.")
    index_path = frontend_dist_path / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    raise HTTPException(status_code=404, detail="React frontend not found. Please build the frontend first.")


@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return await _serve_react_spa()


@app.get("/widget", response_class=HTMLResponse)
async def widget_page():
    """Standalone chat widget meant to be embedded via <iframe> on a client's own webpage."""
    return FileResponse(str(pathlib.Path(__file__).parent / "static" / "widget.html"))


@app.post('/api/tts')
async def text_to_speech(request: Request):
    body = await request.json()
    text = (body.get('text') or '').strip()[:4000]
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")
    client = OpenAI(api_key=(os.getenv("OPENAI_API_KEY") or "").strip() or None)
    response = await asyncio.to_thread(
        client.audio.speech.create,
        model="tts-1",
        voice="nova",
        input=text,
    )
    return StreamingResponse(io.BytesIO(response.content), media_type="audio/mpeg")


# Serve React frontend - catch-all SPA routing for client-side routes (e.g. /chat, /settings)
# This must be defined AFTER all API routes
@app.get("/{full_path:path}", response_class=HTMLResponse)
async def serve_react_app(full_path: str, request: Request):
    """Catch-all for client-side routing. Serves index.html for all non-API paths."""
    if (full_path.startswith("chat_") or
        full_path.startswith("session-transcript") or
        full_path.startswith("translate") or
        full_path.startswith("api/") or
        full_path.startswith("static/") or
        full_path.startswith("assets/")):
        raise HTTPException(status_code=404, detail="Not found")

    return await _serve_react_spa()


if __name__ == "__main__":
    uvicorn.run(app, host='0.0.0.0', port=8000)
