#!/usr/bin/env python3
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
        print("\n👋 Cerrando servidor...")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
