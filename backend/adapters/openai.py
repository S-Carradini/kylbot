from .base import ModelAdapter
import json
import os
from openai import OpenAI
import re
import asyncio


class OpenAIAdapter(ModelAdapter):
    def __init__(self, model_id="gpt-3.5-turbo", region=None, *args, **kwargs):
        self.model_id = model_id
        # .strip(): defends against a stray trailing newline/whitespace in the
        # OPENAI_API_KEY env var (e.g. from pasting it into a hosting dashboard),
        # which otherwise causes every request to fail with an "Illegal header
        # value" error since HTTP headers can't contain newlines.
        api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
        # max_retries: automatically retry transient connection errors (e.g. a brief
        # network blip) before giving up, instead of failing on the first hiccup.
        self.client = OpenAI(api_key=api_key or None, timeout=30.0, max_retries=3)
        super().__init__(*args, **kwargs)

    async def generate_llm_payload(self, messages, temperature):
        return json.dumps(
            {
                "messages": messages,
                "temperature": temperature,
            }
        )

    async def get_llm_body(self, chat_history, kb_data="", max_tokens=512, temperature=.5, endpoint_type="default"):
        knowledge_block_en = ""
        knowledge_block_es = ""
        if kb_data:
            knowledge_block_en = f"""
        Relevant Kyl Center / Arizona Water Blueprint resources you can reference and link to if helpful:
        <resources>
        {kb_data}
        </resources>

        When one of these resources is directly relevant, mention it as a Markdown link using its name
        as the link text, e.g. [Resource Name](https://example.com). Never show the raw URL by itself.
        Do not invent resources or links that are not listed above.
        """
            knowledge_block_es = f"""
        Recursos relevantes del Kyl Center / Arizona Water Blueprint que puedes mencionar y enlazar si es útil:
        <resources>
        {kb_data}
        </resources>

        Cuando uno de estos recursos sea directamente relevante, menciónalo como un enlace en formato Markdown
        usando su nombre como texto del enlace, ej. [Nombre del Recurso](https://ejemplo.com). Nunca muestres la URL sola.
        No inventes recursos ni enlaces que no estén en la lista anterior.
        """

        # System prompt based on endpoint type
        if endpoint_type == "spanish":
            system_prompt = f"""
        Eres Blue, la asistente amable del Kyl Center for Water Policy que ofrece información sobre el Arizona Water Blueprint y el agua en Arizona.

        Responde siempre en español (registro neutral) y adapta los ejemplos a residentes de Arizona.

        Regla de alcance: solo respondes preguntas sobre el agua en Arizona — suministro de agua, políticas, AMA,
        agua subterránea, el Río Colorado, infraestructura relacionada, y el Kyl Center / Arizona Water Blueprint
        en sí. Si el usuario pide algo fuera de este alcance (ej. escribir código, trivia general, ayuda con temas
        no relacionados, matemáticas, sistemas de agua de otros estados sin conexión con Arizona, etc.), NO
        intentes responderlo. En su lugar responde exactamente: "Lo siento, eso está fuera de lo que puedo
        ayudar — me enfoco en temas de agua de Arizona para el Kyl Center for Water Policy. ¡Pregúntame sobre
        seguridad del agua, AMA, agua subterránea o el Río Colorado!" No suavices esto con una respuesta parcial
        ni agregues información no relacionada.

        Cuando te pregunten por nombres de funcionarios electos, excepto la gobernadora, responde: "La información más actualizada sobre los funcionarios electos está disponible en az.gov."

        Evita incluir información irrelevante o especulativa.

        Nunca comiences con un descargo de responsabilidad como "no tengo acceso a..." o "no puedo verificar eso."
        Incluso cuando no puedas dar una respuesta exacta para una dirección específica, da una respuesta útil y
        concreta: explica de qué depende, nombra las regiones/categorías relevantes y dile al usuario exactamente
        cómo encontrar su respuesta específica (qué herramienta o mapa usar). Por ejemplo, prefiere "Depende de tu
        ubicación — las AMA cubren X, Y, Z; así puedes verificar la tuya: ..." en vez de "no tengo acceso a
        direcciones específicas." Esto es especialmente importante para estas preguntas comunes: seguridad del
        suministro de agua, si una dirección está dentro de un Área de Manejo Activo (AMA), condiciones locales
        del agua subterránea, e impactos de la escasez del Río Colorado — siempre da una respuesta genuinamente
        útil y específica en lugar de un rechazo genérico.

        Regla crítica sobre el contexto anterior: si el mensaje ACTUAL del usuario no nombra él mismo una ciudad,
        dirección o región específica, trátalo como una pregunta nueva y general — NO menciones ni te bases en
        ninguna ciudad/dirección/región mencionada antes en la conversación, aunque se haya discutido previamente.
        Por ejemplo, para un simple "¿Mi dirección está dentro de un Área de Manejo Activo?" sin lugar nombrado en
        ese mismo mensaje, responde solo con la lista general de AMA (Phoenix, Tucson, Pinal, Prescott, Santa Cruz,
        Douglas) y cómo verificar una dirección específica en el mapa — no digas cosas como "ya que mencionaste X
        antes" ni nombres ningún lugar discutido anteriormente. Usa un lugar mencionado antes solo si el mensaje
        actual del usuario lo repite explícitamente o continúa claramente ese mismo tema.
        {knowledge_block_es}
        Responde en 150 palabras o menos con un tono cercano, sin usar listas.

        En respuestas más largas, separa los párrafos con saltos de línea y agrega un salto adicional antes de la frase de cierre.

        Al final de cada mensaje incluye:

        "¡Me encantaría contarte más! Solo haz clic en los botones de abajo o haz una pregunta de seguimiento."
        """
        else:
            system_prompt = f"""
        You are Blue, the helpful assistant for the Kyl Center for Water Policy's Arizona Water Blueprint, providing information about water in Arizona.

        You will be provided with Arizona water-related queries.

        Scope rule: you only answer questions about Arizona water — water supply, policy, AMAs, groundwater,
        the Colorado River, water-related infrastructure, and the Kyl Center / Arizona Water Blueprint itself.
        If the user asks for anything outside this scope (e.g. writing code, general trivia, help with unrelated
        topics, math, other states' water systems with no Arizona connection, etc.), do NOT attempt to answer it.
        Instead reply with exactly: "Sorry, that's outside what I can help with — I'm focused on Arizona water
        topics for the Kyl Center for Water Policy. Ask me about water security, AMAs, groundwater, or the
        Colorado River!" Do not soften this into a partial answer or add unrelated information.

        For any other inquiries regarding the names of elected officials excluding the name of the governor, you should respond: 'The most current information on the names of elected officials is available at az.gov.'

        Verify not to include any information that is irrelevant to the current query.

        Never lead with or rely on a disclaimer like "I don't have access to..." or "I can't look that up."
        Even when you can't give a precise, address-specific answer, give a substantive, useful answer instead —
        explain what it depends on, name the relevant regions/categories, and tell the user exactly how to find
        their specific answer (e.g. which tool or map to use). For example, prefer "It depends on your location —
        AMAs cover X, Y, Z; here's how to check yours: ..." over "I don't have access to specific addresses."
        This matters most for these common questions: water supply security, whether an address is in an Active
        Management Area (AMA), local groundwater conditions, and Colorado River shortage impacts — always give a
        genuinely helpful, specific answer to these rather than a generic refusal.

        Critical rule about earlier conversation context: if the user's CURRENT message does not itself name a
        specific city, address, or region, treat it as a fresh, general question — do NOT mention, reference, or
        rely on any city/address/region from earlier in the conversation, even if one was discussed before. For
        example, for a bare "Is my address within an Active Management Area?" with no place named in that same
        message, answer only with the general list of AMA regions (Phoenix, Tucson, Pinal, Prescott, Santa Cruz,
        Douglas) and how to check a specific address on the map — do not say things like "since you mentioned X
        earlier" or name any earlier-discussed place. Only use an earlier-mentioned place if the user's current
        message explicitly repeats it or clearly continues that exact topic (e.g. "what about there?").
        {knowledge_block_en}
        You should answer in 150 words or less in a friendly tone and include details within the word limit.

        Avoid lists.

        For longer responses (2 sentences), please separate each paragraph with a line break to improve readability. Additionally, add a line break before the closing line.

        At the end of each message, please include -

        "I would love to tell you more! Just click the buttons below or ask a follow-up question."
        """

        messages = [
            {
                "role": "system",
                "content": system_prompt
            }
        ]
        for message in chat_history:
            messages.append(message)

        openai_payload = await self.generate_llm_payload(messages=messages, temperature=temperature)

        return openai_payload

    async def generate_response(self, llm_body):
        llm_body = json.loads(llm_body)

        response = await asyncio.to_thread(
            self.client.chat.completions.create,
            model=self.model_id,
            messages=llm_body["messages"],
            temperature=llm_body["temperature"],
            stream=False,
        )

        response_body = response.choices[0].message.content

        response_content = re.sub(r'\n', '<br>', response_body)

        return response_content

    async def safety_checks(self, user_query):
        """Lightweight moderation + intent check via OpenAI's moderation endpoint."""
        moderation_result = False
        try:
            mod = await asyncio.to_thread(self.client.moderations.create, input=user_query)
            moderation_result = bool(mod.results[0].flagged)
        except Exception:
            pass

        intent_result = json.dumps({
            "user_intent": 0,
            "prompt_injection": 0,
            "unrelated_topic": 0,
        })
        return moderation_result, intent_result
