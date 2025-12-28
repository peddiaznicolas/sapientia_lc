# db_config_5450.py - CONFIGURACIÓN BD PARA PUERTO 5450
# ============================================================================

import os
import sys

def setup_database_config():
    """Configurar base de datos para usar puerto 5450"""
    
    # Detectar si estamos en Docker
    if os.path.exists('/.dockerenv'):
        # Dentro de Docker - usar nombre del contenedor
        db_host = "sapientia-postgres"  # Para producción
        if "dev" in os.getcwd() or os.getenv("SAPIENTIA_DEBUG") == "true":
            db_host = "sapientia-db-dev"  # Para desarrollo
    else:
        # Fuera de Docker - usar localhost
        db_host = "localhost"
    
    # Configurar URL de PostgreSQL con puerto 5450
    database_url = f"postgresql://sapientia:sapientia_pedro_2025@{db_host}:5450/sapientia"
    
    # Configurar variable de entorno
    os.environ["DATABASE_URL"] = database_url
    os.environ["SAPIENTIA_DATABASE_URL"] = database_url
    
    print(f"🗄️ Base de datos configurada: {database_url}")
    return database_url

# Configurar automáticamente al importar
if __name__ == "__main__" or True:  # Siempre ejecutar
    setup_database_config()