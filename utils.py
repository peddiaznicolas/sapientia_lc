# utils.py - UTILIDADES Y SEGURIDAD
# -*- coding: utf-8 -*-

import hashlib
import secrets
from datetime import datetime
from schemas import HardwareInfo

class SecurityManager:
    """Gestor de seguridad para hardware fingerprinting y licenciamiento"""
    
    @staticmethod
    def generate_hardware_fingerprint(hardware_info: HardwareInfo) -> str:
        """Genera huella digital única del hardware"""
        combined = (
            hardware_info.mac_address +
            hardware_info.processor_id +
            (hardware_info.motherboard_serial or "") +
            (hardware_info.disk_serial or "") +
            hardware_info.os_info +
            hardware_info.hostname
        )
        return hashlib.sha256(combined.encode()).hexdigest()
    
    @staticmethod
    def generate_license_key(license_prefix: str = "PDN") -> str:
        """Genera clave de licencia única con prefijo personalizable"""
        parts = [secrets.token_hex(4).upper() for _ in range(3)]
        return f"{license_prefix}-{'-'.join(parts)}"
    
    @staticmethod
    def validate_hardware_match(stored_fingerprint: str, current_fingerprint: str) -> bool:
        """Verifica si las huellas digitales coinciden (permite 85% similaridad)"""
        if stored_fingerprint == current_fingerprint:
            return True
        
        # Comparación de similitud básica
        common_chars = sum(a == b for a, b in zip(stored_fingerprint, current_fingerprint))
        similarity = common_chars / max(len(stored_fingerprint), len(current_fingerprint))
        return similarity >= 0.85

def populate_initial_data(db):
    """Populate initial license types and modules"""
    from main import LicenseType, MedicalModule
    
    # Verificar si ya existen datos
    if db.query(LicenseType).count() > 0:
        return
    
    # Tipos de licencia iniciales
    license_types = [
        {
            "name": "trial",
            "description": "Licencia de prueba por 30 días",
            "max_users": 3,
            "max_modules": 2,
            "duration_days": 30,
            "price": 0,
            "features": {"support": "email", "updates": True}
        },
        {
            "name": "standard", 
            "description": "Licencia estándar para pequeñas clínicas",
            "max_users": 10,
            "max_modules": 5,
            "duration_days": 365,
            "price": 299,
            "features": {"support": "email", "updates": True, "backup": True}
        },
        {
            "name": "enterprise",
            "description": "Licencia empresarial para hospitales",
            "max_users": 50,
            "max_modules": -1,
            "duration_days": 365,
            "price": 999,
            "features": {"support": "phone", "updates": True, "backup": True, "priority": True}
        },
        {
            "name": "unlimited",
            "description": "Licencia ilimitada para grandes instituciones",
            "max_users": -1,
            "max_modules": -1,
            "duration_days": 365,
            "price": 1999,
            "features": {"support": "dedicated", "updates": True, "backup": True, "priority": True, "custom": True}
        }
    ]
    
    for lt_data in license_types:
        license_type = LicenseType(**lt_data)
        db.add(license_type)
    
    # Módulos iniciales
    modules = [
        {
            "name": "medical_clinic",
            "display_name": "Medical Clinic Base",
            "description": "Complete medical clinic management: patients, doctors, appointments, medical records",
            "category": "medical",
            "is_core": True,
            "min_license_level": "trial",
            "license_prefix": "MED"
        },
        {
            "name": "medical_clinic_dashboard", 
            "display_name": "Medical Dashboard BI",
            "description": "Advanced medical business intelligence dashboard with analytics and reports",
            "category": "medical",
            "is_core": False,
            "min_license_level": "standard",
            "license_prefix": "MED"
        }
    ]
    
    for mod_data in modules:
        module = MedicalModule(**mod_data)
        db.add(module)
    
    db.commit()
    print("✅ Datos iniciales cargados")