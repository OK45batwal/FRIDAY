"""
Phase 4: merge the LoRA adapter and export a real GGUF for llama.cpp / Ollama.

Previously this script merged the adapter (that part was real) but then wrote a
manifest claiming `format: safetensors_fp16_and_gguf` and status
`ready_for_distribution` without ever producing a GGUF file. The repo separately
shipped `models/friday-1b-q4_k_m.gguf` at 1,032 bytes — a stub, three orders of
magnitude too small for a real 0.5B model — presented as the deployed weights.

This now: (1) merges the adapter into standalone weights, (2) invokes llama.cpp's
convert_hf_to_gguf.py to write an actual GGUF, and (3) optionally quantizes to
Q4_K_M when the llama-quantize binary is available. It refuses to report success
unless a real, plausibly-sized GGUF exists on disk.

Q4_K_M requires the compiled llama-quantize binary (which needs cmake to build).
When it is absent, this produces an honest q8_0 or f16 GGUF and says so, rather
than mislabeling the output.

Setup:
    git clone https://github.com/ggml-org/llama.cpp
    pip install -r services/core/requirements-training.txt   # provides gguf
    export LLAMA_CPP_DIR=/path/to/llama.cpp
    # optional, for Q4_K_M: build llama.cpp so llama-quantize exists on PATH
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import List, Optional

import torch

BASE_MODEL_NAME = "Qwen/Qwen2.5-0.5B-Instruct"
TRAINING_DIR = Path(__file__).resolve().parent
ADAPTER_DIR = TRAINING_DIR / "output" / "friday_1_0_dpo_aligned"
FALLBACK_ADAPTER_DIR = TRAINING_DIR / "output" / "friday_1_0_finetuned"
MERGED_OUTPUT_DIR = TRAINING_DIR / "output" / "friday_1_0_merged_fp16"
GGUF_OUTPUT_DIR = Path(__file__).resolve().parent.parent / "models"

# A real 0.5B model in f16 is ~1 GB; in q4 ~350 MB. Anything far below this is a
# stub, and the whole point of this rewrite is to never ship one again.
MIN_PLAUSIBLE_GGUF_BYTES = 50 * 1024 * 1024


def find_llama_cpp() -> Optional[Path]:
    """Locate a llama.cpp checkout containing the conversion script."""
    candidates: List[Path] = []
    env = os.getenv("LLAMA_CPP_DIR")
    if env:
        candidates.append(Path(env))
    candidates += [
        Path.home() / "llama.cpp",
        Path("/tmp/friday_setup/llama.cpp"),
        TRAINING_DIR / "llama.cpp",
    ]
    for cand in candidates:
        if (cand / "convert_hf_to_gguf.py").exists():
            return cand
    return None


def resolve_adapter_dir() -> Optional[Path]:
    """Prefer the DPO-aligned adapter, fall back to SFT, else None (base only)."""
    for cand in (ADAPTER_DIR, FALLBACK_ADAPTER_DIR):
        if (cand / "adapter_config.json").exists() and list(cand.glob("adapter_model.*")):
            return cand
    return None


def merge_adapter() -> Path:
    from peft import PeftModel
    from transformers import AutoModelForCausalLM, AutoTokenizer

    MERGED_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print("1. Loading base model (fp16) for merge")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME, trust_remote_code=False)
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL_NAME,
        dtype=torch.float16,
        device_map="cpu",
        trust_remote_code=False,
    )

    adapter_dir = resolve_adapter_dir()
    if adapter_dir is not None:
        print(f"2. Merging LoRA adapter: {adapter_dir}")
        model = PeftModel.from_pretrained(base_model, str(adapter_dir))
        model = model.merge_and_unload()
    else:
        print("2. No adapter found — exporting the base model unchanged.")
        model = base_model

    print(f"3. Writing merged weights to {MERGED_OUTPUT_DIR}")
    model.save_pretrained(str(MERGED_OUTPUT_DIR), safe_serialization=True)
    tokenizer.save_pretrained(str(MERGED_OUTPUT_DIR))
    return MERGED_OUTPUT_DIR


def convert_to_gguf(merged_dir: Path, llama_cpp: Path, outtype: str) -> Path:
    GGUF_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = GGUF_OUTPUT_DIR / f"friday-1.0-{outtype}.gguf"
    convert_script = llama_cpp / "convert_hf_to_gguf.py"

    print(f"4. Converting to GGUF ({outtype}) via {convert_script.name}")
    cmd = [
        sys.executable,
        str(convert_script),
        str(merged_dir),
        "--outfile", str(out_path),
        "--outtype", outtype,
    ]
    # check=True: a non-zero exit from the converter must abort, not fall through
    # to a success manifest.
    subprocess.run(cmd, check=True)
    return out_path


def quantize_q4_k_m(source_gguf: Path) -> Optional[Path]:
    """Quantize to Q4_K_M if the llama-quantize binary is available."""
    binary = shutil.which("llama-quantize") or shutil.which("quantize")
    if not binary:
        print(
            "5. Skipping Q4_K_M: llama-quantize binary not found. "
            "Build llama.cpp (needs cmake) to enable 4-bit quantization."
        )
        return None
    out_path = GGUF_OUTPUT_DIR / "friday-1.0-q4_k_m.gguf"
    print(f"5. Quantizing to Q4_K_M via {binary}")
    subprocess.run([binary, str(source_gguf), str(out_path), "Q4_K_M"], check=True)
    return out_path


def export(outtype: str = "q8_0", do_quantize: bool = True) -> Path:
    print("=" * 70)
    print("FRIDAY GGUF export")
    print("=" * 70)

    llama_cpp = find_llama_cpp()
    if llama_cpp is None:
        raise RuntimeError(
            "llama.cpp checkout not found. Clone it and set LLAMA_CPP_DIR. "
            "See the module docstring."
        )

    merged_dir = merge_adapter()
    gguf_path = convert_to_gguf(merged_dir, llama_cpp, outtype)

    size = gguf_path.stat().st_size
    if size < MIN_PLAUSIBLE_GGUF_BYTES:
        raise RuntimeError(
            f"GGUF at {gguf_path} is only {size:,} bytes — implausibly small for a 0.5B "
            "model. Refusing to report success (this is the 1KB-stub failure mode)."
        )

    final_path = gguf_path
    final_quant = outtype
    if do_quantize:
        q4 = quantize_q4_k_m(gguf_path)
        if q4 is not None:
            final_path, final_quant = q4, "Q4_K_M"

    adapter = resolve_adapter_dir()
    manifest = {
        "model_id": f"friday-1.0-{final_quant.lower()}",
        "base_model": BASE_MODEL_NAME,
        # Relative, so the manifest does not leak the builder's home directory.
        "source_adapter": adapter.name if adapter else "base model (no adapter)",
        "parameters": "0.5B (494M)",
        "format": "GGUF",
        "quantization": final_quant,
        "gguf_file": final_path.name,
        "gguf_bytes": final_path.stat().st_size,
        "runtime": "llama.cpp / Ollama",
        # Honest status: the file exists and is real. It is not asserted to be
        # verified, deployed, or distribution-blessed.
        "status": "gguf_exported",
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    with open(GGUF_OUTPUT_DIR / "model_manifest.json", "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)

    print("=" * 70)
    print(f"GGUF export complete: {final_path} ({final_path.stat().st_size:,} bytes, {final_quant})")
    print("=" * 70)
    return final_path


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Merge adapter and export a real GGUF.")
    parser.add_argument(
        "--outtype",
        choices=["f16", "bf16", "q8_0", "f32"],
        default="q8_0",
        help="Base GGUF precision produced by the converter (before optional Q4_K_M).",
    )
    parser.add_argument(
        "--no-quantize",
        action="store_true",
        help="Do not attempt Q4_K_M even if llama-quantize is present.",
    )
    return parser


def main(argv: Optional[List[str]] = None) -> int:
    args = build_arg_parser().parse_args(argv)
    try:
        export(outtype=args.outtype, do_quantize=not args.no_quantize)
    except Exception as exc:
        print(f"\nGGUF EXPORT FAILED: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
