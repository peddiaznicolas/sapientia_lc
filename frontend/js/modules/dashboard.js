// modules/dashboard.js - GESTIÓN DEL DASHBOARD
// ============================================================================

class DashboardManager {
    constructor() {
        this.refreshInterval = 30000; // 30 segundos
        this.intervalId = null;
        this.isLoading = false;
    }
    
    async load() {
        Logger.debug('Cargando dashboard...');
        
        try {
            this.isLoading = true;
            await this.loadDashboardData();
            this.startAutoRefresh();
            
        } catch (error) {
            Logger.error('Error cargando dashboard:', error);
            this.showDashboardError(error.message);
        } finally {
            this.isLoading = false;
        }
    }
    
    async loadDashboardData() {
        const startTime = Date.now();
        
        try {
            // Cargar datos en paralelo
            const [systemInfo, modules, licenseTypes] = await Promise.all([
                this.getSystemInfo(),
                this.getModulesCount(),
                this.getLicenseTypesCount()
            ]);
            
            const responseTime = Date.now() - startTime;
            
            // Actualizar métricas
            this.updateDashboardMetrics({
                totalModules: modules.count,
                totalLicenseTypes: licenseTypes.count,
                systemStatus: systemInfo.status,
                responseTime: responseTime
            });
            
            // Actualizar información del sistema
            this.updateSystemInfo(systemInfo);
            
            Logger.info('Dashboard cargado exitosamente');
            
        } catch (error) {
            Logger.error('Error obteniendo datos del dashboard:', error);
            throw error;
        }
    }
    
    async getSystemInfo() {
    try {
        // Usar /health en lugar de /api/info que no existe
        const response = await fetch('/health');
        if (response.ok) {
            const health = await response.json();
            return {
                status: 'online',
                version: '2.0.0',
                uptime: this.calculateUptime(),
                timestamp: health.timestamp || new Date().toISOString()
            };
        } else {
            throw new Error('Health check failed');
        }
    } catch (error) {
        return {
            status: 'offline',
            version: '2.0.0',
            uptime: '0h 0m',
            error: error.message
        };
    }
}
    
    async getModulesCount() {
        try {
            const modules = await window.cachedApi.getModules();
            return {
                count: modules.length,
                categories: [...new Set(modules.map(m => m.category || 'unknown'))]
            };
        } catch (error) {
            Logger.warn('Error obteniendo módulos para dashboard:', error);
            return { count: 0, categories: [] };
        }
    }
    
    async getLicenseTypesCount() {
        try {
            const types = await window.cachedApi.getLicenseTypes();
            return {
                count: types.length,
                types: types.map(t => t.name)
            };
        } catch (error) {
            Logger.warn('Error obteniendo tipos de licencia para dashboard:', error);
            return { count: 0, types: [] };
        }
    }
    
    updateDashboardMetrics(metrics) {
        // Total módulos
        const totalModulesEl = document.getElementById('totalModulesCount');
        if (totalModulesEl) {
            this.animateNumber(totalModulesEl, metrics.totalModules);
        }
        
        // Total tipos de licencia
        const totalTypesEl = document.getElementById('totalLicenseTypesCount');
        if (totalTypesEl) {
            this.animateNumber(totalTypesEl, metrics.totalLicenseTypes);
        }
        
        // Estado del sistema
        const systemStatusEl = document.getElementById('systemStatusText');
        if (systemStatusEl) {
            systemStatusEl.textContent = metrics.systemStatus === 'online' ? 'Online' : 'Offline';
            systemStatusEl.className = `stat-value status-${metrics.systemStatus}`;
        }
        
        // Tiempo de respuesta
        const responseTimeEl = document.getElementById('serverResponseTime');
        if (responseTimeEl) {
            responseTimeEl.textContent = `${metrics.responseTime}ms`;
            
            // Colores según performance
            if (metrics.responseTime < 100) {
                responseTimeEl.style.color = 'var(--accent-green)';
            } else if (metrics.responseTime < 500) {
                responseTimeEl.style.color = 'var(--accent-yellow)';
            } else {
                responseTimeEl.style.color = 'var(--accent-red)';
            }
        }
    }
    
    updateSystemInfo(systemInfo) {
        // Versión del servidor
        const versionEl = document.getElementById('serverVersion');
        if (versionEl) {
            versionEl.textContent = systemInfo.version;
        }
        
        // Uptime
        const uptimeEl = document.getElementById('systemUptime');
        if (uptimeEl) {
            uptimeEl.textContent = systemInfo.uptime;
        }
        
        // Actualizar dot de estado
        const statusDot = document.querySelector('.status-dot');
        if (statusDot) {
            statusDot.style.backgroundColor = systemInfo.status === 'online' ? 
                'var(--accent-green)' : 'var(--accent-red)';
        }
    }
    
