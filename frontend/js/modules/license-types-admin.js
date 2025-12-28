// SOLUCIÓN COMPLETA PARA license-types-admin.js
// ============================================================================

class LicenseTypesAdmin {
    constructor() {
        this.licenseTypes = [];
        this.isLoading = false;
        this.editingType = null;
    }
    
    async load() {
        Logger.debug('Cargando administrador de tipos de licencia...');
        
        try {
            this.isLoading = true;
            await this.loadLicenseTypes();
            this.render();
            this.bindEvents();
            
        } catch (error) {
            Logger.error('Error cargando License Types Admin:', error);
            this.showError('Error cargando tipos de licencia');
        } finally {
            this.isLoading = false;
        }
    }
    
    async loadLicenseTypes() {
        try {
            const response = await window.apiClient.get('/admin/license-types');
            this.licenseTypes = response.license_types || [];
            Logger.info('Tipos de licencia cargados:', this.licenseTypes.length);
            
        } catch (error) {
            Logger.error('Error obteniendo tipos de licencia:', error);
            this.licenseTypes = [];
        }
    }
    
    render() {
        const container = document.getElementById('admin-content-area');
        if (!container) return;
        
            const html = ` 
            <div class="admin-container">
                <div class="admin-header">
                    <h2>📋 Gestión de Tipos de Licencia</h2>
                    <div class="header-actions">
                        <button class="btn-action btn-primary" id="createLicenseTypeBtn">
                            ➕ Crear Nuevo Tipo
                        </button>
                        <button class="btn-action btn-secondary" id="refreshLicenseTypesBtn">
                            🔄 Actualizar
                        </button>
                    </div>
                </div>
                
                <div class="stats-container">
                    <div class="stat-item">
                        <div class="stat-value">${this.licenseTypes.length}</div>
                        <div class="stat-label">Tipos Totales</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.getActiveTypesCount()}</div>
                        <div class="stat-label">Tipos Activos</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.getAveragePrice()}</div>
                        <div class="stat-label">Precio Promedio</div>
                    </div>
                </div>
                
                ${this.renderLicenseTypesTable()}
                ${this.renderLicenseTypeModal()}
            </div>
            
            <style>
                .admin-container {
                    padding: 1.5rem;
                    background: var(--card-background, #1a1a1a);
                    border-radius: 12px;
                    border: 1px solid var(--border-color, #333);
                    color: var(--text-primary, #fff);
                }
                
                .admin-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid var(--border-color, #333);
                }
                
                .admin-header h2 {
                    margin: 0;
                    color: var(--text-primary, #fff);
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
                
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 255, 255, 0.3);
                }
                
                .btn-secondary {
                    background: #374151;
                    color: #fff;
                    border: 1px solid #4b5563;
                }
                
                .btn-secondary:hover {
                    background: #4b5563;
                }
                
                .stats-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                
                .stat-item {
                    background: var(--background-secondary, #2a2a2a);
                    padding: 1.5rem;
                    border-radius: 8px;
                    text-align: center;
                    border: 1px solid var(--border-color, #333);
                    transition: transform 0.2s ease;
                }
                
                .stat-item:hover {
                    transform: translateY(-2px);
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
                
                .data-table {
                    background: var(--card-background, #1a1a1a);
                    border-radius: 8px;
                    border: 1px solid var(--border-color, #333);
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                }
                
                .data-table table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .data-table th {
                    background: #2a2a2a;
                    padding: 1rem;
                    text-align: center;
                    font-weight: 600;
                    color: #fff;
                    border-bottom: 2px solid #333;
                    white-space: nowrap;
                }
                
                .data-table td {
                    padding: 1rem;
                    border-bottom: 1px solid #333;
                    color: #fff;
                    text-align: center;
                    vertical-align: middle;
                }
                
                .data-table tr:hover {
                    background: #2a2a2a;
                }
                
                .name-cell {
                    text-align: left !important;
                    max-width: 200px;
                }
                
                .name-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                
                .name-content strong {
                    font-size: 1rem;
                    color: #fff;
                }
                
                .desc-cell {
                    text-align: left !important;
                    max-width: 250px;
                }
                
                .desc-text {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: #d1d5db;
                }
                
                .metric-cell {
                    font-weight: 600;
                    font-size: 1rem;
                    min-width: 80px;
                }
                
                .duration-cell {
                    font-weight: 600;
                    font-size: 1rem;
                    color: #60a5fa;
                    min-width: 90px;
                }
                
                .price-cell {
                    font-weight: bold;
                    font-size: 1.1rem;
                }
                
                .price-free {
                    color: #10b981;
                }
                
                .price-paid {
                    color: #f59e0b;
                }
                
                .badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .badge-free {
                    background: #065f46;
                    color: #6ee7b7;
                }
                
                .badge-standard {
                    background: #1e3a8a;
                    color: #93c5fd;
                }
                
                .badge-enterprise {
                    background: #581c87;
                    color: #c4b5fd;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 0.5rem;
                    justify-content: center;
                }
                
                .btn-sm {
                    padding: 0.5rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    min-width: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                
                .btn-edit {
                    background: #1d4ed8;
                    color: white;
                }
                
                .btn-edit:hover {
                    background: #2563eb;
                    transform: scale(1.1);
                }
                
                .btn-view {
                    background: #6b7280;
                    color: white;
                }
                
                .btn-view:hover {
                    background: #9ca3af;
                    transform: scale(1.1);
                }
                
                .btn-delete {
                    background: #dc2626;
                    color: white;
                }
                
                .btn-delete:hover {
                    background: #ef4444;
                    transform: scale(1.1);
                }
            </style>
        `;
        
        container.innerHTML = html;
    }
    
