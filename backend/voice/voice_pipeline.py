"""Full-Duplex WebSocket Voice Pipeline for FRIDAY.

Orchestrates real-time voice conversations:
- Bi-directional WebSocket communication
- Streaming LLM token delivery
- Real-time sentence-by-sentence TTS audio streaming
- Instant barge-in / cancellation
- Live state and transcript broadcast
"""

import re
import json
import base64
import asyncio
from typing import Optional, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect
from backend.ai.orchestrator import orchestrator
from backend.voice.voice_service import voice_service
from backend.voice.whisper_stt import whisper_stt
from backend.utils.logger import get_logger

logger = get_logger("voice_pipeline")


class VoicePipelineSession:
    """Represents a single active voice session over a WebSocket."""

    def __init__(self, websocket: WebSocket):
        self.ws = websocket
        self.active_task: Optional[asyncio.Task] = None
        self.current_conversation_id: Optional[str] = None
        self.is_interrupted = False

    async def send_json(self, data: Dict[str, Any]):
        """Safely send a JSON packet to the client."""
        try:
            await self.ws.send_text(json.dumps(data))
        except Exception as e:
            logger.debug(f"Failed to send JSON over WebSocket: {e}")

    async def cancel_active_generation(self):
        """Immediately abort any active LLM generation or TTS synthesis (barge-in)."""
        self.is_interrupted = True
        if self.active_task and not self.active_task.done():
            logger.info("Barge-in: Cancelling active voice response task.")
            self.active_task.cancel()
            try:
                await asyncio.wait_for(asyncio.shield(self.active_task), timeout=0.2)
            except (asyncio.CancelledError, asyncio.TimeoutError, Exception):
                pass
        self.active_task = None
        await self.send_json({"type": "interrupted"})
        await self.send_json({"type": "state", "state": "LISTENING"})

    async def process_user_speech(self, text: str, conversation_id: Optional[str] = None, voice: str = "aria"):
        """Handle incoming speech input from user and stream synthesized audio responses."""
        await self.cancel_active_generation()
        self.is_interrupted = False
        target_conv = conversation_id or self.current_conversation_id

        async def run_pipeline():
            try:
                await self.send_json({"type": "state", "state": "THINKING"})
                sentence_buffer = ""
                sentence_index = 0
                accumulated_text = ""
                assigned_conv_id = target_conv

                async for event in orchestrator.process_stream(user_text=text, conversation_id=target_conv):
                    if self.is_interrupted:
                        break

                    ev_type = event.get("type")

                    if ev_type == "conversation_created":
                        assigned_conv_id = event.get("conversation_id")
                        self.current_conversation_id = assigned_conv_id
                        await self.send_json(event)

                    elif ev_type == "assistant_state":
                        await self.send_json(event)

                    elif ev_type == "intent_detected":
                        await self.send_json(event)

                    elif ev_type == "tool_started":
                        await self.send_json({"type": "state", "state": "USING_TOOL"})
                        await self.send_json(event)

                    elif ev_type == "tool_completed":
                        await self.send_json(event)

                    elif ev_type == "assistant_token":
                        token = event.get("content", "")
                        accumulated_text += token
                        sentence_buffer += token
                        await self.send_json({"type": "token", "content": token})

                        # Detect sentence boundaries to stream TTS early
                        match = re.search(r"([.!?\n])\s+", sentence_buffer)
                        if match and len(sentence_buffer[: match.end()].strip()) >= 15:
                            sentence = sentence_buffer[: match.end()].strip()
                            sentence_buffer = sentence_buffer[match.end() :]
                            clean_s = voice_service.clean_text_for_speech(sentence)

                            if clean_s and not self.is_interrupted:
                                audio_bytes = await voice_service.synthesize_speech(clean_s, voice_key_or_id=voice)
                                if audio_bytes and not self.is_interrupted:
                                    b64 = base64.b64encode(audio_bytes).decode("ascii")
                                    await self.send_json({
                                        "type": "audio",
                                        "chunk": b64,
                                        "sentence": clean_s,
                                        "index": sentence_index,
                                        "mime": "audio/mp4",
                                        "is_last": False,
                                    })
                                    sentence_index += 1

                    elif ev_type == "assistant_finished":
                        assigned_conv_id = event.get("conversation_id", assigned_conv_id)
                        self.current_conversation_id = assigned_conv_id

                # Synthesize any remaining sentence in buffer
                remaining = sentence_buffer.strip()
                if remaining and not self.is_interrupted:
                    clean_rem = voice_service.clean_text_for_speech(remaining)
                    if clean_rem:
                        audio_bytes = await voice_service.synthesize_speech(clean_rem, voice_key_or_id=voice)
                        if audio_bytes and not self.is_interrupted:
                            b64 = base64.b64encode(audio_bytes).decode("ascii")
                            await self.send_json({
                                "type": "audio",
                                "chunk": b64,
                                "sentence": clean_rem,
                                "index": sentence_index,
                                "mime": "audio/mp4",
                                "is_last": True,
                            })
                            sentence_index += 1

                if not self.is_interrupted:
                    await self.send_json({
                        "type": "finished",
                        "conversation_id": assigned_conv_id,
                        "full_text": accumulated_text,
                    })
                    await self.send_json({"type": "state", "state": "ONLINE"})

            except asyncio.CancelledError:
                logger.info("Voice pipeline task cancelled successfully.")
            except Exception as e:
                logger.error(f"Voice pipeline streaming error: {e}", exc_info=True)
                await self.send_json({"type": "error", "message": str(e)})
                await self.send_json({"type": "state", "state": "ERROR"})

        self.active_task = asyncio.create_task(run_pipeline())

    async def process_audio_chunk(self, audio_b64: str, conversation_id: Optional[str] = None, voice: str = "aria"):
        """Decode base64 audio and run speech-to-text, then trigger speech response."""
        try:
            audio_bytes = base64.b64decode(audio_b64)
            stt_result = await whisper_stt.transcribe(audio_bytes)
            transcript = stt_result.get("text", "").strip()

            if transcript:
                await self.send_json({"type": "transcript", "text": transcript})
                await self.process_user_speech(transcript, conversation_id=conversation_id, voice=voice)
            else:
                await self.send_json({
                    "type": "error",
                    "message": stt_result.get("error", "No speech detected in audio."),
                })
        except Exception as e:
            logger.error(f"Audio processing error: {e}")
            await self.send_json({"type": "error", "message": f"Audio processing failed: {str(e)}"})


