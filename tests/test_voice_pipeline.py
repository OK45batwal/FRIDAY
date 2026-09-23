"""Test Voice Pipeline and Speech Synthesis / Recognition Services."""

import pytest
from backend.voice.voice_service import voice_service
from backend.voice.whisper_stt import whisper_stt


def test_voice_service_sentences():
    text = "Hello there! How are you doing today? I am FRIDAY, your autonomous assistant."
    sentences = voice_service.split_into_sentences(text)
    assert len(sentences) == 3
    assert sentences[0] == "Hello there!"
    assert sentences[1] == "How are you doing today?"
    assert "FRIDAY" in sentences[2]


def test_voice_service_local_or_cloud():
    voices = voice_service.get_voices()
    assert len(voices) >= 5
    assert any(v["key"] == "aria" for v in voices)
    assert any(v["key"] == "sonia" for v in voices)
    assert any("macos" in v for v in voices)


def test_whisper_stt_status():
    status = whisper_stt.get_status()
    assert "available" in status
    assert "model_size" in status
    assert "device" in status


def test_voice_api_endpoints(client):
    # Status
    res_status = client.get("/api/voice/status")
    assert res_status.status_code == 200
    data = res_status.json()
    assert data["tts_available"] is True
    assert len(data["voices"]) >= 5

    # Voices
    res_voices = client.get("/api/voice/voices")
    assert res_voices.status_code == 200
    assert len(res_voices.json()["voices"]) >= 5


def test_voice_websocket_handshake(client):
    with client.websocket_connect("/ws/voice") as ws:
        init_msg = ws.receive_json()
        assert init_msg["type"] == "connected"
        assert "FRIDAY" in init_msg["message"]

        # Ping-Pong
        ws.send_json({"type": "ping"})
        reply = ws.receive_json()
        assert reply["type"] == "pong"

        # Barge-in / Stop
        ws.send_json({"type": "barge_in"})
        interrupted = ws.receive_json()
        assert interrupted["type"] == "interrupted"
        state = ws.receive_json()
        assert state["type"] == "state"
        assert state["state"] == "LISTENING"


def test_semantic_embeddings():
    from backend.memory.embeddings import embedding_engine, cosine_similarity

    v1 = embedding_engine.get_local_vector("apple intelligence on device voice assistant")
    v2 = embedding_engine.get_local_vector("apple on-device voice AI")
    v3 = embedding_engine.get_local_vector("quantum electrodynamics physics theorem")

    sim_related = cosine_similarity(v1, v2)
    sim_unrelated = cosine_similarity(v1, v3)

    assert sim_related > sim_unrelated
    assert sim_related > 0.4

