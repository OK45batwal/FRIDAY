"""Main Pretraining Loop for Custom LLM.

Supports:
- Apple Silicon GPU (MPS) / NVIDIA (CUDA) / CPU
- AdamW with weight decay parameter grouping
- Cosine learning rate schedule with linear warmup
- Gradient accumulation & clipping
- Periodic validation & live sample text generation
- Checkpoint saving & resuming
"""

import os
import sys
import time
import math
import argparse
from typing import Tuple
import torch
import torch.nn as nn

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from model.config import ModelConfig
from model.transformer import CustomLLM
from model.generate import generate
from tokenizer.tokenizer import Tokenizer
from data.dataloader import MemmapDataLoader
from train.checkpoint import save_checkpoint, load_checkpoint
from train.evaluate import evaluate_loss, calculate_perplexity


def get_device() -> torch.device:
    """Auto-detect most capable device."""
    if torch.cuda.is_available():
        return torch.device("cuda")
    elif torch.backends.mps.is_available() and torch.backends.mps.is_built():
        return torch.device("mps")
    return torch.device("cpu")


def configure_optimizers(model: CustomLLM, weight_decay: float, lr: float, betas: Tuple[float, float]) -> torch.optim.Optimizer:
    """
    Separate parameters into decay and no-decay groups.
    Decay: 2D weights (Linear, Embeddings).
    No decay: 1D weights (RMSNorm weights, biases).
    """
    decay_params = []
    nodecay_params = []

    for name, param in model.named_parameters():
        if not param.requires_grad:
            continue
        if param.dim() >= 2:
            decay_params.append(param)
        else:
            nodecay_params.append(param)

    optim_groups = [
        {"params": decay_params, "weight_decay": weight_decay},
        {"params": nodecay_params, "weight_decay": 0.0},
    ]

    optimizer = torch.optim.AdamW(optim_groups, lr=lr, betas=betas)
    return optimizer


def get_lr(step: int, warmup_steps: int, max_steps: int, max_lr: float, min_lr: float) -> float:
    """Cosine learning rate schedule with linear warmup."""
    if step < warmup_steps:
        return max_lr * (step + 1) / max(warmup_steps, 1)
    if step > max_steps:
        return min_lr
    decay_ratio = (step - warmup_steps) / (max_steps - warmup_steps)
    assert 0.0 <= decay_ratio <= 1.0
    coeff = 0.5 * (1.0 + math.cos(math.pi * decay_ratio))
    return min_lr + coeff * (max_lr - min_lr)


