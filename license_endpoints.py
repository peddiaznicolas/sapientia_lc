# -*- coding: utf-8 -*-
"""
License Management Endpoints
===========================
Endpoints para gestión completa de licencias médicas
"""

from fastapi import APIRouter, HTTPException, Depends, Request, status
from sqlalchemy.orm import Session
from typing import List
import logging
from datetime import datetime, timedelta

from main import get_db, License, LicenseType, MedicalModule, LicenseValidation
from schemas import LicenseRequest, LicenseValidationRequest, LicenseResponse
from utils import SecurityManager, HardwareInfo

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/license", tags=["License Management"])

# ============================================================================
# ENDPOINTS DE TIPOS DE LICENCIA
# ============================================================================

@router.get("/types", response_model=List[dict])
async def get_license_types(db: Session = Depends(get_db)):
    """Obtiene todos los tipos de licencia disponibles"""
    license_types = db.query(LicenseType).all()
    return [
        {
            "name": lt.name,
            "description": lt.description,
            "max_users": lt.max_users,
            "duration_days": lt.duration_days,
            "price": lt.price,
            "max_modules": lt.max_modules,
            "features": lt.features
        }
        for lt in license_types
    ]

# ============================================================================
# ENDPOINTS DE MÓDULOS MÉDICOS  
# ============================================================================

@router.get("/modules", response_model=List[dict])
async def get_medical_modules(db: Session = Depends(get_db)):
    """Obtiene todos los módulos médicos disponibles"""
    modules = db.query(MedicalModule).all()
    return [
        {
            "name": module.name,
            "display_name": module.display_name,
            "description": module.description,
            "version": module.version,
            "is_core": module.is_core,
            "min_license_level": module.min_license_level
        }
        for module in modules
    ]

# ============================================================================
# SOLICITUD DE LICENCIA
# ============================================================================

