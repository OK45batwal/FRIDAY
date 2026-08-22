import re
import os
from pathlib import Path
from typing import Tuple, List

class DataCleaner:
    """
    Data Cleaning and Preprocessing Pipeline for MiniGPT v0.1.
    Cleans raw text, removes HTML/spam, normalizes whitespace, and creates Train/Val splits.
    """

    @staticmethod
    def clean_text(raw_text: str) -> str:
        # 1. Remove HTML tags
        text = re.sub(r'<[^>]+>', ' ', raw_text)
        # 2. Remove duplicate punctuation and spam
        text = re.sub(r'([!?.])\1+', r'\1', text)
        # 3. Normalize whitespace and newlines
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'\n\s*\n+', '\n\n', text)
        return text.strip()

    @staticmethod
    def prepare_dataset(
        raw_corpus: str,
        output_dir: Path,
        train_ratio: float = 0.9
    ) -> Tuple[Path, Path]:
        output_dir.mkdir(parents=True, exist_ok=True)
        cleaned = DataCleaner.clean_text(raw_corpus)

        lines = cleaned.split("\n")
        split_idx = int(len(lines) * train_ratio)

        train_lines = lines[:split_idx]
        val_lines = lines[split_idx:]

        train_file = output_dir / "train.txt"
        val_file = output_dir / "val.txt"

        with open(train_file, "w", encoding="utf-8") as f:
            f.write("\n".join(train_lines))

        with open(val_file, "w", encoding="utf-8") as f:
            f.write("\n".join(val_lines))

        return train_file, val_file
