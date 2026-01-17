---
description: how to start the Tripzy Autonomous Reasoning Engine backend
---

This workflow will guide you through starting the FastAPI backend which handles the autonomous reasoning and recommendation logic.

1. Navigate to the project root (if not already there):
   `cd ..` (if inside backend dir)

2. Install the required dependencies:
   `pip install -r backend/requirements.txt`

3. Start the FastAPI server:
   `python -m backend.main`

The reasoning engine will now be available at `http://localhost:8000`. The frontend will automatically connect to it to provide explained recommendations.
