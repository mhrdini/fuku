# packages/solver/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install uv CLI
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Sync base dependencies (without installing project yet)
RUN uv sync --frozen --no-dev --no-install-project --no-cache

# Copy source code
COPY src/ ./src/

# Re-sync dependencies (ensures uv.lock matches venv)
RUN uv sync --frozen --no-dev

# Add venv to PATH
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH=/app/src

# Server config
ENV PORT=8000
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD curl -f http://localhost:${PORT}/health || exit 1

# Start uvicorn with package path
CMD ["uvicorn", "solver.app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]