async def handle_voice_websocket(websocket: WebSocket):
    """Main WebSocket handler for /ws/voice."""
    await websocket.accept()
    session = VoicePipelineSession(websocket)
    logger.info("Voice WebSocket client connected.")

    # Send initial welcome & capabilities
    await session.send_json({
        "type": "connected",
        "message": "FRIDAY Voice Pipeline Online",
        "voices": voice_service.get_voices(),
        "stt": whisper_stt.get_status(),
        "state": "ONLINE",
    })

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except Exception:
                continue

            msg_type = msg.get("type", "")

            if msg_type == "user_speech":
                text = msg.get("text", "").strip()
                conv_id = msg.get("conversation_id")
                voice = msg.get("voice", "aria")
                if text:
                    await session.process_user_speech(text, conversation_id=conv_id, voice=voice)

            elif msg_type == "audio_chunk":
                data = msg.get("data", "")
                conv_id = msg.get("conversation_id")
                voice = msg.get("voice", "aria")
                if data:
                    await session.process_audio_chunk(data, conversation_id=conv_id, voice=voice)

            elif msg_type in ("barge_in", "cancel", "stop"):
                await session.cancel_active_generation()

            elif msg_type == "ping":
                await session.send_json({"type": "pong"})

    except WebSocketDisconnect:
        logger.info("Voice WebSocket client disconnected.")
    except Exception as e:
        logger.error(f"Voice WebSocket error: {e}")
    finally:
        await session.cancel_active_generation()
