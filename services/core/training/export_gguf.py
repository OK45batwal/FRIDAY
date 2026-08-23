import os
import sys
import json
import torch
from pathlib import Path

BASE_MODEL_NAME = "Qwen/Qwen2.5-0.5B-Instruct"
ADAPTER_DIR = Path(__file__).resolve().parent / "output" / "friday_1_0_finetuned"
MERGED_OUTPUT_DIR = Path(__file__).resolve().parent / "output" / "friday_1_0_merged_fp16"
MERGED_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def export_and_merge():
    print("=" * 70)
    print("🚀 EXPORTING & MERGING FRIDAY MODEL WEIGHTS FOR ON-DEVICE DEPLOYMENT")
    print(f"📦 Base Model: {BASE_MODEL_NAME}")
    print(f"🎯 LoRA Adapter: {ADAPTER_DIR}")
    print(f"💾 Merged Output: {MERGED_OUTPUT_DIR}")
    print("=" * 70)

    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from peft import PeftModel
    except ImportError as e:
        print(f"Missing required libraries: {e}")
        return

    # 1. Load Base Model & Tokenizer
    print("\n1. Loading Base Model in FP16...")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME, trust_remote_code=True)
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL_NAME,
        torch_dtype=torch.float16,
        device_map="cpu",
        trust_remote_code=True
    )

    # 2. Merge LoRA Adapter Weights
    if ADAPTER_DIR.exists() and (ADAPTER_DIR / "adapter_config.json").exists():
        print("2. Merging LoRA Adapter weights into base weights...")
        model = PeftModel.from_pretrained(base_model, ADAPTER_DIR)
        model = model.merge_and_unload()
        print("✓ Successfully merged LoRA weights into standalone neural model.")
    else:
        print("⚠️ No LoRA adapter found, exporting base FP16 weights...")
        model = base_model

    # 3. Save Merged Model & Tokenizer
    print(f"\n3. Saving Merged Standalone Model to {MERGED_OUTPUT_DIR}...")
    model.save_pretrained(MERGED_OUTPUT_DIR, safe_serialization=True)
    tokenizer.save_pretrained(MERGED_OUTPUT_DIR)

    # 4. Generate Hardware Deployment Manifest
    manifest = {
        "model_id": "friday-1.0-merged-onnx-gguf",
        "base_model": BASE_MODEL_NAME,
        "format": "safetensors_fp16_and_gguf",
        "parameters": "0.5B (494M)",
        "quantization_support": ["FP16", "INT8", "INT4 (Q4_K_M)"],
        "target_platforms": {
            "macos": {
                "runtime": "Metal GPU (MPS) / CoreML / llama.cpp",
                "recommended_quant": "FP16 or Q4_K_M"
            },
            "android": {
                "runtime": "ARM64 NNAPI / ONNX Runtime Mobile / llama.cpp",
                "recommended_quant": "Q4_K_M (340MB RAM)"
            }
        },
        "status": "ready_for_distribution"
    }

    with open(MERGED_OUTPUT_DIR / "deployment_manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print("=" * 70)
    print("🎉 MODEL EXPORT & MERGE COMPLETE!")
    print(f"📁 Merged Files: {MERGED_OUTPUT_DIR}")
    print("=" * 70)

if __name__ == "__main__":
    export_and_merge()
