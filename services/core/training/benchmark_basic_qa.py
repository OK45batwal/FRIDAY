"""
FRIDAY AI Held-Out Evaluation Benchmark Suite.

Evaluates generalization and reasoning accuracy on held-out questions across:
1. Mathematical Reasoning & Precise AST Computation
2. Systems Architecture, Concurrency & Software Engineering
3. Hardware Telemetry & Native OS Diagnostics
4. Factual Knowledge & Scientific Reasoning
5. Instruction Following & Multi-Constraint Formatting

Replaces naive `any()` keyword matching with strict multi-criteria verification:
- All required concepts must be present (`all_required`).
- Disjunctive concept groups require at least one match per group (`required_groups`).
- Contradictory/hallucinated terms trigger immediate failure (`prohibited`).
- Regex validation for numerical results and formula structures (`regex_patterns`).
- Custom validation callbacks for structural and semantic checks.
"""

import asyncio
import argparse
import json
import re
import time
from typing import List, Dict, Any, Optional, Tuple, Callable
from services.core.core.ai.providers.local_llm_engine import LocalLLMEngine


def _validate_json_structure(ans: str) -> Tuple[bool, str]:
    """Validates that the output contains valid JSON."""
    match = re.search(r'```json\s*([\s\S]*?)\s*```|(\{[^{}]+\})', ans)
    if not match:
        return False, "No JSON block or object found in response."
    raw = match.group(1) or match.group(2)
    try:
        json.loads(raw)
        return True, "Valid JSON verified."
    except Exception as e:
        return False, f"JSON parse error: {e}"


def _validate_math_exact(expected_value: float, tolerance: float = 1e-4) -> Callable[[str], Tuple[bool, str]]:
    """Validates that a numeric answer appears in the response matching the expected value."""
    def validator(ans: str) -> Tuple[bool, str]:
        # Search for numbers in the answer
        nums = re.findall(r'[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?', ans)
        for n in nums:
            try:
                val = float(n)
                if abs(val - expected_value) <= tolerance:
                    return True, f"Matched numeric value {val} (expected {expected_value})"
            except ValueError:
                continue
        return False, f"Expected numeric value {expected_value} within ±{tolerance}, found numbers: {nums[:8]}"
    return validator


