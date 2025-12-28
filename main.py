# main.py - SOLO CONFIGURACIÓN Y MODELOS
# -*- coding: utf-8 -*-

from fastapi import FastAPI, Depends
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import os

# ============================================================================
# CONFIGURACIÓN BÁSICA
# ============================================================================

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://sapientia_admin:SapientiaPass2026!@localhost:5432/sapientia_licenses")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI(
    title="Sapientia License Server",
    description="Sistema Universal de Licenciamiento Odoo - Pedro Diaz Nicolas",
    version="2.0.0"
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================================================
# MODELOS BÁSICOS SOLAMENTE
# ============================================================================

class License(Base):
    __tablename__ = "licenses"
    
    id = Column(Integer, primary_key=True, index=True)
    license_key = Column(String(200), unique=True, nullable=False, index=True)
    client_name = Column(String(200), nullable=False)
    client_email = Column(String(200), nullable=False)
    license_type = Column(String(50), nullable=False)
    hardware_fingerprint = Column(Text, nullable=False)
    issued_date = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(DateTime, nullable=False)
    max_users = Column(Integer)
    current_users = Column(Integer, default=0)
    allowed_modules = Column(JSON)
    is_active = Column(Boolean, default=True)
    last_validation = Column(DateTime)
    validation_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class MedicalModule(Base):
    __tablename__ = "medical_modules"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    display_name = Column(String(200), nullable=False)
    description = Column(Text)
    version = Column(String(20), default="18.0.1.0.0")
    category = Column(String(50), default="medical")
    is_core = Column(Boolean, default=False)
    min_license_level = Column(String(20), default="trial")
    author = Column(String(200), default="Pedro Diaz Nicolas")
    license_prefix = Column(String(10), default="PDN")  # NUEVO CAMPO
    created_at = Column(DateTime, default=datetime.utcnow)

class LicenseType(Base):
    __tablename__ = "license_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(500))
    max_users = Column(Integer, nullable=False)
    max_modules = Column(Integer, default=-1)  # -1 = ilimitado
    duration_days = Column(Integer, nullable=False)
    price = Column(Integer, default=0)
    features = Column(JSON)

class LicenseValidation(Base):
    __tablename__ = "license_validations"
    
    id = Column(Integer, primary_key=True, index=True)
    license_key = Column(String(200), nullable=False, index=True)
    module_name = Column(String(100), nullable=False)
    hardware_fingerprint = Column(Text, nullable=False)
    validation_time = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    validation_result = Column(String(20), nullable=False)
    error_message = Column(Text)

# Crear tablas
Base.metadata.create_all(bind=engine)

# @app.get("/")
# async def root():
#     return {
#         "message": "Sapientia License Server",
#         "version": "2.0.0",
#         "author": "Pedro Diaz Nicolas",
#         "status": "active"
#     }

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow()}