"""
FRIDAY-1B: Fast Unsloth Fine-Tuning Script (Google Colab / Cloud GPU)
Run this script to fine-tune Qwen2.5-0.5B / Llama-3.2-1B with 5x speedup and 80% less VRAM.
"""

SCRIPT_CONTENT = '''
# 1. Install Unsloth & Dependencies
!pip install --no-deps "xformers<0.0.29" "trl<0.9.0" peft accelerate bitsandbytes
!pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"

import torch
from unsloth import FastLanguageModel
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments

# 2. Load Base Model
max_seq_length = 2048
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "Qwen/Qwen2.5-0.5B-Instruct",
    max_seq_length = max_seq_length,
    dtype = None,
    load_in_4bit = True,
)

# 3. Add LoRA Adapters
model = FastLanguageModel.get_peft_model(
    model,
    r = 16,
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_alpha = 32,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
)

# 4. Load Friday Dataset
dataset = load_dataset("json", data_files="friday_dataset.jsonl", split="train")

# 5. Train
trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "messages",
    max_seq_length = max_seq_length,
    dataset_num_proc = 2,
    packing = False,
    args = TrainingArguments(
        per_device_train_batch_size = 4,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 60,
        learning_rate = 2e-4,
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        output_dir = "friday-1b-lora",
    ),
)
trainer.train()

# 6. Save GGUF Model for Mac & Android
model.save_pretrained_gguf("friday-1b-gguf", tokenizer, quantization_method = "q4_k_m")
print("✓ FRIDAY GGUF model successfully created!")
'''

if __name__ == "__main__":
    with open("services/core/training/train_unsloth_colab.py", "w", encoding="utf-8") as f:
        f.write(SCRIPT_CONTENT.strip())
    print("✓ Created services/core/training/train_unsloth_colab.py")
