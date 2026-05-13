#!/bin/sh
set -eu

echo "[python-service] waiting for database config: ${MIMI_DATABASE_URL}"
alembic upgrade head
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
