"""
Phase 2 entry point: supervised fine-tuning (SFT).

This file used to *simulate* training. It slept for 0.5 seconds, printed
hyperparameters it never applied, and wrote an `adapter_config.json` containing
no weights — to `output/friday-1b-lora`, a directory the inference engine does
not read. Nothing was trained, and it reported success.

It is now a thin CLI over the real implementation in fine_tune_base_model.py,
which loads the base model, attaches LoRA adapters, trains against a held-out
split, and refuses to exit 0 unless adapter weights are actually on disk.

Usage:
    python -m services.core.training.train_slm                  # full run
    python -m services.core.training.train_slm --limit 64 --epochs 1   # smoke test
"""

from services.core.training.fine_tune_base_model import main

if __name__ == "__main__":
    raise SystemExit(main())
