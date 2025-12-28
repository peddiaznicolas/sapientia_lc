# -*- coding: utf-8 -*-
"""
Administration Endpoints
=======================
Endpoints para administración de módulos
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from main import get_db, MedicalModule, License, LicenseType
from datetime import datetime
import logging

# Crear logger local
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

admin_router = APIRouter(prefix="/admin", tags=["Administration"])

@admin_router.get("/modules")
async def get_admin_modules(db: Session = Depends(get_db)):
    """Obtiene todos los módulos para administración"""
    try:
        modules = db.query(MedicalModule).all()
        return {
            "success": True,
            "modules": [
                {
                    "id": module.id,
                    "name": module.name,
                    "display_name": module.display_name,
                    "description": module.description,
                    "version": module.version,
                    "category": module.category,
                    "is_core": module.is_core,
                    "min_license_level": module.min_license_level,
                    "author": getattr(module, 'author', 'Pedro Diaz Nicolas'),
                    "app_store": getattr(module, 'app_store', True),
                    "auto_license": getattr(module, 'auto_license', True),
                    "created_at": module.created_at.isoformat() if hasattr(module, 'created_at') and module.created_at else None
                }
                for module in modules
            ],
            "total": len(modules),
            "categories": list(set(module.category for module in modules))
        }
    except Exception as e:
        logger.error(f"Error obteniendo módulos admin: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.post("/modules")
async def create_module(module_data: dict, db: Session = Depends(get_db)):
    """Crear nuevo módulo"""
    try:
        # Verificar que no existe un módulo con el mismo nombre
        existing = db.query(MedicalModule).filter(
            MedicalModule.name == module_data["name"]
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Ya existe un módulo con ese nombre"
            )
        
        # Crear nuevo módulo
        new_module = MedicalModule(
            name=module_data["name"],
            display_name=module_data["display_name"],
            description=module_data.get("description", ""),
            version=module_data.get("version", "18.0.1.0.0"),
            category=module_data.get("category", "custom"),
            is_core=module_data.get("is_core", False),
            min_license_level=module_data.get("min_license_level", "standard")
        )
        
        # Agregar campos opcionales si existen en el modelo
        for field in ['author', 'app_store', 'auto_license', 'website', 'github_repo']:
            if hasattr(MedicalModule, field):
                setattr(new_module, field, module_data.get(field, 
                    'Pedro Diaz Nicolas' if field == 'author' else 
                    True if field in ['app_store', 'auto_license'] else None))
        
        if hasattr(MedicalModule, 'created_at'):
            new_module.created_at = datetime.utcnow()
        
        db.add(new_module)
        db.commit()
        db.refresh(new_module)
        
        logger.info(f"Nuevo módulo creado: {new_module.name}")
        
        return {
            "success": True,
            "message": "Módulo creado exitosamente",
            "module": {
                "id": new_module.id,
                "name": new_module.name,
                "display_name": new_module.display_name,
                "category": new_module.category
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creando módulo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.put("/modules/{module_id}")
async def update_module(module_id: int, module_data: dict, db: Session = Depends(get_db)):
    """Actualizar módulo existente"""
    try:
        module = db.query(MedicalModule).filter(MedicalModule.id == module_id).first()
        
        if not module:
            raise HTTPException(status_code=404, detail="Módulo no encontrado")
        
        # Actualizar campos básicos
        basic_fields = ["name", "display_name", "description", "version", "category", "min_license_level"]
        for field in basic_fields:
            if field in module_data:
                setattr(module, field, module_data[field])
        
        # Actualizar campos opcionales si existen
        optional_fields = ["author", "app_store", "auto_license", "website", "github_repo"]
        for field in optional_fields:
            if field in module_data and hasattr(module, field):
                setattr(module, field, module_data[field])
        
        db.commit()
        db.refresh(module)
        
        logger.info(f"Módulo actualizado: {module.name}")
        
        return {
            "success": True,
            "message": "Módulo actualizado exitosamente",
            "module": {
                "id": module.id,
                "name": module.name,
                "display_name": module.display_name
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando módulo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.delete("/modules/{module_id}")
async def delete_module(module_id: int, db: Session = Depends(get_db)):
    """Eliminar módulo"""
    try:
        module = db.query(MedicalModule).filter(MedicalModule.id == module_id).first()
        
        if not module:
            raise HTTPException(status_code=404, detail="Módulo no encontrado")
        
        # Verificar que no sea un módulo core
        if getattr(module, 'is_core', False):
            raise HTTPException(
                status_code=400,
                detail="No se pueden eliminar módulos core del sistema"
            )
        
        module_name = module.name
        db.delete(module)
        db.commit()
        
        logger.info(f"Módulo eliminado: {module_name}")
        
        return {
            "success": True,
            "message": f"Módulo '{module_name}' eliminado exitosamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando módulo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.get("/stats")
async def get_admin_stats(db: Session = Depends(get_db)):
    """Obtener estadísticas para el dashboard de administración"""
    try:
        # Contar módulos total
        total_modules = db.query(MedicalModule).count()
        
        # Contar módulos por categoría
        modules_by_category = {}
        categories = db.query(MedicalModule.category).distinct().all()
        for (category,) in categories:
            count = db.query(MedicalModule).filter(MedicalModule.category == category).count()
            modules_by_category[category] = count
        
        # Contar licencias
        total_licenses = db.query(License).count()
        active_licenses = db.query(License).filter(License.is_active == True).count()
        
        # Contar módulos core vs custom
        core_modules = db.query(MedicalModule).filter(MedicalModule.is_core == True).count()
        custom_modules = total_modules - core_modules
        
        return {
            "success": True,
            "stats": {
                "total_modules": total_modules,
                "total_licenses": total_licenses,
                "active_licenses": active_licenses,
                "modules_by_category": modules_by_category,
                "core_modules": core_modules,
                "custom_modules": custom_modules,
                "categories": list(modules_by_category.keys())
            }
        }
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    """Obtener todas las categorías disponibles"""
    try:
        categories = db.query(MedicalModule.category).distinct().all()
        category_list = [cat[0] for cat in categories if cat[0]]
        
        return {
            "success": True,
            "categories": sorted(category_list),
            "total": len(category_list)
        }
    except Exception as e:
        logger.error(f"Error obteniendo categorías: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@admin_router.get("/license-types")
async def get_license_types_admin(db: Session = Depends(get_db)):
    """Obtener tipos de licencia para administración"""
    try:
        license_types = db.query(LicenseType).all()
        return {
            "success": True,
            "license_types": [
                {
                    "id": lt.id,
                    "name": lt.name,
                    "description": lt.description,
                    "max_users": lt.max_users,
                    "max_modules": lt.max_modules,
                    "duration_days": lt.duration_days,
                    "price": lt.price,
                    "features": lt.features
                }
                for lt in license_types
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.post("/license-types")
async def create_license_type(license_type_data: dict, db: Session = Depends(get_db)):
    """Crear nuevo tipo de licencia"""
    try:
        new_license_type = LicenseType(
            name=license_type_data["name"],
            description=license_type_data["description"],
            max_users=license_type_data["max_users"],
            max_modules=license_type_data["max_modules"],
            duration_days=license_type_data["duration_days"],
            price=license_type_data["price"],
            features=license_type_data.get("features", {})
        )
        
        db.add(new_license_type)
        db.commit()
        db.refresh(new_license_type)
        
        return {
            "success": True,
            "message": "Tipo de licencia creado exitosamente",
            "license_type": {
                "id": new_license_type.id,
                "name": new_license_type.name
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))