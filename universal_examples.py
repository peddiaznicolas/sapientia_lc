# -*- coding: utf-8 -*-
"""
Universal License Examples
==========================
Ejemplos de uso del sistema de licencias para diferentes dominios
"""

import requests
import json

class UniversalLicenseExamples:
    """Ejemplos de licenciamiento para diferentes industrias"""
    
    def __init__(self, server_url="http://localhost:8000"):
        self.server_url = server_url
    
    # ============================================================================
    # EJEMPLO 1: MÓDULO DE RETAIL/COMERCIO
    # ============================================================================
    
    def retail_pos_example(self):
        """Ejemplo para módulo de punto de venta retail"""
        print("🛒 EJEMPLO: Licenciando módulo POS Retail Venezuela")
        
        # 1. Solicitar licencia para retail
        license_data = {
            "client_name": "Tienda El Éxito C.A.",
            "client_email": "admin@tiendaelexito.com.ve",
            "license_type": "standard",
            "hardware_info": {
                "mac_address": "00:1B:63:84:45:E6",
                "processor_id": "Intel i5-10400",
                "os_info": "Windows 10 Pro",
                "hostname": "POS-TIENDA-01"
            },
            "requested_modules": [
                "retail_pos_advanced",
                "retail_inventory_management"
            ]
        }
        
        response = requests.post(f"{self.server_url}/license/request", json=license_data)
        if response.status_code == 200:
            license_info = response.json()
            print(f"✅ Licencia retail creada: {license_info['license_key']}")
            
            # 2. Validar en el módulo POS
            validation_data = {
                "license_key": license_info['license_key'],
                "module_name": "retail_pos_advanced",
                "hardware_info": license_data["hardware_info"],
                "user_count": 3
            }
            
            validation = requests.post(f"{self.server_url}/license/validate", json=validation_data)
            if validation.status_code == 200:
                result = validation.json()
                print(f"✅ Validación POS: {result['message']}")
                return license_info['license_key']
        
        return None
    
    # ============================================================================
    # EJEMPLO 2: MÓDULO FINANCIERO
    # ============================================================================
    
    def finance_banking_example(self):
        """Ejemplo para módulo de banca empresarial"""
        print("🏦 EJEMPLO: Licenciando módulo Bancario Venezuela")
        
        license_data = {
            "client_name": "Corporación Financiera XYZ",
            "client_email": "it@corpxyz.com.ve",
            "license_type": "enterprise",
            "hardware_info": {
                "mac_address": "00:50:56:C0:00:01",
                "processor_id": "Intel Xeon E5-2690",
                "os_info": "Ubuntu Server 22.04",
                "hostname": "BANKING-SERVER"
            },
            "requested_modules": [
                "finance_banking_ve",
                "finance_accounting_ve"
            ]
        }
        
        response = requests.post(f"{self.server_url}/license/request", json=license_data)
        if response.status_code == 200:
            license_info = response.json()
            print(f"✅ Licencia bancaria creada: {license_info['license_key']}")
            return license_info['license_key']
        
        return None
    
    # ============================================================================
    # EJEMPLO 3: MÓDULO DE MANUFACTURA
    # ============================================================================
    
    def manufacturing_example(self):
        """Ejemplo para módulo de manufactura industrial"""
        print("🏭 EJEMPLO: Licenciando módulo de Manufactura")
        
        license_data = {
            "client_name": "Industrias SIDERÚRGICAS DEL ORINOCO",
            "client_email": "sistemas@sidor.com.ve",
            "license_type": "unlimited",
            "hardware_info": {
                "mac_address": "00:15:5D:00:05:01",
                "processor_id": "AMD EPYC 7742",
                "os_info": "Red Hat Enterprise Linux 8",
                "hostname": "MRP-PRODUCTION"
            },
            "requested_modules": [
                "manufacturing_mrp_advanced",
                "logistics_fleet_management"
            ]
        }
        
        response = requests.post(f"{self.server_url}/license/request", json=license_data)
        if response.status_code == 200:
            license_info = response.json()
            print(f"✅ Licencia manufactura creada: {license_info['license_key']}")
            return license_info['license_key']
        
        return None
    
    # ============================================================================
    # EJEMPLO 4: MÓDULO EDUCATIVO
    # ============================================================================
    
    def education_example(self):
        """Ejemplo para módulo educativo universitario"""
        print("🎓 EJEMPLO: Licenciando módulo Educativo")
        
        license_data = {
            "client_name": "Universidad Central de Venezuela",
            "client_email": "dtic@ucv.ve", 
            "license_type": "enterprise",
            "hardware_info": {
                "mac_address": "00:1E:C9:DD:54:A1",
                "processor_id": "Intel Xeon Gold 6248",
                "os_info": "CentOS 8",
                "hostname": "ACADEMIC-SYSTEM"
            },
            "requested_modules": [
                "education_student_management"
            ]
        }
        
        response = requests.post(f"{self.server_url}/license/request", json=license_data)
        if response.status_code == 200:
            license_info = response.json()
            print(f"✅ Licencia educativa creada: {license_info['license_key']}")
            return license_info['license_key']
        
        return None

