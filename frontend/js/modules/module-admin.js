// modules/module-admin.js - ADMINISTRADOR DE MÓDULOS
// ============================================================================

class ModuleAdmin {
    constructor() {
        this.allModules = [];
        this.filteredModules = [];
        this.categories = [];
        this.stats = {};
        this.currentView = 'modules'; // ← AGREGAR ESTA LÍNEA

    }
    
    async load() {
    Logger.debug('Cargando Module Admin...');
    
    try {
        // Renderizar interfaz con pestañas
        this.renderAdminInterface();
        
        // Si estamos en vista de módulos, ejecutar tu lógica original
        if (this.currentView === 'modules') {
            this.bindEvents();
            await this.loadData();
            this.setupForm();
        }
        
    } catch (error) {
        Logger.error('Error cargando Module Admin:', error);
        this.showError('Error cargando administración de módulos');
    }
}
    
    bindEvents() {
        // Form submission
        const form = document.getElementById('createModuleForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createModule();
            });
            
            form.addEventListener('reset', () => {
                this.resetCreateForm();
            });
        }
        
        // Search functionality
        const searchInput = document.getElementById('searchModules');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.filterModules();
            }, 300));
        }
    }
    
    async loadData() {
        try {
            // Cargar datos en paralelo
            const [modules, stats, categories] = await Promise.all([
                this.loadAllModules(),
                this.loadAdminStats(),
                this.loadCategories()
            ]);
            
            this.allModules = modules;
            this.filteredModules = [...modules];
            this.stats = stats;
            this.categories = categories;
            
        } catch (error) {
            Logger.error('Error cargando datos de módulos:', error);
            throw error;
        }
    }
    
    async loadAllModules() {
        try {
            const response = await window.apiClient.getAdminModules();
            return response.modules || [];
        } catch (error) {
            Logger.warn('Error cargando módulos:', error);
            return [];
        }
    }
    
    async loadAdminStats() {
        try {
            const response = await window.apiClient.getAdminStats();
            return response.stats || {};
        } catch (error) {
            Logger.warn('Error cargando estadísticas:', error);
            return {};
        }
    }
    
    async loadCategories() {
        try {
            const response = await window.apiClient.getCategories();
            return response.categories || [];
        } catch (error) {
            Logger.warn('Error cargando categorías:', error);
            return CONFIG.DEFAULTS.MODULE_CATEGORIES;
        }
    }
    
    setupForm() {
        this.populateCategories();
        this.displayModules();
        this.displayStats();
    }
    
    populateCategories() {
        const select = document.getElementById('moduleCategory');
        if (!select) return;
        
        // Limpiar opciones existentes excepto las predefinidas
        const existingOptions = Array.from(select.options).slice(0, 4);
        select.innerHTML = '';
        existingOptions.forEach(option => select.appendChild(option));
        
        // Agregar categorías dinámicas
        this.categories.forEach(category => {
            if (!['medical', 'retail', 'finance', 'custom'].includes(category)) {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = this.getCategoryDisplayName(category);
                select.appendChild(option);
            }
        });
    }
    
    getCategoryDisplayName(category) {
        const names = {
            'medical': '🏥 Médico',
            'retail': '🛒 Retail',
            'finance': '💰 Financiero',
            'manufacturing': '🏭 Manufactura',
            'education': '🎓 Educación',
            'agriculture': '🌱 Agricultura',
            'real_estate': '🏠 Bienes Raíces',
            'services': '🔧 Servicios',
            'logistics': '🚚 Logística',
            'custom': '⚙️ Personalizado'
        };
        
        return names[category] || `📦 ${category.charAt(0).toUpperCase() + category.slice(1)}`;
    }
    
    displayModules() {
    const container = document.getElementById('modulesList');
    if (!container) return;
    
    if (this.filteredModules.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem; background: #2a2a2a; border-radius: 8px; border: 1px solid #333; color: #fff;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">📦</div>
                <h3>No hay módulos</h3>
                <p style="color: #9ca3af;">No se encontraron módulos</p>
            </div>
        `;
        return;
    }
    
    const modulesHtml = `
        <div style="display: grid; gap: 1rem; margin-bottom: 2rem;">
            ${this.filteredModules.map(module => `
                <div style="background: #2a2a2a; border: 1px solid #333; border-radius: 8px; padding: 1.5rem; color: #fff;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <h4 style="margin: 0; color: #00ffff;">${module.display_name}</h4>
                            <p style="margin: 0.5rem 0; color: #9ca3af; font-family: monospace;">${module.name}</p>
                            <p style="margin: 0; color: #d1d5db;">${module.description || 'Sin descripción'}</p>
                        </div>
                        <span style="background: ${module.is_core ? '#065f46' : '#1e3a8a'}; color: ${module.is_core ? '#6ee7b7' : '#93c5fd'}; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600;">
                            ${module.is_core ? '🔒 CORE' : '⚙️ CUSTOM'}
                        </span>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-bottom: 1rem; font-size: 0.9rem; color: #9ca3af;">
                        <span>📦 ${this.getCategoryDisplayName(module.category)}</span>
                        <span>🏷️ v${module.version}</span>
                        <span>🎫 ${module.min_license_level}</span>
                        <span>📅 ${module.created_at ? new Date(module.created_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    
                    <div style="display: flex; gap: 0.5rem;">
                        <button style="background: #1d4ed8; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;" 
                                onclick="moduleAdmin.editModule(${module.id})">✏️ Editar</button>
                        ${!module.is_core ? `
                            <button style="background: #dc2626; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;" 
                                    onclick="moduleAdmin.deleteModule(${module.id})">🗑️ Eliminar</button>
                        ` : ''}
                        <button style="background: #6b7280; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;" 
                                onclick="moduleAdmin.viewModuleDetails(${module.id})">👁️ Ver</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = modulesHtml;
}
    
    createModuleItemHtml(module) {
        const isCore = module.is_core;
        const coreClass = isCore ? 'core-module' : 'custom-module';
        
        return `
            <div class="module-item ${coreClass}" data-module="${module.id}">
                <div class="module-header">
                    <div class="module-info">
                        <div class="module-name">${module.display_name}</div>
                        <div class="module-technical-name">${module.name}</div>
                        <div class="module-description">${module.description || 'Sin descripción'}</div>
                    </div>
                    <div class="module-badge">
                        ${isCore ? '🔒 Core' : '⚙️ Custom'}
                    </div>
                </div>
                
                <div class="module-details">
                    <div class="module-meta">
                        <span class="meta-item">📦 ${this.getCategoryDisplayName(module.category)}</span>
                        <span class="meta-item">🏷️ v${module.version}</span>
                        <span class="meta-item">🎫 ${module.min_license_level}</span>
                        <span class="meta-item">🔑 ${module.license_prefix || 'PDN'}</span>
                        ${module.created_at ? `<span class="meta-item">📅 ${Utils.formatDate(module.created_at)}</span>` : ''}
                    </div>
                    
                    <div class="module-author">
                        👨‍💻 ${module.author || 'Pedro Diaz Nicolas'}
                    </div>
                </div>
                
                <div class="module-actions">
                    <button class="btn btn-small btn-primary" 
                            onclick="moduleAdmin.editModule(${module.id})"
                            title="Editar módulo">
                        ✏️ Editar
                    </button>
                    ${!isCore ? `
                        <button class="btn btn-small btn-danger" 
                                onclick="moduleAdmin.deleteModule(${module.id})"
                                title="Eliminar módulo">
                            🗑️ Eliminar
                        </button>
                    ` : `
                        <button class="btn btn-small btn-secondary" 
                                disabled
                                title="Los módulos core no se pueden eliminar">
                            🔒 Protegido
                        </button>
                    `}
                    <button class="btn btn-small btn-secondary"
                            onclick="moduleAdmin.viewModuleDetails(${module.id})"
                            title="Ver detalles">
                        📋 Detalles
                    </button>
                </div>
            </div>
        `;
    }
    
    displayStats() {
        const container = document.getElementById('adminStats');
        if (!container || !this.stats) return;
        
        const statsHtml = `
            <div class="card">
                <div class="card-header">
                    <h4>📊 Estadísticas de Módulos</h4>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${this.stats.total_modules || 0}</div>
                        <div class="stat-label">Total Módulos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.stats.core_modules || 0}</div>
                        <div class="stat-label">Módulos Core</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.stats.custom_modules || 0}</div>
                        <div class="stat-label">Módulos Custom</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.categories.length}</div>
                        <div class="stat-label">Categorías</div>
                    </div>
                </div>
                
                ${this.stats.modules_by_category ? this.createCategoryChart() : ''}
            </div>
        `;
        
        container.innerHTML = statsHtml;
    }
    
    createCategoryChart() {
        const categories = this.stats.modules_by_category || {};
        
        const chartHtml = Object.entries(categories).map(([category, count]) => `
            <div class="category-bar">
                <div class="category-label">${this.getCategoryDisplayName(category)}</div>
                <div class="category-progress">
                    <div class="category-bar-fill" style="width: ${(count / Math.max(...Object.values(categories))) * 100}%"></div>
                    <span class="category-count">${count}</span>
                </div>
            </div>
        `).join('');
        
        return `
            <div class="category-chart">
                <h5>📊 Módulos por Categoría</h5>
                <div class="chart-content">
                    ${chartHtml}
                </div>
            </div>
        `;
    }
    
    filterModules() {
        const searchTerm = document.getElementById('searchModules')?.value.toLowerCase() || '';
        
        this.filteredModules = this.allModules.filter(module => {
            return !searchTerm || 
                module.name.toLowerCase().includes(searchTerm) ||
                module.display_name.toLowerCase().includes(searchTerm) ||
                (module.description && module.description.toLowerCase().includes(searchTerm)) ||
                module.category.toLowerCase().includes(searchTerm) ||
                (module.author && module.author.toLowerCase().includes(searchTerm));
        });
        
        this.displayModules();
    }
    
    async createModule() {
        try {
            Logger.debug('Creando nuevo módulo...');
            
            if (!this.validateCreateForm()) {
                return;
            }
            
            this.showCreateLoading(true);
            
            const moduleData = this.prepareModuleData();
            const response = await window.apiClient.createModule(moduleData);
            
            if (response.success) {
                this.showSuccess('Módulo creado exitosamente');
                await this.reloadData();
                this.resetCreateForm();
            } else {
                this.showError(response.message || 'Error creando módulo');
            }
            
        } catch (error) {
            Logger.error('Error creando módulo:', error);
            this.showError(`Error creando módulo: ${error.message}`);
        } finally {
            this.showCreateLoading(false);
        }
    }
    
    validateCreateForm() {
        const name = document.getElementById('moduleName')?.value.trim();
        const displayName = document.getElementById('moduleDisplayName')?.value.trim();
        const category = document.getElementById('moduleCategory')?.value;
        
        if (!name) {
            this.showError('El nombre técnico es requerido');
            return false;
        }
        
        if (!displayName) {
            this.showError('El nombre para mostrar es requerido');
            return false;
        }
        
        if (!category) {
            this.showError('La categoría es requerida');
            return false;
        }
        
        // Verificar que el nombre no exista
        if (this.allModules.find(m => m.name === name)) {
            this.showError('Ya existe un módulo con ese nombre técnico');
            return false;
        }
        
        return true;
    }
    
    prepareModuleData() {
        return {
            name: document.getElementById('moduleName').value.trim(),
            display_name: document.getElementById('moduleDisplayName').value.trim(),
            description: document.getElementById('moduleDescription')?.value.trim() || '',
            category: document.getElementById('moduleCategory').value,
            min_license_level: document.getElementById('moduleMinLicense')?.value || 'standard',
            license_prefix: document.getElementById('moduleLicensePrefix')?.value.trim().toUpperCase() || 'PDN',
            author: 'Pedro Diaz Nicolas',
            version: '18.0.1.0.0',
            is_core: false
        };
    }
    
    async editModule(moduleId) {
        const module = this.allModules.find(m => m.id === moduleId);
        if (!module) return;
        
        const modal = this.createEditModal(module);
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 100);
    }
    
    createEditModal(module) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3 class="modal-title">✏️ Editar Módulo</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                
                <form id="editModuleForm" class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Nombre Técnico</label>
                        <input type="text" class="form-input" id="editModuleName" 
                               value="${module.name}" readonly>
                        <div class="form-help">El nombre técnico no se puede cambiar</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Nombre para Mostrar</label>
                        <input type="text" class="form-input" id="editModuleDisplayName" 
                               value="${module.display_name}" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Descripción</label>
                        <textarea class="form-textarea" id="editModuleDescription">${module.description || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Categoría</label>
                        <select class="form-select" id="editModuleCategory">
                            ${CONFIG.DEFAULTS.MODULE_CATEGORIES.map(cat => `
                                <option value="${cat}" ${module.category === cat ? 'selected' : ''}>${this.getCategoryDisplayName(cat)}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Nivel Mínimo de Licencia</label>
                        <select class="form-select" id="editModuleMinLicense">
                            <option value="trial" ${module.min_license_level === 'trial' ? 'selected' : ''}>Trial</option>
                            <option value="standard" ${module.min_license_level === 'standard' ? 'selected' : ''}>Standard</option>
                            <option value="enterprise" ${module.min_license_level === 'enterprise' ? 'selected' : ''}>Enterprise</option>
                            <option value="unlimited" ${module.min_license_level === 'unlimited' ? 'selected' : ''}>Unlimited</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Prefijo de Licencia</label>
                        <input type="text" class="form-input" id="editModuleLicensePrefix" 
                               value="${module.license_prefix || 'PDN'}" maxlength="5">
                    </div>
                </form>
                
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="moduleAdmin.saveModuleEdit(${module.id})">
                        💾 Guardar Cambios
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        ✕ Cancelar
                    </button>
                </div>
            </div>
        `;
        
        return modal;
    }
    
    async saveModuleEdit(moduleId) {
        try {
            const moduleData = {
                display_name: document.getElementById('editModuleDisplayName').value.trim(),
                description: document.getElementById('editModuleDescription').value.trim(),
                category: document.getElementById('editModuleCategory').value,
                min_license_level: document.getElementById('editModuleMinLicense').value,
                license_prefix: document.getElementById('editModuleLicensePrefix').value.trim().toUpperCase()
            };
            
            const response = await window.apiClient.updateModule(moduleId, moduleData);
            
            if (response.success) {
                this.showSuccess('Módulo actualizado exitosamente');
                await this.reloadData();
                
                // Cerrar modal
                document.querySelector('.modal').remove();
            } else {
                this.showError('Error actualizando módulo');
            }
            
        } catch (error) {
            Logger.error('Error actualizando módulo:', error);
            this.showError(`Error actualizando módulo: ${error.message}`);
        }
    }
    
    async deleteModule(moduleId) {
        const module = this.allModules.find(m => m.id === moduleId);
        if (!module) return;
        
        if (module.is_core) {
            this.showError('Los módulos core no se pueden eliminar');
            return;
        }
        
        const confirmMessage = `¿Eliminar el módulo "${module.display_name}"?\n\nEsta acción no se puede deshacer.`;
        if (!confirm(confirmMessage)) return;
        
        try {
            const response = await window.apiClient.deleteModule(moduleId);
            
            if (response.success) {
                this.showSuccess('Módulo eliminado exitosamente');
                await this.reloadData();
            } else {
                this.showError('Error eliminando módulo');
            }
            
        } catch (error) {
            Logger.error('Error eliminando módulo:', error);
            this.showError(`Error eliminando módulo: ${error.message}`);
        }
    }
    
    viewModuleDetails(moduleId) {
        const module = this.allModules.find(m => m.id === moduleId);
        if (!module) return;
        
        const modal = this.createDetailsModal(module);
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 100);
    }
    
    createDetailsModal(module) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">📋 Detalles del Módulo</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                
                <div class="module-details-modal">
                    <div class="detail-section">
                        <h4>ℹ️ Información General</h4>
                        <div class="detail-grid">
                            <div><strong>Nombre Técnico:</strong> ${module.name}</div>
                            <div><strong>Nombre Mostrar:</strong> ${module.display_name}</div>
                            <div><strong>Categoría:</strong> ${this.getCategoryDisplayName(module.category)}</div>
                            <div><strong>Versión:</strong> ${module.version}</div>
                            <div><strong>Autor:</strong> ${module.author}</div>
                            <div><strong>Tipo:</strong> ${module.is_core ? 'Core' : 'Custom'}</div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>📄 Descripción</h4>
                        <p>${module.description || 'Sin descripción disponible'}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4>🎫 Licenciamiento</h4>
                        <div class="detail-grid">
                            <div><strong>Nivel Mínimo:</strong> ${module.min_license_level}</div>
                            <div><strong>Prefijo:</strong> ${module.license_prefix || 'PDN'}</div>
                        </div>
                    </div>
                    
                    ${module.created_at ? `
                        <div class="detail-section">
                            <h4>📅 Fechas</h4>
                            <div><strong>Creado:</strong> ${Utils.formatDate(module.created_at)}</div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cerrar</button>
                </div>
            </div>
        `;
        
        return modal;
    }
    
    async reloadData() {
        await this.loadData();
        this.displayModules();
        this.displayStats();
        this.populateCategories();
    }
    
    resetCreateForm() {
        const form = document.getElementById('createModuleForm');
        if (form) {
            form.reset();
            
            // Restaurar valores por defecto
            const licensePrefix = document.getElementById('moduleLicensePrefix');
            if (licensePrefix) licensePrefix.value = 'PDN';
        }
    }
    
    showCreateLoading(show = true) {
        const button = document.querySelector('#createModuleForm button[type="submit"]');
        if (button) {
            if (show) {
                button.innerHTML = '<div class="loading"></div> Creando...';
                button.disabled = true;
            } else {
                button.innerHTML = '💾 Crear Módulo';
                button.disabled = false;
            }
        }
    }
    
    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = `
            <div class="toast-icon">❌</div>
            <div class="toast-content">
                <div class="toast-title">Error</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        this.showToast(toast);
    }
    
    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `
            <div class="toast-icon">✅</div>
            <div class="toast-content">
                <div class="toast-title">Éxito</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        this.showToast(toast);
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
        setTimeout(() => toast.remove(), 5000);
    }

    renderAdminInterface() {
    const container = document.getElementById('content-area');
    if (!container) return;
    
    container.innerHTML = `
        <div class="admin-interface">
            <div class="admin-nav">
                <h2>🔧 Panel de Administración</h2>
                <div class="admin-tabs">
                    <button class="admin-tab ${this.currentView === 'modules' ? 'active' : ''}" 
                            data-view="modules">
                        📦 Gestión de Módulos
                    </button>
                    <button class="admin-tab ${this.currentView === 'license-types' ? 'active' : ''}" 
                            data-view="license-types">
                        📋 Tipos de Licencia
                    </button>
                </div>
            </div>
            
            <div id="admin-content-area" class="admin-content-area">
                ${this.currentView === 'modules' ? this.getModulesHTML() : ''}
            </div>
        </div>
        
        <style>
            .admin-interface { padding: 1rem; }
            .admin-nav { margin-bottom: 2rem; }
            .admin-nav h2 { margin: 0 0 1rem 0; color: #fff; }
            .admin-tabs { 
                display: flex; 
                gap: 1rem; 
            }
            .admin-tab { 
                padding: 0.75rem 1.5rem; 
                border: 1px solid #333;
                background: #2a2a2a;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                color: #fff;
                font-weight: 600;
            }
            .admin-tab:hover {
                background: #374151;
            }
            .admin-tab.active { 
                background: linear-gradient(135deg, #00ffff, #0080ff); 
                color: #000; 
                border-color: #00ffff;
            }
            .admin-content-area { 
                min-height: 400px; 
                background: #1a1a1a;
                border-radius: 12px;
                border: 1px solid #333;
            }
        </style>
    `;
    
    if (this.currentView === 'modules') {
        this.bindTabEvents();
    } else {
        this.loadLicenseTypesView();
    }
}

bindTabEvents() {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', async (e) => {
            const view = e.target.dataset.view;
            
            // Cambiar estado visual de pestañas
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            this.currentView = view;
            
            if (view === 'modules') {
                this.renderModulesView();
            } else if (view === 'license-types') {
                await this.loadLicenseTypesView();
            }
        });
    });
}

// AGREGAR ESTOS MÉTODOS:
renderModulesView() {
    const contentArea = document.getElementById('admin-content-area');
    if (!contentArea) return;
    
    contentArea.innerHTML = this.getModulesHTML();
    
    // Recargar datos de módulos
    this.bindEvents();
    this.loadData().then(() => {
        this.setupForm();
    });
}

async loadLicenseTypesView() {
    const contentArea = document.getElementById('admin-content-area');
    if (!contentArea) return;
    
    // AGREGAR ESTA LÍNEA:
    contentArea.innerHTML = '<div id="content-area"></div>';
    
    if (window.licenseTypesAdmin) {
        await window.licenseTypesAdmin.load();
    }
}

getModulesHTML() {
    return `
        <div class="admin-container">
            <div class="admin-header">
                <h2>📦 Gestión de Módulos</h2>
                <div class="header-actions">
                    <button class="btn-action btn-primary" id="createModuleBtn">
                        ➕ Crear Nuevo Módulo
                    </button>
                    <button class="btn-action btn-secondary" id="refreshModulesBtn">
                        🔄 Actualizar
                    </button>
                </div>
            </div>
            
            <div class="stats-container">
                <div class="stat-item">
                    <div class="stat-value">${this.stats.total_modules || 0}</div>
                    <div class="stat-label">Total Módulos</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${this.stats.core_modules || 0}</div>
                    <div class="stat-label">Módulos Core</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${this.stats.custom_modules || 0}</div>
                    <div class="stat-label">Módulos Custom</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${this.categories.length}</div>
                    <div class="stat-label">Categorías</div>
                </div>
            </div>
            
            <div style="margin-bottom: 2rem;">
                <input type="text" id="searchModules" placeholder="🔍 Buscar módulos..." 
                       style="width: 100%; padding: 0.75rem; border: 1px solid #333; border-radius: 4px; background: #2a2a2a; color: #fff;">
            </div>
            
            <div id="modulesList"></div>
            
            <style>
                .admin-container {
                    padding: 1.5rem;
                    background: #1a1a1a;
                    border-radius: 12px;
                    border: 1px solid #333;
                    color: #fff;
                }
                
                .admin-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid #333;
                }
                
                .admin-header h2 {
                    margin: 0;
                    font-size: 1.5rem;
                }
                
                .header-actions {
                    display: flex;
                    gap: 1rem;
                }
                
                .btn-action {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s ease;
                }
                
                .btn-primary {
                    background: linear-gradient(135deg, #00ffff, #0080ff);
                    color: #000;
                }
                
                .btn-secondary {
                    background: #374151;
                    color: #fff;
                }
                
                .stats-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                
                .stat-item {
                    background: #2a2a2a;
                    padding: 1.5rem;
                    border-radius: 8px;
                    text-align: center;
                    border: 1px solid #333;
                }
                
                .stat-value {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #00ffff;
                    margin-bottom: 0.5rem;
                }
                
                .stat-label {
                    color: #9ca3af;
                    font-size: 0.9rem;
                }
            </style>
        </div>
    `;
}
}

// Instancia global
window.moduleAdmin = new ModuleAdmin();

Logger.info('Module Admin initialized');