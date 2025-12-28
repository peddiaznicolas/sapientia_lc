// navigation.js - SISTEMA DE NAVEGACIÓN ENTRE PESTAÑAS
// ============================================================================

class NavigationManager {
    constructor() {
        this.currentTab = 'dashboard';
        this.tabs = ['dashboard', 'generate', 'validate', 'admin', 'control'];
        this.tabLoaders = new Map();
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadTabContent();
        this.restoreLastTab();
    }
    
    bindEvents() {
        // Event delegation para las pestañas
        document.addEventListener('click', (e) => {
            const tabButton = e.target.closest('.nav-tab');
            if (tabButton) {
                e.preventDefault();
               const tabName = tabButton.dataset.tab;
console.log('🔍 Clicked tab:', tabName);
if (!tabName) {
    console.error('❌ No data-tab attribute found');
    return;
}
this.showTab(tabName);
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                const tabNumber = parseInt(e.key);
                if (tabNumber >= 1 && tabNumber <= this.tabs.length) {
                    e.preventDefault();
                    this.showTab(this.tabs[tabNumber - 1]);
                }
            }
        });
        
        // Guardar pestaña actual en localStorage
        window.addEventListener('beforeunload', () => {
            Utils.storage.set(CONFIG.STORAGE.KEYS.LAST_TAB, this.currentTab);
        });
    }
    
