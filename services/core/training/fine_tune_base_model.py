"""
Real supervised fine-tuning (SFT) of the FRIDAY base model with LoRA adapters.

This is the single SFT implementation. `train_slm.py` is a thin CLI over it.

Output goes to settings.LOCAL_MODEL_PATH, which is the directory
core/ai/providers/local_llm_engine.py actually loads adapters from — an earlier
script wrote a LoRA config (and no weights) to a different directory that nothing
read, so "training" produced an adapter the application could never use.
"""

import argparse
import json
import os
import random
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import torch

TRAINING_DIR = Path(__file__).resolve().parent
DATA_PATH = TRAINING_DIR / "data" / "friday_dataset.jsonl"
# Must match settings.LOCAL_MODEL_PATH so the inference engine finds the result.
OUTPUT_DIR = TRAINING_DIR / "output" / "friday_1_0_finetuned"

BASE_MODEL_NAME = os.getenv("LOCAL_MODEL_BASE", "Qwen/Qwen2.5-0.5B-Instruct")
SEED = 1337


def pick_device() -> str:
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def training_dtype(device: str) -> torch.dtype:
    """
    Pick a dtype that is actually trainable on this device.

    float16 is for inference. Training a LoRA in pure fp16 on MPS underflows the
    gradients and the loss goes to NaN or simply stops moving — the previous
    version loaded the model in fp16 whenever a GPU was present, so any "training"
    on Apple Silicon was numerically dead. bf16 on CUDA is fine; MPS and CPU train
    in fp32.
    """
    if device == "cuda" and torch.cuda.is_bf16_supported():
        return torch.bfloat16
    return torch.float32


def load_chat_dataset(tokenizer, path: Path, limit: Optional[int] = None) -> List[Dict[str, str]]:
    """Read the JSONL corpus and render each conversation with the chat template."""
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found at {path}. Run dataset_generator.py first.")

    rows: List[Dict[str, str]] = []
    seen_prompts = set()
    with open(path, "r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
            except json.JSONDecodeError:
                continue
            messages = item.get("messages")
            if not messages:
                continue
            user_turn = next((m["content"] for m in messages if m.get("role") == "user"), "")
            seen_prompts.add(user_turn)
            rows.append({
                "text": tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=False)
            })

    # Surface corpus diversity. The shipped dataset is ~5000 rows built from only
    # a handful of distinct prompts, so training loss falls fast while the model
    # learns almost nothing generalisable. Reporting it prevents mistaking a low
    # loss for a capable model.
    print(f"  rows: {len(rows):,}   distinct user prompts: {len(seen_prompts):,}")
    if rows and len(seen_prompts) < 50:
        print(
            f"  WARNING: only {len(seen_prompts)} unique prompts across {len(rows):,} rows. "
            "This corpus is heavily duplicated; expect memorisation, not generalisation."
        )

    random.Random(SEED).shuffle(rows)
    if limit:
        rows = rows[:limit]
    return rows