    animateNumber(element, targetValue) {
        if (!element) return;
        
        const startValue = parseInt(element.textContent) || 0;
        const difference = targetValue - startValue;
        const duration = 1000; // 1 segundo
        const steps = 60; // 60 FPS
        const stepValue = difference / steps;
        const stepTime = duration / steps;
        
        let currentValue = startValue;
        let stepCount = 0;
        
        const timer = setInterval(() => {
            stepCount++;
            currentValue += stepValue;
            
            if (stepCount >= steps) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            
            element.textContent = Math.round(currentValue);
        }, stepTime);
    }
    
    calculateUptime() {
        try {
            // Calcular uptime basado en cuándo se cargó la página
            const startTime = window.SAPIENTIA.state.startTime || Date.now();
            const uptime = Date.now() - startTime;
            
            const hours = Math.floor(uptime / (1000 * 60 * 60));
            const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
            
            return `${hours}h ${minutes}m`;
        } catch (error) {
            return '0h 0m';
        }
    }
    
    startAutoRefresh() {
        // Limpiar intervalo existente
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        // Configurar nuevo intervalo
        this.intervalId = setInterval(async () => {
            if (!this.isLoading && document.querySelector('#dashboard.active')) {
                try {
                    await this.loadDashboardData();
                } catch (error) {
                    Logger.error('Error en auto-refresh del dashboard:', error);
                }
            }
        }, this.refreshInterval);
        
        Logger.debug(`Auto-refresh configurado cada ${this.refreshInterval / 1000}s`);
    }
    
    stopAutoRefresh() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            Logger.debug('Auto-refresh detenido');
        }
    }
    
    showDashboardError(message) {
        const dashboardElement = document.getElementById('dashboard');
        if (!dashboardElement) return;
        
        const errorHtml = `
            <div class="alert alert-error">
                <h4>❌ Error en Dashboard</h4>
                <p>${Utils.sanitizeHtml(message)}</p>
                <button class="btn btn-secondary" onclick="dashboardManager.load()">
                    🔄 Reintentar
                </button>
            </div>
        `;
        
        // Agregar error sin reemplazar todo el contenido
        const existingError = dashboardElement.querySelector('.alert-error');
        if (existingError) {
            existingError.remove();
        }
        
        dashboardElement.insertAdjacentHTML('afterbegin', errorHtml);
    }
    
    // Método para refrescar manualmente
    async refresh() {
        if (this.isLoading) return;
        
        Logger.debug('Refrescando dashboard manualmente...');
        await this.loadDashboardData();
    }
    
    // Obtener estadísticas para otros módulos
    async getStats() {
        try {
            const [modules, licenseTypes] = await Promise.all([
                this.getModulesCount(),
                this.getLicenseTypesCount()
            ]);
            
            return {
                modules: modules.count,
                moduleCategories: modules.categories,
                licenseTypes: licenseTypes.count,
                licenseTypeNames: licenseTypes.types,
                lastUpdate: Date.now()
            };
        } catch (error) {
            Logger.error('Error obteniendo estadísticas:', error);
            return null;
        }
    }
    
    // Cleanup al cambiar de pestaña
    destroy() {
        this.stopAutoRefresh();
        Logger.debug('Dashboard manager destruido');
    }
}

// Instancia global
window.dashboardManager = new DashboardManager();

// Event listeners
// Event listeners - ENVOLVER EN VERIFICACIÓN
if (window.SAPIENTIA && window.SAPIENTIA.events) {
    window.SAPIENTIA.events.on('tabChanged', (event) => {
        if (event.from === 'dashboard') {
            window.dashboardManager.stopAutoRefresh();
        }
        
        if (event.to === 'dashboard') {
            setTimeout(() => {
                window.dashboardManager.load();
            }, 100);
        }
    });
} else {
    // Fallback si SAPIENTIA no está inicializado
    console.log('⚠️ SAPIENTIA events no disponible - usando fallback');
}

// Configurar tiempo de inicio SOLO SI SAPIENTIA EXISTE
if (window.SAPIENTIA && window.SAPIENTIA.state) {
    window.SAPIENTIA.state.startTime = Date.now();
} else {
    // Crear estructura básica si no existe
    window.SAPIENTIA = window.SAPIENTIA || { state: {} };
    window.SAPIENTIA.state = window.SAPIENTIA.state || {};
    window.SAPIENTIA.state.startTime = Date.now();
}

// Configurar tiempo de inicio de la aplicación
window.SAPIENTIA.state.startTime = Date.now();

Logger.info('Dashboard Manager initialized');