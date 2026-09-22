"""Live Translation & Core Productivity Tasks API for GO 1.0 (goo1).

Provides specialized endpoints for:
- Real-time multilingual translation with language detection and nuance notes
- Structured email composition (Subject, Salutation, Body, Sign-off)
- Text analysis (Summarization, Grammar polishing, Key action extraction, Tone shift)
"""

import json
import re
from typing import Optional, List, Dict, Any
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.ai.ollama_client import ollama_client
from backend.config.settings import settings
from backend.utils.logger import get_logger

logger = get_logger("translate_api")

router = APIRouter(prefix="/api", tags=["translate_and_tasks"])


# ==============================================================================
# Request & Response Models
# ==============================================================================

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Source text to translate")
    source_lang: str = Field(default="Auto-Detect", description="Source language")
    target_lang: str = Field(default="Spanish", description="Target language")
    style: str = Field(default="Natural / Conversational", description="Translation tone/style")


class TranslateResponse(BaseModel):
    success: bool
    source_lang: str
    detected_lang: Optional[str] = None
    target_lang: str
    translated_text: str
    nuance_notes: Optional[str] = None
    character_count: int
    word_count: int


class EmailDraftRequest(BaseModel):
    purpose: str = Field(default="follow_up", description="Email purpose type")
    recipient: str = Field(default="Colleague", description="Recipient name or role")
    tone: str = Field(default="Professional", description="Tone (Professional, Direct, Casual, Polite)")
    key_points: str = Field(..., min_length=1, description="Key details or bullet points")


class EmailDraftResponse(BaseModel):
    success: bool
    subject: str
    salutation: str
    body: str
    sign_off: str
    full_text: str


class TextAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Input text to process")
    action: str = Field(..., description="Action: summarize, grammar_fix, extract_points, tone_shift")
    target_tone: Optional[str] = Field(default="Executive", description="Target tone for tone_shift")


class TextAnalysisResponse(BaseModel):
    success: bool
    action: str
    original_text: str
    result: str
    points: Optional[List[str]] = None
    word_count_original: int
    word_count_result: int


# ==============================================================================
# 1. Live Translation Endpoint
# ==============================================================================