def run_fine_tuning(
    epochs: float = 3.0,
    learning_rate: float = 3e-4,
    batch_size: int = 2,
    grad_accum: int = 2,
    max_seq_len: int = 512,
    limit: Optional[int] = None,
    lora_r: int = 32,
    lora_alpha: int = 64,
    eval_fraction: float = 0.1,
) -> Path:
    from datasets import Dataset
    from peft import LoraConfig, TaskType, get_peft_model
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        DataCollatorForLanguageModeling,
        Trainer,
        TrainingArguments,
    )

    torch.manual_seed(SEED)
    random.seed(SEED)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    device = pick_device()
    dtype = training_dtype(device)

    print("=" * 70)
    print("FRIDAY SFT — LoRA supervised fine-tuning")
    print("=" * 70)
    print(f"  base model : {BASE_MODEL_NAME}")
    print(f"  device     : {device}  (dtype {dtype})")
    print(f"  output     : {OUTPUT_DIR}")

    # trust_remote_code=False: Qwen2 is natively supported by transformers, so
    # there is no reason to execute arbitrary Python from the model repo.
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME, trust_remote_code=False)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    print("\n1. Loading dataset")
    rows = load_chat_dataset(tokenizer, DATA_PATH, limit=limit)
    if not rows:
        raise RuntimeError("Dataset produced zero usable rows.")

    # Real held-out split. The previous script trained on dataset[:200] and never
    # evaluated, so there was no way to tell training from memorisation.
    split_at = max(1, int(len(rows) * (1 - eval_fraction)))
    train_rows, eval_rows = rows[:split_at], rows[split_at:]
    print(f"  train: {len(train_rows):,}   eval: {len(eval_rows):,}")

    def tokenize_fn(examples):
        return tokenizer(
            examples["text"],
            truncation=True,
            max_length=max_seq_len,
            padding="max_length",
        )

    train_ds = Dataset.from_list(train_rows).map(tokenize_fn, batched=True, remove_columns=["text"])
    eval_ds = (
        Dataset.from_list(eval_rows).map(tokenize_fn, batched=True, remove_columns=["text"])
        if eval_rows
        else None
    )

    print(f"\n2. Loading base model")
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL_NAME,
        dtype=dtype,
        trust_remote_code=False,
    )
    model.config.use_cache = False  # incompatible with gradient checkpointing / training

    print(f"\n3. Attaching LoRA adapters (r={lora_r}, alpha={lora_alpha})")
    peft_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=lora_r,
        lora_alpha=lora_alpha,
        lora_dropout=0.05,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    )
    model = get_peft_model(model, peft_config)
    trainable, total = model.get_nb_trainable_parameters()
    print(f"  trainable: {trainable:,} / {total:,} ({100 * trainable / total:.2f}%)")

    training_args = TrainingArguments(
        output_dir=str(OUTPUT_DIR / "checkpoints"),
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=batch_size,
        gradient_accumulation_steps=grad_accum,
        learning_rate=learning_rate,
        num_train_epochs=epochs,
        logging_steps=10,
        eval_strategy="epoch" if eval_ds is not None else "no",
        save_strategy="no",
        report_to=[],
        seed=SEED,
        use_cpu=(device == "cpu"),
        # fp16/bf16 autocast is left off: on MPS it is not supported for training
        # and on CPU it is slower than fp32.
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_ds,
        eval_dataset=eval_ds,
        # mlm=False -> causal LM: labels are the shifted input_ids, and padding is
        # masked to -100 so pad tokens do not contribute to the loss. The old code
        # copied input_ids to labels verbatim, so the model was trained to predict
        # its own padding.
        data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False),
    )

    print("\n4. Training")
    start = time.time()
    train_result = trainer.train()
    elapsed = round(time.time() - start, 2)

    final_eval: Dict[str, float] = {}
    if eval_ds is not None:
        final_eval = trainer.evaluate()
        print(f"  final eval loss: {final_eval.get('eval_loss'):.4f}")

    print(f"\n5. Saving adapter to {OUTPUT_DIR}")
    model.save_pretrained(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))

    # Verify the weights actually landed. Writing only adapter_config.json is
    # exactly the failure mode this script replaces, so refuse to report success
    # without the tensor file on disk.
    weight_files = list(OUTPUT_DIR.glob("adapter_model.*"))
    if not weight_files:
        raise RuntimeError(
            f"Training finished but no adapter weights were written to {OUTPUT_DIR}. "
            "Refusing to report success."
        )
    weights_bytes = sum(p.stat().st_size for p in weight_files)
    print(f"  adapter weights: {[p.name for p in weight_files]} ({weights_bytes:,} bytes)")

    manifest = {
        "model_id": "friday-1.0-lora-sft",
        "base_model": BASE_MODEL_NAME,
        "name": "FRIDAY 1.0 (LoRA SFT)",
        "adapter": f"LoRA (r={lora_r}, alpha={lora_alpha})",
        "trainable_parameters": trainable,
        "total_parameters": total,
        "train_rows": len(train_rows),
        "eval_rows": len(eval_rows),
        "epochs": epochs,
        "learning_rate": learning_rate,
        "device": device,
        "dtype": str(dtype),
        "train_loss": round(float(train_result.training_loss), 4) if train_result.training_loss else None,
        "eval_loss": round(float(final_eval["eval_loss"]), 4) if "eval_loss" in final_eval else None,
        "adapter_weight_bytes": weights_bytes,
        "training_time_seconds": elapsed,
        # Deliberately not "deployed"/"verified": this records that SFT ran and
        # produced weights. Whether the model is any good is what the benchmark
        # is for.
        "status": "sft_complete",
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    with open(OUTPUT_DIR / "training_manifest.json", "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)

    print("=" * 70)
    print(f"SFT complete in {elapsed}s. Adapter at {OUTPUT_DIR}")
    print("=" * 70)
    return OUTPUT_DIR


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="LoRA supervised fine-tuning for FRIDAY.")
    parser.add_argument("--epochs", type=float, default=3.0)
    parser.add_argument("--lr", type=float, default=3e-4, dest="learning_rate")
    parser.add_argument("--batch-size", type=int, default=2)
    parser.add_argument("--grad-accum", type=int, default=2)
    parser.add_argument("--max-seq-len", type=int, default=512)
    parser.add_argument("--limit", type=int, default=None, help="Cap training rows (smoke tests).")
    parser.add_argument("--lora-r", type=int, default=32)
    parser.add_argument("--lora-alpha", type=int, default=64)
    parser.add_argument("--eval-fraction", type=float, default=0.1)
    return parser


def main(argv: Optional[List[str]] = None) -> int:
    args = build_arg_parser().parse_args(argv)
    try:
        run_fine_tuning(
            epochs=args.epochs,
            learning_rate=args.learning_rate,
            batch_size=args.batch_size,
            grad_accum=args.grad_accum,
            max_seq_len=args.max_seq_len,
            limit=args.limit,
            lora_r=args.lora_r,
            lora_alpha=args.lora_alpha,
            eval_fraction=args.eval_fraction,
        )
    except Exception as exc:
        # Exit non-zero so a failed run cannot be mistaken for a successful one
        # by a caller or a CI step.
        print(f"\nSFT FAILED: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
