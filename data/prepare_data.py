"""Dataset preparation script.

Tokenizes raw text into memory-mapped uint16 binary files for high-speed training.
"""

import os
import sys
import argparse
import urllib.request
import numpy as np

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tokenizer.tokenizer import Tokenizer

SHAKESPEARE_URL = "https://raw.githubusercontent.com/karpathy/char-rnn/master/data/tinyshakespeare/input.txt"


def prepare_from_text(
    text: str,
    output_dir: str = "data",
    val_ratio: float = 0.1,
    tokenizer_name: str = "gpt2",
):
    """Tokenize text and save train.bin and val.bin files."""
    os.makedirs(output_dir, exist_ok=True)
    tokenizer = Tokenizer(tokenizer_name)

    print(f"Tokenizing {len(text):,} characters with '{tokenizer_name}' tokenizer...")
    tokens = tokenizer.encode(text)
    tokens_np = np.array(tokens, dtype=np.uint16)
    n_tokens = len(tokens_np)
    print(f"Total tokens produced: {n_tokens:,}")

    # Split train and validation
    split_idx = int(n_tokens * (1.0 - val_ratio))
    train_tokens = tokens_np[:split_idx]
    val_tokens = tokens_np[split_idx:]

    train_path = os.path.join(output_dir, "train.bin")
    val_path = os.path.join(output_dir, "val.bin")

    train_tokens.tofile(train_path)
    val_tokens.tofile(val_path)

    print(f"Saved {len(train_tokens):,} tokens to -> {train_path}")
    print(f"Saved {len(val_tokens):,} tokens to   -> {val_path}")


def prepare_sample_dataset(output_dir: str = "data"):
    """Download a classic benchmark text corpus (Tiny Shakespeare) and prepare binary shards."""
    raw_path = os.path.join(output_dir, "input.txt")
    os.makedirs(output_dir, exist_ok=True)

    if not os.path.exists(raw_path):
        print(f"Downloading sample dataset from {SHAKESPEARE_URL}...")
        urllib.request.urlretrieve(SHAKESPEARE_URL, raw_path)
        print(f"Downloaded to {raw_path}")

    with open(raw_path, "r", encoding="utf-8") as f:
        text = f.read()

    prepare_from_text(text, output_dir=output_dir)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prepare pre-tokenized binary datasets for training")
    parser.add_argument("--input_file", type=str, default=None, help="Path to raw UTF-8 text file")
    parser.add_argument("--output_dir", type=str, default="data", help="Output directory for .bin files")
    parser.add_argument("--val_ratio", type=float, default=0.1, help="Validation set split ratio")
    args = parser.parse_args()

    if args.input_file:
        with open(args.input_file, "r", encoding="utf-8") as f:
            raw_text = f.read()
        prepare_from_text(raw_text, output_dir=args.output_dir, val_ratio=args.val_ratio)
    else:
        print("No input file provided. Preparing sample benchmark dataset...")
        prepare_sample_dataset(output_dir=args.output_dir)
