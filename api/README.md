# API module

FastAPI service exposing MPs, votings, and computed voting metrics.

- `main.py` — application skeleton with `/` and `/health` endpoints.

Run locally (once dependencies are installed):

```bash
uvicorn api.main:app --reload
```

Status: skeleton. Health and root endpoints work; data routes are TODOs.
