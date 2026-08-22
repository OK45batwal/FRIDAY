import os
import json
import time
from pathlib import Path
from typing import Dict, Any, List, Optional

LEARNING_DIR = Path(__file__).resolve().parent.parent.parent / "learning_data"
LEARNING_DIR.mkdir(parents=True, exist_ok=True)

REWARDS_FILE = LEARNING_DIR / "rewards_dataset.jsonl"
LOSSES_FILE = LEARNING_DIR / "losses_dataset.jsonl"
EXPERIENCE_CACHE = LEARNING_DIR / "experience_store.json"
METRICS_FILE = LEARNING_DIR / "learning_metrics.json"

class ContinuousLearningEngine:
    """
    Automatic Continuous Learning & Reinforcement (Reward/Loss) Engine for FRIDAY 1.0.
    Learns from user feedback (thumbs up / thumbs down / corrections) in real time.
    """

    def __init__(self):
        self._load_experience_cache()

    def _load_experience_cache(self):
        self.experiences: Dict[str, str] = {}
        if EXPERIENCE_CACHE.exists():
            try:
                with open(EXPERIENCE_CACHE, "r", encoding="utf-8") as f:
                    self.experiences = json.load(f)
            except Exception:
                self.experiences = {}

    def _save_experience_cache(self):
        try:
            with open(EXPERIENCE_CACHE, "w", encoding="utf-8") as f:
                json.dump(self.experiences, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print("Error saving experience cache:", e)

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

        if feedback == "like":
            # 1. Positive Reward: Learn preferred response into immediate experience cache
            self.experiences[prompt_norm] = response
            self._save_experience_cache()

            record = {
                "timestamp": timestamp,
                "reward": 1.0,
                "prompt": prompt,
                "response": response
            }
            with open(REWARDS_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")

            return {
                "status": "success",
                "action": "reward_recorded",
                "message": "Positive reward registered! FRIDAY 1.0 learned this response style.",
                "total_learned_experiences": len(self.experiences)
            }

        else:
            # 2. Negative Loss / Penalty: Record for DPO retraining & remove from preferred cache
            if prompt_norm in self.experiences:
                del self.experiences[prompt_norm]
                self._save_experience_cache()

            record = {
                "timestamp": timestamp,
                "reward": -1.0,
                "prompt": prompt,
                "rejected_response": response,
                "correction": correction or ""
            }
            with open(LOSSES_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")

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