@router.post("/translate", response_model=TranslateResponse)
async def translate_text(req: TranslateRequest):
    """Translate text between languages with contextual awareness."""
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    client = ollama_client

    system_prompt = (
        "You are the high-speed translation core of GO 1.0 (goo1). "
        "Your role is to translate text with maximum fidelity, natural phrasing, and cultural nuance.\n"
        "Output ONLY a valid JSON object matching this schema, with no additional markdown or commentary:\n"
        "{\n"
        '  "detected_lang": "Name of source language if Auto-Detect was requested, otherwise the source language",\n'
        '  "translated_text": "Precise translation in target language",\n'
        '  "nuance_notes": "1 brief sentence about formality or vocabulary choices, or null"\n'
        "}"
    )

    user_prompt = (
        f"Source Language: {req.source_lang}\n"
        f"Target Language: {req.target_lang}\n"
        f"Style/Tone: {req.style}\n"
        f"Text to Translate:\n\"\"\"{text}\"\"\""
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    try:
        raw_response = await client.chat(messages, temperature=0.2)
        cleaned = raw_response.strip()

        # Strip markdown fences if present
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
            cleaned = re.sub(r"\n?```$", "", cleaned)
            cleaned = cleaned.strip()

        # Parse JSON
        parsed = None
        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            # Fallback regex extraction
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                try:
                    parsed = json.loads(match.group(0))
                except Exception:
                    pass

        if parsed and isinstance(parsed, dict) and "translated_text" in parsed:
            trans_text = parsed.get("translated_text", "").strip()
            det_lang = parsed.get("detected_lang") or req.source_lang
            notes = parsed.get("nuance_notes")
        else:
            # Fallback if raw text returned
            trans_text = cleaned
            det_lang = req.source_lang
            notes = None

        return TranslateResponse(
            success=True,
            source_lang=req.source_lang,
            detected_lang=det_lang,
            target_lang=req.target_lang,
            translated_text=trans_text,
            nuance_notes=notes,
            character_count=len(trans_text),
            word_count=len(trans_text.split()),
        )

    except (httpx.ConnectError, httpx.RequestError) as e:
        logger.warning(f"Translation engine offline: {e}")
        raise HTTPException(
            status_code=503,
            detail="Local LLM service (Ollama) is offline or unreachable. Please start Ollama with 'ollama serve' or './run.sh' to use translation.",
        )
    except Exception as e:
        logger.error(f"Translation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Translation engine error: {str(e)}")


# ==============================================================================
# 2. Email Composition Endpoint
# ==============================================================================

@router.post("/tasks/email", response_model=EmailDraftResponse)
async def draft_email(req: EmailDraftRequest):
    """Generate a structured, professional email with Subject, Salutation, Body, and Sign-off."""
    client = ollama_client

    system_prompt = (
        "You are GO 1.0 (goo1), an expert executive communications assistant. "
        "Draft a polished, complete email based on the user's requirements.\n"
        "Output ONLY a valid JSON object matching this schema with no extra commentary:\n"
        "{\n"
        '  "subject": "Concise, compelling subject line",\n'
        '  "salutation": "Appropriate greeting, e.g. Dear [Name], or Hi [Name],",\n'
        '  "body": "Well-structured body paragraphs with clear spacing and call to action",\n'
        '  "sign_off": "Professional sign-off, e.g. Best regards,\\n[Your Name]"\n'
        "}"
    )

    user_prompt = (
        f"Email Purpose: {req.purpose}\n"
        f"Recipient: {req.recipient}\n"
        f"Tone: {req.tone}\n"
        f"Key Points / Context:\n{req.key_points}"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    try:
        raw_response = await client.chat(messages, temperature=0.35)
        cleaned = raw_response.strip()

        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
            cleaned = re.sub(r"\n?```$", "", cleaned)
            cleaned = cleaned.strip()

        parsed = None
        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                try:
                    parsed = json.loads(match.group(0))
                except Exception:
                    pass

        if parsed and isinstance(parsed, dict) and "body" in parsed:
            subj = parsed.get("subject", "Follow-up")
            salut = parsed.get("salutation", f"Dear {req.recipient},")
            body = parsed.get("body", "")
            sign_off = parsed.get("sign_off", "Best regards,\n[Your Name]")
        else:
            # Fallback parse
            lines = [line.strip() for line in cleaned.split("\n") if line.strip()]
            subj = "Follow-up"
            salut = f"Dear {req.recipient},"
            body = cleaned
            sign_off = "Best regards,\n[Your Name]"
            for line in lines:
                if line.lower().startswith("subject:"):
                    subj = line[8:].strip()
                    break

        full_text = f"Subject: {subj}\n\n{salut}\n\n{body}\n\n{sign_off}"

        return EmailDraftResponse(
            success=True,
            subject=subj,
            salutation=salut,
            body=body,
            sign_off=sign_off,
            full_text=full_text,
        )

    except (httpx.ConnectError, httpx.RequestError) as e:
        logger.warning(f"Email drafting engine offline: {e}")
        raise HTTPException(
            status_code=503,
            detail="Local LLM service (Ollama) is offline or unreachable. Please start Ollama with 'ollama serve' or './run.sh' to draft emails.",
        )
    except Exception as e:
        logger.error(f"Email drafting failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Email generation error: {str(e)}")


# ==============================================================================
# 3. Text Analysis & Language Tools Endpoint
# ==============================================================================

@router.post("/tasks/analyze", response_model=TextAnalysisResponse)
async def analyze_text(req: TextAnalysisRequest):
    """Execute text analysis: summarization, grammar repair, key extraction, or tone shifting."""
    client = ollama_client

    action_prompts = {
        "summarize": "Summarize the text concisely into a 2-3 sentence executive summary followed by key takeaways.",
        "grammar_fix": "Fix all grammar, punctuation, and phrasing errors. Present the corrected text clearly and list any notable improvements made.",
        "extract_points": "Extract all core action items, dates, metrics, and key decisions into clean, organized bullet points.",
        "simplify": "Explain and rewrite this text in simple, clear language that anyone can understand without technical jargon.",
        "tone_shift": f"Rewrite the text to reflect an authoritative, polished '{req.target_tone}' tone while preserving all facts.",
    }

    action_instruction = action_prompts.get(req.action, "Analyze and improve the following text.")

    system_prompt = (
        "You are GO 1.0 (goo1), a master editor and text analysis engine. "
        "Perform the requested linguistic task with high accuracy, clean formatting, and no filler."
    )

    user_prompt = f"Task: {action_instruction}\n\nInput Text:\n\"\"\"{req.text.strip()}\"\"\""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    try:
        result = await client.chat(messages, temperature=0.3)
        orig_words = len(req.text.strip().split())
        res_words = len(result.strip().split())

        # Extract bullet points if present
        points = [
            line.strip().lstrip("-*•").strip()
            for line in result.split("\n")
            if line.strip().startswith(("-", "*", "•", "1.", "2.", "3.", "4.", "5."))
        ]

        return TextAnalysisResponse(
            success=True,
            action=req.action,
            original_text=req.text.strip(),
            result=result.strip(),
            points=points if points else None,
            word_count_original=orig_words,
            word_count_result=res_words,
        )

    except (httpx.ConnectError, httpx.RequestError) as e:
        logger.warning(f"Text analysis engine offline: {e}")
        raise HTTPException(
            status_code=503,
            detail="Local LLM service (Ollama) is offline or unreachable. Please start Ollama with 'ollama serve' or './run.sh' to analyze text.",
        )
    except Exception as e:
        logger.error(f"Text analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Text analysis error: {str(e)}")
