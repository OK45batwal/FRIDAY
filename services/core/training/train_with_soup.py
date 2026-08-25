"""
🥣 FRIDAY Soup Training Runner
Runs data preparation and launches the Soup layer-streaming fine-tuning pipeline.
"""
import os
import sys
import subprocess
from pathlib import Path

TRAINING_DIR = Path(__file__).resolve().parent
DATA_DIR = TRAINING_DIR / "data"
DATASET_PATH = DATA_DIR / "friday_dataset.jsonl"
SOUP_CONFIG = TRAINING_DIR / "soup.yaml"

def ensure_dataset():
    if not DATASET_PATH.exists():
        print("📊 Dataset not found. Generating domain training dataset...")
        import services.core.training.dataset_generator as dg
        dg.generate_dataset()
    print(f"✅ Training dataset ready: {DATASET_PATH}")

def main():
    print("=" * 70)
    print("🥣 FRIDAY AI — SOUP LAYER-STREAMING FINE-TUNING PIPELINE")
    print("=" * 70)
    
    ensure_dataset()
    
    print(f"📄 Loaded Soup Config: {SOUP_CONFIG}")
    print("\nTo train with Soup Layer Streaming:")
    print("  1. Install Soup CLI: pip install \"soup-cli[train]\"")
    print(f"  2. Run Training:     soup train --config {SOUP_CONFIG}")
    print(f"  3. Export GGUF:      soup export --config {SOUP_CONFIG}\n")

    # Check if soup-cli is installed
    try:
        res = subprocess.run(["soup", "--version"], capture_output=True, text=True)
        print(f"🚀 Found Soup CLI: {res.stdout.strip()}")
        print("Starting training run...")
        subprocess.run(["soup", "train", "--config", str(SOUP_CONFIG)])
    except FileNotFoundError:
        print("💡 Tip: Install Soup CLI by running: pip install \"soup-cli[train]\"")

if __name__ == "__main__":
    main()
