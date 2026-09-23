"""Unit and validation tests for Live Translation and Task Studio APIs."""

import pytest
from unittest.mock import AsyncMock, patch


def test_translate_endpoint_success(client):
    mock_ollama_resp = (
        '{\n'
        '  "detected_lang": "English",\n'
        '  "translated_text": "Hola mundo",\n'
        '  "nuance_notes": "Standard friendly greeting in Spanish."\n'
        '}'
    )

    with patch("backend.api.translate.ollama_client.chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = mock_ollama_resp

        res = client.post(
            "/api/translate",
            json={
                "text": "Hello world",
                "source_lang": "Auto-Detect",
                "target_lang": "Spanish",
                "style": "Natural / Conversational",
            },
        )

        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["translated_text"] == "Hola mundo"
        assert data["detected_lang"] == "English"
        assert data["target_lang"] == "Spanish"
        assert "Spanish" in data["nuance_notes"]


def test_translate_empty_text(client):
    res = client.post(
        "/api/translate",
        json={
            "text": "   ",
            "source_lang": "English",
            "target_lang": "French",
        },
    )
    assert res.status_code == 400


def test_email_draft_endpoint(client):
    mock_email_resp = (
        '{\n'
        '  "subject": "Follow-Up — Demo Meeting",\n'
        '  "salutation": "Dear Alex,",\n'
        '  "body": "Thank you for the productive demo call today.",\n'
        '  "sign_off": "Best regards,\\nOmkar"\n'
        '}'
    )

    with patch("backend.api.translate.ollama_client.chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = mock_email_resp

        res = client.post(
            "/api/tasks/email",
            json={
                "purpose": "follow_up",
                "recipient": "Alex",
                "tone": "Professional",
                "key_points": "Thank for demo call",
            },
        )

        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["subject"] == "Follow-Up — Demo Meeting"
        assert data["salutation"] == "Dear Alex,"
        assert "Follow-Up — Demo Meeting" in data["full_text"]


def test_text_analysis_endpoint(client):
    mock_analysis_resp = (
        "Executive Summary:\n"
        "- System tested on Apple Silicon with 60 tok/sec throughput.\n"
        "- Zero memory leaks identified."
    )

    with patch("backend.api.translate.ollama_client.chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = mock_analysis_resp

        res = client.post(
            "/api/tasks/analyze",
            json={
                "text": "We benchmarked the system and achieved 60 tok/sec with no leaks.",
                "action": "summarize",
                "target_tone": "Executive",
            },
        )

        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["action"] == "summarize"
        assert len(data["points"]) == 2
        assert "60 tok/sec" in data["result"]


def test_translate_offline_returns_503(client):
    import httpx
    with patch("backend.api.translate.ollama_client.chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.side_effect = httpx.ConnectError("Connection refused")

        res = client.post(
            "/api/translate",
            json={
                "text": "Hello world",
                "source_lang": "Auto-Detect",
                "target_lang": "French",
            },
        )
        assert res.status_code == 503
        assert "offline" in res.json()["detail"].lower()


