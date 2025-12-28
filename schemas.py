# schemas.py - MODELOS PYDANTIC
# -*- coding: utf-8 -*-

from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# ============================================================================
# ESQUEMAS DE HARDWARE
# ============================================================================

class HardwareInfo(BaseModel):
    mac_address: str
    processor_id: str
    motherboard_serial: Optional[str] = None
    disk_serial: Optional[str] = None
    os_info: str
    hostname: str

# ============================================================================
# ESQUEMAS DE LICENCIA
# ============================================================================

class LicenseRequest(BaseModel):
    client_name: str
    client_email: EmailStr
    license_type: str
    hardware_info: HardwareInfo
    requested_modules: List[str]

class LicenseResponse(BaseModel):
    license_key: str
    client_name: str
    license_type: str
    expiry_date: datetime
    max_users: int
    allowed_modules: List[str]
    is_active: bool
    message: str

class LicenseValidationRequest(BaseModel):
    license_key: str
    module_name: str
    hardware_info: HardwareInfo
    user_count: int = 1

# ============================================================================
# ESQUEMAS DE MÓDULOS
# ============================================================================

class ModuleCreate(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = ""
    category: str = "custom"
    version: str = "18.0.1.0.0"
    min_license_level: str = "standard"
    author: str = "Pedro Diaz Nicolas"
    license_prefix: str = "PDN"

class ModuleResponse(BaseModel):
    id: int
    name: str
    display_name: str
    description: Optional[str]
    category: str
    version: str
    is_core: bool
    min_license_level: str
    author: str
    license_prefix: str
    created_at: Optional[datetime]

# ============================================================================
# ESQUEMAS DE ADMINISTRACIÓN
# ============================================================================

class DashboardStats(BaseModel):
    total_licenses: int
    active_licenses: int
    expired_licenses: int
    recent_validations_24h: int

class LicenseControlResponse(BaseModel):
    id: int
    license_key: str
    client_name: str
    client_email: str
    license_type: str
    issued_date: Optional[datetime]
    expiry_date: datetime
    max_users: int
    current_users: int
    allowed_modules: List[str]
    is_active: bool
    validation_count: int