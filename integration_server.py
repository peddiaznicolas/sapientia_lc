# integration_server.py - SERVIDOR CON POSTGRESQL EN PUERTO 5450
# ============================================================================

import sys
import os
os.environ["SAPIENTIA_DATABASE_URL"] = "postgresql://sapientia:sapientia_pedro_2025@sapientia-postgres:5450/sapientia"
from pathlib import Path

# Configurar puerto ANTES de importar cualquier cosa
sys.path.insert(0, str(Path(__file__).resolve().parent))

# Importar configuración de base de datos
try:
    import db_config_5450
    print("✅ Configuración de BD para puerto 5450 cargada")
except Exception as e:
    print(f"⚠️ Error cargando configuración BD: {e}")

# Importar el resto del sistema
try:
    from app import app  # Tu app principal modular
    from main import get_db
    
    # Importar endpoints modulares existentes
    import license_endpoints
    import admin_endpoints  
    import control_endpoints

    # # AGREGAR ESTAS LÍNEAS - Incluir los routers
    # app.include_router(license_endpoints.router)
    # app.include_router(admin_endpoints.router)
    # app.include_router(control_endpoints.router)
    
    print("✅ Backend modular cargado exitosamente con puerto 5450")
    
except ImportError as e:
    print(f"❌ Error importando backend modular: {e}")
    print("🔄 Creando servidor básico...")
    
    from fastapi import FastAPI
    app = FastAPI(title="Sapientia License Server")

# Imports necesarios para archivos estáticos y respuestas
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Montar archivos estáticos del frontend
frontend_dir = Path("frontend")
if frontend_dir.exists():
    # Montar CSS
    if (frontend_dir / "css").exists():
        app.mount("/css", StaticFiles(directory="frontend/css"), name="css")
        print("✅ CSS montado")
    
    # Montar JS
    if (frontend_dir / "js").exists():
        app.mount("/js", StaticFiles(directory="frontend/js"), name="js")
        print("✅ JS montado")
    
    # Montar Assets
    if (frontend_dir / "assets").exists():
        app.mount("/assets", StaticFiles(directory="frontend/assets"), name="assets")
        print("✅ Assets montado")
    
    print("✅ Archivos estáticos del frontend montados completamente")
else:
    print("⚠️ Directorio frontend no encontrado")

# Endpoint para servir el frontend principal
@app.get("/")
async def serve_frontend():
    """Servir la aplicación frontend modular"""
    frontend_path = Path("frontend/index.html")
    if frontend_path.exists():
        return FileResponse(frontend_path)
    return {"message": "Sapientia funcionando - Puerto 5450 configurado", "frontend": "no encontrado"}

# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "ok", 
        "postgresql_port": "5450",
        "frontend": frontend_dir.exists(),
        "backend_modular": True
    }

# Endpoint de información del sistema
@app.get("/api/info")
async def get_system_info():
    return {
        "project": "Sapientia License Server",
        "author": "Pedro Diaz Nicolas", 
        "version": "2.0.0",
        "postgresql_port": "5450",
        "frontend_modular": frontend_dir.exists(),
        "status": "running"
    }

# Configuraciones adicionales para Docker
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi import Request
import time

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Compresión
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Log solo para requests importantes
    if not request.url.path.startswith("/css") and not request.url.path.startswith("/js"):
        print(f"🌐 {request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")
    
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-PostgreSQL-Port"] = "5450"
    response.headers["X-Powered-By"] = "Sapientia License Server v2.0.0"
    
    return response


# Función principal
def main():
    import uvicorn
    
    print("="*60)
    print("🚀 Sapientia License Server - Puerto PostgreSQL 5450")
    print("📧 Pedro Diaz Nicolas")
    print("="*60)
    print("🗄️ PostgreSQL configurado en puerto 5450")
    print("🌐 Servidor: http://0.0.0.0:8000")
    print(f"📁 Frontend: {'✅ Disponible' if frontend_dir.exists() else '❌ No encontrado'}")
    print("="*60)
    
    uvicorn.run(
        "integration_server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )

if __name__ == "__main__":
    main()