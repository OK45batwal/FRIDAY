import os
import sys
import json
from pathlib import Path

TRAINING_DIR = Path(__file__).resolve().parent
DATA_PATH = TRAINING_DIR / "data" / "friday_dataset.jsonl"
OUTPUT_DIR = TRAINING_DIR / "output" / "friday-1b-lora"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def train_friday_slm(
    base_model_name: str = "Qwen/Qwen2.5-0.5B-Instruct",
    epochs: int = 3,
    learning_rate: float = 2e-4,
    batch_size: int = 4
):
    print("=" * 60)
    print(f"       FRIDAY SLM FINE-TUNING PIPELINE")
    print(f"       Base Model: {base_model_name}")
    print(f"       Dataset:    {DATA_PATH}")
    print(f"       Output:     {OUTPUT_DIR}")
    print("=" * 60)

    if not DATA_PATH.exists():
        print(f"Error: Dataset not found at {DATA_PATH}. Run dataset_generator.py first.")
        return

    # Check hardware accelerator
    device = "cpu"
    try:
        import torch
        if torch.backends.mps.is_available():
            device = "mps (Apple Silicon Metal GPU)"
        elif torch.cuda.is_available():
            device = f"cuda ({torch.cuda.get_device_name(0)})"
    except Exception:
        pass

    print(f"Hardware Accelerator: {device}")
    print(f"Training Epochs:       {epochs}")
    print(f"Learning Rate:         {learning_rate}")
    print(f"Batch Size:            {batch_size}")
    print("-" * 60)

    # Save training configuration metadata
    config_info = {
        "model_name": base_model_name,
        "device": device,
        "epochs": epochs,
        "learning_rate": learning_rate,
        "batch_size": batch_size,
        "lora_rank": 16,
        "lora_alpha": 32,
        "dataset_path": str(DATA_PATH),
        "status": "ready_for_execution"
    }

    with open(OUTPUT_DIR / "training_config.json", "w") as f:
        json.dump(config_info, f, indent=2)

    print("✓ Training config saved successfully.")
    print("✓ Ready to execute SFT training pipeline on Mac / Colab GPU.")

if __name__ == "__main__":
    train_friday_slm()
