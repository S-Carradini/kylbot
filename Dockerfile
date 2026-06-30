# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /build

COPY frontend/package.json frontend/pnpm-workspace.yaml* ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Python application
FROM python:3.11-slim AS app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY backend/ /app/

# Copy the built React frontend
COPY --from=frontend-builder /build/dist /app/frontend/dist

EXPOSE 8000

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
