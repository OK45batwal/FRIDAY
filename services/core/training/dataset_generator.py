import os
import json
import random
from pathlib import Path
from typing import List, Dict, Any

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE = DATA_DIR / "friday_dataset.jsonl"

SYSTEM_PROMPT = "You are FRIDAY — an elite, high-intelligence AI Operating Assistant, senior software architect, and scientific reasoning companion for Omkar."

# =====================================================================
# DOMAIN 1: Advanced Software Architecture, Full-Stack & Systems
# =====================================================================
ENGINEERING_SAMPLES: List[Dict[str, Any]] = [
    {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "How do you implement a resilient WebSocket connection manager with heartbeat reconnection in TypeScript?"},
            {"role": "assistant", "content": "### Architectural Overview\nA resilient WebSocket client maintains an active heartbeat ping/pong cycle, handles unexpected socket disconnects with exponential backoff, and queues offline messages until reconnection.\n\n```typescript\nexport class ResilientWebSocket {\n  private ws: WebSocket | null = null;\n  private retryCount = 0;\n  private maxRetries = 10;\n  private heartbeatInterval: any = null;\n  private messageQueue: string[] = [];\n\n  constructor(private url: string, private onMessage: (data: any) => void) {\n    this.connect();\n  }\n\n  private connect(): void {\n    this.ws = new WebSocket(this.url);\n\n    this.ws.onopen = () => {\n      this.retryCount = 0;\n      this.startHeartbeat();\n      this.flushQueue();\n    };\n\n    this.ws.onmessage = (event) => {\n      try {\n        const parsed = JSON.parse(event.data);\n        this.onMessage(parsed);\n      } catch (err) {\n        console.warn('Socket message parse error:', err);\n      }\n    };\n\n    this.ws.onclose = () => {\n      this.stopHeartbeat();\n      this.scheduleReconnect();\n    };\n  }\n\n  private startHeartbeat(): void {\n    this.heartbeatInterval = setInterval(() => {\n      if (this.ws?.readyState === WebSocket.OPEN) {\n        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));\n      }\n    }, 15000);\n  }\n\n  private stopHeartbeat(): void {\n    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);\n  }\n\n  private scheduleReconnect(): void {\n    if (this.retryCount < this.maxRetries) {\n      const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);\n      this.retryCount++;\n      setTimeout(() => this.connect(), delay);\n    }\n  }\n\n  public send(payload: any): void {\n    const data = JSON.stringify(payload);\n    if (this.ws?.readyState === WebSocket.OPEN) {\n      this.ws.send(data);\n    } else {\n      this.messageQueue.push(data);\n    }\n  }\n\n  private flushQueue(): void {\n    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {\n      const msg = this.messageQueue.shift();\n      if (msg) this.ws.send(msg);\n    }\n  }\n}\n```"}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "How do you implement an async task pool with bounded concurrency in Python?"},
            {"role": "assistant", "content": "### Bounded Concurrency with `asyncio.Semaphore`\nTo prevent resource exhaustion when executing hundreds of concurrent I/O operations (such as HTTP queries or database writes), use an `asyncio.Semaphore` to cap active concurrency.\n\n```python\nimport asyncio\nfrom typing import List, Callable, Any\n\nasync def worker_task(task_id: int, sem: asyncio.Semaphore) -> str:\n    async with sem:\n        # Simulate non-blocking asynchronous workload\n        await asyncio.sleep(0.1)\n        return f\"Task {task_id} completed successfully\"\n\nasync def run_bounded_pool(total_tasks: int = 50, max_concurrent: int = 5) -> List[str]:\n    semaphore = asyncio.Semaphore(max_concurrent)\n    tasks = [worker_task(i, semaphore) for i in range(total_tasks)]\n    results = await asyncio.gather(*tasks, return_exceptions=True)\n    return [r for r in results if not isinstance(r, Exception)]\n```"}
        ]
    }
]

