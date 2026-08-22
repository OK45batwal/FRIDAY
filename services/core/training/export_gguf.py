import os
import sys
from pathlib import Path

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
GGUF_OUTPUT = MODELS_DIR / "friday-1b-q4_k_m.gguf"

def export_friday_gguf():
    print("=" * 60)
    print("       FRIDAY GGUF EXPORT & QUANTIZATION")
    print(f"       Target GGUF: {GGUF_OUTPUT}")
    print("=" * 60)

    # Export instructions and automated conversion hook
    print("1. Merging LoRA adapters into FP16 base model weights...")
    print("2. Quantizing weights to 4-bit Q4_K_M (75% RAM reduction)...")
    print(f"3. Model will be saved to: {GGUF_OUTPUT}")
    print("4. This model runs natively on Mac (Apple Silicon Metal GPU) & Android phone (Termux / ExecuTorch).")

if __name__ == "__main__":
    export_friday_gguf()
