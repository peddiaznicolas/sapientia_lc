# Dockerfile.port5450 - DOCKERFILE PARA PUERTO 5450
# ============================================================================

FROM python:3.11-slim

# Metadata
LABEL maintainer="Pedro Diaz Nicolas <pedro@diaznicolas.com>"
LABEL version="2.0.0"
LABEL description="Sapientia License Server - PostgreSQL Puerto 5450"

# Variables de entorno
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    SAPIENTIA_HOST=0.0.0.0 \
    SAPIENTIA_PORT=8000 \
    SAPIENTIA_DEBUG=True

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario no-root
RUN groupadd -r sapientia && useradd -r -g sapientia sapientia

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar archivos del proyecto
COPY --chown=sapientia:sapientia . .

# Crear directorios necesarios
RUN mkdir -p /app/data /app/logs && \
    chown -R sapientia:sapientia /app

# Cambiar a usuario no-root
USER sapientia

# Exponer puerto
EXPOSE 5450
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Comando de inicio con servidor configurado para puerto 5450
CMD ["python", "integration_server.py"]