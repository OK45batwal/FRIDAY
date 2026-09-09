#!/usr/bin/env bash
# ==============================================================================
# FRIDAY — Autonomous Local AI Assistant Startup Script
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "  ███████╗██████╗ ██╗██████╗  █████╗ ██╗   ██╗"
echo "  ██╔════╝██╔══██╗██║██╔══██╗██╔══██╗╚██╗ ██╔╝"
echo "  █████╗  ██████╔╝██║██║  ██║███████║ ╚████╔╝ "
echo "  ██╔══╝  ██╔══██╗██║██║  ██║██╔══██║  ╚██╔╝  "
echo "  ██║     ██║  ██║██║██████╔╝██║  ██║   ██║   "
echo "  ╚═╝     ╚═╝  ╚═╝╚═╝╚═════╝ ╚═╝  ╚═╝   ╚═╝   "
echo "      v2.0 • Local AI Assistant & Neural Lab  "
echo -e "${NC}"

# 1. Check Python virtual environment
PYTHON_BIN="$DIR/.venv/bin/python"
if [ ! -f "$PYTHON_BIN" ]; then
    echo -e "${YELLOW}[!] .venv not found. Falling back to system python3...${NC}"
    PYTHON_BIN="python3"
fi

# 2. Check Ollama
echo -e "${CYAN}[*] Checking Ollama Local LLM Server...${NC}"
if ! curl -s http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
    echo -e "${YELLOW}[!] Ollama is not running. Attempting to start 'ollama serve'...${NC}"
    if command -v ollama > /dev/null 2>&1; then
        ollama serve > /dev/null 2>&1 &
        OLLAMA_PID=$!
        sleep 2
    else
        echo -e "${RED}[ERROR] Ollama binary not found in PATH. Please install Ollama from https://ollama.ai${NC}"
        exit 1
    fi
fi

if curl -s http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}[✓] Ollama server is online (port 11434).${NC}"
else
    echo -e "${RED}[!] Warning: Could not connect to Ollama. FRIDAY will start, but AI inference may fail.${NC}"
fi

# 3. Check model presence (gemma2:2b)
MODEL_CHECK=$(curl -s http://127.0.0.1:11434/api/tags 2>/dev/null | grep "gemma2:2b" || true)
if [ -z "$MODEL_CHECK" ]; then
    echo -e "${YELLOW}[!] Recommended model 'gemma2:2b' not found in Ollama.${NC}"
    echo -e "${YELLOW}[*] Pulling gemma2:2b (this may take a few minutes)...${NC}"
    ollama pull gemma2:2b || echo -e "${YELLOW}[!] Failed to pull gemma2:2b. Ensure you have an active internet connection.${NC}"
fi

# 4. Start FRIDAY Web Server
echo -e "${CYAN}[*] Launching FRIDAY Backend Server...${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  HUD Web Interface:  http://127.0.0.1:8080         ${NC}"
echo -e "${GREEN}  Interactive Docs:   http://127.0.0.1:8080/docs    ${NC}"
echo -e "${GREEN}  System Health:      http://127.0.0.1:8080/api/health${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Press ${YELLOW}Ctrl+C${NC} to stop FRIDAY.\n"

exec "$PYTHON_BIN" -m backend.main