    async showTab(tabName) {
        if (!this.tabs.includes(tabName) || tabName === this.currentTab) {
            return;
        }
        
        Logger.debug(`Navegando a pestaña: ${tabName}`);
        
        try {
            // Mostrar loading
            this.showLoading(true);
            
            // Ocultar pestaña actual
            this.hideCurrentTab();
            
            // Actualizar botones de navegación
            this.updateNavButtons(tabName);
            
            // Cargar contenido de la nueva pestaña
            await this.loadTabContent(tabName);
            
            // Mostrar nueva pestaña
            this.showTabContent(tabName);
            
            // Guardar pestaña anterior ANTES de cambiar
            const previousTab = this.currentTab;
            
            // Actualizar estado
            this.currentTab = tabName;
            
            // Emitir evento de cambio de pestaña (CON PROTECCIÓN)
            if (window.SAPIENTIA && window.SAPIENTIA.events) {
                window.SAPIENTIA.events.emit('tabChanged', {
                    from: previousTab,  // ← USAR PESTAÑA ANTERIOR
                    to: tabName,
                    timestamp: Date.now()
                });
            }
            
        } catch (error) {
            Logger.error('Error cargando pestaña:', error);
            this.showError(`Error cargando ${tabName}: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }
    
    hideCurrentTab() {
        const currentContent = document.querySelector('.tab-content.active');
        if (currentContent) {
            currentContent.classList.remove('active');
            currentContent.style.opacity = '0';
            currentContent.style.transform = 'translateY(10px)';
        }
        
        const currentButton = document.querySelector('.nav-tab.active');
        if (currentButton) {
            currentButton.classList.remove('active');
        }
    }
    
    updateNavButtons(tabName) {
        // Remover active de todos los botones
        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Activar botón correspondiente
        const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetButton) {
            targetButton.classList.add('active');
        }
    }
    
    async loadTabContent(tabName) {
    const contentArea = document.getElementById('content-area');
    
    if (!contentArea) {
        throw new Error('Content area not found');
    }
    
    // QUITAR await - getTabContent no es async
    let content = this.getTabContent(tabName);
    
    contentArea.innerHTML = content;
    await this.executeTabLoader(tabName);
}
    
    getTabContent(tabName) {
    console.log('🔍 getTabContent called with:', tabName, typeof tabName);
    
    switch (tabName) {
        case 'dashboard':
            console.log('✅ Loading dashboard content');
            return this.getDashboardContent();
        case 'generate':
            return this.getGenerateContent();
        case 'validate':
            return this.getValidateContent();
        case 'admin':
            return this.getAdminContent();
        case 'control':
            return this.getControlContent();
        default:
            console.error('❌ Unknown tab:', tabName);
            return '<div class="alert alert-error">Pestaña no encontrada: ' + tabName + '</div>';
    }
}
    
    getDashboardContent() {
        return `
            <div class="tab-content active" id="dashboard">
                <div class="card">
                    <h3 class="card-title">📊 Dashboard - Sistema de Licencias</h3>
                    
                    <!-- Stats Grid -->
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value" id="totalModulesCount">-</div>
                            <div class="stat-label">Módulos Disponibles</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="totalLicenseTypesCount">-</div>
                            <div class="stat-label">Tipos de Licencia</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="systemStatusText">-</div>
                            <div class="stat-label">Estado del Sistema</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="serverResponseTime">-</div>
                            <div class="stat-label">Tiempo de Respuesta</div>
                        </div>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div class="quick-actions">
                        <a href="#" class="quick-action" onclick="navigationManager.showTab('generate')">
                            <div class="quick-action-icon">🎫</div>
                            <h4 class="quick-action-title">Generar Licencia</h4>
                            <p class="quick-action-description">Crear nueva licencia para cliente</p>
                        </a>
                        <a href="#" class="quick-action" onclick="navigationManager.showTab('validate')">
                            <div class="quick-action-icon">✅</div>
                            <h4 class="quick-action-title">Validar Licencia</h4>
                            <p class="quick-action-description">Verificar licencia existente</p>
                        </a>
                        <a href="#" class="quick-action" onclick="navigationManager.showTab('admin')">
                            <div class="quick-action-icon">🔧</div>
                            <h4 class="quick-action-title">Administración</h4>
                            <p class="quick-action-description">Gestionar módulos del sistema</p>
                        </a>
                        <a href="#" class="quick-action" onclick="navigationManager.showTab('control')">
                            <div class="quick-action-icon">🛡️</div>
                            <h4 class="quick-action-title">Control Licencias</h4>
                            <p class="quick-action-description">Panel de control administrativo</p>
                        </a>
                    </div>
                    
                    <!-- System Info -->
                    <div class="card-footer">
                        <div class="status-grid">
                            <div class="status-item healthy">
                                <div class="status-value" id="serverVersion">v2.0.0</div>
                                <div class="status-label">Versión</div>
                            </div>
                            <div class="status-item healthy">
                                <div class="status-value" id="systemUptime">-</div>
                                <div class="status-label">Uptime</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getGenerateContent() {
        return `
            <div class="tab-content" id="generate">
                <div class="card">
                    <h3 class="card-title">🎫 Generar Nueva Licencia</h3>
                    
                    <form id="generateLicenseForm" class="form-grid">
                        <div class="form-group">
                            <label class="form-label required">Nombre del Cliente</label>
                            <input type="text" class="form-input" id="clientName" 
                                   placeholder="Nombre de la empresa o cliente" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label required">Email del Cliente</label>
                            <input type="email" class="form-input" id="clientEmail" 
                                   placeholder="email@cliente.com" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Tipo de Licencia</label>
                            <select class="form-select" id="licenseType">
                                <option value="">Cargando tipos de licencia...</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Módulos Solicitados</label>
                            <div id="modulesList" class="loading-container">
                                <div class="loading"></div>
                                <p>Cargando módulos...</p>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Hardware del Cliente</label>
                            <button type="button" class="btn btn-secondary" onclick="licenseGenerator.detectHardware()">
                                🖥️ Detectar Hardware Automáticamente
                            </button>
                            <div class="form-help">Se detectará automáticamente la información del hardware</div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                ⚡ Generar Licencia
                            </button>
                            <button type="reset" class="btn btn-secondary">
                                🔄 Limpiar Formulario
                            </button>
                        </div>
                    </form>
                    
                    <div id="licenseResult" style="display: none;"></div>
                </div>
            </div>
        `;
    }
    
    getValidateContent() {
        return `
            <div class="tab-content" id="validate">
                <div class="card">
                    <h3 class="card-title">✅ Validar Licencia</h3>
                    
                    <form id="validateLicenseForm" class="form-grid">
                        <div class="form-group">
                            <label class="form-label required">Clave de Licencia</label>
                            <input type="text" class="form-input" id="validateLicenseKey" 
                                   placeholder="PDN-XXXX-XXXX-XXXX" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label required">Nombre del Módulo</label>
                            <select class="form-select" id="validateModuleName" required>
                                <option value="">Selecciona un módulo...</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Número de Usuarios</label>
                            <input type="number" class="form-input" id="validateUserCount" 
                                   value="1" min="1" max="1000">
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                🔍 Validar Licencia
                            </button>
                            <button type="button" class="btn btn-secondary" 
                                    onclick="licenseValidator.getLicenseInfo()">
                                📋 Información de Licencia
                            </button>
                        </div>
                    </form>
                    
                    <div id="validationResult" style="display: none;"></div>
                </div>
            </div>
        `;
    }
    
    getAdminContent() {
        return `
            <div class="tab-content" id="admin">
                <div class="card">
                    <h3 class="card-title">🔧 Administración de Módulos</h3>
                    
                    <!-- Crear Módulo -->
                    <details class="card">
                        <summary style="cursor: pointer; font-weight: 600;">➕ Crear Nuevo Módulo</summary>
                        
                        <form id="createModuleForm" class="form-grid">
                            <div class="form-group">
                                <label class="form-label required">Nombre Técnico</label>
                                <input type="text" class="form-input" id="moduleName" 
                                       placeholder="medical_clinic_advanced" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label required">Nombre para Mostrar</label>
                                <input type="text" class="form-input" id="moduleDisplayName" 
                                       placeholder="Medical Clinic Advanced" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Descripción</label>
                                <textarea class="form-textarea" id="moduleDescription" 
                                          placeholder="Descripción del módulo..."></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Categoría</label>
                                <select class="form-select" id="moduleCategory">
                                    <option value="medical">Medical</option>
                                    <option value="retail">Retail</option>
                                    <option value="finance">Finance</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Nivel Mínimo de Licencia</label>
                                <select class="form-select" id="moduleMinLicense">
                                    <option value="trial">Trial</option>
                                    <option value="standard">Standard</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Prefijo de Licencia</label>
                                <input type="text" class="form-input" id="moduleLicensePrefix" 
                                       placeholder="PDN" value="PDN" maxlength="5">
                                <div class="form-help">2-5 letras mayúsculas para el prefijo de licencias</div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">
                                    💾 Crear Módulo
                                </button>
                                <button type="reset" class="btn btn-secondary">
                                    🔄 Limpiar
                                </button>
                            </div>
                        </form>
                    </details>
                    
                    <!-- Lista de Módulos -->
                    <div class="card">
                        <div class="card-header">
                            <h4>📦 Módulos Existentes</h4>
                            <input type="text" class="form-input" id="searchModules" 
                                   placeholder="🔍 Buscar módulos..." 
                                   oninput="moduleAdmin.filterModules()">
                        </div>
                        
                        <div id="modulesList" class="loading-container">
                            <div class="loading"></div>
                            <p>Cargando módulos...</p>
                        </div>
                    </div>
                    
                    <!-- Estadísticas -->
                    <div id="adminStats"></div>
                </div>
            </div>
        `;
    }
    
    getControlContent() {
        return `
            <div class="tab-content" id="control">
                <div class="card">
                    <h3 class="card-title">🛡️ Panel de Control de Licencias</h3>
                    
                    <!-- Dashboard de estadísticas -->
                    <div class="stats-grid" style="margin-bottom: 2rem;">
                        <div class="stat-card">
                            <div class="stat-value" id="totalLicensesCount">-</div>
                            <div class="stat-label">Total Licencias</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="activeLicensesCount">-</div>
                            <div class="stat-label">Licencias Activas</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="expiredLicensesCount">-</div>
                            <div class="stat-label">Licencias Expiradas</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="validations24h">-</div>
                            <div class="stat-label">Validaciones 24h</div>
                        </div>
                    </div>

                    <!-- Filtros de búsqueda -->
                    <div class="control-filters">
                        <div class="filter-group">
                            <label class="filter-label">Buscar</label>
                            <input type="text" class="form-input" id="searchLicenses" 
                                   placeholder="🔍 Cliente, email o licencia..." 
                                   oninput="controlPanel.filterLicenses()">
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Tipo</label>
                            <select class="form-select" id="filterLicenseType" 
                                    onchange="controlPanel.filterLicenses()">
                                <option value="">Todos los tipos</option>
                                <option value="trial">Trial</option>
                                <option value="standard">Standard</option>
                                <option value="enterprise">Enterprise</option>
                                <option value="unlimited">Unlimited</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Estado</label>
                            <select class="form-select" id="filterLicenseStatus" 
                                    onchange="controlPanel.filterLicenses()">
                                <option value="">Todos los estados</option>
                                <option value="active">Activas</option>
                                <option value="inactive">Inactivas</option>
                                <option value="expired">Expiradas</option>
                            </select>
                        </div>
                    </div>

                    <!-- Lista de licencias -->
                    <div id="licensesList" class="loading-container">
                        <div class="loading"></div>
                        <p>Cargando licencias...</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    showTabContent(tabName) {
        const content = document.querySelector(`#${tabName}`);
        if (content) {
            content.classList.add('active');
            content.style.opacity = '1';
            content.style.transform = 'translateY(0)';
        }
    }
    
    async executeTabLoader(tabName) {
        switch (tabName) {
            case 'dashboard':
                if (window.dashboardManager) {
                    await window.dashboardManager.load();
                }
                break;
            case 'generate':
                if (window.licenseGenerator) {
                    await window.licenseGenerator.init();
                }
                break;
            case 'validate':
                if (window.licenseValidator) {
                    await window.licenseValidator.init();
                }
                break;
            case 'admin':
                if (window.moduleAdmin) {
                    await window.moduleAdmin.load();
                }
                break;
            case 'control':
                if (window.controlPanel) {
                    await window.controlPanel.load();
                }
                break;
        }
    }
    
    restoreLastTab() {
        const lastTab = Utils.storage.get(CONFIG.STORAGE.KEYS.LAST_TAB, 'dashboard');
        if (this.tabs.includes(lastTab)) {
            this.showTab(lastTab);
        } else {
            this.showTab('dashboard');
        }
    }
    
    showLoading(show = true) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.toggle('active', show);
        }
    }
    
    showError(message) {
        const toast = this.createToast('error', 'Error de Navegación', message);
        this.showToast(toast);
    }
    
    createToast(type, title, message) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${type === 'error' ? '❌' : '✅'}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        return toast;
    }
    
    showToast(toast) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Instancia global
window.navigationManager = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
    Logger.info('Navigation Manager initialized');
});