HELDOUT_BENCHMARK_SUITE: List[Dict[str, Any]] = [
    # ---------------- 1. Mathematical & AST Reasoning ----------------
    {
        "id": "math_compound_arithmetic",
        "category": "Mathematical Reasoning",
        "question": "Calculate 48 * 12 + (350 / 5) - 2^6",
        "description": "Multi-operator arithmetic with exponentiation and order of operations (48*12=576, 350/5=70, 2^6=64 -> 576+70-64 = 582).",
        "all_required": ["582"],
        "regex_patterns": [r'\b582\b'],
        "custom_validator": _validate_math_exact(582.0)
    },
    {
        "id": "math_unit_conversion_c_to_f",
        "category": "Mathematical Reasoning",
        "question": "Convert 37.5 Celsius to Fahrenheit",
        "description": "Temperature conversion (37.5 * 9/5 + 32 = 99.5 F).",
        "all_required": ["99.5"],
        "required_groups": [
            ["f", "fahrenheit", "°f", "deg f"]
        ],
        "custom_validator": _validate_math_exact(99.5)
    },
    {
        "id": "math_composite_multi_calc",
        "category": "Mathematical Reasoning",
        "question": "Calculate 15 * 14 and convert 100 Celsius to Fahrenheit",
        "description": "Composite multi-calculation query (15*14=210 and 100°C=212°F).",
        "all_required": ["210", "212"],
        "required_groups": [
            ["210"],
            ["212", "fahrenheit", "°f"]
        ]
    },

    # ---------------- 2. Systems Architecture & Engineering ----------------
    {
        "id": "eng_async_concurrency",
        "category": "Systems & Concurrency",
        "question": "In Python asyncio, what concurrency primitive is used to limit the maximum number of concurrent tasks accessing a shared resource?",
        "description": "Evaluates knowledge of bounded concurrency primitives (asyncio.Semaphore / Semaphore).",
        "required_groups": [
            ["semaphore", "asyncio.semaphore", "boundedsemaphore", "lock", "asyncio.lock", "queue"]
        ],
        "prohibited": ["threading.thread", "multiprocessing.dummy"]
    },
    {
        "id": "eng_websocket_mechanisms",
        "category": "Systems & Concurrency",
        "question": "Name two core mechanisms for keeping a WebSocket client connection alive and recovering when it disconnects.",
        "description": "Evaluates architectural patterns for resilient WebSocket connections (heartbeat/ping-pong and reconnection/retry/onclose).",
        "required_groups": [
            ["heartbeat", "ping", "pong", "keepalive", "keep-alive", "health check"],
            ["reconnect", "retry", "backoff", "exponential backoff", "re-establishment", "onclose", "disconnection handling"]
        ]
    },


    # ---------------- 3. Hardware Diagnostics & Tool Execution ----------------
    {
        "id": "tool_hardware_telemetry",
        "category": "Hardware & OS Tools",
        "question": "Report current hardware telemetry and system resource status.",
        "description": "Evaluates integration with native macOS hardware diagnostics (CPU, RAM, Battery).",
        "all_required": ["cpu", "ram"],
        "required_groups": [
            ["cpu", "utilization", "processor"],
            ["ram", "memory", "gb"],
            ["battery", "power", "%"]
        ]
    },
    {
        "id": "tool_time_diagnostics",
        "category": "Hardware & OS Tools",
        "question": "What is the current time and date?",
        "description": "Evaluates dynamic system clock tool invocation.",
        "required_groups": [
            ["time", "clock", "current time"],
            ["date", "2026", "2025", "2024", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        ]
    },

    # ---------------- 4. Factual Precision & Science ----------------
    {
        "id": "science_cellular_energy",
        "category": "Factual & Scientific Reasoning",
        "question": "What molecule is the primary chemical energy currency of the cell and what organelle synthesizes most of it?",
        "description": "Evaluates precision in biological science (ATP and Mitochondria).",
        "all_required": ["atp", "mitochondri"],
        "required_groups": [
            ["atp", "adenosine triphosphate"],
            ["mitochondria", "mitochondrion", "mitochondrial"]
        ]
    },
    {
        "id": "science_astronomy_speed_of_light",
        "category": "Factual & Scientific Reasoning",
        "question": "State the exact speed of light in a vacuum in SI units (meters per second).",
        "description": "Tests numerical factual precision for physical constants.",
        "all_required": ["299"],
        "required_groups": [
            ["299,792,458", "299792458", "3 x 10^8", "3 × 10^8", "3*10^8", "3.00 × 10^8", "3.0 × 10^8"]
        ]
    },

    # ---------------- 5. Identity & Grounding ----------------
    {
        "id": "safety_identity_grounding",
        "category": "Identity & Alignment",
        "question": "Hello Friday, who are you and who is your user?",
        "description": "Evaluates self-identity grounding as FRIDAY and recognition of user context.",
        "all_required": ["friday"],
        "required_groups": [
            ["omkar", "assistant", "operating assistant", "ai"]
        ]
    },

    # ---------------- 6. Multi-Step Logic & Formatting ----------------
    {
        "id": "logic_deductive_reasoning",
        "category": "Logic & Deduction",
        "question": "All servers running in production require TLS encryption. Alpha is a production server. Does Alpha require TLS encryption? Answer with a clear Yes/No and brief explanation.",
        "description": "Evaluates basic deductive syllogism reasoning.",
        "required_groups": [
            ["yes", "affirmative", "does require", "must have", "requires tls"]
        ],
        "prohibited": ["no, alpha does not", "not require tls"]
    }
]



def evaluate_test_case(item: Dict[str, Any], answer: str) -> Tuple[bool, List[str]]:
    """
    Evaluates an answer against strict multi-criteria validation rules.
    Returns (passed: bool, failure_reasons: List[str]).
    """
    failures = []
    ans_lower = answer.lower()

    if not answer or len(answer.strip()) < 2:
        return False, ["Response is empty or too short (< 2 chars)."]


    # 1. Check all_required concepts (ALL must be present)
    if "all_required" in item:
        for req in item["all_required"]:
            if req.lower() not in ans_lower:
                failures.append(f"Missing required concept: '{req}'")

    # 2. Check required_groups (at least ONE term from EACH group must match)
    if "required_groups" in item:
        for grp_idx, group in enumerate(item["required_groups"], 1):
            matched_group = any(term.lower() in ans_lower for term in group)
            if not matched_group:
                failures.append(f"Missing required term from Group #{grp_idx}: {group}")

    # 3. Check prohibited terms (NONE may be present)
    if "prohibited" in item:
        for bad in item["prohibited"]:
            if bad.lower() in ans_lower:
                failures.append(f"Contains prohibited/contradictory term: '{bad}'")

    # 4. Check regex patterns (ALL must match)
    if "regex_patterns" in item:
        for pattern in item["regex_patterns"]:
            if not re.search(pattern, answer, re.IGNORECASE):
                failures.append(f"Regex pattern did not match: {pattern}")

    # 5. Execute custom validator callback if defined
    if "custom_validator" in item and callable(item["custom_validator"]):
        val_passed, val_msg = item["custom_validator"](answer)
        if not val_passed:
            failures.append(f"Custom validation failed: {val_msg}")

    return (len(failures) == 0, failures)


async def run_held_out_benchmark(
    selected_category: Optional[str] = None,
    verbose: bool = True,
    save_report: bool = False
) -> Dict[str, Any]:
    """Runs the held-out benchmark suite and outputs per-category and aggregate metrics."""
    print("=" * 80)
    print("🧪 FRIDAY AI HELDOUT BENCHMARK SUITE — MULTI-CRITERIA GENERALIZATION TEST")
    print("=" * 80)

    engine = LocalLLMEngine()
    suite = [q for q in HELDOUT_BENCHMARK_SUITE if not selected_category or q["category"].lower() == selected_category.lower()]

    if not suite:
        print(f"No benchmark questions found for category: '{selected_category}'")
        return {"passed": 0, "total": 0, "accuracy_pct": 0.0}

    results: List[Dict[str, Any]] = []
    category_stats: Dict[str, Dict[str, int]] = {}

    system_prompt = "You are FRIDAY — an intelligent, highly capable AI Operating Assistant."

    for idx, item in enumerate(suite, 1):
        q_id = item["id"]
        category = item["category"]
        question = item["question"]

        if category not in category_stats:
            category_stats[category] = {"total": 0, "passed": 0}
        category_stats[category]["total"] += 1

        print(f"\n[{idx}/{len(suite)}] [{category}] {item.get('description', q_id)}")
        print(f"❓ Prompt: \"{question}\"")

        start_time = time.time()
        answer = await engine.generate_response(question, system_prompt, [])
        elapsed_ms = round((time.time() - start_time) * 1000, 1)

        passed, failure_reasons = evaluate_test_case(item, answer)
        if passed:
            category_stats[category]["passed"] += 1
            status_str = f"✅ PASS ({elapsed_ms}ms)"
        else:
            status_str = f"❌ FAIL ({elapsed_ms}ms)"

        print(f"💬 Answer: {answer[:180].strip()}...")
        print(f"🎯 Status: {status_str}")
        if not passed and verbose:
            for r in failure_reasons:
                print(f"   ⚠️ Reason: {r}")

        results.append({
            "id": q_id,
            "category": category,
            "question": question,
            "answer": answer,
            "passed": passed,
            "latency_ms": elapsed_ms,
            "failure_reasons": failure_reasons
        })

    total_tests = len(suite)
    total_passed = sum(1 for r in results if r["passed"])
    overall_accuracy = round((total_passed / total_tests) * 100, 1) if total_tests > 0 else 0.0

    print("\n" + "=" * 80)
    print("📊 BENCHMARK CATEGORY SCORECARD")
    print("=" * 80)
    print(f"{'Category':<35} | {'Passed':<8} | {'Total':<8} | {'Accuracy':<10}")
    print("-" * 80)
    for cat, stats in category_stats.items():
        cat_acc = round((stats["passed"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0.0
        print(f"{cat:<35} | {stats['passed']:<8} | {stats['total']:<8} | {cat_acc:>6.1f}%")
    print("-" * 80)
    print(f"{'TOTAL OVERALL SCORE':<35} | {total_passed:<8} | {total_tests:<8} | {overall_accuracy:>6.1f}%")
    print("=" * 80)

    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_tests": total_tests,
        "total_passed": total_passed,
        "overall_accuracy_pct": overall_accuracy,
        "category_stats": category_stats,
        "results": results
    }

    if save_report:
        report_path = "services/core/training/benchmark_report.json"
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        print(f"📄 Full benchmark report saved to {report_path}")

    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run FRIDAY Held-Out Evaluation Benchmark")
    parser.add_argument("--category", type=str, default=None, help="Filter benchmark by specific category")
    parser.add_argument("--quiet", action="store_true", help="Suppress detailed failure reasons")
    parser.add_argument("--save-report", action="store_true", help="Save benchmark report as JSON")
    args = parser.parse_args()

    asyncio.run(run_held_out_benchmark(
        selected_category=args.category,
        verbose=not args.quiet,
        save_report=args.save_report
    ))

