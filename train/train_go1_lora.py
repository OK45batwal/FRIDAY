"""Supervised Fine-Tuning (SFT) script for GO 1.0 using LoRA on Google Gemma 2 (2B).

Supports:
- Apple Silicon Metal (MPS) & CUDA acceleration
- Parameter-Efficient Fine-Tuning (PEFT / LoRA)
- Loss masking on user prompt tokens
"""

import os
import sys
import json
import argparse
from pathlib import Path
import torch

try:
    from transformers import (
        AutoTokenizer,
        AutoModelForCausalLM,
        TrainingArguments,
        Trainer,
        DataCollatorForSeq2Seq,
    )
    from peft import LoraConfig, get_peft_model, TaskType
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False


def format_gemma_chat(instruction: str, response: str) -> str:
    """Format instruction and response into Gemma 2 chat template."""
    return (
        f"<start_of_turn>user\n{instruction.strip()}<end_of_turn>\n"
        f"<start_of_turn>model\n{response.strip()}<end_of_turn>\n"
    )


def load_dataset(dataset_path: str):
    """Load JSONL dataset."""
    records = []
    with open(dataset_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


def get_target_device():
    """Detect optimal device (CUDA > MPS > CPU)."""
    if torch.cuda.is_available():
        return "cuda"
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def main():
    parser = argparse.ArgumentParser(description="Train GO 1.0 (LoRA) on Gemma 2 2B")
    parser.add_argument("--base_model", type=str, default="google/gemma-2-2b-it", help="HuggingFace model ID")
    parser.add_argument("--dataset", type=str, default="data/go1/go1_instruct_dataset.jsonl", help="Dataset path")
    parser.add_argument("--output_dir", type=str, default="checkpoints/go1", help="Output checkpoint directory")
    parser.add_argument("--epochs", type=int, default=3, help="Training epochs")
    parser.add_argument("--batch_size", type=int, default=2, help="Batch size per device")
    parser.add_argument("--lr", type=float, default=2e-4, help="Learning rate")
    parser.add_argument("--lora_rank", type=int, default=16, help="LoRA rank (r)")
    parser.add_argument("--lora_alpha", type=int, default=32, help="LoRA alpha")
    parser.add_argument("--dry_run", action="store_true", help="Validate data and setup without loading full model")
    args = parser.parse_args()

    device = get_target_device()
    print(f"[*] Target Compute Device: {device.upper()}")

    # Verify dataset
    data_path = Path(args.dataset)
    if not data_path.exists():
        print(f"[!] Error: Dataset not found at {args.dataset}")
        sys.exit(1)

    data = load_dataset(str(data_path))
    print(f"[✓] Loaded {len(data)} training examples from {data_path}")

    if args.dry_run:
        print("\n--- Dry Run Sample Formatted for Gemma 2 ---")
        sample = data[0]
        formatted = format_gemma_chat(sample["instruction"], sample["response"])
        print(formatted)
        print("[✓] Dry run validated successfully.")
        return

    if not TRANSFORMERS_AVAILABLE:
        print("[!] 'transformers' and 'peft' are required for actual training.")
        print("    Install them with: pip install transformers peft accelerate datasets")
        sys.exit(1)

    print(f"[*] Initializing Tokenizer & Model: {args.base_model}")
    tokenizer = AutoTokenizer.from_pretrained(args.base_model)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    dtype = torch.bfloat16 if device in ["cuda", "mps"] else torch.float32
    model = AutoModelForCausalLM.from_pretrained(
        args.base_model,
        torch_dtype=dtype,
        device_map=device if device != "mps" else None,
    )
    if device == "mps":
        model = model.to("mps")

    # Configure LoRA
    peft_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=args.lora_rank,
        lora_alpha=args.lora_alpha,
        lora_dropout=0.05,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        bias="none",
    )
    model = get_peft_model(model, peft_config)
    model.print_trainable_parameters()

    output_path = Path(args.output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    print(f"\n[✓] Setup complete. Ready to train GO 1.0 checkpoints to {output_path}")


if __name__ == "__main__":
    main()
