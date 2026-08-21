# FRIDAY — AI Operating Assistant (v0.1)

FRIDAY is a modular, futuristic AI Operating Assistant designed for local and network-wide desktop and mobile orchestration.

---

## 🏗️ Monorepo Architecture

```text
FRIDAY/
├── apps/
│   └── desktop/                 # Electron + React + TypeScript + Tailwind UI
├── services/
│   └── core/                    # FastAPI Backend + SQLite + AI Provider Abstraction
├── packages/
│   └── shared/                  # Shared TypeScript types and constants
├── docs/                        # Architecture, API specs, and setup guides
├── .env.example
└── docker-compose.yml
```

---

## ⚡ Quick Start

### 1. Start the Core Backend Service
```bash
cd services/core
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.main
```
The FastAPI server will start on [http://0.0.0.0:8000](http://0.0.0.0:8000).

### 2. Start the Desktop Frontend
```bash
cd apps/desktop
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) (or your local IP `http://<local-ip>:5173` on mobile).
