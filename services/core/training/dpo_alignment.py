"""
Phase 3: Direct Preference Optimization (DPO) alignment.

This file previously performed no alignment at all. It read the preference pairs,
printed progress, slept, and wrote a `dpo_manifest.json` whose status field said
`"aligned_and_verified"` — into a directory that contained nothing else. No
reference model, no policy update, no weights. Nothing was aligned and nothing
was verified.

It now runs a real DPO pass with trl.DPOTrainer over the LoRA-adapted policy,
and refuses to exit 0 unless preference-optimized weights are on disk.

Usage:
    python -m services.core.training.dpo_alignment                    # full run
    python -m services.core.training.dpo_alignment --limit 32 --epochs 1
"""

import argparse
import json
import random
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional

import torch

TRAINING_DIR = Path(__file__).resolve().parent
DPO_DATA_PATH = TRAINING_DIR / "data" / "friday_dpo_pairs.jsonl"
SFT_ADAPTER_DIR = TRAINING_DIR / "output" / "friday_1_0_finetuned"
OUTPUT_DIR = TRAINING_DIR / "output" / "friday_1_0_dpo_aligned"

BASE_MODEL_NAME = "Qwen/Qwen2.5-0.5B-Instruct"
SEED = 1337


def pick_device() -> str:
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def load_preference_pairs(path: Path, tokenizer=None, limit: Optional[int] = None) -> List[Dict[str, str]]:
    """
    Load {prompt, chosen, rejected} triples.

    Rows where chosen == rejected carry no preference signal and are dropped:
    DPO's loss on such a pair is a constant, so they only dilute the gradient.

    When a tokenizer is supplied, the prompt is wrapped in the chat template so
    it is a clean tokenized prefix of prompt+chosen. Without this, trl warns
    "Mismatch between tokenized prompt and the start of tokenized prompt+chosen"
    for every row, because a bare prompt string does not tokenize as a prefix of
    the templated conversation.
    """
    if not path.exists():
        raise FileNotFoundError(f"Preference pairs not found at {path}.")

    system_prompt = (
        "You are FRIDAY — an elite, high-intelligence AI Operating Assistant, "
        "senior software architect, and scientific reasoning companion for Omkar."
    )

    def format_prompt(raw: str) -> str:
        if tokenizer is None:
            return raw
        return tokenizer.apply_chat_template(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": raw},
            ],
            tokenize=False,
            add_generation_prompt=True,
        )

    rows: List[Dict[str, str]] = []
    skipped = 0
    distinct_prompts = set()
    with open(path, "r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
            except json.JSONDecodeError:
                skipped += 1
                continue
            prompt = (item.get("prompt") or "").strip()
            chosen = (item.get("chosen") or "").strip()
            rejected = (item.get("rejected") or "").strip()
            if not (prompt and chosen and rejected) or chosen == rejected:
                skipped += 1
                continue
            distinct_prompts.add(prompt)
            rows.append({
                "prompt": format_prompt(prompt),
                "chosen": chosen,
                "rejected": rejected,
            })

    print(f"  usable pairs: {len(rows):,}   skipped: {skipped:,}   distinct prompts: {len(distinct_prompts):,}")
    if rows and len(distinct_prompts) < 20:
        print(
            f"  WARNING: only {len(distinct_prompts)} distinct prompts. A preference set this "
            "narrow shifts style on a few inputs; it is not broad alignment."
        )

    random.Random(SEED).shuffle(rows)
    if limit:
        rows = rows[:limit]
    return rows


def run_dpo_alignment(
    epochs: float = 1.0,
    learning_rate: float = 5e-6,
    batch_size: int = 1,
    grad_accum: int = 4,
    beta: float = 0.1,
    max_length: int = 640,
    limit: Optional[int] = None,
    eval_fraction: float = 0.1,
) -> Path:
    from datasets import Dataset
    from peft import LoraConfig, PeftModel, TaskType
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from trl import DPOConfig, DPOTrainer

    torch.manual_seed(SEED)
    random.seed(SEED)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    device = pick_device()

    print("=" * 70)
    print("FRIDAY DPO — direct preference optimization")
    print("=" * 70)
    print(f"  base model : {BASE_MODEL_NAME}")
    print(f"  device     : {device}")
    print(f"  output     : {OUTPUT_DIR}")

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME, trust_remote_code=False)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    print("\n1. Loading preference pairs")
    rows = load_preference_pairs(DPO_DATA_PATH, tokenizer=tokenizer, limit=limit)
    if not rows:
        raise RuntimeError("No usable preference pairs found.")

    split_at = max(1, int(len(rows) * (1 - eval_fraction)))
    train_rows, eval_rows = rows[:split_at], rows[split_at:]
    print(f"  train: {len(train_rows):,}   eval: {len(eval_rows):,}")

    train_ds = Dataset.from_list(train_rows)
    eval_ds = Dataset.from_list(eval_rows) if eval_rows else None

    # fp32: DPO on MPS in fp16 produces NaN losses, and this stage is small.
    print("\n2. Loading policy model")
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL_NAME,
        dtype=torch.float32,
        trust_remote_code=False,
    )
    model.config.use_cache = False

    # Start from the SFT adapter when one exists, so DPO refines the fine-tuned
    # policy rather than the raw base model. is_trainable=True is required or the
    # loaded adapter comes back frozen and DPO would update nothing.
    peft_config = None
    if (SFT_ADAPTER_DIR / "adapter_config.json").exists() and list(SFT_ADAPTER_DIR.glob("adapter_model.*")):
        print(f"  continuing from SFT adapter: {SFT_ADAPTER_DIR}")
        model = PeftModel.from_pretrained(model, str(SFT_ADAPTER_DIR), is_trainable=True)
    else:
        print("  no SFT adapter found; attaching a fresh LoRA for DPO")
        peft_config = LoraConfig(
            task_type=TaskType.CAUSAL_LM,
            r=16,
            lora_alpha=32,
            lora_dropout=0.05,
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
        )

    dpo_args = DPOConfig(
        output_dir=str(OUTPUT_DIR / "checkpoints"),
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=batch_size,
        gradient_accumulation_steps=grad_accum,
        learning_rate=learning_rate,
        num_train_epochs=epochs,
        beta=beta,
        max_length=max_length,
        logging_steps=5,
        eval_strategy="epoch" if eval_ds is not None else "no",
        save_strategy="no",
        report_to=[],
        seed=SEED,
        use_cpu=(device == "cpu"),
        bf16=False,
        fp16=False,
    )

    # ref_model=None with a PEFT policy: trl uses the adapter-disabled base model
    # as the implicit reference, which is both correct and half the memory of a
    # second full copy.
    trainer = DPOTrainer(
        model=model,
        ref_model=None,
        args=dpo_args,
        train_dataset=train_ds,
        eval_dataset=eval_ds,
        processing_class=tokenizer,
        peft_config=peft_config,
    )

    print("\n3. Running DPO")
    start = time.time()
    train_result = trainer.train()
    elapsed = round(time.time() - start, 2)

    final_eval: Dict[str, float] = {}
    if eval_ds is not None:
        final_eval = trainer.evaluate()

    print(f"\n4. Saving aligned adapter to {OUTPUT_DIR}")
    trainer.save_model(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))

    # The previous version's entire output was a manifest claiming success. Insist
    # on real weights before writing any manifest at all.
    weight_files = [p for p in OUTPUT_DIR.glob("adapter_model.*")] or [
        p for p in OUTPUT_DIR.glob("model*.safetensors")
    ]
    if not weight_files:
        raise RuntimeError(
            f"DPO finished but no weights were written to {OUTPUT_DIR}. Refusing to report success."
        )
    weights_bytes = sum(p.stat().st_size for p in weight_files)
    print(f"  aligned weights: {[p.name for p in weight_files]} ({weights_bytes:,} bytes)")

    # reward accuracy = fraction of eval pairs where the policy prefers `chosen`.
    # This is the number that says whether alignment did anything.
    reward_acc = final_eval.get("eval_rewards/accuracies")
    if reward_acc is not None:
        print(f"  eval reward accuracy: {reward_acc:.3f}")

    manifest = {
        "model_id": "friday-1.0-dpo-aligned",
        "base_model": BASE_MODEL_NAME,
        "initialized_from": str(SFT_ADAPTER_DIR) if peft_config is None else "fresh LoRA",
        "algorithm": "DPO (Direct Preference Optimization)",
        "beta": beta,
        "train_pairs": len(train_rows),
        "eval_pairs": len(eval_rows),
        "epochs": epochs,
        "learning_rate": learning_rate,
        "device": device,
        "train_loss": round(float(train_result.training_loss), 4) if train_result.training_loss else None,
        "eval_loss": round(float(final_eval["eval_loss"]), 4) if "eval_loss" in final_eval else None,
        "eval_reward_accuracy": round(float(reward_acc), 4) if reward_acc is not None else None,
        "aligned_weight_bytes": weights_bytes,
        "alignment_time_seconds": elapsed,
        # Not "aligned_and_verified". This records that DPO ran and produced
        # weights; verification is the benchmark's job.
        "status": "dpo_complete",
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    with open(OUTPUT_DIR / "dpo_manifest.json", "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)

    print("=" * 70)
    print(f"DPO complete in {elapsed}s. Aligned adapter at {OUTPUT_DIR}")
    print("=" * 70)
    return OUTPUT_DIR


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="DPO preference alignment for FRIDAY.")
    parser.add_argument("--epochs", type=float, default=1.0)
    parser.add_argument("--lr", type=float, default=5e-6, dest="learning_rate")
    parser.add_argument("--batch-size", type=int, default=1)
    parser.add_argument("--grad-accum", type=int, default=4)
    parser.add_argument("--beta", type=float, default=0.1)
    parser.add_argument("--max-length", type=int, default=640)
    parser.add_argument("--limit", type=int, default=None, help="Cap pairs (smoke tests).")
    parser.add_argument("--eval-fraction", type=float, default=0.1)
    return parser


def main(argv: Optional[List[str]] = None) -> int:
    args = build_arg_parser().parse_args(argv)
    try:
        run_dpo_alignment(
            epochs=args.epochs,
            learning_rate=args.learning_rate,
            batch_size=args.batch_size,
            grad_accum=args.grad_accum,
            beta=args.beta,
            max_length=args.max_length,
            limit=args.limit,
            eval_fraction=args.eval_fraction,
        )
    except Exception as exc:
        print(f"\nDPO FAILED: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
