import os
import json
import time
import logging
import tempfile
import threading
from pathlib import Path
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

LEARNING_DIR = Path(__file__).resolve().parent.parent.parent / "learning_data"
LEARNING_DIR.mkdir(parents=True, exist_ok=True)

REWARDS_FILE = LEARNING_DIR / "rewards_dataset.jsonl"
LOSSES_FILE = LEARNING_DIR / "losses_dataset.jsonl"
EXPERIENCE_CACHE = LEARNING_DIR / "experience_store.json"
METRICS_FILE = LEARNING_DIR / "learning_metrics.json"

# Cap the in-memory/pinned experience store. Without a bound, "like" feedback
# grew the cache and its JSON file without limit, and every prompt was linear-
# scanned on each request.
MAX_EXPERIENCES = 5_000


def _atomic_write_json(path: Path, data: Any) -> None:
    """
    Write JSON to a temp file in the same directory, then os.replace it into
    place. A crash mid-write previously truncated the store to invalid JSON,
    which then loaded as empty and silently wiped every learned experience.
    os.replace is atomic on the same filesystem, so readers see either the old
    file or the new one, never a half-written one.
    """
    tmp_fd, tmp_name = tempfile.mkstemp(dir=str(path.parent), prefix=path.name, suffix=".tmp")
    try:
        with os.fdopen(tmp_fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_name, path)
    except Exception:
        try:
            os.unlink(tmp_name)
        except OSError:
            pass
        raise


class ContinuousLearningEngine:
    """
    Automatic Continuous Learning & Reinforcement (Reward/Loss) Engine for FRIDAY 1.0.
    Learns from user feedback (thumbs up / thumbs down / corrections) in real time.
    """

    def __init__(self):
        # Serialises appends/rewrites. record_feedback runs from request handlers
        # that may overlap, and two concurrent rewrites of the JSON store could
        # interleave. ponytail: a process-local lock; fine for a single-process
        # uvicorn worker, revisit if this ever runs multi-process.
        self._lock = threading.Lock()
        self._load_experience_cache()

    def _load_experience_cache(self):
        self.experiences: Dict[str, str] = {}
        if EXPERIENCE_CACHE.exists():
            try:
                with open(EXPERIENCE_CACHE, "r", encoding="utf-8") as f:
                    loaded = json.load(f)
                if isinstance(loaded, dict):
                    self.experiences = {str(k): str(v) for k, v in loaded.items()}
                else:
                    logger.warning("Experience store was not a JSON object; ignoring.")
            except Exception:
                # Do NOT silently reset: back the corrupt file up so it can be
                # inspected, and start clean rather than crashing.
                logger.warning("Experience store unreadable; quarantining.", exc_info=True)
                try:
                    EXPERIENCE_CACHE.replace(EXPERIENCE_CACHE.with_suffix(".corrupt"))
                except OSError:
                    pass

    def _save_experience_cache(self):
        try:
            _atomic_write_json(EXPERIENCE_CACHE, self.experiences)
        except Exception:
            logger.error("Failed to persist experience cache", exc_info=True)

    def _append_jsonl(self, path: Path, record: Dict[str, Any]) -> None:
        try:
            with open(path, "a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
        except Exception:
            logger.error("Failed to append feedback record to %s", path, exc_info=True)

    def record_feedback(
        self,
        prompt: str,
        response: str,
        feedback: str,  # "like" | "dislike"
        correction: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Records reward or loss event and updates continuous learning weights.
        """
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        prompt_norm = prompt.strip().lower()

        with self._lock:
            if feedback == "like":
                # 1. Positive Reward: learn preferred response into experience cache
                if (
                    prompt_norm not in self.experiences
                    and len(self.experiences) >= MAX_EXPERIENCES
                ):
                    # Drop the oldest to stay bounded (dicts preserve insertion order).
                    self.experiences.pop(next(iter(self.experiences)))
                self.experiences[prompt_norm] = response
                self._save_experience_cache()

                self._append_jsonl(REWARDS_FILE, {
                    "timestamp": timestamp,
                    "reward": 1.0,
                    "prompt": prompt,
                    "response": response,
                })

                return {
                    "status": "success",
                    "action": "reward_recorded",
                    "message": "Positive reward registered! FRIDAY 1.0 learned this response style.",
                    "total_learned_experiences": len(self.experiences)
                }

            # 2. Negative Loss / Penalty: record for DPO retraining & unpin
            if prompt_norm in self.experiences:
                del self.experiences[prompt_norm]
                self._save_experience_cache()

            self._append_jsonl(LOSSES_FILE, {
                "timestamp": timestamp,
                "reward": -1.0,
                "prompt": prompt,
                "rejected_response": response,
                "correction": correction or "",
            })

            return {
                "status": "success",
                "action": "loss_penalized",
                "message": "Negative feedback noted. Policy weights updated to improve future answers.",
                "total_learned_experiences": len(self.experiences)
            }

    def get_learned_response(self, prompt: str) -> Optional[str]:
        """Checks if a user-rewarded experience matches the query."""
        prompt_norm = prompt.strip().lower()
        return self.experiences.get(prompt_norm)

    def get_stats(self) -> Dict[str, Any]:
        rewards_count = 0
        losses_count = 0

        if REWARDS_FILE.exists():
            with open(REWARDS_FILE, "r", encoding="utf-8") as f:
                rewards_count = sum(1 for _ in f)

        if LOSSES_FILE.exists():
            with open(LOSSES_FILE, "r", encoding="utf-8") as f:
                losses_count = sum(1 for _ in f)

        total_interactions = rewards_count + losses_count
        reward_rate = round((rewards_count / total_interactions) * 100, 1) if total_interactions > 0 else 100.0

        return {
            "total_rewards": rewards_count,
            "total_losses": losses_count,
            "reward_rate_percent": reward_rate,
            "learned_experiences_count": len(self.experiences),
            "status": "active_continuous_learning"
        }

learning_engine = ContinuousLearningEngine()
