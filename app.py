# app.py - PUNTO DE ENTRADA MODULAR
# -*- coding: utf-8 -*-

from main import app, get_db
from license_endpoints import router as license_router
from admin_endpoints import admin_router
from control_endpoints import control_router
from utils import populate_initial_data
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Incluir todos los routers
try:
    app.include_router(license_router)
    app.include_router(admin_router)
    app.include_router(control_router)
    logger.info("✅ Todos los endpoints cargados correctamente")
except Exception as e:
    logger.error(f"❌ Error cargando endpoints: {e}")

# Cargar datos iniciales al startup
@app.on_event("startup")
async def startup_event():
    """Eventos de inicio"""
    try:
        # Cargar datos iniciales
        db = next(get_db())
        populate_initial_data(db)
        db.close()
        logger.info("✅ Servidor iniciado correctamente")
    except Exception as e:
        logger.error(f"❌ Error en startup: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)