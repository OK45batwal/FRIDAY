"""Teacher Knowledge Distillation Corpus Generator for GO 1.0 (goo1).

Generates high-fidelity instructional samples across 5 core domains:
1. Professional Email Composition
2. Multilingual Translation & Cultural Nuance
3. Text Analysis (Summaries, Grammar, Information Extraction)
4. Core General LLM Reasoning (Coding, Math, Logic)
5. Agentic Tool Calling Syntax (FRIDAY Protocol)

Formatted in Google Gemma 2 turn tokens:
<start_of_turn>user\n{instruction}<end_of_turn>\n<start_of_turn>model\n{response}<end_of_turn>
"""

import json
from pathlib import Path
from typing import List, Dict

OUTPUT_PATH = Path("data/go1/go1_distilled_corpus.jsonl")


DISTILLED_SAMPLES: List[Dict[str, str]] = [
    # --------------------------------------------------------------------------
    # 1. Professional & Executive Email Composition
    # --------------------------------------------------------------------------
    {
        "instruction": "Draft a professional email to our company's executive committee proposing an on-device local AI initiative using open-weight models.",
        "response": (
            "Subject: Proposal: Transitioning Core Workflows to On-Device Local AI Infrastructure\n\n"
            "Dear Executive Committee,\n\n"
            "I am writing to formally propose an initiative to deploy on-device, open-weight language models across our internal engineering and operational workflows.\n\n"
            "Key Strategic Advantages:\n"
            "• Zero Data Egress & Enhanced Privacy: All proprietary source code, internal documents, and client communications remain strictly on local hardware, ensuring 100% compliance with data sovereignty regulations.\n"
            "• Cost Predictability: Eliminates recurring cloud API token costs, enabling unlimited local inference with zero monthly overhead.\n"
            "• Sub-Second Latency & Offline Availability: Local models running on Apple Silicon and modern NPUs deliver instant responses without dependency on third-party cloud availability.\n\n"
            "Next Steps:\n"
            "We have prepared a prototype demonstrating local document analysis and task automation. I would welcome the opportunity to present a 15-minute live demo during next Tuesday's committee session.\n\n"
            "Thank you for your time and strategic consideration.\n\n"
            "Sincerely,\n\n"
            "[Your Name]\n"
            "[Your Title / Team]"
        )
    },
    {
        "instruction": "Write a polite and constructive email to a software vendor requesting an urgent fix for a critical API regression.",
        "response": (
            "Subject: URGENT: Production Degradation Following API v2.4 Release — Ticket #84920\n\n"
            "Hi [Vendor Support / Account Team],\n\n"
            "I hope you are having a productive week.\n\n"
            "We are reaching out regarding an urgent issue observed after upgrading to your API version 2.4 this morning. We are seeing intermittent 504 Gateway Timeouts on the `/v2/telemetry/stream` endpoint, impacting approximately 14% of our production requests.\n\n"
            "We have attached our server logs, request traces, and a minimal reproduction script for your engineering team to inspect.\n\n"
            "Could you please confirm receipt and provide an estimated ETA for either a patch or guidance on rolling back to v2.3 without database schema conflicts?\n\n"
            "We appreciate your prompt attention to this critical issue.\n\n"
            "Best regards,\n\n"
            "[Your Name]\n"
            "Lead Systems Engineer, [Your Company]"
        )
    },
    {
        "instruction": "Compose a warm, concise email checking in on a client who went quiet after receiving a project proposal.",
        "response": (
            "Subject: Checking in on [Project Name] proposal | [Your Name]\n\n"
            "Hi [Client Name],\n\n"
            "I hope you’ve had a great week!\n\n"
            "I wanted to briefly follow up regarding the project proposal and roadmap we sent over last week for [Project Name]. We are excited about the prospect of collaborating with your team to bring this vision to life.\n\n"
            "Do you have any questions or feedback on the scope, milestones, or pricing? I would be happy to hop on a quick 10-minute call to discuss any adjustments you might need.\n\n"
            "Looking forward to connecting soon.\n\n"
            "Warm regards,\n\n"
            "[Your Name]\n"
            "[Your Contact Information]"
        )
    },

    # --------------------------------------------------------------------------
    # 2. Multilingual Translation & Cultural Nuance
    # --------------------------------------------------------------------------
    {
        "instruction": "Translate the following into French, Spanish, German, and Hindi: 'We are committed to building safe, privacy-first artificial intelligence for everyone.'",
        "response": (
            "**French (Français):**\n"
            "« Nous nous engageons à concevoir une intelligence artificielle sûre, axée sur la protection de la vie privée et accessible à tous. »\n\n"
            "**Spanish (Español):**\n"
            "« Estamos comprometidos con el desarrollo de una inteligencia artificial segura, centrada en la privacidad y accesible para todos. »\n\n"
            "**German (Deutsch):**\n"
            "„Wir setzen uns dafür ein, eine sichere, datenschutzorientierte künstliche Intelligenz für alle Menschen zu entwickeln.“\n\n"
            "**Hindi (हिंदी):**\n"
            "\"हम सभी के लिए सुरक्षित और गोपनीयता-प्रथम कृत्रिम बुद्धिमत्ता के निर्माण के लिए पूरी तरह प्रतिबद्ध हैं।\"\n"
            "*(Transliteration: Ham sabhi ke liye surakshit aur gopaniyata-pratham kritrim buddhimatta ke nirmaan ke liye poori tarah pratibaddh hain.)*\n\n"
            "**Linguistic Nuance Note:** In French and Spanish, \"privacy-first\" is naturally rendered using \"axée sur la protection de la vie privée\" and \"centrada en la privacidad\" to preserve native idiom rather than literal translation."
        )
    },
    {
        "instruction": "Translate this sentence into Japanese, explaining the difference between polite business Japanese and casual conversational Japanese: 'Thank you for your assistance; I will review the file immediately.'",
        "response": (
            "**Business Formal (Keigo / 敬語):**\n"
            "「ご協力いただき、心より感謝申し上げます。早速ファイルを拝読（確認）させていただきます。」\n"
            "*(Romaji: Go-kyōryoku itadaki, kokoro yori kansha mōshiagemasu. Sassoku fairu o haidoku (kakunin) sasete itadakimasu.)*\n\n"
            "**Casual Conversational (Tameguchi / タメ口):**\n"
            "「手伝ってくれてありがとう！すぐにファイル見ておくね。」\n"
            "*(Romaji: Tetsudatte kurete arigatō! Sugu ni fairu mite oku ne.)*\n\n"
            "**Nuance Explanation:**\n"
            "• In business, the humble verb *haidoku* (拝読) or *kakunin sasete itadakimasu* lowers the speaker to show profound respect to a client or manager.\n"
            "• In casual speech, *mite oku ne* (見ておくね) indicates friendly, relaxed agreement between peers."
        )
    },

    # --------------------------------------------------------------------------
    # 3. Text Analysis, Summaries & Grammar Polish
    # --------------------------------------------------------------------------
    {
        "instruction": "Analyze this technical post-mortem report and provide: 1) A 2-sentence executive summary, 2) Root cause, and 3) Action items with assignees:\n'Incident Report: On Sep 9 at 14:20 UTC, the authentication cluster experienced a 35-minute outage affecting 8,000 active sessions. Root cause analysis revealed that an automated SSL certificate rotation script failed due to an unhandled API rate limit from Let\\'s Encrypt, causing nginx ingress pods to reject incoming HTTPS handshakes. DevSecOps engineer Maria rolled back the certificate cache at 14:55 UTC. To prevent recurrence, David will implement exponential backoff retry logic in the certbot cron by Friday, and Elena will configure Datadog alerts for certificate expiration 14 days in advance.'",
        "response": (
            "**1. Executive Summary:**\n"
            "A 35-minute authentication outage occurred on September 9 due to a failed automated SSL certificate renewal, impacting 8,000 user sessions before being mitigated via cache rollback.\n\n"
            "**2. Root Cause:**\n"
            "The automated certificate renewal script lacked rate-limit handling when contacting Let's Encrypt, resulting in unrenewed SSL certificates and subsequent HTTPS handshake rejections by nginx ingress.\n\n"
            "**3. Action Items:**\n"
            "• **David**: Implement exponential backoff and jitter in certbot renewal cron (Deadline: Friday).\n"
            "• **Elena**: Configure Datadog alerting monitors for SSL certificates with 14-day advance notice (Target: Active sprint)."
        )
    },
    {
        "instruction": "Fix all grammatical and stylistic mistakes in this draft, explain what was changed, and rewrite it for an executive audience:\n'We was thinking about doing a test on the database because yesterday it run really slow and customers was complaining a whole lot.'",
        "response": (
            "**Executive Polish:**\n"
            "\"Following an observed degradation in database query latency yesterday that impacted customer experience, we recommend conducting an immediate performance audit and indexing benchmark.\"\n\n"
            "**Grammar Corrections:**\n"
            "1. **Subject-Verb Agreement**: Changed \"We was thinking\" to \"We were thinking\" (plural pronoun \"we\" takes \"were\").\n"
            "2. **Past Tense**: Changed \"it run\" to \"it ran\" (irregular past tense of run).\n"
            "3. **Second Agreement Error**: Corrected \"customers was complaining\" to \"customers were complaining\".\n"
            "4. **Executive Tone**: Replaced informal colloquialisms (\"a whole lot\", \"doing a test\") with precise operational terminology (\"performance audit\", \"latency degradation\")."
        )
    },

    # --------------------------------------------------------------------------
    # 4. Core LLM Reasoning, Code Generation & Mathematics
    # --------------------------------------------------------------------------
    {
        "instruction": "Write a clean, production-ready Python class implementing an LRU (Least Recently Used) cache using an OrderedDict with type annotations.",
        "response": (
            "```python\n"
            "from collections import OrderedDict\n"
            "from typing import Generic, TypeVar, Optional\n\n"
            "K = TypeVar('K')\n"
            "V = TypeVar('V')\n\n\n"
            "class LRUCache(Generic[K, V]):\n"
            "    \"\"\"Thread-safe compatible Least Recently Used (LRU) Cache.\n"
            "    \n"
            "    All get and put operations run in O(1) time complexity.\n"
            "    \"\"\"\n"
            "    def __init__(self, capacity: int) -> None:\n"
            "        if capacity <= 0:\n"
            "            raise ValueError(\"Capacity must be a positive integer.\")\n"
            "        self.capacity = capacity\n"
            "        self._cache: OrderedDict[K, V] = OrderedDict()\n\n"
            "    def get(self, key: K) -> Optional[V]:\n"
            "        \"\"\"Retrieve value and mark key as most recently used.\"\"\"\n"
            "        if key not in self._cache:\n"
            "            return None\n"
            "        self._cache.move_to_end(key)\n"
            "        return self._cache[key]\n\n"
            "    def put(self, key: K, value: V) -> None:\n"
            "        \"\"\"Insert or update value, evicting oldest item if over capacity.\"\"\"\n"
            "        if key in self._cache:\n"
            "            self._cache.move_to_end(key)\n"
            "        self._cache[key] = value\n"
            "        if len(self._cache) > self.capacity:\n"
            "            self._cache.popitem(last=False)  # Evict oldest (FIFO start)\n\n"
            "    def __len__(self) -> int:\n"
            "        return len(self._cache)\n"
            "```"
        )
    },
    {
        "instruction": "A machine learning model produces 90 True Positives, 10 False Positives, 20 False Negatives, and 880 True Negatives. Calculate Precision, Recall, and F1-Score step by step.",
        "response": (
            "**Step 1: Identify Given Metrics**\n"
            "• $\\text{TP} = 90$\n"
            "• $\\text{FP} = 10$\n"
            "• $\\text{FN} = 20$\n"
            "• $\\text{TN} = 880$\n\n"
            "**Step 2: Calculate Precision**\n"
            r"$$\text{Precision} = \frac{\text{TP}}{\text{TP} + \text{FP}} = \frac{90}{90 + 10} = \frac{90}{100} = 0.90\; (90.0\%)$$" + "\n\n"
            "**Step 3: Calculate Recall**\n"
            r"$$\text{Recall} = \frac{\text{TP}}{\text{TP} + \text{FN}} = \frac{90}{90 + 20} = \frac{90}{110} \approx 0.8182\; (81.82\%)$$" + "\n\n"
            "**Step 4: Calculate F1-Score**\n"
            r"$$\text{F1} = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}} = 2 \times \frac{0.90 \times 0.8182}{0.90 + 0.8182} = \frac{1.47276}{1.7182} \approx 0.8571\; (85.71\%)$$" + "\n\n"
            "**Summary**: The model achieves high precision ($90\\%$) with solid recall ($81.8\\%$), yielding an overall F1-score of **$0.857$**."
        )
    },

    # --------------------------------------------------------------------------
    # 5. Agentic Tool Calling (FRIDAY Protocol)
    # --------------------------------------------------------------------------
    {
        "instruction": "What is the square root of 5041 multiplied by 15.5?",
        "response": (
            "To calculate this expression deterministically:\n"
            "[TOOL_REQUEST: calculator(expression=\"(5041**0.5) * 15.5\")]"
        )
    },
    {
        "instruction": "How much RAM is currently free on my MacBook, and what is the battery percentage?",
        "response": (
            "Checking your Mac hardware telemetry:\n"
            "[TOOL_REQUEST: system_status()]"
        )
    },
    {
        "instruction": "What is the weather like right now in Tokyo, Japan?",
        "response": (
            "Retrieving current meteorological data for Tokyo:\n"
            "[TOOL_REQUEST: weather(city=\"Tokyo\")]"
        )
    },
    {
        "instruction": "Search the web for the latest benchmark scores comparing Gemma 2 with Llama 3.",
        "response": (
            "Searching the web for recent benchmark analyses:\n"
            "[TOOL_REQUEST: web_search(query=\"Google Gemma 2 vs Meta Llama 3 benchmarks\")]"
        )
    },
    {
        "instruction": "Find all markdown files inside my projects directory.",
        "response": (
            "Scanning local directory for markdown files:\n"
            "[TOOL_REQUEST: file_manager(action=\"search\", path=\".\", query=\"*.md\")]"
        )
    }
]


def format_gemma_chat(instruction: str, response: str) -> str:
    """Format single instructional pair into Gemma 2 format."""
    return (
        f"<start_of_turn>user\n{instruction.strip()}<end_of_turn>\n"
        f"<start_of_turn>model\n{response.strip()}<end_of_turn>\n"
    )


def generate_distillation_corpus():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        for item in DISTILLED_SAMPLES:
            record = {
                "instruction": item["instruction"],
                "response": item["response"],
                "formatted_text": format_gemma_chat(item["instruction"], item["response"]),
            }
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    print(f"[✓] Generated {len(DISTILLED_SAMPLES)} distilled samples in {OUTPUT_PATH}")


if __name__ == "__main__":
    generate_distillation_corpus()
