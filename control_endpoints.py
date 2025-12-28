# control_endpoints.py - CONTROL Y GESTIÓN DE LICENCIAS
# -*- coding: utf-8 -*-

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from main import get_db, License, LicenseValidation
from schemas import DashboardStats, LicenseControlResponse
from datetime import datetime, timedelta
from typing import List
import logging

logger = logging.getLogger(__name__)

control_router = APIRouter(prefix="/admin", tags=["License Control"])

@control_router.get("/dashboard")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Dashboard administrativo con estadísticas"""
    try:
        total_licenses = db.query(License).count()
        active_licenses = db.query(License).filter(License.is_active == True).count()
        expired_licenses = db.query(License).filter(License.expiry_date < datetime.utcnow()).count()
        
        # Validaciones recientes (24 horas)
        recent_validations = db.query(LicenseValidation).filter(
            LicenseValidation.validation_time > datetime.utcnow() - timedelta(hours=24)
        ).count()
        
        return {
            "stats": {
                "total_licenses": total_licenses,
                "active_licenses": active_licenses,
                "expired_licenses": expired_licenses,
                "recent_validations_24h": recent_validations
            }
        }
    except Exception as e:
        logger.error(f"Error obteniendo dashboard: {e}")
        return {
            "stats": {
                "total_licenses": 0,
                "active_licenses": 0,
                "expired_licenses": 0,
                "recent_validations_24h": 0
            }
        }

@control_router.get("/licenses")
async def get_all_licenses(db: Session = Depends(get_db)):
    """Panel de administración - Ver todas las licencias"""
    try:
        licenses = db.query(License).order_by(License.issued_date.desc()).all()
        
        return {
            "licenses": [
                {
                    "id": lic.id,
                    "license_key": lic.license_key,
                    "client_name": lic.client_name,
                    "client_email": lic.client_email,
                    "license_type": lic.license_type,
                    "issued_date": lic.issued_date.isoformat() if lic.issued_date else None,
                    "expiry_date": lic.expiry_date.isoformat(),
                    "max_users": lic.max_users,
                    "current_users": lic.current_users or 0,
                    "allowed_modules": lic.allowed_modules,
                    "is_active": lic.is_active,
                    "validation_count": lic.validation_count or 0
                }
                for lic in licenses
            ],
            "total_licenses": len(licenses)
        }
    except Exception as e:
        logger.error(f"Error obteniendo licencias: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@control_router.post("/licenses/{license_id}/toggle")
async def toggle_license_status(license_id: int, db: Session = Depends(get_db)):
    """Activar/Desactivar una licencia específica"""
    try:
        license_obj = db.query(License).filter(License.id == license_id).first()
        if not license_obj:
            raise HTTPException(status_code=404, detail="Licencia no encontrada")
        
        license_obj.is_active = not license_obj.is_active
        db.commit()
        
        status = "activada" if license_obj.is_active else "desactivada"
        return {
            "success": True,
            "license_key": license_obj.license_key,
            "client_name": license_obj.client_name,
            "is_active": license_obj.is_active,
            "message": f"Licencia {status} exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cambiando estado de licencia: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@control_router.post("/licenses/{license_id}/block-module")
async def block_module_for_license(license_id: int, module_name: str, db: Session = Depends(get_db)):
    """Bloquear un módulo específico de una licencia"""
    try:
        license_obj = db.query(License).filter(License.id == license_id).first()
        if not license_obj:
            raise HTTPException(status_code=404, detail="Licencia no encontrada")
        
        if module_name in license_obj.allowed_modules:
            license_obj.allowed_modules.remove(module_name)
            db.commit()
            
            return {
                "success": True,
                "message": f"Módulo '{module_name}' bloqueado para {license_obj.client_name}",
                "license_key": license_obj.license_key,
                "remaining_modules": license_obj.allowed_modules
            }
        else:
            raise HTTPException(status_code=400, detail="El módulo no está en esta licencia")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error bloqueando módulo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@control_router.get("/purchases")
async def get_purchases(db: Session = Depends(get_db)):
    """Obtener historial de compras/licencias generadas"""
    try:
        licenses = db.query(License).order_by(License.issued_date.desc()).all()
        
        purchases = []
        for lic in licenses:
            purchases.append({
                "id": lic.id,
                "license_key": lic.license_key,
                "client_name": lic.client_name,
                "client_email": lic.client_email,
                "license_type": lic.license_type,
                "purchase_date": lic.issued_date.isoformat() if lic.issued_date else None,
                "amount": 0,  # Agregar campo price en futuras versiones
                "modules": lic.allowed_modules,
                "status": "active" if lic.is_active else "inactive"
            })
        
        return {
            "purchases": purchases,
            "total_purchases": len(purchases),
            "total_licenses_generated": len(licenses)
        }
    except Exception as e:
        logger.error(f"Error obteniendo compras: {e}")
        return {
            "purchases": [],
            "total_purchases": 0,
            "total_licenses_generated": 0
        }