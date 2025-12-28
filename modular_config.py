# modular_config.py - CONFIGURACIÓN PARA BACKEND MODULAR EXISTENTE
# ============================================================================

import os
from pathlib import Path

class ModularBackendConfig:
    """Configuración específica para integrar con el backend modular existente"""
    
    # Información del proyecto
    PROJECT_NAME = "Sapientia Medical License Server"
    FRONTEND_VERSION = "2.0.0"
    AUTHOR = "Pedro Diaz Nicolas"
    
    # Rutas del proyecto
    BASE_DIR = Path(__file__).resolve().parent
    FRONTEND_DIR = BASE_DIR / "frontend"
    
    # Configuración del servidor integrado
    HOST = os.getenv("SAPIENTIA_HOST", "0.0.0.0") 
    PORT = int(os.getenv("SAPIENTIA_PORT", 8000))
    DEBUG = os.getenv("SAPIENTIA_DEBUG", "True").lower() == "true"
    
    # CORS para desarrollo y producción
    CORS_ORIGINS = [
        "http://localhost:8000",
        "http://127.0.0.1:8000", 
        "http://localhost:3000",
        "https://sapientia.pedrodiaznicolas.com"
    ]
    
    # Mapeo de endpoints del backend modular al frontend
    ENDPOINT_MAPPING = {
        # Endpoints de licencias
        "license_generate": "/license/generate",
        "license_validate": "/license/validate", 
        "license_info": "/license/info",
        "license_renew": "/license/renew",
        "license_deactivate": "/license/deactivate",
        
        # Endpoints de módulos (admin)
        "modules_list": "/admin/modules",
        "modules_create": "/admin/modules",
        "modules_update": "/admin/modules/{id}",
        "modules_delete": "/admin/modules/{id}",
        "admin_stats": "/admin/stats",
        
        # Endpoints de control
        "control_dashboard": "/control/dashboard",
        "control_licenses": "/control/licenses",
        "license_toggle": "/control/licenses/{id}/toggle",
        "module_block": "/control/licenses/{id}/block-module",
        
        # Endpoints del sistema
        "health": "/health",
        "system_info": "/system/info"
    }
    
    # Configuración específica del backend médico
    MEDICAL_CONFIG = {
        "default_license_type": "trial",
        "default_modules": [
            "medical_clinic",
            "medical_clinic_dashboard", 
            "medical_clinic_inventory"
        ],
        "license_prefixes": {
            "medical": "MED",
            "retail": "POS", 
            "finance": "FIN",
            "default": "PDN"
        }
    }
    
    # Configuración de tipos de licencia médica
    MEDICAL_LICENSE_TYPES = [
        {
            "name": "trial",
            "display_name": "Trial Médico",
            "description": "Prueba gratuita para clínicas pequeñas",
            "duration_days": 30,
            "max_users": 3,
            "max_modules": 2,
            "price": 0.00,
            "features": ["Pacientes", "Doctores", "Citas básicas"]
        },
        {
            "name": "clinic_basic", 
            "display_name": "Clínica Básica",
            "description": "Para consultorios y clínicas pequeñas", 
            "duration_days": 365,
            "max_users": 5,
            "max_modules": 3,
            "price": 299.00,
            "features": ["Hasta 5 usuarios", "Historias clínicas", "Agenda médica", "Reportes básicos"]
        },
        {
            "name": "clinic_standard",
            "display_name": "Clínica Standard", 
            "description": "Para clínicas medianas con múltiples especialidades",
            "duration_days": 365,
            "max_users": 15,
            "max_modules": 6,
            "price": 599.00,
            "features": ["Hasta 15 usuarios", "Múltiples especialidades", "Dashboard BI", "Inventario médico", "Reportes avanzados"]
        },
        {
            "name": "hospital_enterprise",
            "display_name": "Hospital Enterprise",
            "description": "Para hospitales y clínicas grandes",
            "duration_days": 365, 
            "max_users": 50,
            "max_modules": 15,
            "price": 1299.00,
            "features": ["Usuarios ilimitados", "Hospitalización", "UCI", "Quirófanos", "Farmacia", "Laboratorio", "Soporte 24/7"]
        },
        {
            "name": "health_system",
            "display_name": "Sistema de Salud",
            "description": "Para redes de salud y sistemas hospitalarios",
            "duration_days": 365,
            "max_users": 9999, 
            "max_modules": 9999,
            "price": 2999.00,
            "features": ["Multi-sede", "Integración HL7", "Telemedicina", "Analytics avanzados", "Desarrollo personalizado"]
        }
    ]
    
    # Módulos médicos disponibles  
    MEDICAL_MODULES = [
        {
            "name": "medical_clinic",
            "display_name": "Medical Clinic Base",
            "description": "Sistema base para gestión de clínicas médicas con pacientes, doctores y citas",
            "category": "medical",
            "version": "18.0.1.0.0",
            "author": "Pedro Diaz Nicolas",
            "is_core": True,
            "min_license_level": "trial",
            "license_prefix": "MED",
            "icon": "🏥"
        },
        {
            "name": "medical_clinic_dashboard",
            "display_name": "Medical Dashboard BI", 
            "description": "Dashboard con métricas e inteligencia de negocios para clínicas",
            "category": "medical",
            "version": "18.0.1.0.0",
            "author": "Pedro Diaz Nicolas", 
            "is_core": True,
            "min_license_level": "clinic_basic",
            "license_prefix": "MED",
            "icon": "📊"
        },
        {
            "name": "medical_clinic_inventory",
            "display_name": "Medical Inventory",
            "description": "Gestión de inventario médico integrado con stock de Odoo",
            "category": "medical", 
            "version": "18.0.1.0.0",
            "author": "Pedro Diaz Nicolas",
            "is_core": True,
            "min_license_level": "clinic_standard", 
            "license_prefix": "MED",
            "icon": "📦"
        },
        {
            "name": "medical_hospitalization",
            "display_name": "Medical Hospitalization",
            "description": "Módulo para gestión de hospitalización, camas y internación",
            "category": "medical",
            "version": "18.0.1.0.0", 
            "author": "Pedro Diaz Nicolas",
            "is_core": True,
            "min_license_level": "hospital_enterprise",
            "license_prefix": "MED", 
            "icon": "🏨"
        },
        {
            "name": "medical_laboratory",
            "display_name": "Medical Laboratory",
            "description": "Sistema de laboratorio clínico con órdenes y resultados",
            "category": "medical",
            "version": "18.0.1.0.0",
            "author": "Pedro Diaz Nicolas", 
            "is_core": True,
            "min_license_level": "clinic_standard",
            "license_prefix": "MED",
            "icon": "🔬"
        },
        {
            "name": "medical_pharmacy", 
            "display_name": "Medical Pharmacy",
            "description": "Gestión de farmacia hospitalaria y dispensación",
            "category": "medical",
            "version": "18.0.1.0.0",
            "author": "Pedro Diaz Nicolas",
            "is_core": True,
            "min_license_level": "hospital_enterprise", 
            "license_prefix": "MED",
            "icon": "💊"
        }
    ]
    
    # Configuración de seguridad específica
    SECURITY_CONFIG = {
        "hardware_similarity_threshold": 0.85,
        "max_validation_attempts": 1000,
        "license_key_format": "XXX-XXXX-XXXX-XXXX", 
        "encryption_algorithm": "AES-256-GCM",
        "hash_algorithm": "SHA-256"
    }
    
    # Configuración de base de datos (usar la del backend existente)
    DATABASE_CONFIG = {
        "default_url": "sqlite:///medical_licenses.db",
        "models": [
            "LicenseModel", 
            "ModuleModel",
            "LicenseTypeModel",
            "ValidationLogModel"
        ]
    }
    
    # Configuración de logging específica
    LOGGING_CONFIG = {
        "level": "INFO",
        "format": "%(asctime)s - %(name)s - %(levelname)s - [Medical] %(message)s",
        "file": "medical_license_server.log",
        "max_bytes": 10485760,  # 10MB
        "backup_count": 5
    }
    
    @classmethod
    def get_frontend_config(cls):
        """Obtener configuración para el frontend"""
        return {
            "api_base": f"http://{cls.HOST}:{cls.PORT}",
            "project": {
                "name": cls.PROJECT_NAME,
                "version": cls.FRONTEND_VERSION,
                "author": cls.AUTHOR
            },
            "medical": cls.MEDICAL_CONFIG,
            "endpoints": cls.ENDPOINT_MAPPING,
            "license_types": cls.MEDICAL_LICENSE_TYPES,
            "modules": cls.MEDICAL_MODULES
        }
    
    @classmethod
    def get_cors_config(cls):
        """Configuración de CORS"""
        return {
            "allow_origins": cls.CORS_ORIGINS,
            "allow_credentials": True,
            "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["*"]
        }
    
    @classmethod
    def get_security_headers(cls):
        """Headers de seguridad"""
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY", 
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com",
            "X-Powered-By": f"Sapientia Medical v{cls.FRONTEND_VERSION}"
        }
    
    @classmethod
    def validate_medical_license(cls, license_type, modules):
        """Validar compatibilidad de licencia médica con módulos"""
        type_config = next((lt for lt in cls.MEDICAL_LICENSE_TYPES if lt["name"] == license_type), None)
        
        if not type_config:
            return False, "Tipo de licencia no válido"
        
        # Verificar límite de módulos
        if len(modules) > type_config["max_modules"]:
            return False, f"Máximo {type_config['max_modules']} módulos para {license_type}"
        
        # Verificar nivel mínimo de licencia para cada módulo
        for module_name in modules:
            module_config = next((m for m in cls.MEDICAL_MODULES if m["name"] == module_name), None)
            if module_config:
                required_level = module_config["min_license_level"] 
                if not cls._license_level_sufficient(license_type, required_level):
                    return False, f"Módulo {module_name} requiere licencia {required_level} o superior"
        
        return True, "Licencia válida para módulos seleccionados"
    
    @classmethod
    def _license_level_sufficient(cls, current_level, required_level):
        """Verificar si el nivel de licencia es suficiente"""
        levels = ["trial", "clinic_basic", "clinic_standard", "hospital_enterprise", "health_system"]
        
        try:
            current_idx = levels.index(current_level)
            required_idx = levels.index(required_level)
            return current_idx >= required_idx
        except ValueError:
            return False

# Instancia global de configuración
medical_config = ModularBackendConfig()