# Development Guide for FRIDAY

## Prerequisites
- Node.js 18+ and npm
- Python 3.10+

## Local Setup

### 1. Services Core
```bash
cd services/core
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run server on port 8000
PYTHONPATH=../../ ./venv/bin/uvicorn services.core.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Desktop Frontend
```bash
cd apps/desktop
npm install
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) or access via local Wi-Fi IP on mobile devices.
