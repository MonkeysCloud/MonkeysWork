FROM python:3.11-slim

RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app

COPY ai-fraud-v1/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ai-fraud-v1/src/ ./src/

# Shared libraries (pubsub, callback)
COPY shared/ ./shared/

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/healthz')" || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]
