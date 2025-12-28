# -*- coding: utf-8 -*-
"""
Medical License Client - Sistema de Pruebas
==========================================
Cliente para probar el sistema de licenciamiento médico
Simula validaciones desde módulos Odoo
"""

import requests
import json
import platform
import uuid
import psutil
import hashlib
from datetime import datetime
from typing import Dict, Any

class MedicalLicenseClient:
    """Cliente para interactuar con el servidor de licencias médicas"""
    
    def __init__(self, server_url: str = "http://localhost:8000"):
        self.server_url = server_url.rstrip('/')
        self.session = requests.Session()
        
    def get_hardware_info(self) -> Dict[str, Any]:
        """Obtiene información del hardware actual"""
        try:
            # MAC Address (primera interfaz de red)
            mac_address = ':'.join(['{:02x}'.format((uuid.getnode() >> i) & 0xff) 
                                   for i in range(0, 8*6, 8)][::-1])
            
            # Información del procesador
            import cpuinfo
            cpu_info = cpuinfo.get_cpu_info()
            processor_id = cpu_info.get('brand_raw', 'Unknown CPU')
            
            # Información del sistema
            os_info = f"{platform.system()} {platform.release()} {platform.machine()}"
            hostname = platform.node()
            
            # Información de discos (primer disco)
            disk_serial = "Unknown"
            try:
                partitions = psutil.disk_partitions()
                if partitions:
                    disk_serial = hashlib.md5(partitions[0].device.encode()).hexdigest()[:16]
            except:
                pass
            
            return {
                "mac_address": mac_address,
                "processor_id": processor_id,
                "motherboard_serial": "Unknown",  # Difícil de obtener multiplataforma
                "disk_serial": disk_serial,
                "os_info": os_info,
                "hostname": hostname
            }
        except Exception as e:
            print(f"Error obteniendo información de hardware: {e}")
            # Hardware de fallback para testing
            return {
                "mac_address": "00:1B:63:84:45:E6",
                "processor_id": "Intel i7-8700K",
                "motherboard_serial": "MB123456789",
                "disk_serial": "DISK987654321",
                "os_info": "Windows 10 x64",
                "hostname": "MEDICAL-PC-01"
            }
    
    def get_server_status(self) -> Dict[str, Any]:
        """Verifica el estado del servidor"""
        try:
            response = self.session.get(f"{self.server_url}/health")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e), "status": "offline"}
    
    def get_license_types(self) -> Dict[str, Any]:
        """Obtiene tipos de licencia disponibles"""
        try:
            response = self.session.get(f"{self.server_url}/license/types")
            response.raise_for_status()
            return {"success": True, "data": response.json()}
        except requests.exceptions.RequestException as e:
            return {"success": False, "error": str(e)}
    
    def get_medical_modules(self) -> Dict[str, Any]:
        """Obtiene módulos médicos disponibles"""
        try:
            response = self.session.get(f"{self.server_url}/license/modules")
            response.raise_for_status()
            return {"success": True, "data": response.json()}
        except requests.exceptions.RequestException as e:
            return {"success": False, "error": str(e)}
    
    def request_license(self, 
                       client_name: str,
                       client_email: str,
                       license_type: str,
                       requested_modules: list = None) -> Dict[str, Any]:
        """Solicita una nueva licencia"""
        if requested_modules is None:
            requested_modules = ["medical_clinic"]
        
        hardware_info = self.get_hardware_info()
        
        license_request = {
            "client_name": client_name,
            "client_email": client_email,
            "license_type": license_type,
            "hardware_info": hardware_info,
            "requested_modules": requested_modules
        }
        
        try:
            response = self.session.post(
                f"{self.server_url}/license/request",
                json=license_request
            )
            response.raise_for_status()
            return {"success": True, "data": response.json()}
        except requests.exceptions.RequestException as e:
            error_detail = "Unknown error"
            if hasattr(e.response, 'json'):
                try:
                    error_detail = e.response.json().get('detail', str(e))
                except:
                    error_detail = str(e)
            return {"success": False, "error": error_detail}
    
    def validate_license(self,
                        license_key: str,
                        module_name: str,
                        user_count: int = 1) -> Dict[str, Any]:
        """Valida una licencia para un módulo específico"""
        hardware_info = self.get_hardware_info()
        
        validation_request = {
            "license_key": license_key,
            "module_name": module_name,
            "hardware_info": hardware_info,
            "user_count": user_count
        }
        
        try:
            response = self.session.post(
                f"{self.server_url}/license/validate",
                json=validation_request
            )
            response.raise_for_status()
            return {"success": True, "data": response.json()}
        except requests.exceptions.RequestException as e:
            return {"success": False, "error": str(e)}
    
    def get_license_info(self, license_key: str) -> Dict[str, Any]:
        """Obtiene información detallada de una licencia"""
        try:
            response = self.session.get(f"{self.server_url}/license/info/{license_key}")
            response.raise_for_status()
            return {"success": True, "data": response.json()}
        except requests.exceptions.RequestException as e:
            return {"success": False, "error": str(e)}

def main():
    """Función principal para probar el cliente"""
    print("🔐 Medical Clinic License Client - Sistema de Pruebas")
    print("=" * 60)
    
    client = MedicalLicenseClient()
    
    # 1. Verificar estado del servidor
    print("\n1️⃣ Verificando estado del servidor...")
    status = client.get_server_status()
    print(f"Estado: {json.dumps(status, indent=2, default=str)}")
    
    if "error" in status:
        print("❌ Servidor no disponible. Asegúrate de que esté ejecutándose.")
        return
    
    # 2. Obtener tipos de licencia
    print("\n2️⃣ Obteniendo tipos de licencia disponibles...")
    license_types = client.get_license_types()
    if license_types["success"]:
        for lt in license_types["data"]:
            print(f"  • {lt['name']}: {lt['description']} - ${lt['price']}")
    
    # 3. Obtener módulos médicos
    print("\n3️⃣ Obteniendo módulos médicos disponibles...")
    modules = client.get_medical_modules()
    if modules["success"]:
        for module in modules["data"]:
            print(f"  • {module['name']}: {module['description']}")
    
    # 4. Solicitar licencia de prueba
    print("\n4️⃣ Solicitando licencia de prueba...")
    license_request = client.request_license(
        client_name="Clínica Test Venezuela",
        client_email="test@clinica.ve",
        license_type="trial",
        requested_modules=["medical_clinic", "medical_clinic_dashboard"]
    )
    
    if license_request["success"]:
        license_key = license_request["data"]["license_key"]
        print(f"✅ Licencia creada exitosamente: {license_key}")
        
        # 5. Validar licencia para módulo base
        print(f"\n5️⃣ Validando licencia para módulo medical_clinic...")
        validation = client.validate_license(license_key, "medical_clinic", user_count=2)
        if validation["success"]:
            valid = validation["data"]["valid"]
            print(f"{'✅' if valid else '❌'} Validación: {validation['data']['message']}")
        
        # 6. Obtener información de la licencia
        print(f"\n6️⃣ Obteniendo información de la licencia...")
        license_info = client.get_license_info(license_key)
        if license_info["success"]:
            info = license_info["data"]
            print(f"  Cliente: {info['client_name']}")
            print(f"  Tipo: {info['license_type']}")
            print(f"  Expira: {info['expiry_date']}")
            print(f"  Usuarios: {info['current_users']}/{info['max_users']}")
            print(f"  Estado: {info['status']}")
            print(f"  Módulos permitidos: {', '.join(info['allowed_modules'])}")
    else:
        print(f"❌ Error solicitando licencia: {license_request['error']}")

if __name__ == "__main__":
    main()