# ============================================================================
# CÓDIGO DE VALIDACIÓN UNIVERSAL PARA CUALQUIER MÓDULO ODOO
# ============================================================================

class OdooUniversalLicenseValidator:
    """Validador universal para cualquier módulo Odoo"""
    
    @staticmethod
    def validate_module_license(module_name, license_server="http://license-server:8000"):
        """
        Método universal para validar licencia desde cualquier módulo Odoo
        
        Uso en cualquier módulo:
        
        # En retail_pos_advanced/__init__.py
        from universal_license import OdooUniversalLicenseValidator
        
        def pre_init_hook(env):
            if not OdooUniversalLicenseValidator.validate_module_license('retail_pos_advanced'):
                raise Exception('Licencia requerida para POS Avanzado')
        
        # En manufacturing_mrp_advanced/models/mrp_production.py
        @api.model
        def create(self, vals):
            if not self.validate_license():
                raise UserError('Licencia de manufactura requerida')
            return super().create(vals)
        """
        
        import subprocess
        import platform
        import psutil
        import socket
        
        # Obtener información del hardware
        try:
            # MAC Address
            import uuid
            mac = ':'.join(['{:02x}'.format((uuid.getnode() >> i) & 0xff) 
                           for i in range(0, 8*6, 8)][::-1])
            
            # Información del sistema
            import cpuinfo
            cpu_info = cpuinfo.get_cpu_info()
            processor_id = cpu_info.get('brand_raw', 'Unknown CPU')
            
            os_info = f"{platform.system()} {platform.release()}"
            hostname = socket.gethostname()
            
            hardware_info = {
                "mac_address": mac,
                "processor_id": processor_id,
                "os_info": os_info,
                "hostname": hostname
            }
            
            # Obtener license key desde configuración Odoo
            try:
                # Intentar obtener desde variables de entorno
                import os
                license_key = os.getenv('ODOO_LICENSE_KEY')
                
                if not license_key:
                    # Intentar obtener desde parámetros del sistema
                    from odoo import api, SUPERUSER_ID
                    from odoo.registry import Registry
                    
                    registry = Registry.new(os.getenv('ODOO_DATABASE', 'postgres'))
                    with registry.cursor() as cr:
                        env = api.Environment(cr, SUPERUSER_ID, {})
                        license_key = env['ir.config_parameter'].sudo().get_param('universal.license_key')
                
                if not license_key:
                    print(f"❌ No se encontró license key para módulo {module_name}")
                    return False
                
            except Exception as e:
                print(f"❌ Error obteniendo license key: {e}")
                return False
            
            # Validar con servidor de licencias
            validation_data = {
                "license_key": license_key,
                "module_name": module_name,
                "hardware_info": hardware_info,
                "user_count": 1  # Se puede obtener dinámicamente
            }
            
            import requests
            response = requests.post(f"{license_server}/license/validate", 
                                   json=validation_data, 
                                   timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('valid', False):
                    print(f"✅ Licencia válida para {module_name}")
                    return True
                else:
                    print(f"❌ Licencia inválida para {module_name}: {result.get('error', 'Unknown')}")
                    return False
            else:
                print(f"❌ Error servidor de licencias: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error validando licencia para {module_name}: {e}")
            return False

def main():
    """Ejecutar ejemplos de diferentes dominios"""
    print("🔐 SISTEMA UNIVERSAL DE LICENCIAMIENTO")
    print("=" * 50)
    print("Ejemplos de uso para diferentes industrias\n")
    
    examples = UniversalLicenseExamples()
    
    # Ejecutar ejemplos
    retail_key = examples.retail_pos_example()
    print()
    
    finance_key = examples.finance_banking_example()
    print()
    
    manufacturing_key = examples.manufacturing_example()
    print()
    
    education_key = examples.education_example()
    print()
    
    print("✅ Todos los ejemplos de licenciamiento completados")
    print("\n📋 RESUMEN DE LICENCIAS GENERADAS:")
    if retail_key:
        print(f"  🛒 Retail: {retail_key}")
    if finance_key:
        print(f"  🏦 Finance: {finance_key}")
    if manufacturing_key:
        print(f"  🏭 Manufacturing: {manufacturing_key}")
    if education_key:
        print(f"  🎓 Education: {education_key}")

if __name__ == "__main__":
    main()