def train(
    data_dir: str = "data",
    checkpoint_dir: str = "checkpoints",
    scale: str = "tiny",
    batch_size: int = 16,
    seq_len: int = 256,
    max_steps: int = 2000,
    warmup_steps: int = 100,
    learning_rate: float = 6e-4,
    min_lr: float = 6e-5,
    weight_decay: float = 0.1,
    grad_accum_steps: int = 1,
    grad_clip: float = 1.0,
    eval_interval: int = 200,
    eval_batches: int = 20,
    sample_interval: int = 200,
    sample_prompt: str = "Once upon a time",
    resume_from: str = None,
):
    device = get_device()
    print(f"Using device: {device}")

    # Build or load configuration
    if scale == "tiny":
        config = ModelConfig.tiny()
    elif scale == "small":
        config = ModelConfig.small()
    elif scale == "base":
        config = ModelConfig.base()
    else:
        config = ModelConfig.tiny()

    config.max_seq_len = max(config.max_seq_len, seq_len)

    # Initialize Tokenizer
    tokenizer = Tokenizer("gpt2")
    config.vocab_size = tokenizer.vocab_size

    # Initialize or resume model
    start_step = 0
    best_val_loss = float("inf")

    if resume_from and os.path.exists(resume_from):
        print(f"Resuming training from checkpoint: {resume_from}")
        model, ckpt = load_checkpoint(resume_from, device)
        start_step = ckpt.get("step", 0) + 1
        best_val_loss = ckpt.get("val_loss", float("inf"))
    else:
        print(f"Initializing custom LLM with config: {config}")
        model = CustomLLM(config)
        model.to(device)

    total_params = model.get_num_params()
    print(f"Model parameters: {total_params:,} ({total_params / 1e6:.2f}M)")

    # Data loaders
    train_bin = os.path.join(data_dir, "train.bin")
    val_bin = os.path.join(data_dir, "val.bin")

    if not os.path.exists(train_bin):
        raise FileNotFoundError(
            f"Training dataset not found at {train_bin}. Run `python data/prepare_data.py` first."
        )

    train_loader = MemmapDataLoader(train_bin, batch_size=batch_size, seq_len=seq_len, device=device)
    val_loader = MemmapDataLoader(val_bin, batch_size=batch_size, seq_len=seq_len, device=device) if os.path.exists(val_bin) else None

    # Optimizer
    optimizer = configure_optimizers(model, weight_decay=weight_decay, lr=learning_rate, betas=(0.9, 0.95))

    print("-" * 70)
    print(f"Starting training run: {max_steps} steps | batch size {batch_size} | seq len {seq_len}")
    print("-" * 70)

    model.train()
    start_time = time.time()

    for step in range(start_step, max_steps):
        lr = get_lr(step, warmup_steps, max_steps, learning_rate, min_lr)
        for param_group in optimizer.param_groups:
            param_group["lr"] = lr

        optimizer.zero_grad(set_to_none=True)
        accum_loss = 0.0

        for _ in range(grad_accum_steps):
            x, y = train_loader.sample_batch()
            _, loss = model(x, targets=y)
            loss = loss / grad_accum_steps
            loss.backward()
            accum_loss += loss.item()

        if grad_clip > 0.0:
            torch.nn.utils.clip_grad_norm_(model.parameters(), grad_clip)

        optimizer.step()

        # Step logging
        if step % 20 == 0 or step == max_steps - 1:
            dt = time.time() - start_time
            tokens_per_sec = (batch_size * seq_len * grad_accum_steps * 20) / max(dt, 1e-4) if step > 0 else 0
            start_time = time.time()
            print(f"Step {step:5d}/{max_steps} | Loss: {accum_loss:.4f} | LR: {lr:.2e} | Speed: {tokens_per_sec:,.0f} tok/s")

        # Periodic evaluation
        if val_loader is not None and (step % eval_interval == 0 or step == max_steps - 1) and step > 0:
            val_loss = evaluate_loss(model, val_loader, eval_batches=eval_batches)
            ppl = calculate_perplexity(val_loss)
            is_best = val_loss < best_val_loss
            if is_best:
                best_val_loss = val_loss
            print(f">>> [EVAL step {step}] Val Loss: {val_loss:.4f} | Perplexity: {ppl:.2f} {'(New Best!)' if is_best else ''}")

            save_checkpoint(
                checkpoint_dir=checkpoint_dir,
                step=step,
                model=model,
                optimizer=optimizer,
                val_loss=val_loss,
                config=config,
                is_best=is_best,
            )

        # Live sample generation
        if (step % sample_interval == 0 or step == max_steps - 1) and step > 0:
            print("\n" + "=" * 30 + f" Sample Generation (Step {step}) " + "=" * 30)
            prompt_ids = tokenizer.encode(sample_prompt, return_tensors="pt").to(device)
            gen_tokens = generate(
                model=model,
                prompt_tokens=prompt_ids,
                max_new_tokens=40,
                temperature=0.8,
                top_k=40,
                top_p=0.9,
                use_kv_cache=True,
            )
            sample_text = tokenizer.decode(gen_tokens[0])
            print(f"Prompt: {sample_prompt}\nGenerated:\n{sample_text}")
            print("=" * 76 + "\n")
            model.train()

    print("Training run completed successfully!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train custom LLM from scratch")
    parser.add_argument("--data_dir", type=str, default="data", help="Directory containing train.bin and val.bin")
    parser.add_argument("--checkpoint_dir", type=str, default="checkpoints", help="Directory to save model checkpoints")
    parser.add_argument("--scale", type=str, default="tiny", choices=["tiny", "small", "base"], help="Model parameter scale preset")
    parser.add_argument("--batch_size", type=int, default=16, help="Batch size per training step")
    parser.add_argument("--seq_len", type=int, default=256, help="Sequence length per sample")
    parser.add_argument("--max_steps", type=int, default=1000, help="Maximum number of training steps")
    parser.add_argument("--warmup_steps", type=int, default=100, help="Linear warmup steps for learning rate")
    parser.add_argument("--lr", type=float, default=6e-4, help="Maximum learning rate")
    parser.add_argument("--eval_interval", type=int, default=200, help="Evaluate validation loss every N steps")
    parser.add_argument("--sample_interval", type=int, default=200, help="Generate sample text every N steps")
    parser.add_argument("--sample_prompt", type=str, default="Once upon a time", help="Prompt to test generation")
    parser.add_argument("--resume_from", type=str, default=None, help="Path to checkpoint .pt file to resume")
    args = parser.parse_args()

    train(
        data_dir=args.data_dir,
        checkpoint_dir=args.checkpoint_dir,
        scale=args.scale,
        batch_size=args.batch_size,
        seq_len=args.seq_len,
        max_steps=args.max_steps,
        warmup_steps=args.warmup_steps,
        learning_rate=args.lr,
        eval_interval=args.eval_interval,
        sample_interval=args.sample_interval,
        sample_prompt=args.sample_prompt,
        resume_from=args.resume_from,
    )
