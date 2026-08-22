import asyncio
import re
from typing import List, Dict, Any
from services.core.core.ai.providers.local_llm_engine import LocalLLMEngine

BENCHMARK_QUESTIONS: List[Dict[str, Any]] = [
    {
        "id": "anatomy_bones",
        "question": "How many bones are in the adult human body?",
        "expected_keywords": ["206", "bones"]
    },
    {
        "id": "science_photosynthesis",
        "question": "What is photosynthesis and what does it produce?",
        "expected_keywords": ["glucose", "oxygen", "sunlight"]
    },
    {
        "id": "physics_light_speed",
        "question": "What is the speed of light in a vacuum?",
        "expected_keywords": ["299,792,458", "3", "10^8", "m/s", "186,282"]
    },
    {
        "id": "geography_capitals",
        "question": "What are the capitals of France and Japan?",
        "expected_keywords": ["Paris", "Tokyo"]
    },
    {
        "id": "math_water_boiling",
        "question": "What is the boiling and freezing point of water in Celsius and Fahrenheit?",
        "expected_keywords": ["100", "0", "212", "32"]
    },
    {
        "id": "coding_python",
        "question": "How do you create a function and a list in Python?",
        "expected_keywords": ["def", "["]
    }
]

async def run_benchmark():
    print("=" * 70)
    print("🧪 RUNNING BASIC QA FACTUAL ACCURACY BENCHMARK ON FRIDAY LLM")
    print("=" * 70)

    engine = LocalLLMEngine()
    passed = 0
    total = len(BENCHMARK_QUESTIONS)

    for item in BENCHMARK_QUESTIONS:
        q = item["question"]
        print(f"\n❓ Question: \"{q}\"")
        ans = await engine.generate_response(q, "You are FRIDAY, an intelligent assistant.", [])
        print(f"💬 Answer:\n{ans[:250]}...\n")

        # Check if expected keywords are present
        matched = any(k.lower() in ans.lower() for k in item["expected_keywords"])
        if matched:
            print(f"✅ PASS: Matched expected factual knowledge.")
            passed += 1
        else:
            print(f"⚠️ REVIEW: Did not match keywords {item['expected_keywords']}")

    print("=" * 70)
    score_pct = round((passed / total) * 100, 1)
    print(f"📊 Benchmark Results: {passed}/{total} Passed ({score_pct}%)")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_benchmark())