    renderLicenseTypesTable() {
        if (this.licenseTypes.length === 0) {
            return `
                <div style="text-align: center; padding: 4rem; background: #2a2a2a; border-radius: 8px; border: 1px solid #333;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">📄</div>
                    <h3>No hay tipos de licencia configurados</h3>
                    <p style="color: #9ca3af; margin-bottom: 2rem;">Crea el primer tipo de licencia para comenzar</p>
                    <button class="btn-action btn-primary" onclick="licenseTypesAdmin.openCreateModal()">
                        ➕ Crear Primer Tipo
                    </button>
                </div>
            `;
        }
        
        return `
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Max Usuarios</th>
                            <th>Max Módulos</th>
                            <th>Duración</th>
                            <th>Precio</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.licenseTypes.map(type => this.renderLicenseTypeRow(type)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    renderLicenseTypeRow(type) {
        const durationText = type.duration_days === -1 ? 'Permanente' : 
            type.duration_days === 365 ? '1 año' :
            type.duration_days === 30 ? '1 mes' :
            `${type.duration_days} días`;
        const maxModulesText = type.max_modules === -1 ? 'Ilimitado' : type.max_modules;
        const priceText = type.price === 0 ? 'Gratis' : `$${type.price}`;
        const priceClass = type.price === 0 ? 'price-free' : 'price-paid';
        
        return `
            <tr data-type-id="${type.id}">
                <td class="name-cell">
                    <div class="name-content">
                        <strong>${type.name}</strong>
                        ${this.renderTypeBadge(type)}
                    </div>
                </td>
                <td class="desc-cell">
                    <div class="desc-text" title="${type.description}">
                        ${type.description || 'Sin descripción'}
                    </div>
                </td>
                <td class="metric-cell">${type.max_users}</td>
                <td class="metric-cell">${maxModulesText}</td>
                <td class="duration-cell">${durationText}</td>
                <td class="price-cell ${priceClass}">${priceText}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-sm btn-edit" onclick="licenseTypesAdmin.editLicenseType(${type.id})" title="Editar">
                            ✏️
                        </button>
                        <button class="btn-sm btn-view" onclick="licenseTypesAdmin.viewLicenseType(${type.id})" title="Ver">
                            👁️
                        </button>
                        <button class="btn-sm btn-delete" onclick="licenseTypesAdmin.deleteLicenseType(${type.id})" title="Eliminar">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    renderTypeBadge(type) {
        if (type.price === 0) return '<span class="badge badge-free">Gratis</span>';
        if (type.max_users > 50) return '<span class="badge badge-enterprise">Enterprise</span>';
        return '<span class="badge badge-standard">Standard</span>';
    }
    
    renderLicenseTypeModal() {
        return `
            <div id="licenseTypeModal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center;">
                <div style="background: #1a1a1a; border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; color: #fff; border: 1px solid #333;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #333;">
                        <h3 id="modalTitle">Crear Tipo de Licencia</h3>
                        <button onclick="licenseTypesAdmin.closeModal()" style="background: none; border: none; font-size: 1.5rem; color: #fff; cursor: pointer;">×</button>
                    </div>
                    <form id="licenseTypeForm" style="padding: 1.5rem;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Nombre *</label>
                                <input type="text" id="typeName" required 
                                       style="width: 100%; padding: 0.75rem; border: 1px solid #333; border-radius: 4px; background: #2a2a2a; color: #fff;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Precio USD</label>
                                <input type="number" id="typePrice" min="0" step="0.01"
                                       style="width: 100%; padding: 0.75rem; border: 1px solid #333; border-radius: 4px; background: #2a2a2a; color: #fff;">
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 2rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Descripción</label>
                            <textarea id="typeDescription" rows="3"
                                      style="width: 100%; padding: 0.75rem; border: 1px solid #333; border-radius: 4px; background: #2a2a2a; color: #fff;"></textarea>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Max Usuarios *</label>
                                <input type="number" id="maxUsers" required min="1"
                                       style="width: 100%; padding: 0.75rem; border: 1px solid #333; border-radius: 4px; background: #2a2a2a; color: #fff;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Max Módulos</label>
                                <input type="number" id="maxModules" placeholder="-1 = ilimitado"
                                       style="width: 100%; padding: 0.75rem; border: 1px solid #333; border-radius: 4px; background: #2a2a2a; color: #fff;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Duración (días) *</label>
                                <input type="number" id="durationDays" required min="1" placeholder="365"
                                       style="width: 100%; padding: 0.75rem; border: 1px solid #333; border-radius: 4px; background: #2a2a2a; color: #fff;">
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 1rem; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid #333;">
                            <button type="button" onclick="licenseTypesAdmin.closeModal()" class="btn-action btn-secondary">
                                Cancelar
                            </button>
                            <button type="submit" class="btn-action btn-primary">
                                <span id="submitButtonText">Crear Tipo</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
    
    bindEvents() {
        const createBtn = document.getElementById('createLicenseTypeBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.openCreateModal());
        }
        
        const refreshBtn = document.getElementById('refreshLicenseTypesBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
        
        const form = document.getElementById('licenseTypeForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveLicenseType();
            });
        }
    }
    
    openCreateModal() {
        this.editingType = null;
        document.getElementById('modalTitle').textContent = 'Crear Nuevo Tipo de Licencia';
        document.getElementById('submitButtonText').textContent = 'Crear Tipo';
        this.resetForm();
        this.showModal();
    }
    
    editLicenseType(typeId) {
        const type = this.licenseTypes.find(t => t.id === typeId);
        if (!type) return;
        
        this.editingType = type;
        document.getElementById('modalTitle').textContent = 'Editar Tipo de Licencia';
        document.getElementById('submitButtonText').textContent = 'Actualizar Tipo';
        this.populateForm(type);
        this.showModal();
    }
    
    viewLicenseType(typeId) {
        const type = this.licenseTypes.find(t => t.id === typeId);
        if (!type) return;
        
        alert(`Detalles del Tipo: ${type.name}\n\nDescripción: ${type.description}\nPrecio: $${type.price}\nUsuarios: ${type.max_users}\nMódulos: ${type.max_modules === -1 ? 'Ilimitado' : type.max_modules}\nDuración: ${type.duration_days} días`);
    }
    
    async deleteLicenseType(typeId) {
        const type = this.licenseTypes.find(t => t.id === typeId);
        if (!type) return;
        
        if (!confirm(`¿Eliminar el tipo "${type.name}"?\n\nEsta acción no se puede deshacer.`)) return;
        
        try {
            const response = await window.apiClient.delete(`/admin/license-types/${typeId}`);
            if (response.success) {
                this.showSuccess('Tipo eliminado exitosamente');
                await this.refreshData();
            } else {
                this.showError('Error al eliminar');
            }
        } catch (error) {
            this.showError(`Error: ${error.message}`);
        }
    }
    
    populateForm(type) {
        document.getElementById('typeName').value = type.name || '';
        document.getElementById('typeDescription').value = type.description || '';
        document.getElementById('maxUsers').value = type.max_users || '';
        document.getElementById('maxModules').value = type.max_modules || '';
        document.getElementById('durationDays').value = type.duration_days || '';
        document.getElementById('typePrice').value = type.price || '';
    }
    
    resetForm() {
        document.getElementById('licenseTypeForm').reset();
    }
    
    showModal() {
        document.getElementById('licenseTypeModal').style.display = 'flex';
    }
    
    closeModal() {
        document.getElementById('licenseTypeModal').style.display = 'none';
        this.editingType = null;
        this.resetForm();
    }
    
    async saveLicenseType() {
        try {
            const formData = this.getFormData();
            const isEdit = !!this.editingType;
            
            let response;
            if (isEdit) {
                response = await window.apiClient.put(`/admin/license-types/${this.editingType.id}`, formData);
            } else {
                response = await window.apiClient.post('/admin/license-types', formData);
            }
            
            if (response.success) {
                this.showSuccess(`Tipo ${isEdit ? 'actualizado' : 'creado'} exitosamente`);
                this.closeModal();
                await this.refreshData();
            } else {
                this.showError('Error al guardar');
            }
        } catch (error) {
            this.showError(`Error: ${error.message}`);
        }
    }
    
    getFormData() {
        return {
            name: document.getElementById('typeName').value,
            description: document.getElementById('typeDescription').value,
            max_users: parseInt(document.getElementById('maxUsers').value),
            max_modules: parseInt(document.getElementById('maxModules').value) || -1,
            duration_days: parseInt(document.getElementById('durationDays').value),
            price: parseFloat(document.getElementById('typePrice').value) || 0,
            features: {}
        };
    }
    
    async refreshData() {
        await this.loadLicenseTypes();
        this.render();
        this.bindEvents();
    }
    
    getActiveTypesCount() {
        return this.licenseTypes.length;
    }
    
    getAveragePrice() {
        if (this.licenseTypes.length === 0) return '$0';
        const total = this.licenseTypes.reduce((sum, type) => sum + (type.price || 0), 0);
        const avg = total / this.licenseTypes.length;
        return `$${avg.toFixed(0)}`;
    }
    
    showSuccess(message) {
        alert('✅ ' + message);
    }
    
    showError(message) {
        alert('❌ ' + message);
    }
}

// Instancia global
window.licenseTypesAdmin = new LicenseTypesAdmin();

Logger.info('License Types Admin initialized - FINAL VERSION');