@router.post("/request", response_model=dict)
async def request_license(
    license_req: LicenseRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Solicita una nueva licencia médica"""
    try:
        # Validar tipo de licencia
        license_type = db.query(LicenseType).filter(
            LicenseType.name == license_req.license_type
        ).first()
        
        if not license_type:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de licencia '{license_req.license_type}' no válido"
            )
        
        # Validar módulos solicitados
        if license_req.requested_modules:
            for module_name in license_req.requested_modules:
                module = db.query(MedicalModule).filter(
                    MedicalModule.name == module_name
                ).first()
                if not module:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Módulo '{module_name}' no existe"
                    )
        
        # Generar huella digital del hardware
        hardware_fingerprint = SecurityManager.generate_hardware_fingerprint(
            license_req.hardware_info
        )
        
        # Verificar si ya existe una licencia para este hardware
        existing_license = db.query(License).filter(
            License.hardware_fingerprint == hardware_fingerprint,
            License.is_active == True
        ).first()
        
        if existing_license:
            raise HTTPException(
                status_code=409,
                detail="Ya existe una licencia activa para este hardware"
            )
        
        # Generar clave de licencia única
        license_key = SecurityManager.generate_license_key()
        
        # Determinar módulos permitidos basado en el tipo de licencia
        allowed_modules = license_req.requested_modules or ["medical_clinic"]
        
        # Verificar límite de módulos
        if license_type.max_modules > 0 and len(allowed_modules) > license_type.max_modules:
            raise HTTPException(
                status_code=400,
                detail=f"Excede el límite de módulos ({license_type.max_modules}) para licencia {license_type.name}"
            )
        
        # Crear nueva licencia
        expiry_date = datetime.utcnow() + timedelta(days=license_type.duration_days)
        
        new_license = License(
            license_key=license_key,
            client_name=license_req.client_name,
            client_email=license_req.client_email,
            license_type=license_req.license_type,
            hardware_fingerprint=hardware_fingerprint,
            expiry_date=expiry_date,
            max_users=license_type.max_users,
            allowed_modules=allowed_modules,
            is_active=True
        )
        
        db.add(new_license)
        db.commit()
        db.refresh(new_license)
        
        logger.info(f"Nueva licencia creada: {license_key} para {license_req.client_name}")
        
        return {
            "success": True,
            "license_key": license_key,
            "client_name": license_req.client_name,
            "license_type": license_req.license_type,
            "expires_at": expiry_date.isoformat(),
            "max_users": license_type.max_users,
            "allowed_modules": allowed_modules,
            "message": "Licencia generada exitosamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creando licencia: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor al crear licencia"
        )

# ============================================================================
# VALIDACIÓN DE LICENCIA
# ============================================================================

@router.post("/validate", response_model=dict)
async def validate_license(
    validation_req: LicenseValidationRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Valida una licencia para un módulo específico"""
    try:
        client_ip = request.client.host
        user_agent = request.headers.get("user-agent", "Unknown")
        
        # Buscar licencia
        license_record = db.query(License).filter(
            License.license_key == validation_req.license_key,
            License.is_active == True
        ).first()
        
        validation_result = "failed"
        error_message = None
        
        if not license_record:
            error_message = "Licencia no encontrada o inactiva"
        elif datetime.utcnow() > license_record.expiry_date:
            error_message = "Licencia expirada"
        else:
            # Validar hardware
            current_fingerprint = SecurityManager.generate_hardware_fingerprint(
                validation_req.hardware_info
            )
            
            if not SecurityManager.validate_hardware_match(
                license_record.hardware_fingerprint, current_fingerprint
            ):
                error_message = "Hardware no coincide con la licencia"
            elif validation_req.module_name not in license_record.allowed_modules:
                error_message = f"Módulo '{validation_req.module_name}' no permitido en esta licencia"
            elif (license_record.max_users > 0 and 
                  validation_req.user_count > license_record.max_users):
                error_message = f"Excede límite de usuarios ({license_record.max_users})"
            else:
                validation_result = "success"
                
                # Actualizar contadores
                license_record.last_validation = datetime.utcnow()
                license_record.validation_count += 1
                license_record.current_users = max(
                    license_record.current_users, validation_req.user_count
                )
                db.commit()
        
        # Registrar validación
        validation_log = LicenseValidation(
            license_key=validation_req.license_key,
            module_name=validation_req.module_name,
            hardware_fingerprint=SecurityManager.generate_hardware_fingerprint(
                validation_req.hardware_info
            ),
            ip_address=client_ip,
            user_agent=user_agent,
            validation_result=validation_result,
            error_message=error_message
        )
        db.add(validation_log)
        db.commit()
        
        if validation_result == "success":
            return {
                "valid": True,
                "license_key": validation_req.license_key,
                "module_name": validation_req.module_name,
                "client_name": license_record.client_name,
                "license_type": license_record.license_type,
                "expires_at": license_record.expiry_date.isoformat(),
                "max_users": license_record.max_users,
                "current_users": license_record.current_users,
                "allowed_modules": license_record.allowed_modules,
                "message": "Licencia válida"
            }
        else:
            return {
                "valid": False,
                "license_key": validation_req.license_key,
                "module_name": validation_req.module_name,
                "error": error_message,
                "message": "Validación de licencia fallida"
            }
            
    except Exception as e:
        logger.error(f"Error validando licencia: {str(e)}")
        
        # Registrar error en log
        validation_log = LicenseValidation(
            license_key=validation_req.license_key,
            module_name=validation_req.module_name,
            hardware_fingerprint="error",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", "Unknown"),
            validation_result="error",
            error_message=str(e)
        )
        db.add(validation_log)
        db.commit()
        
        return {
            "valid": False,
            "license_key": validation_req.license_key,
            "module_name": validation_req.module_name,
            "error": "Error interno del servidor",
            "message": "Error al validar licencia"
        }

# ============================================================================
# INFORMACIÓN DE LICENCIA
# ============================================================================

@router.get("/info/{license_key}", response_model=dict)
async def get_license_info(license_key: str, db: Session = Depends(get_db)):
    """Obtiene información detallada de una licencia"""
    license_record = db.query(License).filter(
        License.license_key == license_key
    ).first()
    
    if not license_record:
        raise HTTPException(status_code=404, detail="Licencia no encontrada")
    
    # Obtener estadísticas de validación
    validation_count = db.query(LicenseValidation).filter(
        LicenseValidation.license_key == license_key
    ).count()
    
    recent_validations = db.query(LicenseValidation).filter(
        LicenseValidation.license_key == license_key,
        LicenseValidation.validation_time >= datetime.utcnow() - timedelta(days=7)
    ).count()
    
    return {
        "license_key": license_record.license_key,
        "client_name": license_record.client_name,
        "client_email": license_record.client_email,
        "license_type": license_record.license_type,
        "issued_date": license_record.issued_date.isoformat(),
        "expiry_date": license_record.expiry_date.isoformat(),
        "is_active": license_record.is_active,
        "max_users": license_record.max_users,
        "current_users": license_record.current_users,
        "allowed_modules": license_record.allowed_modules,
        "last_validation": license_record.last_validation.isoformat() if license_record.last_validation else None,
        "total_validations": validation_count,
        "recent_validations": recent_validations,
        "days_remaining": (license_record.expiry_date - datetime.utcnow()).days,
        "status": "active" if license_record.is_active and datetime.utcnow() <= license_record.expiry_date else "inactive"
    }

# ============================================================================
# RENOVACIÓN DE LICENCIA
# ============================================================================

@router.post("/renew/{license_key}", response_model=dict)
async def renew_license(
    license_key: str,
    renewal_days: int = 365,
    db: Session = Depends(get_db)
):
    """Renueva una licencia existente"""
    license_record = db.query(License).filter(
        License.license_key == license_key
    ).first()
    
    if not license_record:
        raise HTTPException(status_code=404, detail="Licencia no encontrada")
    
    # Extender fecha de expiración
    new_expiry = max(datetime.utcnow(), license_record.expiry_date) + timedelta(days=renewal_days)
    license_record.expiry_date = new_expiry
    license_record.is_active = True
    
    db.commit()
    
    logger.info(f"Licencia renovada: {license_key} hasta {new_expiry}")
    
    return {
        "success": True,
        "license_key": license_key,
        "new_expiry_date": new_expiry.isoformat(),
        "days_added": renewal_days,
        "message": "Licencia renovada exitosamente"
    }

# ============================================================================
# DESACTIVACIÓN DE LICENCIA
# ============================================================================

@router.post("/deactivate/{license_key}", response_model=dict)
async def deactivate_license(license_key: str, db: Session = Depends(get_db)):
    """Desactiva una licencia"""
    license_record = db.query(License).filter(
        License.license_key == license_key
    ).first()
    
    if not license_record:
        raise HTTPException(status_code=404, detail="Licencia no encontrada")
    
    license_record.is_active = False
    db.commit()
    
    logger.info(f"Licencia desactivada: {license_key}")
    
    return {
        "success": True,
        "license_key": license_key,
        "message": "Licencia desactivada exitosamente"
    }