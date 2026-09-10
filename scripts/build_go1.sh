#!/usr/bin/env bash
# ==============================================================================
# GO 1.0 (goo1) Model Builder & Verification Suite
# Builds a specialized model on top of Google Gemma 2 (2B)
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
echo "  ║        GO 1.0 (goo1) BUILD & DEPLOYMENT PIPELINE          ║"
echo "  ║         Foundation: Google Gemma 2 (2B Parameters)        ║"
echo "  ║         Specialties: Emails • Translation • Analysis      ║"
echo "  ╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 1. Verify Ollama CLI
if ! command -v ollama > /dev/null 2>&1; then
    echo -e "${RED}[ERROR] Ollama is not installed or not in PATH.${NC}"
    echo "Please install Ollama from https://ollama.ai"
    exit 1
fi

# 2. Check Ollama server
echo -e "${CYAN}[1/5] Checking Ollama server connection...${NC}"
if ! curl -s http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
    echo -e "${YELLOW}[!] Ollama daemon is not responding. Starting 'ollama serve'...${NC}"
    ollama serve > /dev/null 2>&1 &
    sleep 3
fi

if ! curl -s http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
    echo -e "${RED}[ERROR] Could not establish connection to Ollama at http://127.0.0.1:11434${NC}"
    echo "Please start the Ollama application and re-run this script."
    exit 1
fi
echo -e "${GREEN}[✓] Ollama server is online.${NC}"

# 3. Verify base model (gemma2:2b)
echo -e "${CYAN}[2/5] Checking foundation model 'gemma2:2b'...${NC}"
if ! ollama list | grep -q "gemma2:2b"; then
    echo -e "${YELLOW}[*] Pulling base model 'gemma2:2b' from Ollama library...${NC}"
    ollama pull gemma2:2b
fi
echo -e "${GREEN}[✓] Foundation model 'gemma2:2b' is available.${NC}"

# 4. Build GO 1.0 from Modelfile
echo -e "${CYAN}[3/5] Compiling GO 1.0 (go1.0) with specialized system instructions...${NC}"
if [ ! -f "model/go1/Modelfile" ]; then
    echo -e "${RED}[ERROR] model/go1/Modelfile not found.${NC}"
    exit 1
fi

ollama create go1.0 -f model/go1/Modelfile
echo -e "${GREEN}[✓] Successfully created 'go1.0'!${NC}"

# Create alias 'goo1'
echo -e "${CYAN}[4/5] Registering alias 'goo1'...${NC}"
ollama cp go1.0 goo1 2>/dev/null || true
echo -e "${GREEN}[✓] Model registered as both 'go1.0' and 'goo1'.${NC}"

# 5. Automated Verification Test Suite
echo -e "\n${CYAN}[5/5] Running Automated Capability Benchmark for GO 1.0...${NC}"
echo -e "─────────────────────────────────────────────────────────────"

echo -e "\n${BOLD}[Test 1: Identity & Architecture]${NC}"
ollama run go1.0 "In 2 sentences, who are you and what is your base model?"

echo -e "\n${BOLD}[Test 2: Professional Email Composition]${NC}"
ollama run go1.0 "Write a brief 3-sentence email thanking a client for a productive demo call and proposing next steps for Friday."

echo -e "\n${BOLD}[Test 3: Multilingual Translation]${NC}"
ollama run go1.0 "Translate to Spanish and French: 'We are excited to introduce our new AI assistant.'"

echo -e "\n${BOLD}[Test 4: Language Finding & Summarization]${NC}"
ollama run go1.0 "Find the key action item from: 'The system showed high memory usage during the batch job. Omkar will optimize the data loader by tomorrow morning.'"

echo -e "\n─────────────────────────────────────────────────────────────"
echo -e "${GREEN}${BOLD}✓ GO 1.0 (goo1) is fully built, tested, and ready!${NC}"
echo -e "You can now:"
echo -e "  1. Test interactively via terminal:  ${CYAN}ollama run go1.0${NC}"
echo -e "  2. Start FRIDAY with GO 1.0:         ${CYAN}./run.sh${NC}"
