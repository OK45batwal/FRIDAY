"""Interactive inference CLI and text generation utility.

Supports:
- Model checkpoint loading
- Interactive prompt loop
- Real-time token streaming with KV caching
- Temperature, top-k, and top-p nucleus sampling
"""

import os
import sys
import argparse
import torch

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from model.config import ModelConfig
from model.transformer import CustomLLM
from model.generate import generate, generate_stream
from tokenizer.tokenizer import Tokenizer
from train.checkpoint import load_checkpoint


def get_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    elif torch.backends.mps.is_available() and torch.backends.mps.is_built():
        return torch.device("mps")
    return torch.device("cpu")


def generate_completion(
    model: CustomLLM,
    tokenizer: Tokenizer,
    prompt: str,
    max_new_tokens: int = 150,
    temperature: float = 0.8,
    top_k: int = 50,
    top_p: float = 0.9,
    stream: bool = True,
) -> str:
    """Generate continuation from prompt string."""
    device = next(model.parameters()).device
    prompt_ids = tokenizer.encode(prompt, return_tensors="pt").to(device)

    if stream:
        print(f"\nPrompt: {prompt}\nResponse: ", end="", flush=True)
        tokens_out = []
        for token_id in generate_stream(
            model=model,
            prompt_tokens=prompt_ids,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_k=top_k,
            top_p=top_p,
            eos_id=tokenizer.eos_token_id,
        ):
            tokens_out.append(token_id)
            chunk = tokenizer.decode([token_id])
            print(chunk, end="", flush=True)
        print("\n")
        return tokenizer.decode(tokens_out)
    else:
        out_ids = generate(
            model=model,
            prompt_tokens=prompt_ids,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_k=top_k,
            top_p=top_p,
            eos_id=tokenizer.eos_token_id,
            use_kv_cache=True,
        )
        completion = tokenizer.decode(out_ids[0])
        print(f"\n{completion}\n")
        return completion


def run_interactive_session(
    checkpoint_path: str,
    temperature: float = 0.8,
    top_k: int = 50,
    top_p: float = 0.9,
    max_new_tokens: int = 150,
):
    device = get_device()
    print(f"Loading checkpoint from: {checkpoint_path} on {device}...")
    model, _ = load_checkpoint(checkpoint_path, device)
    model.eval()

    tokenizer = Tokenizer("gpt2")
    print("\n" + "=" * 60)
    print(" Custom LLM Interactive Generation Console")
    print(" (Type 'quit' or 'exit' to terminate, or enter a prompt)")
    print("=" * 60 + "\n")

    while True:
        try:
            prompt = input(">>> ").strip()
            if not prompt:
                continue
            if prompt.lower() in ("quit", "exit", "q"):
                print("Exiting interactive session.")
                break

            generate_completion(
                model=model,
                tokenizer=tokenizer,
                prompt=prompt,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                top_k=top_k,
                top_p=top_p,
                stream=True,
            )
        except (KeyboardInterrupt, EOFError):
            print("\nExiting interactive session.")
            break


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Interactive generation runner for custom LLM")
    parser.add_argument("--checkpoint", type=str, required=True, help="Path to checkpoint .pt file")
    parser.add_argument("--prompt", type=str, default=None, help="One-shot prompt to generate continuation")
    parser.add_argument("--max_tokens", type=int, default=150, help="Maximum number of new tokens to generate")
    parser.add_argument("--temperature", type=float, default=0.8, help="Sampling temperature")
    parser.add_argument("--top_k", type=int, default=50, help="Top-K sampling cutoff")
    parser.add_argument("--top_p", type=float, default=0.9, help="Top-P nucleus sampling threshold")
    args = parser.parse_args()

    if args.prompt:
        device = get_device()
        model, _ = load_checkpoint(args.checkpoint, device)
        tokenizer = Tokenizer("gpt2")
        generate_completion(
            model=model,
            tokenizer=tokenizer,
            prompt=args.prompt,
            max_new_tokens=args.max_tokens,
            temperature=args.temperature,
            top_k=args.top_k,
            top_p=args.top_p,
            stream=True,
        )
    else:
        run_interactive_session(
            checkpoint_path=args.checkpoint,
            temperature=args.temperature,
            top_k=args.top_k,
            top_p=args.top_p,
            max_new_tokens=args.max_tokens,
        )
