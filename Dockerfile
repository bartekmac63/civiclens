# Backend image: ingestion + analysis + FastAPI, on the live PostgreSQL store.
# psycopg[binary] and numpy ship manylinux wheels, so no build toolchain is
# needed — a slim runtime is enough.
FROM python:3.12-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install dependencies first (the package metadata), then the code, so the
# dependency layer is cached across code-only changes.
COPY pyproject.toml README.md ./
COPY ingestion ./ingestion
COPY analysis ./analysis
COPY api ./api
RUN pip install .

# Run as an unprivileged user.
RUN useradd --create-home --uid 10001 civiclens
USER civiclens

EXPOSE 8099

# Default: serve the API. The compose `api` service runs migrations first.
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8099"]
