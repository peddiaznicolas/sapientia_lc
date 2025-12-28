#!/usr/bin/env python3
# setup_integration.py - CONFIGURACIÓN DE INTEGRACIÓN COMPLETA
# ============================================================================

import os
import sys
import shutil
import subprocess
from pathlib import Path
import webbrowser
import time

class SapientiaIntegrationSetup:
    """Configurador automático para la integración del sistema"""
    
    def __init__(self):
        self.current_dir = Path.cwd()
        self.frontend_dir = self.current_dir / "frontend"
        
        print("🚀 Sapientia License Server - Setup de Integración")
        print("="*60)
        print(f"📁 Directorio actual: {self.current_dir}")
        print("="*60)
    
    def check_backend_files(self):
        """Verificar archivos del backend modular"""
        print("🔍 Verificando archivos del backend modular...")
        
        required_files = [
            "main.py",
            "app.py", 
            "license_endpoints.py",
            "admin_endpoints.py",
            "control_endpoints.py",
            "schemas.py",
            "utils.py"
        ]
        
        missing_files = []
        existing_files = []
        
        for file in required_files:
            if (self.current_dir / file).exists():
                existing_files.append(file)
            else:
                missing_files.append(file)
        
        print(f"✅ Archivos encontrados ({len(existing_files)}):")
        for file in existing_files:
            print(f"   ✓ {file}")
        
        if missing_files:
            print(f"⚠️ Archivos faltantes ({len(missing_files)}):")
            for file in missing_files:
                print(f"   ✗ {file}")
            return False
        
        return True
    
    def check_frontend_files(self):
        """Verificar archivos del frontend modular"""
        print("\n🎨 Verificando archivos del frontend modular...")
        
        if not self.frontend_dir.exists():
            print(f"❌ Directorio frontend no existe: {self.frontend_dir}")
            return False
        
        required_files = [
            "index.html",
            "css/main.css",
            "js/main.js",
            "js/config.js",
            "js/api-client.js"
        ]
        
        missing_files = []
        existing_files = []
        
        for file in required_files:
            if (self.frontend_dir / file).exists():
                existing_files.append(file)
            else:
                missing_files.append(file)
        
        print(f"✅ Archivos encontrados ({len(existing_files)}):")
        for file in existing_files:
            print(f"   ✓ {file}")
        
        if missing_files:
            print(f"⚠️ Archivos faltantes ({len(missing_files)}):")
            for file in missing_files:
                print(f"   ✗ {file}")
            return False
        
        return True
    
    def create_frontend_structure(self):
        """Crear estructura básica del frontend si no existe"""
        print("\n📁 Creando estructura del frontend...")
        
        # Crear directorios
        dirs = [
            self.frontend_dir,
            self.frontend_dir / "css",
            self.frontend_dir / "js",
            self.frontend_dir / "js" / "modules",
            self.frontend_dir / "assets"
        ]
        
        for dir_path in dirs:
            dir_path.mkdir(exist_ok=True)
            print(f"   📂 {dir_path}")
        
        print("✅ Estructura de directorios creada")
    
    def install_dependencies(self):
        """Instalar dependencias de Python"""
        print("\n📦 Instalando dependencias de Python...")
        
        dependencies = [
            "fastapi>=0.104.0",
            "uvicorn[standard]>=0.24.0",
            "sqlalchemy>=2.0.0",
            "pydantic>=2.4.0",
            "python-multipart>=0.0.6",
            "cryptography>=41.0.0"
        ]
        
        for dep in dependencies:
            try:
                print(f"   📦 Instalando {dep}...")
                subprocess.check_call([
                    sys.executable, "-m", "pip", "install", dep, 
                    "--break-system-packages", "--quiet"
                ])
                print(f"   ✅ {dep}")
            except subprocess.CalledProcessError:
                print(f"   ❌ Error instalando {dep}")
                return False
        
        print("✅ Todas las dependencias instaladas")
        return True
    
    def copy_frontend_files(self, source_dir):
        """Copiar archivos del frontend desde un directorio fuente"""
        if not Path(source_dir).exists():
            print(f"❌ Directorio fuente no existe: {source_dir}")
            return False
        
        print(f"\n📋 Copiando archivos desde: {source_dir}")
        
        try:
            shutil.copytree(source_dir, self.frontend_dir, dirs_exist_ok=True)
            print("✅ Archivos copiados exitosamente")
            return True
        except Exception as e:
            print(f"❌ Error copiando archivos: {e}")
            return False
    
    def update_config_js(self):
        """Actualizar configuración del frontend para el backend modular"""
        print("\n⚙️ Actualizando configuración del frontend...")
        
        config_file = self.frontend_dir / "js" / "config.js"
        
        if not config_file.exists():
            print(f"⚠️ Archivo config.js no encontrado en: {config_file}")
            return False
        
        try:
            # Leer archivo actual
            with open(config_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Actualizar API_BASE para usar endpoints del backend modular
            updated_content = content.replace(
                'const API_BASE = "http://localhost:8000";',
                'const API_BASE = "http://localhost:8000";'
            )
            
            # Agregar configuración específica para backend modular
            integration_config = '''
// Configuración específica para backend modular
window.BACKEND_TYPE = "modular";
window.BACKEND_VERSION = "medical_license_server";
'''
            
            updated_content = updated_content.replace(
                'window.SAPIENTIA = {',
                integration_config + '\nwindow.SAPIENTIA = {'
            )
            
            # Escribir archivo actualizado
            with open(config_file, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            
            print("✅ Configuración actualizada")
            return True
            
        except Exception as e:
            print(f"❌ Error actualizando config.js: {e}")
            return False
    
    def create_startup_script(self):
        """Crear script de inicio integrado"""
        print("\n📝 Creando script de inicio...")
        
        startup_script = self.current_dir / "start_sapientia.py"
        
        script_content = '''#!/usr/bin/env python3
# start_sapientia.py - SCRIPT DE INICIO SAPIENTIA
# ============================================================================

import subprocess
import sys
import time
import webbrowser
from pathlib import Path

def main():
    print("🚀 Iniciando Sapientia License Server...")
    print("📧 Desarrollado por Pedro Diaz Nicolas")
    print("="*50)
    
    try:
        # Verificar archivos necesarios
        if not Path("integration_server.py").exists():
            print("❌ integration_server.py no encontrado")
            return
        
        # Iniciar servidor
        print("🌐 Iniciando servidor en http://localhost:8000")
        print("📖 Documentación en http://localhost:8000/docs")
        print("="*50)
        
        # Abrir navegador después de 2 segundos
        import threading
        def open_browser():
            time.sleep(2)
            webbrowser.open("http://localhost:8000")
        
        browser_thread = threading.Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()
        
        # Ejecutar servidor
        subprocess.run([sys.executable, "integration_server.py"])
        
    except KeyboardInterrupt:
        print("\\n👋 Cerrando servidor...")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
'''
        
        with open(startup_script, 'w', encoding='utf-8') as f:
            f.write(script_content)
        
        # Hacer ejecutable en sistemas Unix
        try:
            startup_script.chmod(0o755)
        except:
            pass
        
        print(f"✅ Script creado: {startup_script}")
        return True
    
    def test_integration(self):
        """Probar la integración"""
        print("\n🧪 Probando integración...")
        
        try:
            # Importar integration_server para verificar que funciona
            import integration_server
            print("✅ integration_server.py se importa correctamente")
            
            # Verificar endpoints
            from integration_server import app
            print("✅ FastAPI app cargada")
            
            return True
            
        except ImportError as e:
            print(f"❌ Error importando integration_server: {e}")
            return False
        except Exception as e:
            print(f"❌ Error en test: {e}")
            return False
    
    def show_completion_info(self):
        """Mostrar información de finalización"""
        print("\n" + "="*60)
        print("🎉 ¡INTEGRACIÓN COMPLETADA EXITOSAMENTE!")
        print("="*60)
        print("📁 Estructura del proyecto:")
        print("   Backend Modular:")
        print("   ├── main.py, app.py, schemas.py, utils.py")
        print("   ├── license_endpoints.py, admin_endpoints.py")
        print("   └── control_endpoints.py")
        print("   Frontend Modular:")
        print("   └── frontend/ (HTML, CSS, JS modulares)")
        print("   Integración:")
        print("   ├── integration_server.py")
        print("   └── start_sapientia.py")
        print()
        print("🚀 Para iniciar el sistema:")
        print("   python start_sapientia.py")
        print("   O directamente: python integration_server.py")
        print()
        print("🌐 URLs disponibles:")
        print("   Frontend: http://localhost:8000")
        print("   API Docs: http://localhost:8000/docs") 
        print("   Health: http://localhost:8000/health")
        print("="*60)
    
    def run_setup(self, frontend_source=None):
        """Ejecutar setup completo"""
        print("🚀 Iniciando setup de integración...\n")
        
        # 1. Verificar backend
        if not self.check_backend_files():
            print("❌ Backend modular incompleto. Verifica que todos los archivos estén presentes.")
            return False
        
        # 2. Crear estructura frontend
        self.create_frontend_structure()
        
        # 3. Copiar archivos frontend si se proporciona directorio fuente
        if frontend_source:
            if not self.copy_frontend_files(frontend_source):
                return False
        
        # 4. Verificar frontend
        frontend_ok = self.check_frontend_files()
        if not frontend_ok:
            print("⚠️ Frontend incompleto. El sistema funcionará con frontend básico.")
        
        # 5. Instalar dependencias
        if not self.install_dependencies():
            print("❌ Error instalando dependencias")
            return False
        
        # 6. Actualizar configuración si es posible
        if frontend_ok:
            self.update_config_js()
        
        # 7. Crear script de inicio
        self.create_startup_script()
        
        # 8. Probar integración
        if not self.test_integration():
            print("❌ Error en test de integración")
            return False
        
        # 9. Mostrar información final
        self.show_completion_info()
        
        return True

def main():
    """Función principal"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Setup de Integración Sapientia")
    parser.add_argument("--frontend-source", help="Directorio fuente del frontend modular")
    parser.add_argument("--auto-start", action="store_true", help="Iniciar servidor después del setup")
    
    args = parser.parse_args()
    
    # Ejecutar setup
    setup = SapientiaIntegrationSetup()
    
    if setup.run_setup(args.frontend_source):
        print("✅ Setup completado exitosamente!")
        
        if args.auto_start:
            print("\n🚀 Iniciando servidor...")
            time.sleep(2)
            subprocess.run([sys.executable, "start_sapientia.py"])
        else:
            print("💡 Para iniciar: python start_sapientia.py")
    else:
        print("❌ Setup falló. Revisa los errores anteriores.")
        sys.exit(1)

if __name__ == "__main__":
    main()