// main.js - INICIALIZACIÓN PRINCIPAL DE LA APLICACIÓN
// ============================================================================

class SapientiaApp {
    constructor() {
        this.isInitialized = false;
        this.modules = new Map();
        this.initStartTime = Date.now();
    }
    
    async init() {
        if (this.isInitialized) {
            Logger.warn('La aplicación ya está inicializada');
            return;
        }
        
        Logger.info('Iniciando Sapientia License Server...');
        
        try {
            // Mostrar splash screen
            this.showSplashScreen();
            
            // Verificar dependencias
            await this.checkDependencies();
            
            // Verificar conectividad del servidor
            await this.checkServerHealth();
            
            // Inicializar módulos core
            await this.initializeCoreModules();
            
            // Inicializar módulos de interfaz
            await this.initializeUIModules();
            
            // Configurar event listeners globales
            this.setupGlobalEventListeners();
            
            // Configurar interceptores de errores
            this.setupErrorHandlers();
            
            // Ocultar splash screen
            this.hideSplashScreen();
            
            // Marcar como inicializado
            this.isInitialized = true;
            
            const initTime = Date.now() - this.initStartTime;
            Logger.info(`Sapientia License Server inicializado en ${initTime}ms`);
            
            // Emitir evento de aplicación lista
            window.SAPIENTIA.events.emit('appReady', {
                initTime,
                timestamp: Date.now()
            });
            
            // Mostrar notificación de bienvenida
            this.showWelcomeMessage();
            
        } catch (error) {
            Logger.error('Error inicializando aplicación:', error);
            this.showInitializationError(error);
        }
    }
    
