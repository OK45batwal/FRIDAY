#!/usr/bin/env bash
# ==============================================================================
# Ingest Colab-Trained GO 1.0 (GGUF) into Local Ollama & FRIDAY
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "  ╔═══════════════════════════════════════════════════════════╗"
echo "  ║        IMPORT COLAB-DISTILLED GO 1.0 INTO OLLAMA          ║"
echo "  ║         Target File: checkpoints/goo1-Q4_K_M.gguf         ║"
echo "  ╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

GGUF_TARGET="checkpoints/goo1-Q4_K_M.gguf"

# 1. Check if GGUF exists in checkpoints or Downloads
if [ ! -f "$GGUF_TARGET" ]; then
    echo -e "${YELLOW}[*] Searching for downloaded GGUF in ~/Downloads...${NC}"
    if [ -f "$HOME/Downloads/goo1-Q4_K_M.gguf" ]; then
        echo -e "${GREEN}[✓] Found in ~/Downloads! Moving to checkpoints/...${NC}"
        mkdir -p checkpoints
        cp "$HOME/Downloads/goo1-Q4_K_M.gguf" "$GGUF_TARGET"
    elif [ -f "$HOME/Downloads/unsloth.Q4_K_M.gguf" ]; then
        echo -e "${GREEN}[✓] Found unsloth.Q4_K_M.gguf in ~/Downloads! Renaming to $GGUF_TARGET...${NC}"
        mkdir -p checkpoints
        cp "$HOME/Downloads/unsloth.Q4_K_M.gguf" "$GGUF_TARGET"
    else
        echo -e "${RED}[ERROR] GGUF file not found at $GGUF_TARGET or ~/Downloads/goo1-Q4_K_M.gguf${NC}"
        echo "Please download the compiled 'goo1-Q4_K_M.gguf' file from your Google Colab / Google Drive session"
        echo "and place it inside the 'checkpoints/' folder."
        exit 1
    fi
fi

echo -e "${GREEN}[✓] Verified GGUF model binary: $(ls -lh "$GGUF_TARGET" | awk '{print $5}')${NC}"

# 2. Verify Ollama is running
if ! curl -s http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
    echo -e "${YELLOW}[!] Ollama is not running. Starting 'ollama serve'...${NC}"
    ollama serve > /dev/null 2>&1 &
    sleep 3
fi

# 3. Compile model into Ollama from Modelfile.gguf
echo -e "${CYAN}[*] Registering GGUF weights into Ollama as 'go1.0'...${NC}"
ollama create go1.0 -f model/go1/Modelfile.gguf
ollama cp go1.0 goo1 2>/dev/null || true

echo -e "\n${GREEN}${BOLD}✓ Successfully loaded Colab-trained GO 1.0 weights!${NC}"
echo -e "Testing inference on Apple Silicon Metal:\n"
ollama run go1.0 "Who are you and how were you trained?"
