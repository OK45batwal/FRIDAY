# Custom LLM — Transformer Language Model from Scratch

A modern, high-performance **Decoder-Only Transformer Language Model** built completely from scratch in PyTorch. Designed for training and inference across Apple Silicon (`MPS`), NVIDIA (`CUDA`), and CPU.

---

## Architecture Highlights

- **Pre-Normalization**: Root Mean Square Layer Normalization (**RMSNorm**) for stable gradient flow.
- **Positional Encoding**: Rotary Position Embeddings (**RoPE**) applied to query and key heads, enabling relative distance understanding and length extrapolation.
- **Activation Function**: **SwiGLU** Feed-Forward Network ($W_2(\text{SiLU}(W_1 x) \odot W_3 x)$) matching modern architectures like LLaMA and Mistral.
- **Attention**: Grouped-Query Attention (**GQA**) with Scaled Dot-Product Attention (`F.scaled_dot_product_attention`) leveraging hardware acceleration.
- **Inference Optimization**: State-of-the-art **KV Caching** for $O(1)$ memory retrieval during autoregressive token generation.
- **Data Pipeline**: Zero-copy memory-mapped binary shards (`uint16` / `uint32`) for zero-RAM overhead training on massive text corpuses.

---

## Directory Layout

```text
.
├── model/
│   ├── config.py           # ModelConfig dataclass & model scale presets (tiny, small, base)
│   ├── rope.py             # Rotary Position Embeddings precompute & rotation logic
│   ├── transformer.py      # RMSNorm, SwiGLU, GQA Attention, TransformerBlock, CustomLLM
│   └── generate.py         # KV-cached generation with top-p, top-k, and streaming
├── tokenizer/
│   ├── tokenizer.py        # Tokenizer wrapper around byte-level BPE with special tokens
│   └── train_tokenizer.py  # Standalone Byte-Pair Encoding trainer from raw text
├── data/
│   ├── prepare_data.py     # Download, tokenize, and shard raw text into train.bin / val.bin
│   └── dataloader.py       # Zero-copy memory-mapped dataloader
├── train/
│   ├── train.py            # Pretraining loop with AdamW, Cosine LR, warmup, and live sample generation
│   ├── evaluate.py         # Validation loss and perplexity evaluation
│   └── checkpoint.py       # Checkpoint saving & resuming
├── infer/
│   └── chat.py             # Interactive CLI generator with real-time token streaming
├── tests/
│   ├── test_model.py       # RMSNorm, RoPE, forward pass, and KV-cache parity tests
│   ├── test_tokenizer.py   # Tokenizer roundtrip and tensor conversion tests
│   └── test_training_step.py # Optimizer step & gradient backpropagation tests
├── requirements.txt
└── pyproject.toml
```

---

## Quickstart

### 1. Setup Environment
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Run Test Suite
```bash
pytest tests/ -v
```

### 3. Prepare Dataset
Tokenize raw text into memory-mapped binary shards:
```bash
# Prepare sample benchmark dataset:
python data/prepare_data.py

# Or prepare custom raw text file:
python data/prepare_data.py --input_file /path/to/my_corpus.txt --output_dir data
```

### 4. Train the Model
Train on Apple Silicon GPU (`mps`), CUDA, or CPU:
```bash
# Rapid local test run (~17M parameters):
python train/train.py --scale tiny --batch_size 16 --seq_len 256 --max_steps 1000

# Capable model (~65M parameters):
python train/train.py --scale small --batch_size 32 --seq_len 512 --max_steps 5000
```

### 5. Interactive Inference
Generate text interactively or one-shot with real-time streaming:
```bash
# Interactive chat loop:
python infer/chat.py --checkpoint checkpoints/best_model.pt

# One-shot prompt:
python infer/chat.py --checkpoint checkpoints/best_model.pt --prompt "To be or not to be" --temperature 0.8
```

---

## Model Scale Presets

| Preset | Parameters | Layers | Hidden Dim | Heads | KV Heads | Max Seq Len |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `tiny` | ~17M | 6 | 256 | 8 | 4 | 512 |
| `small`| ~65M | 8 | 512 | 8 | 4 | 1024 |
| `base` | ~150M | 12 | 768 | 12 | 4 | 2048 |