    showSplashScreen() {
        const splash = document.createElement('div');
        splash.id = 'splash-screen';
        splash.className = 'splash-screen';
        splash.innerHTML = `
            <div class="splash-content">
                <div class="splash-logo">🚀 SAPIENTIA</div>
                <div class="splash-tagline">Sistema Universal de Licenciamiento</div>
                <div class="splash-author">Pedro Diaz Nicolas</div>
                <div class="splash-loading">
                    <div class="splash-progress"></div>
                    <div class="splash-text">Inicializando sistema...</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(splash);
        
        // Agregar estilos del splash
        const style = document.createElement('style');
        style.textContent = `
            .splash-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary));
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                animation: fadeIn 0.5s ease;
            }
            
            .splash-content {
                text-align: center;
                max-width: 400px;
            }
            
            .splash-logo {
                font-size: 4rem;
                font-weight: 700;
                background: linear-gradient(45deg, var(--accent-cyan), var(--accent-purple));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 1rem;
                font-family: 'Space Mono', monospace;
            }
            
            .splash-tagline {
                font-size: 1.2rem;
                color: var(--text-primary);
                margin-bottom: 0.5rem;
            }
            
            .splash-author {
                font-size: 1rem;
                color: var(--text-secondary);
                margin-bottom: 3rem;
            }
            
            .splash-loading {
                margin-top: 2rem;
            }
            
            .splash-progress {
                width: 100%;
                height: 4px;
                background: var(--bg-secondary);
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 1rem;
            }
            
            .splash-progress::after {
                content: '';
                display: block;
                height: 100%;
                background: linear-gradient(90deg, var(--accent-cyan), var(--accent-purple));
                width: 0%;
                border-radius: 2px;
                animation: loading 3s ease-in-out infinite;
            }
            
            .splash-text {
                font-size: 0.9rem;
                color: var(--text-secondary);
            }
            
            @keyframes loading {
                0% { width: 0%; }
                50% { width: 70%; }
                100% { width: 100%; }
            }
        `;
        document.head.appendChild(style);
    }
    
    hideSplashScreen() {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.animation = 'fadeOut 0.5s ease';
            setTimeout(() => {
                splash.remove();
            }, 500);
        }
    }
    
    async checkDependencies() {
        Logger.debug('Verificando dependencias...');
        
        const dependencies = [
            { name: 'fetch', check: () => typeof fetch !== 'undefined' },
            { name: 'localStorage', check: () => typeof Storage !== 'undefined' },
            { name: 'JSON', check: () => typeof JSON !== 'undefined' },
            { name: 'Promise', check: () => typeof Promise !== 'undefined' },
            { name: 'EventListener', check: () => typeof addEventListener !== 'undefined' }
        ];
        
        const missing = dependencies.filter(dep => !dep.check());
        
        if (missing.length > 0) {
            throw new Error(`Dependencias faltantes: ${missing.map(d => d.name).join(', ')}`);
        }
        
        Logger.debug('Todas las dependencias están disponibles');
    }
    
    async checkServerHealth() {
        Logger.debug('Verificando conectividad del servidor...');
        
        try {
            const health = await window.apiClient.getHealth();
            
            if (health.status === 'ok') {
                Logger.info('Servidor disponible y funcionando');
                window.SAPIENTIA.state.serverStatus = 'online';
            } else {
                throw new Error('Servidor reporta estado no saludable');
            }
            
        } catch (error) {
            Logger.warn('Servidor no disponible, modo offline:', error.message);
            window.SAPIENTIA.state.serverStatus = 'offline';
            
            // En modo offline, mostrar advertencia pero continuar
            this.showOfflineWarning();
        }
    }
    
    async initializeCoreModules() {
        Logger.debug('Inicializando módulos core...');
        
        const coreModules = [
            { name: 'hardwareDetector', module: window.hardwareDetector },
            { name: 'navigationManager', module: window.navigationManager },
            { name: 'apiClient', module: window.apiClient },
            { name: 'cacheManager', module: window.cacheManager }
        ];
        
        for (const { name, module } of coreModules) {
            if (module) {
                this.modules.set(name, module);
                Logger.debug(`Módulo core ${name} registrado`);
            } else {
                Logger.warn(`Módulo core ${name} no disponible`);
            }
        }
    }
    
    async initializeUIModules() {
        Logger.debug('Inicializando módulos de UI...');
        
        const uiModules = [
            { name: 'dashboardManager', module: window.dashboardManager },
            { name: 'licenseGenerator', module: window.licenseGenerator },
            { name: 'licenseValidator', module: window.licenseValidator },
            { name: 'moduleAdmin', module: window.moduleAdmin },
            { name: 'controlPanel', module: window.controlPanel }
        ];
        
        for (const { name, module } of uiModules) {
            if (module) {
                this.modules.set(name, module);
                Logger.debug(`Módulo UI ${name} registrado`);
            } else {
                Logger.warn(`Módulo UI ${name} no disponible`);
            }
        }
    }
    
    setupGlobalEventListeners() {
        Logger.debug('Configurando event listeners globales...');
        
        // Prevenir navegación accidental
        window.addEventListener('beforeunload', (e) => {
            if (window.SAPIENTIA.state.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'Tienes cambios sin guardar. ¿Seguro que quieres salir?';
            }
        });
        
        // Detectar cambios de conectividad
        window.addEventListener('online', () => {
            Logger.info('Conexión restaurada');
            window.SAPIENTIA.state.serverStatus = 'online';
            this.showConnectivityMessage('online');
        });
        
        window.addEventListener('offline', () => {
            Logger.warn('Conexión perdida');
            window.SAPIENTIA.state.serverStatus = 'offline';
            this.showConnectivityMessage('offline');
        });
        
        // Detectar cambios de visibilidad de la página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                Logger.debug('Aplicación oculta');
            } else {
                Logger.debug('Aplicación visible');
                this.handlePageVisible();
            }
        });
        
        // Manejo de errores de recursos
        window.addEventListener('error', (e) => {
            if (e.target !== window) {
                Logger.error('Error de recurso:', e.target.src || e.target.href);
            }
        });
        
        // Shortcuts de teclado globales
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyboard(e);
        });
    }
    
    setupErrorHandlers() {
        Logger.debug('Configurando manejadores de errores...');
        
        // Errores JavaScript no capturados
        window.addEventListener('error', (e) => {
            Logger.error('Error no capturado:', e.error || e.message);
            this.reportError(e.error || new Error(e.message));
        });
        
        // Promesas rechazadas no manejadas
        window.addEventListener('unhandledrejection', (e) => {
            Logger.error('Promesa rechazada no manejada:', e.reason);
            this.reportError(e.reason);
            e.preventDefault(); // Evitar que se muestre en consola
        });
        
        // Configurar reporte de errores
        window.SAPIENTIA.reportError = (error) => this.reportError(error);
    }
    
    handlePageVisible() {
        // Refresh datos cuando la página vuelve a ser visible
        if (window.navigationManager && window.navigationManager.currentTab) {
            const currentModule = this.modules.get(`${window.navigationManager.currentTab}Manager`);
            if (currentModule && typeof currentModule.refresh === 'function') {
                currentModule.refresh();
            }
        }
    }
    
    handleGlobalKeyboard(e) {
        // Ctrl/Cmd + R: Refresh aplicación
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            if (e.shiftKey) {
                e.preventDefault();
                this.hardRefresh();
            }
        }
        
        // Ctrl/Cmd + D: Toggle debug mode
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            this.toggleDebugMode();
        }
        
        // Escape: Cerrar modales
        if (e.key === 'Escape') {
            const modal = document.querySelector('.modal.active');
            if (modal) {
                modal.remove();
            }
        }
    }
    
    showOfflineWarning() {
        const toast = document.createElement('div');
        toast.className = 'toast warning';
        toast.innerHTML = `
            <div class="toast-icon">⚠️</div>
            <div class="toast-content">
                <div class="toast-title">Modo Offline</div>
                <div class="toast-message">No se puede conectar al servidor. Algunas funciones pueden estar limitadas.</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        this.showToast(toast, 8000);
    }
    
    showConnectivityMessage(status) {
        const isOnline = status === 'online';
        const toast = document.createElement('div');
        toast.className = `toast ${isOnline ? 'success' : 'warning'}`;
        toast.innerHTML = `
            <div class="toast-icon">${isOnline ? '✅' : '⚠️'}</div>
            <div class="toast-content">
                <div class="toast-title">${isOnline ? 'Conexión Restaurada' : 'Sin Conexión'}</div>
                <div class="toast-message">${isOnline ? 'Todas las funciones están disponibles' : 'Trabajando en modo offline'}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        this.showToast(toast);
    }
    
    showWelcomeMessage() {
        const isFirstVisit = !Utils.storage.get('has_visited', false);
        
        if (isFirstVisit) {
            Utils.storage.set('has_visited', true);
            
            const toast = document.createElement('div');
            toast.className = 'toast info';
            toast.innerHTML = `
                <div class="toast-icon">🚀</div>
                <div class="toast-content">
                    <div class="toast-title">¡Bienvenido a Sapientia!</div>
                    <div class="toast-message">Sistema Universal de Licenciamiento iniciado correctamente</div>
                </div>
                <button class="toast-close" onclick="this.parentElement.remove()">×</button>
            `;
            this.showToast(toast, 6000);
        }
    }
    
    showInitializationError(error) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'initialization-error';
        errorContainer.innerHTML = `
            <div class="error-content">
                <h1>❌ Error de Inicialización</h1>
                <p>No se pudo inicializar Sapientia License Server</p>
                <div class="error-details">
                    <strong>Error:</strong> ${error.message}
                </div>
                <div class="error-actions">
                    <button onclick="location.reload()" class="btn btn-primary">
                        🔄 Reintentar
                    </button>
                    <button onclick="sapientiaApp.showDiagnostics()" class="btn btn-secondary">
                        🔍 Diagnósticos
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorContainer);
    }
    
    hardRefresh() {
        Logger.info('Realizando refresh completo...');
        
        // Limpiar cache
        window.cacheManager?.clear();
        
        // Limpiar storage temporal
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith(CONFIG.STORAGE.PREFIX)) {
                sessionStorage.removeItem(key);
            }
        });
        
        // Recargar página
        location.reload();
    }
    
    toggleDebugMode() {
        const currentMode = window.SAPIENTIA.state.debugMode || false;
        window.SAPIENTIA.state.debugMode = !currentMode;
        
        if (window.SAPIENTIA.state.debugMode) {
            document.body.classList.add('debug-mode');
            Logger.info('Modo debug activado');
        } else {
            document.body.classList.remove('debug-mode');
            Logger.info('Modo debug desactivado');
        }
        
        const toast = document.createElement('div');
        toast.className = 'toast info';
        toast.innerHTML = `
            <div class="toast-icon">🐛</div>
            <div class="toast-content">
                <div class="toast-title">Modo Debug ${window.SAPIENTIA.state.debugMode ? 'Activado' : 'Desactivado'}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        this.showToast(toast);
    }
    
    showDiagnostics() {
        const diagnostics = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            modules: Array.from(this.modules.keys()),
            serverStatus: window.SAPIENTIA.state.serverStatus,
            errors: Logger.getRecentErrors?.() || [],
            storage: {
                localStorage: typeof localStorage !== 'undefined',
                sessionStorage: typeof sessionStorage !== 'undefined'
            }
        };
        
        console.table(diagnostics);
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔍 Diagnósticos del Sistema</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="diagnostics-content">
                    <pre>${JSON.stringify(diagnostics, null, 2)}</pre>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cerrar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    reportError(error) {
        // En un entorno de producción, aquí enviarías el error a un servicio de monitoreo
        Logger.error('Error reportado:', error);
        
        // Mostrar notificación de error al usuario si es crítico
        if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
            this.showChunkLoadError();
        }
    }
    
    showChunkLoadError() {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = `
            <div class="toast-icon">❌</div>
            <div class="toast-content">
                <div class="toast-title">Error de Carga</div>
                <div class="toast-message">Se ha actualizado la aplicación. Por favor recarga la página.</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
            <button class="btn btn-small btn-primary" onclick="location.reload()" style="margin-left: auto;">
                🔄 Recargar
            </button>
        `;
        this.showToast(toast, 0); // No auto-dismiss
    }
    
    showToast(toast, duration = 5000) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(toast);
        
        if (duration > 0) {
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, duration);
        }
    }
    
    getModule(name) {
        return this.modules.get(name);
    }
    
    getAllModules() {
        return Array.from(this.modules.entries());
    }
    
    getAppInfo() {
        return {
            name: CONFIG.APP.NAME,
            version: CONFIG.APP.VERSION,
            author: CONFIG.APP.AUTHOR,
            initialized: this.isInitialized,
            initTime: Date.now() - this.initStartTime,
            modules: this.modules.size,
            serverStatus: window.SAPIENTIA.state.serverStatus
        };
    }
   
}

 setTimeout(() => {
    if (window.navigationManager) {
        window.navigationManager.showTab('dashboard');
    }
}, 2000); 
// Crear instancia global de la aplicación
window.sapientiaApp = new SapientiaApp();

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.sapientiaApp.init();
    } catch (error) {
        Logger.error('Error en inicialización automática:', error);
    }
});

// Exportar para uso global
window.SAPIENTIA.app = window.sapientiaApp;

Logger.info('Main application script loaded');