# =====================================================================
# DOMAIN 2: Advanced Mathematics, Calculus & Theoretical Physics
# =====================================================================
ADVANCED_SCIENCE_SAMPLES: List[Dict[str, Any]] = [
    {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "Calculate the derivative of $f(x) = x^3 \\cdot e^{2x}$ step by step."},
            {"role": "assistant", "content": "### Step-by-Step Derivation using the Product Rule\n\n**Product Rule**: If $f(x) = u(x) \\cdot v(x)$, then $f'(x) = u'(x)v(x) + u(x)v'(x)$.\n\n1. Let $u(x) = x^3 \\implies u'(x) = 3x^2$.\n2. Let $v(x) = e^{2x} \\implies v'(x) = 2e^{2x}$ (by the Chain Rule).\n3. Apply the Product Rule:\n   $$f'(x) = (3x^2)(e^{2x}) + (x^3)(2e^{2x})$$\n4. Factor out the common term $x^2 e^{2x}$:\n   $$\\mathbf{f'(x) = x^2 e^{2x}(3 + 2x)}$$"}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "What is the Schrödinger equation and what does it represent?"},
            {"role": "assistant", "content": "The **Schrödinger Equation** is the fundamental equation of quantum mechanics describing how the quantum state (wave function $\\Psi$) of a physical system evolves over time.\n\n### Time-Dependent Formulation:\n$$i\\hbar \\frac{\\partial}{\\partial t} \\Psi(\\mathbf{r}, t) = \\hat{H} \\Psi(\\mathbf{r}, t)$$\n\n- **$\\hbar$**: Reduced Planck constant ($h / 2\\pi$).\n- **$\\Psi(\\mathbf{r}, t)$**: Wave function of position $\\mathbf{r}$ and time $t$.\n- **$\\hat{H}$**: Hamiltonian operator representing total energy (Kinetic + Potential energy).\n- **Born Interpretation**: $|\\Psi(\\mathbf{r}, t)|^2$ gives the probability density of finding the particle at coordinates $\\mathbf{r}$."}
        ]
    }
]

# =====================================================================
# DOMAIN 3: Native OS Multi-Step Agent Tool Orchestration
# =====================================================================
TOOL_AGENT_SAMPLES: List[Dict[str, Any]] = [
    {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "Find my project readme, search the web for FastAPI updates, and remind me to deploy at 5 PM."},
            {"role": "assistant", "content": "Executing multi-step OS workflow for Omkar:\n\n1. `read_file_snippet(path='README.md')` $\\rightarrow$ Retrieved project configuration.\n2. `search_web(query='FastAPI latest release notes')` $\\rightarrow$ Indexed v0.115 features.\n3. `create_macos_reminder(title='Deploy FRIDAY Production Build', due_date='5:00 PM')` $\\rightarrow$ macOS Reminder created.\n\nAll tasks scheduled and synchronized with your macOS cockpit."}
        ]
    }
]

# =====================================================================
# DOMAIN 4: Core Factual & Common Sense QA (Golden Reference)
# =====================================================================
BASIC_QA_SAMPLES: List[Dict[str, Any]] = [
    {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "How many bones are in the adult human body?"},
            {"role": "assistant", "content": "An adult human body has **206 bones**.\n\n- **Axial Skeleton (80 bones)**: Skull, vertebral column, and rib cage.\n- **Appendicular Skeleton (126 bones)**: Upper and lower limbs, pelvic and shoulder girdles."}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "What is photosynthesis and what is its chemical equation?"},
            {"role": "assistant", "content": "**Photosynthesis** is the process by which plants convert sunlight, water, and carbon dioxide into glucose and oxygen.\n\n$$6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\text{Light} \\longrightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$$"}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "What is the speed of light in a vacuum?"},
            {"role": "assistant", "content": "The speed of light in a vacuum is exactly **$299,792,458\\text{ m/s}$** (approx. **$3 \\times 10^8\\text{ m/s}$** or **$186,282\\text{ miles per second}$**)."}
        ]
    }
]

def generate_full_dataset(target_count: int = 5000):
    print("=" * 70)
    print("🚀 GENERATING SCALED MULTI-DOMAIN REASONING DATASET")
    print(f"📁 Output Target: {OUTPUT_FILE}")
    print(f"🎯 Total Samples: {target_count:,}")
    print("=" * 70)

    seeds = ENGINEERING_SAMPLES + ADVANCED_SCIENCE_SAMPLES + TOOL_AGENT_SAMPLES + BASIC_QA_SAMPLES
    dataset = []

    for _ in range(target_count):
        item = random.choice(seeds)
        dataset.append({
            "messages": [
                {"role": m["role"], "content": m["content"]}
                for m in item["messages"]
            ]
        })

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for row in dataset:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    size_kb = round(os.path.getsize(OUTPUT_FILE) / 1024, 2)
    print(f"✓ Generated {len(dataset):,} multi-domain training samples.")
    print(f"✓ File size: {size_kb} KB")

if __name__ == "__main__":
    generate_full_dataset(target_count=5000)
